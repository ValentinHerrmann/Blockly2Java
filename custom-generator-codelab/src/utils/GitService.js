import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import LightningFS from '@isomorphic-git/lightning-fs';
import LocalStorageManager from './LocalStorageManager.js';


/**
 * Browser-based Git client for cloning, pulling, and pushing B2J projects.
 *
 * Uses isomorphic-git with a LightningFS (IndexedDB-backed) virtual
 * filesystem.  Connection credentials are kept in sessionStorage so they
 * survive page reloads but are cleared when the browser tab closes.
 *
 * File mapping:
 *  - `.xml` files  → Blockly workspace JSON stored in localStorage
 *  - `.java` files → pushed to / read from the embedded Online-IDE
 */
export class GitService {

  // ── Configuration ────────────────────────────────────────────────────────

  /**
   * CORS proxy URL.
   * Injected at build time via webpack DefinePlugin from the CORS_PROXY_URL
   * environment variable.  Defaults to '/cors-proxy' (the local webpack-dev-server
   * middleware) so development works without any extra configuration.
   *
   * For production (e.g. GitHub Pages), set CORS_PROXY_URL to your deployed
   * Cloudflare Worker URL before running `npm run build`:
   *   CORS_PROXY_URL=https://b2j-cors-proxy.<sub>.workers.dev npm run build
   */
  /* global __CORS_PROXY_URL__ */
  static CORS_PROXY = (typeof __CORS_PROXY_URL__ !== 'undefined')
    ? __CORS_PROXY_URL__
    : '/cors-proxy';

  /** sessionStorage key that holds URL + credentials for the active repo. */
  static SESSION_KEY = 'b2j_git_config';

  /** Root directory inside the virtual filesystem. */
  static REPO_DIR = '/repo';

  /** Subdirectory within the repo that holds all code files (.xml / .java). */
  static SRC_DIR = 'src';

  // ── Internal state ───────────────────────────────────────────────────────

  /** @type {LightningFS|null} */
  static _fs = null;

  // ── Filesystem helpers ───────────────────────────────────────────────────

  /** Lazily initialises and returns the LightningFS instance. */
  static _getFs() {
    if (!this._fs) {
      this._fs = new LightningFS('b2j-git');
    }
    return this._fs;
  }

  /**
   * Recursively removes a directory from the virtual filesystem.
   * @param {string} dirPath
   */
  static async _rmrf(dirPath) {
    const fs = this._getFs();
    try {
      const entries = await fs.promises.readdir(dirPath);
      for (const entry of entries) {
        const full = `${dirPath}/${entry}`;
        const stat = await fs.promises.stat(full);
        if (stat.isDirectory()) {
          await this._rmrf(full);
        } else {
          await fs.promises.unlink(full);
        }
      }
      await fs.promises.rmdir(dirPath);
    } catch {
      /* directory may not exist — ignore */
    }
  }

  // ── Session config ───────────────────────────────────────────────────────

  /**
   * Returns the stored git connection config, or `null` if none exists.
   * @returns {{ url: string, username: string, password: string }|null}
   */
  static getStoredConfig() {
    const raw = globalThis.sessionStorage?.getItem(this.SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  /**
   * Persists git connection config to sessionStorage.
   * @param {string} url      – clean repo URL (without embedded credentials)
   * @param {string} username
   * @param {string} password – token or password
   */
  static _storeConfig(url, username, password) {
    globalThis.sessionStorage?.setItem(
      this.SESSION_KEY,
      JSON.stringify({ url, username, password }),
    );
  }

  /** Clears the stored git config (effectively "disconnects"). */
  static clearConfig() {
    globalThis.sessionStorage?.removeItem(this.SESSION_KEY);
  }

  /** Whether a git repository is currently connected. */
  static isConnected() {
    return this.getStoredConfig() !== null;
  }

  // ── URL parsing ──────────────────────────────────────────────────────────

  /**
   * Splits a raw git URL into a clean URL and optional credentials.
   *
   * Accepted formats:
   *  - `https://user:token@github.com/owner/repo.git`
   *  - `https://user@github.com/owner/repo.git`
   *  - `https://github.com/owner/repo.git`
   *
   * @param {string} rawUrl
   * @returns {{ url: string, username: string, password: string }}
   */
  static parseGitUrl(rawUrl) {
    try {
      const urlObj = new URL(rawUrl);
      const username = decodeURIComponent(urlObj.username || '');
      const password = decodeURIComponent(urlObj.password || '');
      urlObj.username = '';
      urlObj.password = '';
      return { url: urlObj.toString(), username, password };
    } catch {
      return { url: rawUrl, username: '', password: '' };
    }
  }

  // ── Auth helpers ──────────────────────────────────────────────────────────

  /**
   * Builds an HTTP Basic Authorization header object.
   * Sending credentials on the very first request avoids the 401-then-retry
   * dance that breaks through some CORS proxies.
   * @param {string} username
   * @param {string} password
   * @returns {Object} headers object with Authorization
   */
  static _authHeaders(username, password) {
    if (!username && !password) return {};
    const encoded = btoa(`${username}:${password}`);
    return { Authorization: `Basic ${encoded}` };
  }

  // ── Clone ────────────────────────────────────────────────────────────────

  /**
   * Clones a remote git repository into the virtual filesystem and returns
   * the parsed file contents.
   *
   * @param {string} rawUrl     – git URL, optionally with `user:token@`
   * @param {string} [password] – password / token (if not embedded in URL)
   * @returns {Promise<{ xml: Object<string,string>, java: Object<string,string> }>}
   */
  static async clone(rawUrl, password) {
    const { url, username, password: urlPassword } = this.parseGitUrl(rawUrl);
    const finalPassword = urlPassword || password || '';
    const finalUsername  = username || 'git';

    const fs = this._getFs();

    // Wipe any previous clone.
    await this._rmrf(this.REPO_DIR);
    await fs.promises.mkdir(this.REPO_DIR).catch(() => {});

    await git.clone({
      fs,
      http,
      dir: this.REPO_DIR,
      url,
      corsProxy: this.CORS_PROXY,
      headers: this._authHeaders(finalUsername, finalPassword),
      onAuth: () => ({ username: finalUsername, password: finalPassword }),
      singleBranch: true,
      depth: 1,
    });

    this._storeConfig(url, finalUsername, finalPassword);

    return this._readRepoFiles();
  }

  // ── Pull ─────────────────────────────────────────────────────────────────

  /**
   * Pulls the latest changes from the remote and re-reads all files.
   * @returns {Promise<{ xml: Object<string,string>, java: Object<string,string> }>}
   */
  static async pull() {
    const config = this.getStoredConfig();
    if (!config) throw new Error('Kein Git-Repository verbunden.');

    const fs = this._getFs();

    await git.pull({
      fs,
      http,
      dir: this.REPO_DIR,
      corsProxy: this.CORS_PROXY,
      headers: this._authHeaders(config.username, config.password),
      onAuth: () => ({ username: config.username, password: config.password }),
      singleBranch: true,
      author: {
        name: config.username,
        email: `${config.username}@blockly2java`,
      },
    });

    return this._readRepoFiles();
  }

  // ── Commit & Push ────────────────────────────────────────────────────────

  /**
   * Writes the current workspace state (XML + Java) into the repository,
   * commits everything, and pushes to the remote.
   *
   * @param {string} message – commit message
   */
  static async commitAndPush(message) {
    const config = this.getStoredConfig();
    if (!config) throw new Error('Kein Git-Repository verbunden.');

    const fs = this._getFs();

    // ── Export current workspace into the virtual filesystem ──────────────
    await this._exportXmlFiles(fs);
    await this._exportJavaFiles(fs);

    // ── Stage all changed / new / deleted files ──────────────────────────
    const matrix = await git.statusMatrix({ fs, dir: this.REPO_DIR });
    for (const [filepath, , workdirStatus, stageStatus] of matrix) {
      if (workdirStatus !== stageStatus) {
        if (workdirStatus === 0) {
          await git.remove({ fs, dir: this.REPO_DIR, filepath });
        } else {
          await git.add({ fs, dir: this.REPO_DIR, filepath });
        }
      }
    }

    // ── Commit ───────────────────────────────────────────────────────────
    await git.commit({
      fs,
      dir: this.REPO_DIR,
      message: message || 'B2J: Workspace aktualisiert',
      author: {
        name: config.username,
        email: `${config.username}@blockly2java`,
      },
    });

    // ── Push ─────────────────────────────────────────────────────────────
    await git.push({
      fs,
      http,
      dir: this.REPO_DIR,
      corsProxy: this.CORS_PROXY,
      headers: this._authHeaders(config.username, config.password),
      onAuth: () => ({ username: config.username, password: config.password }),
    });
  }

  // ── File I/O helpers ─────────────────────────────────────────────────────

  /**
   * Reads all tracked files (non-dotfiles, non-directories) from the repo
   * and categorises them into xml and java buckets.
   *
   * XML files are immediately persisted to localStorage; Java files are
   * returned to the caller so the IDE bridge can inject them.
   *
   * @returns {Promise<{ xml: Object<string,string>, java: Object<string,string> }>}
   */
  static async _readRepoFiles() {
    const fs = this._getFs();
    const srcPath = `${this.REPO_DIR}/${this.SRC_DIR}`;

    // If the src/ directory doesn't exist yet (e.g. first clone of a repo
    // that has no code files), fall back gracefully.
    let entries;
    try {
      entries = await fs.promises.readdir(srcPath);
    } catch {
      entries = [];
    }

    const result = { xml: {}, java: {} };

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;

      const fullPath = `${srcPath}/${entry}`;
      const stat = await fs.promises.stat(fullPath);
      if (stat.isDirectory()) continue;

      const content = new TextDecoder().decode(
        await fs.promises.readFile(fullPath),
      );

      if (entry.endsWith('.xml')) {
        // Blockly workspace JSON → localStorage
        const className = entry.replace(/\.xml$/, '');
        try {
          LocalStorageManager.saveWorkspace(className, JSON.parse(content));
        } catch {
          // If the content is not valid JSON, store as-is.
          LocalStorageManager.saveWorkspace(className, content);
        }
        result.xml[entry] = content;
      } else if (entry.endsWith('.java')) {
        result.java[entry] = content;
      }
    }

    // Remove XML entries from localStorage that no longer exist in the repo.
    const repoXmlKeys = new Set(Object.keys(result.xml));
    for (let i = globalThis.localStorage.length - 1; i >= 0; i--) {
      const key = globalThis.localStorage.key(i);
      if (key?.endsWith('.xml') && !repoXmlKeys.has(key)) {
        const className = key.replace(/\.xml$/, '');
        LocalStorageManager.deleteClass(className);
      }
    }

    return result;
  }

  /**
   * Exports all `.xml` workspace entries from localStorage to the virtual
   * filesystem, and removes `.xml` files that no longer exist.
   * @param {LightningFS} fs
   */
  static async _exportXmlFiles(fs) {
    const srcPath = `${this.REPO_DIR}/${this.SRC_DIR}`;
    await fs.promises.mkdir(srcPath).catch(() => {});

    // Collect current XML keys from localStorage.
    const currentXmlKeys = new Set();
    for (let i = 0; i < globalThis.localStorage.length; i++) {
      const key = globalThis.localStorage.key(i);
      if (key?.endsWith('.xml')) currentXmlKeys.add(key);
    }

    // Remove .xml files from the repo that are no longer in localStorage.
    const entries = await fs.promises.readdir(srcPath).catch(() => []);
    for (const entry of entries) {
      if (entry.endsWith('.xml') && !currentXmlKeys.has(entry)) {
        await fs.promises.unlink(`${srcPath}/${entry}`).catch(() => {});
      }
    }

    // Write current XML files.
    for (const key of currentXmlKeys) {
      const data = globalThis.localStorage.getItem(key);
      if (data) {
        await fs.promises.writeFile(`${srcPath}/${key}`, data);
      }
    }
  }

  /**
   * Exports all Java files from the Online-IDE to the virtual filesystem,
   * and removes `.java` files that no longer exist in the IDE.
   * @param {LightningFS} fs
   */
  static async _exportJavaFiles(fs) {
    const ideAccess = globalThis.online_ide_access?.getIDE?.('Java');
    if (!ideAccess) return;

    const srcPath = `${this.REPO_DIR}/${this.SRC_DIR}`;
    await fs.promises.mkdir(srcPath).catch(() => {});

    // Collect current Java filenames from the IDE.
    const currentJavaNames = new Set();
    const files = ideAccess.getFiles();
    for (const file of files) {
      const name = file.getName();
      if (name.endsWith('.java')) currentJavaNames.add(name);
    }

    // Remove .java files from the repo that are no longer in the IDE.
    const entries = await fs.promises.readdir(srcPath).catch(() => []);
    for (const entry of entries) {
      if (entry.endsWith('.java') && !currentJavaNames.has(entry)) {
        await fs.promises.unlink(`${srcPath}/${entry}`).catch(() => {});
      }
    }

    // Write current Java files.
    for (const file of files) {
      const name = file.getName();
      if (!name.endsWith('.java')) continue;

      const content = file.getText();
      if (content) {
        await fs.promises.writeFile(`${srcPath}/${name}`, content);
      }
    }
  }

  /**
   * Returns `true` when the current workspace has changes not yet committed.
   * Exports XML + Java to the VFS (same as the pre-commit step) so the git
   * status matrix reflects the current state.
   * @returns {Promise<boolean>}
   */
  static async hasLocalChanges() {
    if (!this.isConnected()) return false;
    const fs = this._getFs();
    try {
      await this._exportXmlFiles(fs);
      await this._exportJavaFiles(fs);
      const matrix = await git.statusMatrix({ fs, dir: this.REPO_DIR });
      return matrix.some(([, head, workdir, stage]) => {
        if (head === 0 && workdir === 0 && stage === 0) return false;
        return !(head === 1 && workdir === 1 && stage === 1);
      });
    } catch {
      return false;
    }
  }

  /**
   * Fetches the remote (no checkout) and returns `true` when the remote
   * HEAD is ahead of the local HEAD.
   * @returns {Promise<boolean>}
   */
  static async hasRemoteChanges() {
    const config = this.getStoredConfig();
    if (!config) return false;
    const fs = this._getFs();
    try {
      await git.fetch({
        fs, http,
        dir: this.REPO_DIR,
        corsProxy: this.CORS_PROXY,
        headers: this._authHeaders(config.username, config.password),
        onAuth: () => ({ username: config.username, password: config.password }),
        singleBranch: true,
        depth: 1,
        tags: false,
      });
      const branch     = (await git.currentBranch({ fs, dir: this.REPO_DIR })) ?? 'main';
      const localHead  = await git.resolveRef({ fs, dir: this.REPO_DIR, ref: 'HEAD' });
      const remoteHead = await git.resolveRef({ fs, dir: this.REPO_DIR, ref: `refs/remotes/origin/${branch}` });
      return localHead !== remoteHead;
    } catch {
      return false;
    }
  }

  /**
   * Returns info about the most recent commit on HEAD.
   * @returns {Promise<{ message: string, timestamp: number }|null>}
   *   `timestamp` is a Unix timestamp in seconds (from the committer field).
   */
  static async getLatestCommitInfo() {
    const fs = this._getFs();
    try {
      const commits = await git.log({ fs, dir: this.REPO_DIR, depth: 1 });
      const commit = commits[0]?.commit;
      if (!commit) return null;
      return {
        message:   commit.message?.split('\n')[0] ?? '',
        timestamp: commit.committer?.timestamp ?? commit.author?.timestamp ?? null,
      };
    } catch {
      return null;
    }
  }
}

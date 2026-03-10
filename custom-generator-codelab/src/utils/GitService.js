import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import LightningFS from '@isomorphic-git/lightning-fs';
import LocalStorageManager from './LocalStorageManager.js';
import { ToolboxConfigManager } from './ToolboxConfigManager.js';


/**
 * Browser-based Git client for cloning, pulling, and pushing B2J projects.
 *
 * Uses isomorphic-git with a LightningFS (IndexedDB-backed) virtual
 * filesystem.  The repository URL and username are persisted in localStorage
 * so they survive browser restarts.  The password / token is kept only in
 * sessionStorage for security, meaning the user may be prompted to re-enter
 * it after closing and reopening the browser.
 *
 * File mapping:
 *  - `.json` files → Blockly workspace JSON stored in localStorage
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

  /** sessionStorage key that holds the full config (URL + credentials) for the active session. */
  static SESSION_KEY = 'b2j_git_config';

  /**
   * localStorage key that persists the non-sensitive parts of the config
   * (URL + username, NO password/token) across browser sessions.
   */
  static LOCAL_KEY = 'b2j_git_persist';

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
   *
   * Priority:
   *  1. sessionStorage – has full config including password (current session).
   *  2. localStorage   – has URL + username only (persisted across sessions);
   *                      password will be empty and must be re-entered for
   *                      operations that require authentication.
   *
   * @returns {{ url: string, username: string, password: string }|null}
   */
  static getStoredConfig() {
    const sessionRaw = globalThis.sessionStorage?.getItem(this.SESSION_KEY);
    if (sessionRaw) return JSON.parse(sessionRaw);

    // Fall back to the persistent (non-sensitive) localStorage entry.
    const localRaw = globalThis.localStorage?.getItem(this.LOCAL_KEY);
    return localRaw ? { ...JSON.parse(localRaw), password: '' } : null;
  }

  /**
   * Returns true if the current session has a stored password / token.
   * When false the user must re-enter credentials before pull / push.
   */
  static hasSessionCredentials() {
    return globalThis.sessionStorage?.getItem(this.SESSION_KEY) !== null;
  }

  /**
   * Persists git connection config.
   *  - URL + username → localStorage (survives browser close)
   *  - Full config incl. password → sessionStorage (cleared on browser close)
   *
   * @param {string} url      – clean repo URL (without embedded credentials)
   * @param {string} username
   * @param {string} password – token or password
   */
  static _storeConfig(url, username, password) {
    // Persist non-sensitive parts across sessions.
    globalThis.localStorage?.setItem(
      this.LOCAL_KEY,
      JSON.stringify({ url, username }),
    );
    // Full config (including password) only for the current session.
    globalThis.sessionStorage?.setItem(
      this.SESSION_KEY,
      JSON.stringify({ url, username, password }),
    );
  }

  /** Clears the stored git config from both storages (effectively "disconnects"). */
  static clearConfig() {
    globalThis.sessionStorage?.removeItem(this.SESSION_KEY);
    globalThis.localStorage?.removeItem(this.LOCAL_KEY);
  }

  /** Whether a git repository URL is known (even if session credentials have expired). */
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
    const finalUsername  = username || '';

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

  // ── Top-level code detection ────────────────────────────────────────────

  /**
   * Returns true when a line is a Java preamble line (import, package,
   * blank, comment, or annotation) rather than executable top-level code.
   * @param {string} line
   * @returns {boolean}
   */
  static _isHeaderLine(line) {
    return /^\s*(import|package|\/\/|\/\*|\*|@|\s*$)/.test(line);
  }

  /**
   * Scans `content` at character level, correctly skipping string literals
   * and comments, and returns the character positions of the outermost
   * class-body delimiters.
   *
   * This is more precise than the old line-level scanner because it correctly
   * handles cases where top-level code sits on the *same line* as `{` or `}`.
   *
   * @param {string} content
   * @returns {{ firstOpenPos: number, lastClosePos: number }}
   *   Both values are -1 when no class body is found.
   */
  static _findClassBoundariesPos(content) {
    let depth = 0;
    let firstOpenPos = -1;
    let lastClosePos = -1;
    let i = 0;

    while (i < content.length) {
      // Skip line comments
      if (content[i] === '/' && content[i + 1] === '/') {
        const nl = content.indexOf('\n', i);
        i = nl === -1 ? content.length : nl + 1;
        continue;
      }
      // Skip block comments
      if (content[i] === '/' && content[i + 1] === '*') {
        const end = content.indexOf('*/', i + 2);
        i = end === -1 ? content.length : end + 2;
        continue;
      }
      // Skip string / char literals
      if (content[i] === '"' || content[i] === "'") {
        const q = content[i++];
        while (i < content.length && content[i] !== q) {
          if (content[i] === '\\') i++;
          i++;
        }
        i++;
        continue;
      }

      if (content[i] === '{') {
        if (depth === 0) firstOpenPos = i;
        depth++;
      } else if (content[i] === '}') {
        depth--;
        if (depth === 0) lastClosePos = i;
      }
      i++;
    }

    return { firstOpenPos, lastClosePos };
  }

  /**
   * Detects top-level Java code: executable statements that appear either
   * before or after the outermost class/interface/enum body, including code
   * that shares a line with the opening `{` or closing `}`.
   *
   * @param {string} javaContent
   * @returns {string|null} trimmed top-level code, or null if none found
   */
  static detectTopLevelCode(javaContent) {
    const { firstOpenPos, lastClosePos } = this._findClassBoundariesPos(javaContent);

    const parts = [];

    // Code before the class/interface/enum keyword (not the opening brace),
    // so that the declaration itself is not included in the preview.
    if (firstOpenPos > 0) {
      const lineStart = javaContent.lastIndexOf('\n', firstOpenPos - 1) + 1;
      const linePre = javaContent.substring(lineStart, firstOpenPos);
      const classMatch = linePre.match(
        /((?:(?:public|protected|private|abstract|final|strictfp)\s+)*)(?:class|interface|enum)\s/
      );
      const classStartInLine = classMatch ? linePre.indexOf(classMatch[0]) : linePre.length;
      const classStartPos = lineStart + classStartInLine;

      if (classStartPos > 0) {
        const preContent = javaContent.substring(0, classStartPos);
        const preCode = preContent.split('\n')
          .filter(l => !this._isHeaderLine(l))
          .join('\n')
          .trim();
        if (preCode) parts.push(preCode);
      }
    }

    // Code after the last closing brace (may include content on the same line)
    if (lastClosePos !== -1 && lastClosePos < javaContent.length - 1) {
      const postCode = javaContent.substring(lastClosePos + 1).trim();
      if (postCode) parts.push(postCode);
    }

    return parts.length ? parts.join('\n\n') : null;
  }

  /**
   * Returns a copy of the Java content with all top-level executable code
   * commented out using block comments, both before and after the outermost
   * class body.  Code that shares a line with the opening '{' or closing '}'
   * is commented out inline so no newlines are introduced.
   * Preamble lines (import, package, blank, existing comments) are preserved.
   *
   * @param {string} javaContent
   * @returns {string}
   */
  static stripTopLevelCode(javaContent) {
    const { firstOpenPos, lastClosePos } = this._findClassBoundariesPos(javaContent);

    if (firstOpenPos === -1 && lastClosePos === -1) return javaContent;

    let result = javaContent;

    // ── Post-class code (after lastClosePos) ─────────────────────────────
    // Must be done first so that firstOpenPos stays valid (it comes earlier).
    if (lastClosePos !== -1 && lastClosePos < result.length - 1) {
      const postContent = result.substring(lastClosePos + 1);
      if (postContent.trim()) {
        result =
          result.substring(0, lastClosePos + 1) +
          ' /*' + postContent.trim() + '*/';
      }
    }

    // ── Pre-class code (before firstOpenPos) ─────────────────────────────
    if (firstOpenPos > 0) {
      // Find the start of the line that contains the opening '{'.
      const lineStart = result.lastIndexOf('\n', firstOpenPos - 1) + 1;
      // The portion of that line sitting before '{'.
      const linePre = result.substring(lineStart, firstOpenPos);

      // Locate the beginning of the class/interface/enum declaration within
      // that line so we know exactly what to comment out.
      const classMatch = linePre.match(
        /((?:(?:public|protected|private|abstract|final|strictfp)\s+)*)(?:class|interface|enum)\s/
      );
      const classStartInLine = classMatch ? linePre.indexOf(classMatch[0]) : 0;
      const classStartPos = lineStart + classStartInLine;

      // Split the text before the class keyword into lines.
      const preContent = result.substring(0, classStartPos);
      const preLines = preContent.split('\n');

      // All fully-preceding lines: use `// ` for non-header lines.
      const commentOutLine = l => this._isHeaderLine(l) ? l : '// ' + l;
      const fullPrecedingLines = preLines.slice(0, -1).map(commentOutLine);

      // The partial line sharing the row with the class declaration:
      // wrap in `/* … */` inline (only if it contains non-whitespace).
      const partialLine = preLines[preLines.length - 1];
      const commentedPartialLine =
        partialLine.trim() ? '/*' + partialLine.trimEnd() + '*/ ' : partialLine;

      result =
        [...fullPrecedingLines, commentedPartialLine].join('\n') +
        result.substring(classStartPos);
    }

    return result;
  }

  /**
   * Inspects all Java files currently loaded in the Online-IDE and collects
   * any top-level code found in them.
   *
   * @returns {Array<{file: string, code: string}>}
   */
  static getTopLevelCodeInfo() {
    const ideAccess = globalThis.online_ide_access?.getIDE?.('Java');
    if (!ideAccess) return [];

    const results = [];
    for (const file of ideAccess.getFiles()) {
      const name = file.getName();
      if (!name.endsWith('.java')) continue;
      const content = file.getText();
      if (!content) continue;
      const topLevel = this.detectTopLevelCode(content);
      if (topLevel) results.push({ file: name, code: topLevel });
    }
    return results;
  }

  // ── Commit & Push ────────────────────────────────────────────────────────

  /**
   * Writes the current workspace state (XML + Java) into the repository,
   * commits everything, and pushes to the remote.
   *
   * @param {string}  message           – commit message
   * @param {Object}  [opts]
   * @param {boolean} [opts.stripTopLevelCode=false] – strip top-level Java code before committing
   */
  static async commitAndPush(message, { stripTopLevelCode = false } = {}) {
    const config = this.getStoredConfig();
    if (!config) throw new Error('Kein Git-Repository verbunden.');

    const fs = this._getFs();

    // ── Export current workspace into the virtual filesystem ──────────────
    await this._exportJsonFiles(fs);
    await this._exportJavaFiles(fs, { stripTopLevelCode });
    await this._exportToolboxConfig(fs);
    await this._exportMetadataFile(fs);

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

  /**
   * Writes the current toolbox config to the repo root as
   * `blockly-config.json`. Uses the active in-memory config when
   * available, falls back to the stored config, and finally to an
   * explicit "all blocks active" preset.
   * @param {LightningFS} fs
   */
  static async _exportToolboxConfig(fs) {
    try {
      const stored = ToolboxConfigManager.lastConfig ?? ToolboxConfigManager.loadStored();
      const config = stored ?? ToolboxConfigManager._buildPresetAlles(null);
      const content = JSON.stringify(config, null, 2);
      await fs.promises.writeFile(`${this.REPO_DIR}/blockly-config.json`, new TextEncoder().encode(content));
    } catch {
      /* ignore write failures */
    }
  }

  // ── Metadata file helper ──────────────────────────────────────────────────

  /**
   * Writes `b2j-metadata.json` at the repository root.
   * Records which classes have been manually edited so the flag survives a
   * round-trip through commit → clone/pull.
   * @param {LightningFS} fs
   */
  static async _exportMetadataFile(fs) {
    const modifiedClasses = LocalStorageManager.getAllJavaModifiedClassNames();
    const content = JSON.stringify({ javaModified: modifiedClasses }, null, 2);
    await fs.promises.writeFile(
      `${this.REPO_DIR}/b2j-metadata.json`,
      new TextEncoder().encode(content),
    );
  }

  // ── File I/O helpers ─────────────────────────────────────────────────────

  /**
   * Recursively collects all .md files under a directory into `mdMap`.
   * Keys are the filename only (basename), values are the UTF-8 content.
   * Dotfiles and dot-directories are skipped.
   * @param {LightningFS} fs
   * @param {string} dirPath  absolute path inside the virtual FS
   * @param {Object<string,string>} mdMap  accumulator
   */
  static async _collectMdFiles(fs, dirPath, mdMap) {
    let entries;
    try {
      entries = await fs.promises.readdir(dirPath);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.startsWith('.')) continue;
      const fullPath = `${dirPath}/${entry}`;
      const stat = await fs.promises.stat(fullPath);
      if (stat.isDirectory()) {
        await this._collectMdFiles(fs, fullPath, mdMap);
      } else if (entry.endsWith('.md')) {
        const content = new TextDecoder().decode(await fs.promises.readFile(fullPath));
        // Use the basename as key; later entries with the same name overwrite earlier ones.
        mdMap[entry] = content;
      }
    }
  }

  /**
   * Reads all tracked files (non-dotfiles, non-directories) from the repo
   * and categorises them into xml, java, and md buckets.
   *
   * XML files are immediately persisted to localStorage; Java files and
   * Markdown files are returned to the caller so the IDE bridge can inject them.
   *
   * @returns {Promise<{ xml: Object<string,string>, java: Object<string,string>, md: Object<string,string> }>}
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

    const result = { json: {}, java: {}, md: {}, toolboxConfig: null };

    // Look for a toolbox config file at the repo root.
    try {
      const raw = await fs.promises.readFile(`${this.REPO_DIR}/blockly-config.json`);
      result.toolboxConfig = JSON.parse(new TextDecoder().decode(raw));
    } catch {
      /* No blockly-config.json present – that is perfectly fine. */
    }

    // Restore java-modified flags from the repo metadata file.
    // If the file is absent (legacy repo or flags were cleared and pushed),
    // treat it as "no classes modified" and wipe any stale local flags.
    try {
      const raw = await fs.promises.readFile(`${this.REPO_DIR}/b2j-metadata.json`);
      const meta = JSON.parse(new TextDecoder().decode(raw));
      if (Array.isArray(meta?.javaModified)) {
        LocalStorageManager.restoreJavaModifiedClassNames(meta.javaModified);
      } else {
        LocalStorageManager.restoreJavaModifiedClassNames([]);
      }
    } catch {
      // File absent → clear all stale flags.
      LocalStorageManager.restoreJavaModifiedClassNames([]);
    }

    for (const entry of entries) {
      if (entry.startsWith('.')) continue;

      const fullPath = `${srcPath}/${entry}`;
      const stat = await fs.promises.stat(fullPath);
      if (stat.isDirectory()) continue;

      const content = new TextDecoder().decode(
        await fs.promises.readFile(fullPath),
      );

      if (entry.endsWith('.json')) {
        // Blockly workspace JSON → localStorage
        const className = entry.replace(/\.json$/, '');
        try {
          LocalStorageManager.saveWorkspace(className, JSON.parse(content));
        } catch {
          // If the content is not valid JSON, store as-is.
          LocalStorageManager.saveWorkspace(className, content);
        }
        result.json[entry] = content;
      } else if (entry.endsWith('.java')) {
        result.java[entry] = content;
      }
    }

    // Also collect .md files from anywhere in the repo tree (outside src/).
    await this._collectMdFiles(fs, this.REPO_DIR, result.md);

    // Remove JSON entries from localStorage that no longer exist in the repo.
    const repoJsonKeys = new Set(Object.keys(result.json));
    for (let i = globalThis.localStorage.length - 1; i >= 0; i--) {
      const key = globalThis.localStorage.key(i);
      if (key?.endsWith('.json') && !repoJsonKeys.has(key)) {
        const className = key.replace(/\.json$/, '');
        LocalStorageManager.deleteClass(className);
      }
    }

    return result;
  }

  /**
   * Exports all `.json` workspace entries from localStorage to the virtual
   * filesystem, and removes `.json` files that no longer exist.
   * JSON content is pretty-printed (2-space indent) for best auto-mergeability.
   * @param {LightningFS} fs
   */
  static async _exportJsonFiles(fs) {
    const srcPath = `${this.REPO_DIR}/${this.SRC_DIR}`;
    await fs.promises.mkdir(srcPath).catch(() => {});

    // Collect current JSON keys from localStorage.
    const currentJsonKeys = new Set();
    for (let i = 0; i < globalThis.localStorage.length; i++) {
      const key = globalThis.localStorage.key(i);
      if (key?.endsWith('.json')) currentJsonKeys.add(key);
    }

    // Remove .json files from the repo that are no longer in localStorage.
    const entries = await fs.promises.readdir(srcPath).catch(() => []);
    for (const entry of entries) {
      if (entry.endsWith('.json') && !currentJsonKeys.has(entry)) {
        await fs.promises.unlink(`${srcPath}/${entry}`).catch(() => {});
      }
    }

    // Write current JSON files, pretty-printed for readability and git auto-mergeability.
    for (const key of currentJsonKeys) {
      const data = globalThis.localStorage.getItem(key);
      if (data) {
        let prettyData = data;
        try {
          prettyData = JSON.stringify(JSON.parse(data), null, 2);
        } catch {
          // Fall back to raw value if parsing fails.
        }
        await fs.promises.writeFile(`${srcPath}/${key}`, prettyData);
      }
    }
  }

  /**
   * Exports all Java files from the Online-IDE to the virtual filesystem,
   * and removes `.java` files that no longer exist in the IDE.
   * @param {LightningFS} fs
   * @param {Object}  [opts]
   * @param {boolean} [opts.stripTopLevelCode=false] – strip top-level code before writing
   */
  static async _exportJavaFiles(fs, { stripTopLevelCode = false } = {}) {
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

      let content = file.getText();
      if (content) {
        if (stripTopLevelCode) {
          content = this.stripTopLevelCode(content);
        }
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
      await this._exportJsonFiles(fs);
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

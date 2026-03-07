/**
 * WorkspaceManager
 *
 * Provides three local workspace operations that work independently of any
 * Git remote:
 *
 *  - clearWorkspace(ws)     — reset everything to a blank project
 *  - downloadWorkspace()    — export the full project as a .b2j archive
 *  - uploadWorkspace(ws)    — import a previously exported .b2j archive
 *
 * The ZIP layout mirrors the repository layout used by GitService so that
 * archives created here can also be committed to a git repository:
 *
 *   src/ClassName.json   ← Blockly workspace JSON (from localStorage)
 *   src/ClassName.java   ← Java source files (from the Online-IDE)
 *   src/filename.md      ← Markdown files (from the Online-IDE)
 *   blockly-config.json  ← Optional toolbox config
 */

import JSZip from 'jszip';
import LocalStorageManager from './LocalStorageManager.js';
import { IdeBridge } from './IdeBridge.js';
import { GitService } from './GitService.js';
import { ToolboxConfigManager } from './ToolboxConfigManager.js';
import { GitDialog } from './GitDialog.js';
import { BlocklyOverlayManager } from './BlocklyOverlayManager.js';
import emptyTemplate from '../emptyTemplate.json';
import * as Blockly from 'blockly/core';
import { load } from '../serialization.js';

/**
 * Toolbox config that enables every category, subcategory and block.
 * Applied when creating a blank workspace so the exported blockly-config.json
 * is a fully-explicit, editable template rather than relying on implicit defaults.
 *
 * Block types mirror the contents of toolboxGrade9.js.
 * Methoden/Klassen-Methoden subcategory blocks are the def-block types
 * controlled by the flyout:
 *   Objekt-Methoden            → java_method_noreturn, java_method_return
 *   Klassen-Methoden (statisch)→ java_static_method_noreturn, java_static_method_return
 */
/**
 * Default config matching the old grade-9 instruction set.
 * The full toolbox (toolboxGrade9.js) now contains every block from the
 * upstream toolbox.js; blocks that were excluded for grade 9 are set to
 * active: false here so they are hidden by default but can be re-enabled
 * by editing the exported blockly-config.json.
 */
export const FULL_ACTIVE_CONFIG = {
  version: 1,
  description:
    'Standard Blockly2Java-Toolbox – erweiterter Satz, Klasse-9-Elemente aktiv. ' +
    'Auf false gesetzte Blöcke können aktiviert werden.',
  categories: [
    {
      name: 'Logik',
      active: true,
      blocks: [
        { type: 'controls_if',     active: true  },
        { type: 'logic_compare',   active: true  },
        { type: 'logic_operation', active: true  },
        { type: 'logic_negate',    active: true  },
        { type: 'logic_boolean',   active: true  },
        { type: 'logic_null',      active: true  },
        { type: 'logic_ternary',   active: false }, // Klasse 9: zu komplex
      ],
    },
    {
      name: 'Schleifen',
      active: true,
      blocks: [
        { type: 'controls_repeat_ext',      active: true  },
        { type: 'controls_whileUntil',      active: true  },
        { type: 'controls_for',             active: true  },
        { type: 'controls_forEach',         active: false }, // Klasse 9: nur mit Listen sinnvoll
        { type: 'controls_flow_statements', active: true  },
      ],
    },
    {
      name: 'Mathe',
      active: true,
      blocks: [
        { type: 'math_number',          active: true  },
        { type: 'math_arithmetic',      active: true  },
        { type: 'math_single',          active: true  },
        { type: 'math_trig',            active: true  },
        { type: 'math_constant',        active: true  },
        { type: 'math_number_property', active: true  },
        { type: 'math_round',           active: true  },
        { type: 'math_on_list',         active: true  },
        { type: 'math_modulo',          active: true  },
        { type: 'math_constrain',       active: false }, // Klasse 9: durch native Ops ersetzbar
        { type: 'math_random_int',      active: true  },
        { type: 'math_random_float',    active: true  },
        { type: 'math_atan2',           active: false }, // Klasse 9: zu speziell
      ],
    },
    {
      name: 'Text',
      active: true,
      blocks: [
        { type: 'text',              active: true  },
        { type: 'text_multiline',    active: false }, // Klasse 9: in Java unnötig
        { type: 'text_join',         active: true  },
        { type: 'text_append',       active: false }, // Klasse 9: Typbestimmung problematisch
        { type: 'text_length',       active: true  },
        { type: 'text_isEmpty',      active: false }, // Klasse 9: durch length==0 ersetzbar
        { type: 'text_indexOf',      active: false }, // Klasse 9: Typbestimmung problematisch
        { type: 'text_charAt',       active: false }, // Klasse 9: zu komplex ohne Vorwissen
        { type: 'text_getSubstring', active: true  },
        { type: 'text_changeCase',   active: true  },
        { type: 'text_trim',         active: true  },
        { type: 'text_count',        active: true  },
        { type: 'text_replace',      active: true  },
        { type: 'text_reverse',      active: true  },
        { type: 'text_print',        active: true  },
        { type: 'text_prompt_ext',   active: false }, // Klasse 9: GUI-basiert, zu komplex
      ],
    },
    {
      name: 'Listen',
      active: false, // Klasse 9: nicht im Lehrplan
      blocks: [
        { type: 'lists_create_with', active: true },
        { type: 'lists_repeat',      active: true },
        { type: 'lists_length',      active: true },
        { type: 'lists_isEmpty',     active: true },
        { type: 'lists_indexOf',     active: true },
        { type: 'lists_getIndex',    active: true },
        { type: 'lists_setIndex',    active: true },
        { type: 'lists_getSublist',  active: true },
        { type: 'lists_split',       active: true },
        { type: 'lists_sort',        active: true },
        { type: 'lists_reverse',     active: true },
      ],
    },
    {
      name: 'Farben',
      active: false, // Klasse 9: nicht im Lehrplan
      blocks: [
        { type: 'colour_picker', active: true },
        { type: 'colour_random', active: true },
        { type: 'colour_rgb',    active: true },
        { type: 'colour_blend',  active: true },
      ],
    },
    {
      name: 'Grafik-Objekte',
      active: false, // nur bei Grafik-Aufgaben benötigt
      blocks: [
        { type: 'graphics_new_world',     active: true },
        { type: 'graphics_new_circle',    active: true },
        { type: 'graphics_new_rectangle', active: true },
        { type: 'graphics_new_line',      active: true },
        { type: 'graphics_new_text',      active: true },
      ],
    },
    {
      name: 'Grafik-Aussehen',
      active: false, // nur bei Grafik-Aufgaben benötigt
      blocks: [
        { type: 'graphics_setfillcolor',   active: true },
        { type: 'graphics_setbordercolor', active: true },
        { type: 'graphics_setvisible',     active: true },
        { type: 'graphics_setbgcolor',     active: true },
        { type: 'graphics_bringtofront',   active: true },
        { type: 'graphics_sendtoback',     active: true },
      ],
    },
    {
      name: 'Grafik-Bewegung',
      active: false, // nur bei Grafik-Aufgaben benötigt
      blocks: [
        { type: 'graphics_move',   active: true },
        { type: 'graphics_rotate', active: true },
        { type: 'graphics_scale',  active: true },
      ],
    },
    {
      name: 'Variablen',
      active: true,
      subcategories: [
        { name: 'Lokale Variablen', active: true },
      ],
    },
    {
      name: 'Attribute',
      active: true,
      subcategories: [
        { name: 'Instanz-Attribute', active: true },
        { name: 'Klassen-Attribute', active: true },
      ],
    },
    {
      name: 'Parameter',
      active: true,
    },
    {
      name: 'Methoden',
      active: true,
      subcategories: [
        {
          name: 'Objekt-Methoden',
          active: true,
          blocks: [
            { type: 'java_method_noreturn', active: true },
            { type: 'java_method_return',   active: true },
          ],
        },
        {
          name: 'Methoden auf Objekten',
          active: true,
          blocks: [
            { type: 'java_obj_method_call_noreturn', active: true },
            { type: 'java_obj_method_call_return',   active: true },
          ],
        },
      ],
    },
    {
      name: 'K-Methoden',
      active: true,
      subcategories: [
        {
          name: 'K-Methoden',
          active: true,
          blocks: [
            { type: 'java_static_method_noreturn', active: true },
            { type: 'java_static_method_return',   active: true },
          ],
        },
        {
          name: 'Externe Klassen-Methoden',
          active: true,
          blocks: [
            { type: 'java_ext_static_call_noreturn', active: true },
            { type: 'java_ext_static_call_return',   active: true },
          ],
        },
      ],
    },
    {
      name: 'Klassen',
      active: true,
      blocks: [
        { type: 'defconstructor',  active: true },
        { type: 'callconstructor', active: true },
        { type: 'java_extends',    active: true },
        { type: 'java_super_call', active: true },
      ],
    },
  ],
};

export class WorkspaceManager {

  // ── Clear ────────────────────────────────────────────────────────────────

  /**
   * Resets the entire workspace to a blank new project:
   *  1. Clears all Blockly workspace JSON and constructor data from localStorage.
   *  2. Disconnects from any connected git repository.
   *  3. Loads the empty Blockly template.
   *  4. Removes all IDE files except Main.java and resets it to an empty state.
   *
   * @param {Blockly.WorkspaceSvg} ws – the live Blockly workspace
   */
  static clearWorkspace(ws) {
    // ── 1. Clear localStorage workspace files ────────────────────────────
    const keysToRemove = [];
    for (let i = 0; i < globalThis.localStorage.length; i++) {
      const key = globalThis.localStorage.key(i);
      if (key && (key.endsWith('.json') || key.endsWith('.xml'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(k => globalThis.localStorage.removeItem(k));

    // Clear constructor data.
    LocalStorageManager.clearAllConstructors();

    // Clear java-modified flags and generated-code cache so no overlay
    // is shown after the reset.
    LocalStorageManager.clearAllJavaModifiedData();
    BlocklyOverlayManager.hide();

    // Apply the full-active config so the blank workspace has an explicit
    // blockly-config.json (all categories on) rather than implicit defaults.
    ToolboxConfigManager.applyConfig(FULL_ACTIVE_CONFIG, ws);

    // ── 2. Disconnect git ────────────────────────────────────────────────
    GitService.clearConfig();

    // ── 3. Reset Blockly workspace ───────────────────────────────────────
    IdeBridge.selected_file_name = 'Main.java';
    IdeBridge.last_java_file_name = 'Main.java';

    Blockly.Events.disable();
    ws.clear();
    Blockly.serialization.workspaces.load(
      JSON.parse(JSON.stringify(emptyTemplate)),
      ws,
      false,
    );
    Blockly.Events.enable();

    // ── 4. Reset IDE files and select the fresh Main.java ────────────────
    this._resetIDE();
  }

  /**
   * Removes all Java and Markdown files from the IDE and creates a single
   * blank Main.java so the IDE always has at least one file.
   */
  static _resetIDE() {
    const ideAccess = globalThis.online_ide_access?.getIDE?.('Java');
    if (!ideAccess) return;

    const ide = ideAccess.ide;
    const files = [...ideAccess.getFiles()];

    // Remove all existing files.
    for (const ideFile of files) {
      const internalFile = ideFile.file ?? ideFile;
      ide?.removeFile?.(internalFile);
      ide?.fileExplorer?.removeFile?.(internalFile);
    }

    // Create a fresh Main.java and select it immediately so the editor
    // shows the blank file rather than whatever was open before.
    if (ide?.addFile) {
      const file = ide.addFile({ title: 'Main.java', text: '' });
      if (ide.fileExplorer?.addFile) {
        ide.fileExplorer.addFile(file);
      }
      // Select the new file in the file explorer so the editor reflects it.
      requestAnimationFrame(() => {
        const internalFile = file.file ?? file;
        const node = ide?.fileExplorer?.treeview?.nodes?.find(
          n => n.externalObject === internalFile
        );
        if (node) ide.fileExplorer.treeview.selectNodeAndSetFocus(node, false);
        ide?.fileExplorer?.selectFile?.(internalFile);
      });
    }

    // Tell the compiler about the structural change.
    ide?.getCompiler?.()?.triggerCompile?.();
  }

  // ── Download ─────────────────────────────────────────────────────────────

  /**
   * Packages the current workspace as a .b2j archive and triggers a browser
   * download.  The archive mirrors the Git repository layout used by GitService.
   */
  static async downloadWorkspace() {
    // Ask for a filename first.
    const result = await GitDialog.showDownloadFilenameDialog('blockly2java-workspace');
    if (!result) return;  // user cancelled

    // Strip a trailing .b2j if the user typed it, then re-append.
    const baseName = (result.filename?.trim() || 'blockly2java-workspace').replace(/\.b2j$/i, '');

    const zip = new JSZip();
    const src = zip.folder('src');

    // ── Blockly workspace JSON files (from localStorage) -----------------
    for (let i = 0; i < globalThis.localStorage.length; i++) {
      const key = globalThis.localStorage.key(i);
      if (!key || !key.endsWith('.json')) continue;
      const raw = globalThis.localStorage.getItem(key);
      if (!raw) continue;
      let pretty = raw;
      try { pretty = JSON.stringify(JSON.parse(raw), null, 2); } catch { /* keep raw */ }
      src.file(key, pretty);
    }

    // ── IDE files (.java and .md) ----------------------------------------
    const ideAccess = globalThis.online_ide_access?.getIDE?.('Java');
    if (ideAccess) {
      for (const ideFile of ideAccess.getFiles()) {
        const name    = ideFile.getName();
        const content = ideFile.getText() ?? '';
        if (name.endsWith('.java') || name.endsWith('.md')) {
          src.file(name, content);
        }
      }
    }

    // ── Toolbox config (blockly-config.json) ─────────────────────────────
    // Always export a config; fall back to the full-active preset so that
    // every downloaded archive contains an explicit, editable config file.
    const toolboxConfig = ToolboxConfigManager.lastConfig ?? FULL_ACTIVE_CONFIG;
    try {
      zip.file('blockly-config.json', JSON.stringify(toolboxConfig, null, 2));
    } catch { /* skip */ }

    // ── Blockly-override metadata (b2j-metadata.json) ────────────────────
    // Stores which classes have been manually edited so the flag survives
    // a round-trip through export + import.
    const modifiedClasses = LocalStorageManager.getAllJavaModifiedClassNames();
    zip.file('b2j-metadata.json', JSON.stringify({ javaModified: modifiedClasses }, null, 2));

    // ── Generate and download -------------------------------------------
    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${baseName}.b2j`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Upload ───────────────────────────────────────────────────────────────

  /**
   * Opens a file-picker, reads the selected .b2j archive, and imports the
   * workspace data – restoring Blockly workspaces, Java source files, and the
   * optional toolbox config – exactly as the Git clone / pull flow does.
   *
   * @param {Blockly.WorkspaceSvg} ws     – the live Blockly workspace
   * @param {Function}              onDone – called after a successful import
   *   with the imported file counts: `{ json, java, md }`
   */
  static async uploadWorkspace(ws, onDone) {
    // Prompt the user to pick a file.
    const file = await this._pickZipFile();
    if (!file) return null;              // user cancelled

    // Confirm destructive import before overwriting current workspace/IDE files.
    const confirmed = await GitDialog.showDragDropConfirm(file.name);
    if (!confirmed) return null;

    const counts = await this._processZipFile(file, ws);
    if (onDone) onDone(counts);
    return counts;
  }

  /**
   * Registers global drag-and-drop listeners so that .b2j files dropped
   * anywhere on the page trigger an import confirmation dialog.
   *
   * @param {Blockly.WorkspaceSvg} ws        – the live Blockly workspace
   * @param {Function}              onSuccess – called with `{ json, java, md }` counts
   * @param {Function}              onError   – called with the Error on failure
   */
  static setupDragDrop(ws, onSuccess, onError) {
    document.addEventListener('dragover', (e) => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    document.addEventListener('drop', async (e) => {
      const hasFiles = e.dataTransfer?.types?.includes('Files');
      if (!hasFiles) return;
      e.preventDefault();

      const file = [...(e.dataTransfer.files ?? [])].find(f => f.name.endsWith('.b2j'));
      if (!file) return;
      const confirmed = await GitDialog.showDragDropConfirm(file.name);
      if (!confirmed) return;

      try {
        const counts = await this._processZipFile(file, ws);
        if (onSuccess) onSuccess(counts);
      } catch (err) {
        console.error('Drag-drop import failed:', err);
        if (onError) onError(err);
      }
    });
  }

  /**
   * Processes a .b2j File object: extracts Blockly JSON, Java/MD files and the
   * optional toolbox config, then restores everything into the live workspace.
   * Shared by uploadWorkspace (file-picker flow) and setupDragDrop (drop flow).
   *
   * @param {File}                  file – the .b2j archive File
   * @param {Blockly.WorkspaceSvg}  ws   – the live Blockly workspace
   * @returns {Promise<{json: number, java: number, md: number}>}
   */
  static async _processZipFile(file, ws) {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    const counts = { json: 0, java: 0, md: 0 };

    // ── Extract files ----------------------------------------------------
    const jsonEntries = [];
    const javaFiles   = {};
    const mdFiles     = {};
    let   toolboxConfig = null;

    for (const [zipPath, zipEntry] of Object.entries(zip.files)) {
      if (zipEntry.dir) continue;
      // Normalise path separators.
      const normalised = zipPath.replace(/\\/g, '/');
      const basename   = normalised.split('/').pop();

      if (normalised === 'blockly-config.json') {
        const raw = await zipEntry.async('string');
        try { toolboxConfig = JSON.parse(raw); } catch { /* ignore */ }
        continue;
      }

      if (normalised === 'b2j-metadata.json') {
        // Restore java-modified flags from the archive.
        try {
          const meta = JSON.parse(await zipEntry.async('string'));
          if (Array.isArray(meta?.javaModified)) {
            LocalStorageManager.restoreJavaModifiedClassNames(meta.javaModified);
          }
        } catch { /* ignore malformed metadata */ }
        continue;
      }

      // Only process files inside src/.
      if (!normalised.startsWith('src/')) continue;

      const content = await zipEntry.async('string');

      if (basename.endsWith('.json')) {
        jsonEntries.push({ basename, content });
      } else if (basename.endsWith('.java')) {
        javaFiles[basename] = content;
      } else if (basename.endsWith('.md')) {
        mdFiles[basename] = content;
      }
    }

    // ── Restore JSON workspaces to localStorage --------------------------
    // First clear stale entries not present in the archive.
    const incomingJsonKeys = new Set(jsonEntries.map(e => e.basename));
    for (let i = globalThis.localStorage.length - 1; i >= 0; i--) {
      const key = globalThis.localStorage.key(i);
      if (key?.endsWith('.json') && !incomingJsonKeys.has(key)) {
        const className = key.replace(/\.json$/, '');
        LocalStorageManager.deleteClass(className);
      }
    }
    for (const { basename, content } of jsonEntries) {
      const className = basename.replace(/\.json$/, '');
      try {
        LocalStorageManager.saveWorkspace(className, JSON.parse(content));
      } catch {
        LocalStorageManager.saveWorkspace(className, content);
      }
      counts.json++;
    }

    // ── Import Java + Markdown files into the IDE ------------------------
    const allIdeFiles = { ...javaFiles, ...mdFiles };
    counts.java = Object.keys(javaFiles).length;
    counts.md   = Object.keys(mdFiles).length;

    this._importFilesToIDE(allIdeFiles);

    // Ensure there is an active Java target after import.
    // If the previously selected file was deleted by _importFilesToIDE(),
    // IdeBridge.selected_file_name may now be falsy. In that case, pick a
    // sensible default from the imported Java files (prefer Main.java).
    if (!IdeBridge.selected_file_name && counts.java > 0) {
      const javaNames = Object.keys(javaFiles);
      let activeJava = javaNames.find(name => name === 'Main.java') || javaNames[0];
      IdeBridge.selected_file_name = activeJava;
      IdeBridge.last_java_file_name = activeJava;
    }

    // ── Apply toolbox config (resets to full toolbox if absent) ----------
    ToolboxConfigManager.applyConfig(toolboxConfig, ws);

    // ── Reload Blockly for the active file -------------------------------
    const activeFile = IdeBridge.selected_file_name;
    if (activeFile) {
      load(ws);
    }

    // Update overlay immediately for the newly active class (flag may have
    // just been restored from the archive).
    if (activeFile) {
      BlocklyOverlayManager.updateForClass(activeFile.replace('.java', ''));
    }

    return counts;
  }

  /**
   * Pushes Java/Markdown file contents into the Online-IDE via the same
   * approach used by GitService.importJavaFilesToIDE.
   * @param {Object<string,string>} files – { filename: content }
   */
  static _importFilesToIDE(files) {
    const ideAccess = globalThis.online_ide_access?.getIDE?.('Java');
    if (!ideAccess) return;

    const ide           = ideAccess.ide;
    const currentFiles  = ideAccess.getFiles();
    const incomingNames = new Set(Object.keys(files));
    let   structChanged = false;

    // Remove IDE files not in the archive.
    for (const ideFile of currentFiles) {
      const name = ideFile.getName();
      if ((name.endsWith('.java') || name.endsWith('.md')) && !incomingNames.has(name)) {
        const internal = ideFile.file ?? ideFile;
        ide?.removeFile?.(internal);
        ide?.fileExplorer?.removeFile?.(internal);
        if (name.endsWith('.java')) IdeBridge.fileDeleted(name);
        structChanged = true;
      }
    }

    // Update or create files.
    const afterRemove = ideAccess.getFiles();
    for (const [name, content] of Object.entries(files)) {
      const match = afterRemove.find(f => f.getName() === name);
      if (match) {
        match.setText(content);
      } else if (ide?.addFile) {
        const file = ide.addFile({ title: name, text: content });
        if (ide.fileExplorer?.addFile) ide.fileExplorer.addFile(file);
        structChanged = true;
      }
    }

    if (structChanged) {
      ide?.getCompiler?.()?.triggerCompile?.();
    }
  }

  /**
   * Shows a file-picker limited to .b2j files and returns the selected File,
   * or null if the user cancels.
   * @returns {Promise<File|null>}
   */
  static _pickZipFile() {
    return new Promise((resolve) => {
      const input      = document.createElement('input');
      input.type       = 'file';
      input.accept     = '.b2j';
      input.style.display = 'none';

      // Resolve null if the dialog is closed without selecting a file.
      const onFocus = () => {
        setTimeout(() => {
          globalThis.removeEventListener('focus', onFocus);
          if (!input.files?.length) resolve(null);
        }, 300);
      };

      input.addEventListener('change', () => {
        globalThis.removeEventListener('focus', onFocus);
        resolve(input.files?.[0] ?? null);
      });

      document.body.appendChild(input);
      globalThis.addEventListener('focus', onFocus);
      input.click();
      // Clean up the element shortly after.
      setTimeout(() => input.remove(), 60_000);
    });
  }
}

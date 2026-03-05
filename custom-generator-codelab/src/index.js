/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import {javaGenerator} from './generators/java';
import {save, load} from './serialization';
import {toolbox} from './toolboxGrade9';
import * as CTR from './blocks/constructor.js';
import { methodFlyoutCategory, normalAttrFlyoutCategory, localVarFlyoutCategory, staticAttrFlyoutCategory, paramFlyoutCategory, allVariablesFlyoutCategory, allAttrFlyoutCategory } from './blocks/java_variable_blocks.js';
import * as JAVA_METHODS from './blocks/java_method_blocks.js';
import * as JAVA_OBJ_CALLS from './blocks/java_object_call_blocks.js';
import {getClassName, setClassName} from "./generators/javascript/javascript_generator";
import LocalStorageManager from "./utils/LocalStorageManager.js";

import './styles/stylesheet.css';
import './index.css';

// Utility classes
import { CodeTransformer } from './utils/CodeTransformer';
import { IdeBridge } from './utils/IdeBridge';
import { RestManager } from './utils/RestManager';
import { UiManager } from './utils/UiManager';
import { GitService } from './utils/GitService';
import { GitDialog } from './utils/GitDialog';
import { ToolboxConfigManager } from './utils/ToolboxConfigManager';
import { WorkspaceManager, FULL_ACTIVE_CONFIG } from './utils/WorkspaceManager';
import { BlocklyOverlayManager } from './utils/BlocklyOverlayManager';

// Module-level state
export let ws;

/** Guard: prevents the workspace change listener from re-entering onBlocksChange
 *  while a background multi-pass generation is in progress. */
let _batchGenerating = false;

// Instantiate managers
// Passing onXmlLoaded as callback for REST response
const restManager = new RestManager(onXmlLoaded, UiManager.showCodeDiv);


// ---------------------------------------------------------------------------
// Step 1 – Initialization  (page opens)
// ---------------------------------------------------------------------------

/**
 * Entry point — called once when the page opens.
 * Orchestrates theme creation, Blockly injection, responsive layout setup,
 * initial load, first code generation, and listener registration.
 */
function init() {
  const theme = UiManager.setupTheme();
  ws = setupBlockly(theme);
  UiManager.setupLayout(ws);

  // Restore a toolbox config that was applied in a previous session,
  // or apply the grade-9 default when the page is opened for the first time.
  const storedToolboxConfig = ToolboxConfigManager.loadStored();
  ToolboxConfigManager.applyConfig(storedToolboxConfig ?? FULL_ACTIVE_CONFIG, ws);

  // Load the initial state from storage and run the code.
  load(ws);
  //onBlocksChange();

  // Initialise the overlay manager that guards Blockly when Java was manually edited.
  BlocklyOverlayManager.init({
    getIDECode:     () => IdeBridge.getCurrentIDECode(),
    getClassName:   () => IdeBridge.selected_file_name.replace('.java', ''),
    onBlocksChange: () => onBlocksChange(),
  });

  // Show overlay immediately if the initially loaded class is already flagged.
  const initialClassName = IdeBridge.selected_file_name.replace('.java', '');
  BlocklyOverlayManager.updateForClass(initialClassName);

  setupListeners(ws);
}

/**
 * Injects Blockly into the page with the given theme.
 * @param {Blockly.Theme} theme
 * @returns {Blockly.WorkspaceSvg} the created workspace
 */
function setupBlockly(theme) {
  const blocklyDiv = document.getElementById('blocklyDiv');

  const workspace = Blockly.inject(blocklyDiv, {
    toolbox,
    theme,
  });

  // Dynamic flyout categories.
  workspace.registerToolboxCategoryCallback('JAVA_METHOD', methodFlyoutCategory);
  workspace.registerToolboxCategoryCallback('JAVA_NORMAL_ATTR', normalAttrFlyoutCategory);
  workspace.registerToolboxCategoryCallback('JAVA_LOCAL_VAR', localVarFlyoutCategory);
  workspace.registerToolboxCategoryCallback('JAVA_STATIC_ATTR', staticAttrFlyoutCategory);
  workspace.registerToolboxCategoryCallback('JAVA_PARAM', paramFlyoutCategory);
  workspace.registerToolboxCategoryCallback('JAVA_VARIABLES_ALL', allVariablesFlyoutCategory);
  workspace.registerToolboxCategoryCallback('JAVA_ATTR', allAttrFlyoutCategory);

  // Button callbacks: open the built-in dialog but create a typed variable.
  workspace.registerButtonCallback('CREATE_JAVA_NORMAL_ATTR',
    (btn) => Blockly.Variables.createVariableButtonHandler(btn.getTargetWorkspace(), null, ''));
  workspace.registerButtonCallback('CREATE_JAVA_LOCAL_VAR',
    (btn) => Blockly.Variables.createVariableButtonHandler(btn.getTargetWorkspace(), null, 'local'));
  workspace.registerButtonCallback('CREATE_JAVA_STATIC_ATTR',
    (btn) => Blockly.Variables.createVariableButtonHandler(btn.getTargetWorkspace(), null, 'static'));
  // Toolbox config editor button.
  document.getElementById('toolboxConfigBtn')?.addEventListener('click', () => {
    ToolboxConfigManager.openConfigEditor(ws, FULL_ACTIVE_CONFIG);
  });
  return workspace;
}

/**
 * Registers all workspace event listeners and the `online_ide_access` and
 * `selected_file_name` property hooks on `globalThis`.
 * @param {Blockly.WorkspaceSvg} workspace
 */
function setupListeners(workspace) {
  // Persist workspace state after every meaningful change.
  workspace.addChangeListener((e) => {
    if (e.isUiEvent) return;   // scrolling, zooming, etc. — skip
    save(workspace);
  });

  // Intercept assignments to globalThis.online_ide_access.
  // When the embedded IDE initialises it sets window.online_ide_access;
  // register IdeBridge callbacks at that moment.
  let _javaModifiedPollId = null;

  Object.defineProperty(globalThis, 'online_ide_access', {
    set: function(value) {
      this._online_ide_access = value;
      const ideAccess = value?.getIDE?.('Java');
      if (ideAccess) {
        ideAccess.onFileRenamed( (prev, next) => IdeBridge.filenameChanged(prev, next));
        ideAccess.onFileDeleted( (name)       => IdeBridge.fileDeleted(name));
        ideAccess.onFileCreated( (name)       => IdeBridge.fileCreated(name));
        ideAccess.onFileSelected((name)       => IdeBridge.fileSelected(name));

        // ── Java-modified detection polling ───────────────────────────
        // Poll every 350 ms to compare the IDE's current code against the
        // last Blockly-generated baseline.  As soon as they diverge (= the
        // user typed something in the Java editor) we set the flag and show
        // the overlay without waiting for the next Blockly event.
        if (_javaModifiedPollId) clearInterval(_javaModifiedPollId);
        _javaModifiedPollId = setInterval(() => {
          const className = IdeBridge.selected_file_name.replace('.java', '');
          if (!className) return;
          // Already flagged — overlay is visible, nothing more to do.
          if (LocalStorageManager.isJavaModified(className)) return;
          BlocklyOverlayManager.detectAndMarkIfModified(className);
        }, 350);
      }

      // ── Lift the IDE's bottom panel into B2J's managed section ────────────
      // The IDE creates .joe_bottomDiv inside #ide (inside #ideTopSection).
      // We move it to #ideBottomSection so B2J's horizontal drag handle
      // controls the split — giving a large, touch-friendly resize bar.
      requestAnimationFrame(() => {
        const ideDiv         = document.getElementById('ide');
        const bottomDiv      = ideDiv?.querySelector('.joe_bottomDiv');
        const ideBottomSection = document.getElementById('ideBottomSection');
        if (bottomDiv && ideBottomSection) {
          // Remove the IDE's own 4 px vertical slider strip (the .jo_slider
          // that sits at the very top of .joe_bottomDiv) — B2J replaces it.
          const ideInternalSlider = bottomDiv.querySelector(':scope > .jo_slider');
          ideInternalSlider?.remove();

          // The ThemeManager sets dark-mode CSS custom properties as inline
          // styles on #ide. Since #ideBottomSection is a sibling (not a
          // descendant), those vars won't cascade. Copy them across so the
          // relocated bottom panel gets the same colors.
          for (let i = 0; i < ideDiv.style.length; i++) {
            const prop = ideDiv.style[i];
            if (prop.startsWith('--')) {
              ideBottomSection.style.setProperty(prop, ideDiv.style.getPropertyValue(prop));
            }
          }

          // Relocate the bottom panel into B2J's section.
          ideBottomSection.appendChild(bottomDiv);
          // Let Monaco know its container dimensions changed.
          window.dispatchEvent(new Event('resize'));
        }
      });
    },
    get: function() {
      return this._online_ide_access;
    }
    
  });

  // Re-generate code after every meaningful workspace change.
  // The listener is DEBOUNCED: we wait until the current JS task (and all
  // synchronous workspace events it produces) finishes before running code
  // generation.  Without this, a single block-shape mutation (which fires a
  // burst of removeInput / appendInput / setValue events) would trigger
  // onBlocksChange() for each individual event, and each call would swap
  // workspaces via silentGenerateForClass → load(ws) mid-mutation, creating
  // an endless event→generation→swap→event loop.
  let _codeGenTimer = null;
  workspace.addChangeListener((e) => {
    if (e.isUiEvent || e.type == Blockly.Events.FINISHED_LOADING ||
      workspace.isDragging()) {
      return;
    }
    clearTimeout(_codeGenTimer);
    _codeGenTimer = setTimeout(() => {
      // If a Blockly FieldTextInput editor is currently active (user is typing
      // inside a block's text field), running onBlocksChange() would call
      // load(ws) which rebuilds the workspace DOM and destroys the focused
      // <input>, causing focus loss after every character.
      // Instead, defer code generation until the field editor is dismissed.
      const active = document.activeElement;
      if (active && active.tagName === 'INPUT' && active.closest?.('.blocklyWidgetDiv')) {
        active.addEventListener('blur', () => {
          // If the user clicked elsewhere to dismiss the editor, a gesture may
          // already be starting (pointerdown fired before blur). Cancel it so
          // that load(ws) inside onBlocksChange() doesn't operate on stale
          // block references while the gesture's handlers are still bound.
          if (ws.currentGesture_) {
            ws.currentGesture_.cancel();
          }
          onBlocksChange();
        }, { once: true });
        return;
      }
      onBlocksChange();
    }, 0);
  });

  // Clean up orphaned 'param' variables whenever any block is deleted.
  // compose() handles param cleanup when individual params are removed via the
  // mutator dialog, but deleting an entire method/constructor block bypasses it.
  const METHOD_BLOCK_TYPES = [
    'java_static_method_noreturn', 'java_static_method_return',
    'java_method_noreturn', 'java_method_return',
    'defconstructor',
  ];
  workspace.addChangeListener((e) => {
    if (e.type !== Blockly.Events.BLOCK_DELETE) return;

    // Collect all param names still claimed by surviving method blocks.
    const claimedNames = new Set();
    for (const type of METHOD_BLOCK_TYPES) {
      for (const block of workspace.getBlocksByType(type, true)) {
        for (const name of (block.arguments_ ?? [])) {
          claimedNames.add(name);
        }
      }
    }

    // Delete any 'param' workspace variable not claimed by a surviving block.
    for (const variable of workspace.getVariablesOfType('param')) {
      if (!claimedNames.has(variable.name)) {
        workspace.deleteVariableById(variable.getId());
      }
    }
  });
}


// ---------------------------------------------------------------------------
// Step 2 – Blocks changed  (user edits the Blockly diagram)
// ---------------------------------------------------------------------------

/**
 * Called whenever the Blockly blocks change meaningfully.
 * Clears stale constructor data, regenerates Java code, transforms it,
 * and pushes the result to the online IDE.
 * If the IDE is currently showing a Markdown file, it is switched back to
 * the last active Java file first.
 */
export function onBlocksChange() {
  // Do not re-enter while a background multi-pass generation is in progress.
  if (_batchGenerating) return;

  // If the IDE is showing a .md file, switch it back to the Java file.
  IdeBridge.ensureJavaFileActive();

  IdeBridge.syncClassNameFromIDE();

  // Do not overwrite manually edited Java code.  This guard covers every call
  // site: Blockly events, post-import, post-clone/pull, etc.
  const className = IdeBridge.selected_file_name.replace('.java', '');
  if (!className) return;
  if (className && LocalStorageManager.isJavaModified(className)) {
    BlocklyOverlayManager.show();
    return;
  }

  // ── Pass 0: generate the currently active class ─────────────────────────
  // This populates its callsite hints (e.g. new Child(42)) in localStorage
  // so the background passes below can read them for downstream classes.
  LocalStorageManager.clearConstructors(getClassName());
  LocalStorageManager.clearMethods(getClassName());

  const rawCode = generateCode();
  const modCode = CodeTransformer.transformCode(rawCode);
  IdeBridge.pushCodeToIDE(modCode);

  // ── Background multi-pass: propagate type hints across all other classes ─
  // Pass 1: each other class reads hints written by pass 0 (or older state).
  // Pass 2: classes further down the inheritance chain (e.g. Super) pick up
  //         the super-call hints written by pass 1 (e.g. in Child).
  // After both passes the active class is re-generated so IT benefits too
  // from any hints that were updated during the background passes.
  _batchGenerating = true;
  try {
    const activeClass = getClassName();
    const allConstructors = LocalStorageManager.getAllConstructors() ?? {};
    const otherClasses = Object.keys(allConstructors).filter(
      c => c && c !== activeClass && !LocalStorageManager.isJavaModified(c)
    );

    if (otherClasses.length > 0) {
      // Pass 1 — propagate from active class outward.
      for (const cls of otherClasses) {
        silentGenerateForClass(cls);
      }
      // Pass 2 — handle indirect chains (A→B→C: B must be done before C).
      for (const cls of otherClasses) {
        silentGenerateForClass(cls);
      }

      // Restore the active class workspace so the user still sees their class.
      IdeBridge.selected_file_name = activeClass + '.java';
      setClassName(activeClass);
      load(ws);

      // Re-generate the active class now that all downstream hints are fresh.
      LocalStorageManager.clearConstructors(activeClass);
      LocalStorageManager.clearMethods(activeClass);
      const rawCode2 = generateCode();
      const modCode2 = CodeTransformer.transformCode(rawCode2);
      IdeBridge.pushCodeToIDE(modCode2);
    }
  } finally {
    _batchGenerating = false;
  }
}



// ---------------------------------------------------------------------------
// Step 3 – XML loaded from REST backend
// ---------------------------------------------------------------------------

/**
 * Called when the REST backend returns saved XML for the current file.
 * Parses the response, restores the workspace, and triggers code generation.
 * @param {XMLHttpRequest} xhttp - the completed XHR whose response contains
 *   a code-prefix and XML block, separated by "|||||"
 */
function onXmlLoaded(xhttp) {
  const array = xhttp.response.split("|||||", 2);
  // codePrefix from array[0] is unused as it is regenerated in CodeTransformer

  IdeBridge.syncClassNameFromIDE();

  const xml = Blockly.utils.xml.textToDom(array[1]);
  Blockly.getMainWorkspace().clear();
  Blockly.Xml.domToWorkspace(xml, Blockly.getMainWorkspace());

  onBlocksChange();
}


// ---------------------------------------------------------------------------
// Code generation helper
// ---------------------------------------------------------------------------

/**
 * Generates raw Java code from the current Blockly workspace.
 * @returns {string} raw generated Java code (before any transformations)
 */
function generateCode() {
  return javaGenerator.workspaceToCode(ws);
}

// ---------------------------------------------------------------------------
// Background silent generation helper
// ---------------------------------------------------------------------------

/**
 * Silently loads, generates, transforms, and pushes code for an arbitrary
 * class without disturbing the currently visible workspace.
 *
 * The workspace is swapped in with events disabled so no UI repaint or
 * spurious onBlocksChange() calls occur.  selected_file_name is temporarily
 * overwritten so that load() and pushCodeToIDEForClass() target the right
 * storage keys, then restored before returning.
 *
 * @param {string} className  Name of the class to (re)generate (no .java).
 */
function silentGenerateForClass(className) {
  if (!className) return;
  if (LocalStorageManager.isJavaModified(className)) return;

  // Bail out if there is no saved workspace for this class.
  const data = LocalStorageManager.loadWorkspace(className);
  if (!data) return;

  // Redirect load/save to the target class.
  const prevFileName = IdeBridge.selected_file_name;
  IdeBridge.selected_file_name = className + '.java';

  setClassName(className);
  LocalStorageManager.clearConstructors(className);
  LocalStorageManager.clearMethods(className);

  // load() internally calls Blockly.Events.disable/enable, so the workspace
  // change listener won't fire and trigger a recursive onBlocksChange().
  load(ws);

  const rawCode = generateCode();
  const modCode = CodeTransformer.transformCode(rawCode);
  IdeBridge.pushCodeToIDEForClass(className, modCode);

  // Restore the previously selected file name so subsequent calls and the
  // final restore in onBlocksChange() operate on the right class.
  IdeBridge.selected_file_name = prevFileName;
}



// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

init();
setupGitActions();
setupWorkspaceActions();

// Register service worker for installability (best-effort; silent on failure).
// Skip on localhost to avoid Chrome debug reload loops caused by skipWaiting()+clients.claim().
if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-basic.js').catch(() => {});
  });
}


// ---------------------------------------------------------------------------
// Step 4 – Workspace management (clear / download / upload)
// ---------------------------------------------------------------------------

/**
 * Wires up the three workspace action buttons:
 *  - Reset  – clears the workspace after a confirmation dialog
 *  - Export – downloads the workspace as a .b2j archive
 *  - Import – uploads a previously exported .b2j archive
 */
function setupWorkspaceActions() {
  const clearBtn    = document.getElementById('workspaceClearBtn');
  const downloadBtn = document.getElementById('workspaceDownloadBtn');
  const uploadBtn   = document.getElementById('workspaceUploadBtn');

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const confirmed = await GitDialog.showClearConfirm();
      if (!confirmed) return;

      for(var i = 0; i < 2; i++) {
          WorkspaceManager.clearWorkspace(ws);

        // Push freshly generated code (empty template) into the new Main.java.
        onBlocksChange();

        // After clearing, update git button states (clone becomes available again).
        updateGitButtonStates();

      }
    });
  }

  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      try {
        await WorkspaceManager.downloadWorkspace();
      } catch (err) {
        console.error('Workspace export failed:', err);
        await GitDialog.showMessage('Fehler beim Export', err.message);
      }
    });
  }

  if (uploadBtn) {
    uploadBtn.addEventListener('click', async () => {
      try {
        // Pick + read the zip first (no loading overlay during file picker).
        const counts = await WorkspaceManager.uploadWorkspace(ws, null);

        if (counts === null) return; // user cancelled the file picker

        // After upload, regenerate the code for the active file.
        onBlocksChange();

        // Update git button states: connecting git after import still works.
        updateGitButtonStates();

        const total = counts.json + counts.java + counts.md;
        await GitDialog.showMessage(
          'Import erfolgreich',
          `${total} Datei(en) importiert (${counts.java} Java, ${counts.json} Workspace, ${counts.md} Markdown).`,
        );
      } catch (err) {
        console.error('Workspace import failed:', err);
        await GitDialog.showMessage('Fehler beim Import', err.message);
      }
    });
  }

  // ── Drag-and-drop anywhere on the page ──────────────────────────────────
  WorkspaceManager.setupDragDrop(
    ws,
    async (counts) => {
      onBlocksChange();
      updateGitButtonStates();
      const total = counts.json + counts.java + counts.md;
      await GitDialog.showMessage(
        'Import erfolgreich',
        `${total} Datei(en) importiert (${counts.java} Java, ${counts.json} Workspace, ${counts.md} Markdown).`,
      );
    },
    async (err) => {
      await GitDialog.showMessage('Fehler beim Import', err.message);
    },
  );
}


// ---------------------------------------------------------------------------
// Step 5 – Git integration
// ---------------------------------------------------------------------------

/**
 * Wires up the three git action buttons (clone, pull, commit & push)
 * and restores UI state if a session config already exists.
 */
function setupGitActions() {
  const cloneBtn = document.getElementById('gitCloneBtn');
  const pullBtn  = document.getElementById('gitPullBtn');
  const pushBtn  = document.getElementById('gitPushBtn');

  if (!cloneBtn || !pullBtn || !pushBtn) return;

  updateGitButtonStates();

  cloneBtn.addEventListener('click', handleClone);
  pullBtn.addEventListener('click',  handlePull);
  pushBtn.addEventListener('click',  handleCommitAndPush);

  const infoBtn = document.getElementById('gitInfoBtn');
  if (infoBtn) {
    infoBtn.addEventListener('click', async () => {
      const cfg = GitService.getStoredConfig();
      const info = await GitService.getLatestCommitInfo().catch(() => null);
      await GitDialog.showInfoDialog(cfg?.url ?? null, info?.message ?? null, info?.timestamp ?? null);
    });
  }
}

/** Enables / disables pull & push buttons based on connection state.
 *  Also refreshes the repo URL and latest commit message in the sidebar. */
function updateGitButtonStates() {
  const cloneBtn = document.getElementById('gitCloneBtn');
  const pullBtn  = document.getElementById('gitPullBtn');
  const pushBtn  = document.getElementById('gitPushBtn');
  if (!cloneBtn || !pullBtn || !pushBtn) return;

  const connected = GitService.isConnected();
  pullBtn.disabled = !connected;
  pushBtn.disabled = !connected;

  const infoBtn = document.getElementById('gitInfoBtn');
  if (infoBtn) infoBtn.disabled = !connected;

  cloneBtn.classList.toggle('git-sidebar-btn--connected', connected);
  cloneBtn.title = connected ? 'Verbunden – erneut klonen' : 'Repository klonen';

}


/**
 * Handles the "Clone" flow:
 *  1. Prompt for repository URL.
 *  2. If the URL contains no password, prompt separately.
 *  3. Clone and import files.
 */
async function handleClone() {
  const urlResult = await GitDialog.showCloneDialog();
  if (!urlResult) return;              // user cancelled

  const { url: rawUrl } = urlResult;
  if (!rawUrl.trim()) return;

  // Parse URL to check for embedded credentials.
  const { username, password } = GitService.parseGitUrl(rawUrl);

  let finalPassword = password;
  if (username && !password) {
    const pwResult = await GitDialog.showPasswordDialog(username);
    if (!pwResult) return;             // user cancelled
    finalPassword = pwResult.password;
  }

  const dismiss = GitDialog.showLoading('Klone Repository…');
  try {
    const files = await GitService.clone(rawUrl, finalPassword);
    dismiss();

    // Apply toolbox config from the repo (resets to full toolbox when absent).
    ToolboxConfigManager.applyConfig(files.toolboxConfig, ws);

    // Import Java and Markdown files into the Online-IDE.
    importJavaFilesToIDE({ ...files.java, ...files.md });

    // After importing, prefer displaying a markdown file if one exists.
    // We use fileExplorer.selectFile directly because IdeBridge.fileSelected
    // intentionally ignores .md files (they are view-only panels).
    const ideAccess = globalThis.online_ide_access?.getIDE?.('Java');
    const ideFiles = ideAccess?.getFiles?.() ?? [];
    const mdFile = ideFiles.find(f => f.getName().toLowerCase().endsWith('.md'));
    if (mdFile) {
      const ide = ideAccess.ide;
      const internalFile = mdFile.file ?? mdFile;
      // Select the treeview node so it gets highlighted in the file explorer.
      const node = ide?.fileExplorer?.treeview?.nodes?.find(n => n.externalObject === internalFile);
      if (node) ide.fileExplorer.treeview.selectNodeAndSetFocus(node, false);
      ide?.fileExplorer?.selectFile?.(internalFile);

      // Load the first Java file's Blockly workspace without switching the IDE
      // view away from the markdown file.
      const firstJavaFile = ideFiles.find(f => f.getName().toLowerCase().endsWith('.java'));
      if (firstJavaFile) {
        IdeBridge.selected_file_name = firstJavaFile.getName();
        IdeBridge.last_java_file_name = firstJavaFile.getName();
        IdeBridge.syncClassNameFromIDE();
        load(ws);
      }
    } else if (!IdeBridge.selected_file_name) {
      if (ideFiles.length > 0) {
        IdeBridge.fileSelected(ideFiles[0].getName());
      }
    } else {
      load(ws);
      onBlocksChange();
    }

    updateGitButtonStates();

    const fileCount = Object.keys(files.json).length + Object.keys(files.java).length + Object.keys(files.md).length;
    await GitDialog.showMessage(
      'Erfolgreich geklont',
      `${fileCount} Datei(en) importiert.`,
    );
  } catch (err) {
    dismiss();
    console.error('Git clone failed:', err);
    await GitDialog.showMessage('Fehler beim Klonen', err.message);
  }
}

/**
 * Ensures that git credentials (URL + password) are available for the current
 * session.  If the session has expired (browser was closed and reopened) but
 * the repo URL is still known from localStorage, prompts the user to re-enter
 * their password and re-stores it in sessionStorage.
 *
 * @returns {Promise<boolean>} false when the user cancels the password dialog
 */
async function ensureCredentials() {
  if (GitService.hasSessionCredentials()) return true;  // already have password

  const cfg = GitService.getStoredConfig();
  if (!cfg) return false;  // no repo known at all

  // Session expired — ask for password.
  const pwResult = await GitDialog.showPasswordDialog(cfg.username);
  if (!pwResult) return false;  // user cancelled

  GitService._storeConfig(cfg.url, cfg.username, pwResult.password);
  return true;
}

/**
 * Handles the "Pull" flow.
 */
async function handlePull() {
  if (!await ensureCredentials()) return;

  const dismiss = GitDialog.showLoading('Lade Änderungen…');
  try {
    const files = await GitService.pull();
    dismiss();

    // Apply toolbox config from the repo (resets to full toolbox when absent).
    ToolboxConfigManager.applyConfig(files.toolboxConfig, ws);

    importJavaFilesToIDE({ ...files.java, ...files.md });

    if (IdeBridge.selected_file_name) {
      load(ws);
      onBlocksChange();
    }

    updateGitButtonStates();

    const fileCount = Object.keys(files.json).length + Object.keys(files.java).length + Object.keys(files.md).length;
    await GitDialog.showMessage(
      'Pull erfolgreich',
      `${fileCount} Datei(en) aktualisiert.`,
    );
  } catch (err) {
    dismiss();
    console.error('Git pull failed:', err);
    await GitDialog.showMessage('Fehler beim Pull', err.message);
  }
}

/**
 * Handles the "Commit & Push" flow.
 */
async function handleCommitAndPush() {
  if (!await ensureCredentials()) return;

  const commitResult = await GitDialog.showCommitDialog();
  if (!commitResult) return;

  // Detect top-level Java code (code outside any class definition)
  const topLevelCodeInfos = GitService.getTopLevelCodeInfo();
  let stripTopLevelCode = false;
  if (topLevelCodeInfos.length > 0) {
    const choice = await GitDialog.showTopLevelCodeWarningDialog(topLevelCodeInfos);
    if (choice === null) return;          // user cancelled
    stripTopLevelCode = (choice === 'strip');
  }

  const dismiss = GitDialog.showLoading('Committe und pushe…');
  try {
    await GitService.commitAndPush(commitResult.message, { stripTopLevelCode });
    dismiss();
    updateGitButtonStates();
    await GitDialog.showMessage('Push erfolgreich', 'Änderungen wurden gepusht.');
  } catch (err) {
    dismiss();
    console.error('Git commit & push failed:', err);
    await GitDialog.showMessage('Fehler beim Push', err.message);
  }
}

/**
 * Pushes Java file contents from a git clone/pull into the Online-IDE.
 * Updates existing files via setText() and creates new files that don't
 * exist yet using the IDE's internal addFile / fileExplorer API.
 * @param {Object<string,string>} javaFiles – { 'Main.java': 'code…', … }
 */
function importJavaFilesToIDE(javaFiles) {
  const ideAccess = globalThis.online_ide_access?.getIDE?.('Java');
  if (!ideAccess) return;

  const ideFiles = ideAccess.getFiles();
  const pulledNames = new Set(Object.keys(javaFiles));
  let structureChanged = false;

  // ── Remove IDE files that no longer exist in the repo ─────────────────
  for (const ideFile of ideFiles) {
    const name = ideFile.getName();
    if ((name.endsWith('.java') || name.endsWith('.md')) && !pulledNames.has(name)) {
      const ide = ideAccess.ide;
      // ideFile wraps the internal file object; access it via .file
      const internalFile = ideFile.file ?? ideFile;
      if (ide?.removeFile) {
        ide.removeFile(internalFile);
      }
      if (ide?.fileExplorer?.removeFile) {
        ide.fileExplorer.removeFile(internalFile);
      }
      // Also clean up the corresponding Blockly workspace from localStorage.
      if (name.endsWith('.java')) IdeBridge.fileDeleted(name);
      structureChanged = true;
      console.log(`Git: Datei „${name}" aus IDE entfernt.`);
    }
  }

  // ── Create / update files from the repo ───────────────────────────────
  // Re-fetch the file list after possible deletions.
  const currentIdeFiles = ideAccess.getFiles();

  for (const [fileName, content] of Object.entries(javaFiles)) {
    const match = currentIdeFiles.find(f => f.getName() === fileName);
    if (match) {
      match.setText(content);
    } else {
      // The external API doesn't expose createFile, but the internal
      // embedded IDE object provides addFile({title, text}) and its
      // fileExplorer can register the new node in the treeview.
      const ide = ideAccess.ide;
      if (ide?.addFile) {
        const file = ide.addFile({ title: fileName, text: content });
        if (ide.fileExplorer?.addFile) {
          ide.fileExplorer.addFile(file);
        }
        structureChanged = true;
        console.log(`Git: Datei „${fileName}" in IDE angelegt.`);
      } else {
        console.warn(
          `Git: Datei „${fileName}" existiert nicht in der IDE – ` +
          'bitte manuell anlegen und erneut pullen.',
        );
      }
    }
  }

  // If we created or removed files, tell the compiler so it picks up
  // the changes immediately.
  if (structureChanged) {
    const ide = ideAccess.ide;
    ide?.getCompiler?.()?.triggerCompile?.();
  }
}

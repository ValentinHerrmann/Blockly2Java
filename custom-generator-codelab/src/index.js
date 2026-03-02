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
import { methodFlyoutCategory, normalAttrFlyoutCategory, localVarFlyoutCategory, staticAttrFlyoutCategory, paramFlyoutCategory, allVariablesFlyoutCategory } from './blocks/java_variable_blocks.js';
import * as JAVA_METHODS from './blocks/java_method_blocks.js';
import {getClassName} from "./generators/javascript/javascript_generator";
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

// Module-level state
export let ws;

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

  // Load the initial state from storage and run the code.
  load(ws);
  //onBlocksChange();

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

  // Button callbacks: open the built-in dialog but create a typed variable.
  workspace.registerButtonCallback('CREATE_JAVA_NORMAL_ATTR',
    (btn) => Blockly.Variables.createVariableButtonHandler(btn.getTargetWorkspace(), null, ''));
  workspace.registerButtonCallback('CREATE_JAVA_LOCAL_VAR',
    (btn) => Blockly.Variables.createVariableButtonHandler(btn.getTargetWorkspace(), null, 'local'));
  workspace.registerButtonCallback('CREATE_JAVA_STATIC_ATTR',
    (btn) => Blockly.Variables.createVariableButtonHandler(btn.getTargetWorkspace(), null, 'static'));

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
  Object.defineProperty(globalThis, 'online_ide_access', {
    set: function(value) {
      this._online_ide_access = value;
      const ideAccess = value?.getIDE?.('Java');
      if (ideAccess) {
        ideAccess.onFileRenamed( (prev, next) => IdeBridge.filenameChanged(prev, next));
        ideAccess.onFileDeleted( (name)       => IdeBridge.fileDeleted(name));
        ideAccess.onFileCreated( (name)       => IdeBridge.fileCreated(name));
        ideAccess.onFileSelected((name)       => IdeBridge.fileSelected(name));
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
  workspace.addChangeListener((e) => {
    if (e.isUiEvent || e.type == Blockly.Events.FINISHED_LOADING ||
      workspace.isDragging()) {
      return;
    }
    onBlocksChange();
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
  // If the IDE is showing a .md file, switch it back to the Java file.
  IdeBridge.ensureJavaFileActive();

  IdeBridge.syncClassNameFromIDE();
  LocalStorageManager.clearConstructors(getClassName());

  const rawCode = generateCode();
  const modCode = CodeTransformer.transformCode(rawCode);
  IdeBridge.pushCodeToIDE(modCode);
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
// Start
// ---------------------------------------------------------------------------

init();
setupGitActions();

// Register service worker for installability (best-effort; silent on failure).
// Skip on localhost to avoid Chrome debug reload loops caused by skipWaiting()+clients.claim().
if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-basic.js').catch(() => {});
  });
}


// ---------------------------------------------------------------------------
// Step 4 – Git integration
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
    } else if (!IdeBridge.selected_file_name) {
      if (ideFiles.length > 0) {
        IdeBridge.fileSelected(ideFiles[0].getName());
      }
    } else {
      load(ws);
      onBlocksChange();
    }

    updateGitButtonStates();

    const fileCount = Object.keys(files.xml).length + Object.keys(files.java).length + Object.keys(files.md).length;
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
 * Handles the "Pull" flow.
 */
async function handlePull() {
  const dismiss = GitDialog.showLoading('Lade Änderungen…');
  try {
    const files = await GitService.pull();
    dismiss();

    importJavaFilesToIDE({ ...files.java, ...files.md });

    if (IdeBridge.selected_file_name) {
      load(ws);
      onBlocksChange();
    }

    updateGitButtonStates();

    const fileCount = Object.keys(files.xml).length + Object.keys(files.java).length + Object.keys(files.md).length;
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

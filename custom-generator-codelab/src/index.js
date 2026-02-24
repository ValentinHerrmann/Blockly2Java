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
import {getClassName} from "./generators/javascript/javascript_generator";
import LocalStorageManager from "./utils/LocalStorageManager.js";

import './stylesheet.css';
import './index.css';

// Utility classes
import { CodeTransformer } from './utils/CodeTransformer';
import { IdeBridge } from './utils/IdeBridge';
import { RestManager } from './utils/RestManager';
import { UiManager } from './utils/UiManager';

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
  onBlocksChange();

  setupListeners(ws);
}

/**
 * Injects Blockly into the page with the given theme.
 * @param {Blockly.Theme} theme
 * @returns {Blockly.WorkspaceSvg} the created workspace
 */
function setupBlockly(theme) {
  const blocklyDiv = document.getElementById('blocklyDiv');

  return Blockly.inject(blocklyDiv, {
    toolbox,
    theme,
  });
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
}


// ---------------------------------------------------------------------------
// Step 2 – Blocks changed  (user edits the Blockly diagram)
// ---------------------------------------------------------------------------

/**
 * Called whenever the Blockly blocks change meaningfully.
 * Clears stale constructor data, regenerates Java code, transforms it,
 * and pushes the result to the online IDE.
 */
function onBlocksChange() {
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

// Register service worker for installability (best-effort; silent on failure).
// Skip on localhost to avoid Chrome debug reload loops caused by skipWaiting()+clients.claim().
if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw-basic.js').catch(() => {});
  });
}

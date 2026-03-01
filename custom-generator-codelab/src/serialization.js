/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly/core';
import LocalStorageManager from './utils/LocalStorageManager';
import { IdeBridge } from './utils/IdeBridge';


/**
 * Saves the state of the workspace to browser's local storage.
 * @param {Blockly.Workspace} workspace Blockly workspace to save.
 */
export const save = function(workspace) {
  const data = Blockly.serialization.workspaces.save(workspace);
  const selectedFileName = IdeBridge.selected_file_name || '';
  const className = selectedFileName.replaceAll('.java', '');
  if(selectedFileName === '') {
    console.warn('No file selected, skipping workspace save.');
    return;
  }
  LocalStorageManager.saveWorkspace(className, data);
};

/**
 * Loads saved state from local storage into the given workspace.
 * @param {Blockly.Workspace} workspace Blockly workspace to load into.
 */
export const load = function(workspace) {
  const selectedFileName = IdeBridge.selected_file_name || '';
  const className = selectedFileName.replaceAll('.java', '');
  if(selectedFileName === '') {
    console.warn('No file selected, skipping workspace save.');
    return;
  }
  const emptyTemplate = {"blocks":{"languageVersion":0,"blocks":[{"type":"java_static_method_noreturn","id":"0-~]xj!ER5LuqkjtzKSY","x":92,"y":164,"extraState":"<mutation xmlns=\"http://www.w3.org/1999/xhtml\"></mutation>","icons":{"comment":{"text":"Das Hauptprogramm (main-Methode): \nAlles, was ausgeführt werden soll, \nmuss in diese Methode eingefügt werden. \nObjekte erstellen, Methoden aufrufen, ...\n\nDas Hauptprogramm wird automatisch \ngestartet, wenn du auf 'Play' drückst.","pinned":true,"height":69.96484375,"width":305.83197021484375}},"fields":{"NAME":"main"}}]}};
  const data = LocalStorageManager.loadWorkspace(className) || JSON.stringify(emptyTemplate);

  // Don't emit events during loading.
  Blockly.Events.disable();
  Blockly.serialization.workspaces.load(JSON.parse(data), workspace, false);
  Blockly.Events.enable();
};

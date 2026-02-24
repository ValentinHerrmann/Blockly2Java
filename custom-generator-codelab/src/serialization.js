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
  const data = LocalStorageManager.loadWorkspace(className) || JSON.stringify([]);

  // Don't emit events during loading.
  Blockly.Events.disable();
  Blockly.serialization.workspaces.load(JSON.parse(data), workspace, false);
  Blockly.Events.enable();
};

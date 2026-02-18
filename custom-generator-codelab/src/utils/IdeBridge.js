import * as Blockly from 'blockly';
import { setClassName } from "../generators/javascript/javascript_generator";
import LocalStorageManager from "./LocalStorageManager.js";
import { load } from "../serialization.js";

const WORKSPACE_STORAGE_KEY = 'b2j_workspace_';
const CONSTRUCTORS_STORAGE_KEY = 'constructors';

export class IdeBridge {
  static getSelectedFileName() {
    if ('selected_file_name' in globalThis) {
      return globalThis.selected_file_name;
    }
    console.warn('selected_file_name is not available on globalThis.');
    return '';
  }

  static syncClassNameFromIDE() {
    let className = 'MeineKlasse';
    const fileName = this.getSelectedFileName();
    if (fileName) {
      className = fileName.replace('.java', '');
    }
    setClassName(className);
  }

  static pushCodeToIDE(modCode) {
    const ide = document.getElementById('ide');
    if (!ide) return;

    if (!globalThis.online_ide_access) {
      console.warn('online_ide_access is not available on globalThis.');
      return;
    }

    //@ts-ignore
    const ideAccess = globalThis.online_ide_access.getIDE('Java');
    const files = ideAccess.getFiles();
    const selectedFileName = this.getSelectedFileName();

    for (const element of files) {
      const file = element;
      if (file.getName() === selectedFileName || selectedFileName === '') {
        console.log('Name: ' + file.getName());
        file.setText(modCode);
      }
    }
  }

  /**
   * Called when the user renames a file in the online IDE.
   * Migrates the stored Blockly workspace and constructor data to the new name,
   * and updates the active class name if the renamed file is currently selected.
   * @param {string} previousName - old filename (e.g. 'Foo.java')
   * @param {string} newName      - new filename (e.g. 'Bar.java')
   */
  static filenameChanged(previousName, newName) {
    console.log(`IdeBridge: file renamed ${previousName} → ${newName}`);
    // Migrate the saved Blockly workspace to the new storage key.
    const oldKey = WORKSPACE_STORAGE_KEY + previousName;
    const newKey = WORKSPACE_STORAGE_KEY + newName;
    const savedData = globalThis.localStorage?.getItem(oldKey);
    if (savedData) {
      globalThis.localStorage.setItem(newKey, savedData);
      globalThis.localStorage.removeItem(oldKey);
    }

    // Migrate constructor data from old class name to new class name.
    const oldClassName = previousName.replace('.java', '');
    const newClassName = newName.replace('.java', '');
    const ctrsJSON = globalThis.localStorage?.getItem(CONSTRUCTORS_STORAGE_KEY);
    if (ctrsJSON) {
      const ctrs = JSON.parse(ctrsJSON);
      if (ctrs[oldClassName] !== undefined) {
        ctrs[newClassName] = ctrs[oldClassName];
        delete ctrs[oldClassName];
        globalThis.localStorage.setItem(CONSTRUCTORS_STORAGE_KEY, JSON.stringify(ctrs));
      }
    }

    // If the renamed file is currently active, update the backing field directly
    // (bypassing the setter so we don't trigger a reload) and sync the class name.
    if (this.getSelectedFileName() === previousName) {
      globalThis.selected_file_name = newName;
      this.syncClassNameFromIDE();
    }
  }

  /**
   * Called when the user deletes a file in the online IDE.
   * Removes the stored Blockly workspace and constructor data for that file,
   * and clears the Blockly workspace if the deleted file was currently selected.
   * @param {string} fileName - the deleted filename (e.g. 'Foo.java')
   */
  static fileDeleted(fileName) {
    console.log(`IdeBridge: file deleted ${fileName}`);
    // Remove the saved Blockly workspace.
    const key = WORKSPACE_STORAGE_KEY + fileName;
    globalThis.localStorage?.removeItem(key);

    // Clear constructor data for that class.
    const className = fileName.replace('.java', '');
    LocalStorageManager.deleteClass(className);

    // If the deleted file was currently active, clear the Blockly workspace.
    if (this.getSelectedFileName() === fileName) {
      Blockly.getMainWorkspace()?.clear();
      globalThis.selected_file_name = '';
      this.syncClassNameFromIDE();
    }
  }

  /**
   * Called when a new file is created in the online IDE.
   * Clears any stale workspace and constructor data stored under that name.
   * @param {string} fileName - the new filename (e.g. 'Bar.java')
   */
  static fileCreated(fileName) {
    console.debug(`IdeBridge: file created ${fileName}`);
    // Clear stale workspace data that might exist under this name.
    globalThis.localStorage?.removeItem(WORKSPACE_STORAGE_KEY + fileName);

    // Clear stale constructor data for that class.
    const className = fileName.replace('.java', '');
    LocalStorageManager.clearStoredCtrs_thisClass(className);

    console.log(`IdeBridge: file created ${fileName}`);
  }

  /**
   * Called when the user selects a file in the online IDE.
   * Updates the global file name, loads the corresponding Blockly workspace,
   * and syncs the className used by the code generator.
   * @param {string} fileName - the selected filename (e.g. 'Foo.java')
   */
  static fileSelected(fileName) {
    console.log(`IdeBridge: file selected ${fileName}`);
    // Update the plain global property so save/load use the correct storage key.
    globalThis.selected_file_name = fileName;

    // Load the saved Blockly workspace for this file.
    console.log('starting to load workspace for ' + fileName);
    load(Blockly.getMainWorkspace());

    // Sync the class name used by the code generator.
    this.syncClassNameFromIDE();
  }
}

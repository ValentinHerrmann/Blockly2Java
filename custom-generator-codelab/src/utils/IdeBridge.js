import * as Blockly from 'blockly';
import { setClassName } from "../generators/javascript/javascript_generator";
import LocalStorageManager from "./LocalStorageManager.js";
import { load } from "../serialization.js";
import { onBlocksChange } from '../index.js';


export class IdeBridge {
  static selected_file_name = '';

  static syncClassNameFromIDE() {
    let className = '';
    const fileName = this.selected_file_name;
    if (fileName) {
      className = fileName.replace('.java', '');
    }
    if(className === null || className === undefined || className === '') {
      return;
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
    const selectedFileName = this.selected_file_name;

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

    const oldClassName = previousName.replace('.java', '');
    const newClassName = newName.replace('.java', '');
    LocalStorageManager.renameClass(oldClassName, newClassName);

    // If the renamed file is currently active, update the backing field directly
    // (bypassing the setter so we don't trigger a reload) and sync the class name.
    if (this.selected_file_name === previousName) {
      this.selected_file_name = newName;
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

    // Clear constructor data for that class.
    const className = fileName.replace('.java', '');
    LocalStorageManager.deleteClass(className);

    // If the deleted file was currently active, clear the Blockly workspace.
    if (this.selected_file_name === fileName) {
      Blockly.getMainWorkspace()?.clear();
      this.selected_file_name = '';
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

    // Clear stale data for that class.
    const className = fileName.replace('.java', '');
    LocalStorageManager.deleteClass(className);
    LocalStorageManager.clearConstructors(className);

    onBlocksChange();

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
    this.selected_file_name = fileName;

    // Load the saved Blockly workspace for this file.
    console.log('starting to load workspace for ' + fileName);
    load(Blockly.getMainWorkspace());

    // Sync the class name used by the code generator.
    this.syncClassNameFromIDE();
    onBlocksChange();
  }
}

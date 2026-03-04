import * as Blockly from 'blockly';
import { setClassName } from "../generators/javascript/javascript_generator";
import LocalStorageManager from "./LocalStorageManager.js";
import { load } from "../serialization.js";
import { onBlocksChange } from '../index.js';
import { BlocklyOverlayManager } from './BlocklyOverlayManager.js';


export class IdeBridge {
  static selected_file_name = '';

  /**
   * The last Java file the user had active, so we can switch back to it
   * when Blockly changes while a Markdown file is shown.
   */
  static last_java_file_name = '';

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
        //console.log('Name: ' + file.getName());
        file.setText(modCode);
      }
    }

    // Persist what Blockly generated so detectAndMarkIfModified() can later
    // compare it to the IDE content and detect manual user edits.
    // Also clear the java-modified flag and overlay: Blockly is now in sync.
    const className = selectedFileName.replace('.java', '');
    if (className) {
      LocalStorageManager.saveLastGeneratedCode(className, modCode);
      LocalStorageManager.setJavaModified(className, false);
      BlocklyOverlayManager.hide();
      // Start the grace period so the poll doesn't fire a false positive
      // while Monaco asynchronously applies the new text.
      BlocklyOverlayManager.notifyPushed();
    }
  }

  /**
   * Pushes generated code to the IDE file for a specific class without
   * affecting the overlay or the currently selected file name.
   * Intended for background (batch) re-generation passes.
   * @param {string} className  Class name (without .java extension)
   * @param {string} modCode    Transformed Java code to write
   */
  static pushCodeToIDEForClass(className, modCode) {
    if (!globalThis.online_ide_access) return;
    const ideAccess = globalThis.online_ide_access.getIDE?.('Java');
    if (!ideAccess) return;

    const fileName = className + '.java';
    for (const file of ideAccess.getFiles()) {
      if (file.getName() === fileName) {
        file.setText(modCode);
        break;
      }
    }

    // Persist baseline and clear the java-modified flag so later polls
    // don't misidentify Blockly's own output as a manual edit.
    LocalStorageManager.saveLastGeneratedCode(className, modCode);
    LocalStorageManager.setJavaModified(className, false);
  }

  /**
   * Returns the current text content of the selected file as shown in the IDE
   * editor, or null if the IDE is not ready / no file is selected.
   * Used by BlocklyOverlayManager to detect manual edits.
   * @returns {string|null}
   */
  static getCurrentIDECode() {
    if (!globalThis.online_ide_access) return null;
    const ideAccess = globalThis.online_ide_access.getIDE?.('Java');
    if (!ideAccess) return null;
    const files = ideAccess.getFiles();
    const fileName = this.selected_file_name;
    const file = files.find(f => f.getName() === fileName);
    if (!file) return null;
    return file.getText?.() ?? file.text ?? null;
  }

  /**
   * Called when the user renames a file in the online IDE.
   * Migrates the stored Blockly workspace and constructor data to the new name,
   * and updates the active class name if the renamed file is currently selected.
   * @param {string} previousName - old filename (e.g. 'Foo.java')
   * @param {string} newName      - new filename (e.g. 'Bar.java')
   */
  static filenameChanged(previousName, newName) {
    //console.log(`IdeBridge: file renamed ${previousName} → ${newName}`);

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
    //console.log(`IdeBridge: file deleted ${fileName}`);

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

    //console.log(`IdeBridge: file created ${fileName}`);
  }

  /**
   * Called when the user selects a file in the online IDE.
   * Updates the global file name, loads the corresponding Blockly workspace,
   * and syncs the className used by the code generator.
   * @param {string} fileName - the selected filename (e.g. 'Foo.java')
   */
  static fileSelected(fileName) {
    //console.log(`IdeBridge: file selected ${fileName}`);

    // Markdown files are read-only info panels – Blockly ignores them.
    // Keep showing the last active Java workspace and don't push code.
    if (fileName.endsWith('.md')) {
      return;
    }

    // Update the plain global property so save/load use the correct storage key.
    this.selected_file_name = fileName;
    if (fileName.endsWith('.java')) {
      this.last_java_file_name = fileName;
    }

    // Load the saved Blockly workspace for this file.
    //console.log('starting to load workspace for ' + fileName);
    load(Blockly.getMainWorkspace());

    // Sync the class name used by the code generator.
    this.syncClassNameFromIDE();

    // Update the java-modified overlay for the newly selected class.
    // If the class was manually edited, show the overlay and do NOT push
    // Blockly-generated code (which would overwrite the user's edits).
    const className = fileName.replace('.java', '');
    // First, perform an immediate check to detect recent manual edits
    // that may not yet have been picked up by the polling mechanism.
    const wasJustDetectedAsModified =
      BlocklyOverlayManager.detectAndMarkIfModified
        ? BlocklyOverlayManager.detectAndMarkIfModified(className) === true
        : false;

    BlocklyOverlayManager.updateForClass(className);
    if (!wasJustDetectedAsModified && !LocalStorageManager.isJavaModified(className)) {
      onBlocksChange();
    }
  }

  /**
   * If the IDE is currently displaying a Markdown file, programmatically
   * switch it back to the last active Java file.  Called at the start of
   * onBlocksChange() so that generated code always lands in the Java editor.
   */
  static ensureJavaFileActive() {
    // Backwards-compatible wrapper; prefer switchToLastJavaFileIfNeeded().
    this.switchToLastJavaFileIfNeeded();
  }

  /**
   * If the IDE is currently displaying a non-target file (for example, a
   * Markdown info panel), switch it back to the last active Java file so
   * that generated code is written into the correct editor tab.
   */
  static switchToLastJavaFileIfNeeded() {
    if (!globalThis.online_ide_access) return;
    const ideAccess = globalThis.online_ide_access.getIDE?.('Java');
    if (!ideAccess) return;
    const ide = ideAccess.ide;
    if (!ide?.fileExplorer) return;

    // Check whether the IDE is currently showing something that is NOT our
    // active Java file (e.g. it's showing a .md file).
    const targetName = this.selected_file_name || this.last_java_file_name;
    if (!targetName) return;

    // Find the internal file object matching our target Java file.
    const wrappedFiles = ideAccess.getFiles();
    const wrapped = wrappedFiles.find(f => f.getName() === targetName);
    if (!wrapped) return;
    const internalFile = wrapped.file ?? wrapped;

    // Only switch if the IDE is not already showing this file.
    const currentlyActive = ide.fileExplorer.treeview
      ?.getCurrentlySelectedNodes?.()
      ?.[0]?.externalObject;
    if (currentlyActive?.name === targetName) return;

    ide.fileExplorer.selectFile(internalFile, false);
  }
}

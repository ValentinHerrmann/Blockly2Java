/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
// import {blocks} from './blocks/text';
// import {forBlock} from './generators/java';
import {javaGenerator, warningNote} from './generators/java';
import {save, load} from './serialization';
import {toolbox as unused} from './toolbox';
import * as CTR from './blocks/constructor.js';
//import {proceduresFlyoutCallback} from './blocks/constructor2.js';
//import * as CTR2 from './blocks/constructor2.js';
import {toolbox} from './toolboxGrade9';

import './stylesheet.css';
import './index.css';
import {javascriptGenerator} from "blockly/javascript";
import {ctrCount, setClassName, getClassName} from "./generators/javascript/javascript_generator";

//import { exceptions } from 'blockly/core/icons.js';


// Register the blocks and generator with Blockly
// Blockly.common.defineBlocks(blocks);
// Object.assign(javaGenerator.forBlock, forBlock);

// Set up UI elements and inject Blockly
//const codeDiv = document.getElementById('generatedCode').firstChild;
//const outputDiv = scriptscriptdocumentscript.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');

// Get colors from CSS variables
const rootStyles = getComputedStyle(document.documentElement);
const colors = {
    primaryBg: rootStyles.getPropertyValue('--primary-bg').trim(),
    secondaryBg: rootStyles.getPropertyValue('--secondary-bg').trim(),
    tertiaryBg: rootStyles.getPropertyValue('--tertiary-bg').trim(),
    textPrimary: rootStyles.getPropertyValue('--text-primary').trim(),
    textSecondary: rootStyles.getPropertyValue('--text-secondary').trim(),
    textTertiary: rootStyles.getPropertyValue('--text-tertiary').trim(),
    opacityFlyout: parseFloat(rootStyles.getPropertyValue('--opacity-flyout').trim()),
    opacityScrollbar: parseFloat(rootStyles.getPropertyValue('--opacity-scrollbar').trim()),
    opacityMarker: parseFloat(rootStyles.getPropertyValue('--opacity-marker').trim()),
};

// Create a dark theme for Blockly using CSS variables
const darkTheme = Blockly.Theme.defineTheme('dark', {
    'base': Blockly.Themes.Classic,
    'componentStyles': {
        'workspaceBackgroundColour': colors.primaryBg,
        'toolboxBackgroundColour': colors.secondaryBg,
        'toolboxForegroundColour': colors.textPrimary,
        'flyoutBackgroundColour': colors.secondaryBg,
        'flyoutForegroundColour': colors.textPrimary,
        'flyoutOpacity': colors.opacityFlyout,
        'scrollbarColour': colors.tertiaryBg,
        'scrollbarOpacity': colors.opacityScrollbar,
        'insertionMarkerColour': colors.textSecondary,
        'insertionMarkerOpacity': colors.opacityMarker,
        'markerColour': colors.textSecondary,
        'cursorColour': colors.textTertiary,
    }
});

export const ws = Blockly.inject(blocklyDiv, {
    toolbox,
    theme: darkTheme
});

// Set up draggable divider
const divider = document.getElementById('divider');
const leftPane = document.getElementById('leftPane');
const rightPane = document.getElementById('rightPane');
const pageContainer = document.getElementById('pageContainer');

let isDragging = false;

divider.addEventListener('mousedown', (e) => {
    isDragging = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const containerRect = pageContainer.getBoundingClientRect();
    const newLeftWidth = e.clientX - containerRect.left;
    const containerWidth = containerRect.width;
    const dividerWidth = 5;
    
    // Get computed styles to account for margins
    const leftPaneStyle = getComputedStyle(leftPane);
    const rightPaneStyle = getComputedStyle(rightPane);
    
    // Calculate margins (left + right margins for each pane)
    const leftPaneMargin = Number.parseInt(leftPaneStyle.marginLeft) + Number.parseInt(leftPaneStyle.marginRight);
    const rightPaneMargin = Number.parseInt(rightPaneStyle.marginLeft) + Number.parseInt(rightPaneStyle.marginRight);
    
    // Get minimum widths from CSS classes
    const minLeftWidth = Number.parseInt(leftPaneStyle.minWidth); // get minimum width from css-class of leftPane
    const minRightWidth = Number.parseInt(rightPaneStyle.minWidth); // get minimum width from css-class of rightPane
    
    // Calculate maximum left width accounting for margins
    const maxLeftWidth = containerWidth - minRightWidth - rightPaneMargin - dividerWidth;
    const effectiveMinLeftWidth = minLeftWidth + leftPaneMargin;
    
    if (newLeftWidth >= effectiveMinLeftWidth && newLeftWidth <= maxLeftWidth) {
        const leftPixels = newLeftWidth - leftPaneMargin;
        const rightPixels = containerWidth - newLeftWidth - dividerWidth - rightPaneMargin;
        
        leftPane.style.flex = `0 0 ${leftPixels}px`;
        rightPane.style.flex = `0 0 ${rightPixels}px`;
        
        // Trigger Blockly resize
        Blockly.svgResize(ws);
    }
});

document.addEventListener('mouseup', () => {
    if (isDragging) {
        isDragging = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }
});

var codePrefix = '';
var restCount = 0;
var restInitSuccess = false;
// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
const runCode = () => {
  getClassName_fromIDE();
  let code = javaGenerator.workspaceToCode(ws);
  code = globalCodeModification(code);
  
  /*postCode(code,"java").then(data => {
    //console.log("Java Code successfully sent to BlueJ:\n\n"+code);

  });

  let dom = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(ws));
  postCode(dom,"xml").then(data => {
  });
*/
};

// Load the initial state from storage and run the code.
load(ws);
//ws.registerToolboxCategoryCallback('MY_PROCEDURES', proceduresFlyoutCallback);
//getSavedXml();
runCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(ws);
});

// When globalThis.selected_file_name changes, call load(ws)
Object.defineProperty(globalThis, 'selected_file_name', {
  set: function(value) {
    this._selected_file_name = value;
    load(ws);
  },
  get: function() {
    return this._selected_file_name;
  }
});


// Whenever the workspace changes meaningfully, run the code again.
ws.addChangeListener((e) => {
  // Don't run the code when the workspace finishes loading; we're
  // already running it once when the application starts.
  // Don't run the code during drags; we might have invalid state.
  if (e.isUiEvent || e.type == Blockly.Events.FINISHED_LOADING ||
    ws.isDragging()) {
    return;
  }
  runCode();
});



async function postCode(code,typ) {

  if(!restInitSuccess) 
  {
    console.debug("REST-Service not yet initialized. Code not posted.");
    return;
  }


  let url = 'http://localhost:8081/api';


  const rc = restCount++;
  var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
         if (this.readyState == 4 && this.status == 200) {
          console.debug(`<<< POST-${typ}[${rc}]: ${this.status}`);
         }
         else if(this.readyState == 4) {
          console.debug(`<<< POST-${typ}[${rc}]: ${this.status}`);
          showCodeDiv(true);
         }
    };

    console.debug(`>>> POST-${typ}[${rc}]: ${url}`);
    xhttp.open("POST", url, true);
    if(typ=="xml")
    {
      xhttp.setRequestHeader("Content-type", "text/xml");
    }
    else if(typ=="java")
    {
      xhttp.setRequestHeader("Content-type", "text/java");
    }

    xhttp.send(code);

}

function getClassName_fromIDE() {
  let className = 'MeineKlasse';
  if (('selected_file_name' in globalThis)) 
  {
    className =globalThis.selected_file_name.replace('.java','');
  }
  setClassName(className);
}


function loadXmlToWorkspace(xhttp) {
  const array = xhttp.response.split("|||||",2);

  codePrefix = array[0];
  
  getClassName_fromIDE();

  let xml = Blockly.utils.xml.textToDom(array[1]);
  Blockly.getMainWorkspace().clear();

  Blockly.Xml.domToWorkspace(xml,Blockly.getMainWorkspace());
  runCode();
}

function showCodeDiv(show) {
  const pane = document.getElementById('outputPane'); 
  if(show) {
    pane.style.flex = '0 0 500px';
    pane.style.margin = '10px';
  }
  else {
    pane.style.flex = '0px';
    pane.style.margin = '1px';
  }
}

function getSavedXml() {
  let url = 'http://localhost:8081/api';
  const rc = restCount++;
  let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
         if (this.readyState == 4 && this.status == 200) {
          restInitSuccess = true;
          showCodeDiv(false);
          loadXmlToWorkspace(this);
         }
         else if(this.readyState == 4) {
          showCodeDiv(true);
         }
    };
    xhttp.open("GET", url, true);
    xhttp.send();
}

function globalCodeModification(code) {
  


  let codeSplitByFirstWarning = code.split("!!!",2)

  let modCode = codeSplitByFirstWarning[0];
  
  modCode = indentation(modCode);
  
  modCode = modCode.replaceAll('    // Describe this function...\n','');
  modCode = defaultCodePrefix(modCode);
  



  modCode = modCode.replaceAll('__CLASS__',getClassName());

  
  if(modCode.includes('public static void main()')) {
    modCode += '\n\n\n// main()-Methode starten\n'+getClassName()+'.main();';
  }
  
  const ide = document.getElementById('ide');
  if (ide) {

    


  if (!('online_ide_access' in globalThis)) {
    console.warn('online_ide_access is not available on globalThis.');
    return modCode;
  }
  
  //@ts-ignore
  let ideAccess =globalThis.online_ide_access.getIDE('Java');
  let files = ideAccess.getFiles();

  let selectedFileName = '';
  if ('selected_file_name' in globalThis) {
    console.warn('selected_file_name is not available on globalThis.');
    selectedFileName =globalThis.selected_file_name;
  }
  else {
    console.warn('selected_file_name is not available onglobalThis.');
  }

  for(const element of files){
    let file = element;

    if(file.getName() == selectedFileName || selectedFileName == '') {
      console.log('Name: ' + file.getName());
      file.setText(modCode);
    }
    }
  }
  return modCode;
}



function findClassName(codePrefix)  {
  let regex = 'public class [^\{]+';
  let classHeader = codePrefix.match(regex);
  if(classHeader == null)
  {
    console.warn("Class Header not found");
    return "MeineKlasse";
  }
  else
  {
    classHeader = classHeader[0].replace('public class','').trim();
    return classHeader;
  }
}


function constructors(modCode){
  let regex = 'public class [^\{]+';
  let classHeader = modCode.match(regex);
  if(classHeader == null)
  {
    console.warn("Class Header not found");
  }
  else
  {
    classHeader = classHeader[0].replace('public class','').trim();
    console.log("Class Header: " + classHeader);
  }
  modCode = modCode.replace("public void " + classHeader + "(", "public " + classHeader + "(");
  return modCode;
}

function mainMethod(modCode) {
  let mainMethod = 'public void main(';
  modCode = modCode.replace(mainMethod, 'public static void main(');
  return modCode;
}

function defaultCodePrefix(modCode) {
  codePrefix = 'public class ' + getClassName() + ' { \n'
  return codePrefix + modCode + '}';
}

function indentation(modCode) {
  let codeLines = modCode.split("\n");
  for(let i=0; i<codeLines.length; i++)
  {
      if(codeLines[i] != "")
      {
        codeLines[i] = "    " + codeLines[i];
      }
  }
  modCode = codeLines.join("\n");
  return modCode;
}
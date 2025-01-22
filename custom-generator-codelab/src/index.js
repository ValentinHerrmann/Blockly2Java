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
import {toolbox} from './toolboxGrade9';
import './index.css';
import {javascriptGenerator} from "blockly/javascript";


// Register the blocks and generator with Blockly
// Blockly.common.defineBlocks(blocks);
// Object.assign(javaGenerator.forBlock, forBlock);

// Set up UI elements and inject Blockly
const codeDiv = document.getElementById('generatedCode').firstChild;
//const outputDiv = scriptscriptdocumentscript.getElementById('output');
const blocklyDiv = document.getElementById('blocklyDiv');
const ws = Blockly.inject(blocklyDiv, {toolbox});
var codePrefix = '';
// This function resets the code and output divs, shows the
// generated code from the workspace, and evals the code.
// In a real application, you probably shouldn't use `eval`.
const runCode = () => {
  
  let code = javaGenerator.workspaceToCode(ws);
  code = globalCodeModification(code);
  console.log(code);
  
  postCode(code,"java").then(data => {
    console.log("Java Code successfully sent to BlueJ");
  });
  let dom = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(ws));
  postCode(dom,"xml").then(data => {
    console.log("XML Code successfully sent to BlueJ");
  });

};

// Load the initial state from storage and run the code.
load(ws);
getSavedXml();
runCode();

// Every time the workspace changes state, save the changes to storage.
ws.addChangeListener((e) => {
  // UI events are things like scrolling, zooming, etc.
  // No need to save after one of these.
  if (e.isUiEvent) return;
  save(ws);
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

  let url = 'http://localhost:8081/api';

  var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
         if (this.readyState == 4 && this.status == 200) {
         }
    };
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


function loadXmlToWorkspace(xhttp) {
  console.log("loadXmlToWorkspace");
  console.log(xhttp.response);
  const array = xhttp.response.split("|||||",2);
  console.log(array[0]);
  console.log(array[1]);

  codePrefix = array[0];
  var xml = Blockly.utils.xml.textToDom(array[1]);
  Blockly.getMainWorkspace().clear();

  Blockly.Xml.domToWorkspace(xml,Blockly.getMainWorkspace());
  console.log("Workspace updated");
}

function getSavedXml() {
  console.log("getSavedXml");

  let url = 'http://localhost:8081/api';

  var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
         if (this.readyState == 4 && this.status == 200) {
          loadXmlToWorkspace(this);
         }
         console.log("<<< GET Response: "+this.status)
    };
    xhttp.open("GET", url, true);
    console.log(">>> GET: " + url)
    xhttp.send();
}

function globalCodeModification(code) {
  let codeSplitByFirstWarning = code.split("!!!",2)

  var modCode = codeSplitByFirstWarning[0];

  modCode = indentation(modCode);
  modCode = modCode.replaceAll('    // Describe this function...\n','');
  modCode = defaultCodePrefix(modCode);
  modCode = constructors(modCode);
  modCode = mainMethod(modCode);
  
  if(codeSplitByFirstWarning.length > 1)
    {
      codeDiv.innerText = modCode + "\n\n!!!"+codeSplitByFirstWarning[1] + "!!!";
    }
    else
    {
      codeDiv.innerText = modCode;
    }
  console.log("Global code modification successful");
  return modCode;
}


function constructors(modCode){
  let regex = 'public class [^\{]+';
  let classHeader = modCode.match(regex);
  if(classHeader != null)
  {
    classHeader = classHeader[0].replace('public class','').trim();
    console.log("Class Header: " + classHeader);
  }
  else
  {
    console.log("Class Header not found");
  }
  
  // let ctrMethod = modCode.match("public void " + classHeader + "\\(");

  modCode = modCode.replace("public void " + classHeader + "(", "public " + classHeader + "(");
  return modCode;
}

function mainMethod(modCode) {
  let mainMethod = 'public void main(';
  modCode = modCode.replace(mainMethod, 'public static void main(');
  return modCode;
}

function defaultCodePrefix(modCode) {
  if(codePrefix === '')
  {
    codePrefix = 'import java.util.*; \n\npublic class MeineKlasse { \n'
  }
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
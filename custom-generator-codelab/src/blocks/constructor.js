
import {icons} from 'blockly/core';
import {prototype} from 'blockly/core';

import * as Blockly from 'blockly/core';

let prefix = "_";

Blockly.Blocks["defconstructor"] = {
  init: function () {
    this.appendDummyInput()
        .appendField("Konstruktor");
    this.appendStatementInput("STACK")
        .setCheck(null)
        .appendField("do");
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setColour(230);
    this.setTooltip("");
    this.setHelpUrl("");
    this.arguments_ = [];
    this.updateShape_();
    this.setMutator(new Blockly.icons.MutatorIcon(['argument_input'], this));
//    this.setMutator(new Blockly.Mutator(['argument_input']));
  },

  mutationToDom: function() {
    var container = document.createElement('mutation');
    
    for (var i = 0; i < this.arguments_.length; i++) {
      
      var name = this.arguments_[i];
      var argument = document.createElement('arg');

      console.log("Name: " + name);
      console.log("Prefix: " + prefix);

      if(!name.startsWith(prefix))
      {
        name = prefix+name;
      }
      console.log("Name: " + name);

      this.arguments_[i] = name;
      argument.setAttribute('name', name);

      //if (!this.workspace.getVariable(name)) {
      //  this.workspace.createVariable(name);
      //}
      //var id = this.workspace.getVariable(name).getId();
      //argument.setAttribute('varid', id);
      container.appendChild(argument);
      this.inputList.push(name);
    }
    return container;
  },

  domToMutation: function(xmlElement) {
    this.arguments_ = [];
    for (var i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() == 'arg') {
        this.arguments_.push(childNode.getAttribute('name'));
      }
    }
    this.updateShape_();
  },

  decompose: function(workspace) {
    var containerBlock = workspace.newBlock('argument_container');
    containerBlock.initSvg();
    var connection = containerBlock.getInput('STACK').connection;
    for (var i = 0; i < this.arguments_.length; i++) {
      var argumentBlock = workspace.newBlock('argument_input');
      argumentBlock.initSvg();
      argumentBlock.setFieldValue(this.arguments_[i], 'NAME');
      connection.connect(argumentBlock.previousConnection);
      connection = argumentBlock.nextConnection;
    }
    return containerBlock;
  },

  compose: function(containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    this.arguments_ = [];
    var connections = [];
    while (itemBlock) {
      this.arguments_.push(itemBlock.getFieldValue('NAME'));
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection &&
          itemBlock.nextConnection.targetBlock();
    }
    this.updateShape_();
  },

  updateShape_: function() {
    if (this.getInput('ARGUMENTS')) {
      this.removeInput('ARGUMENTS');
    }

    // if (this.arguments_.length) {
    //   let joinedArgs = this.arguments_.join(", ");
    //   const topLine = this.getInput('TOP_LINE');
    //   if (topLine) {
    //     topLine.fieldRow = topLine.fieldRow.slice(0, 1);

    //     console.log("topLine:", topLine);
    //     console.log("joinedArgs:", joinedArgs);
        
    //     if (typeof topLine.appendField === 'function') {
    //         topLine.appendField("with: " + joinedArgs);
    //     } else {
    //         console.error("appendField is not a function on topLine");
    //     }

    //     topLine.appendField("with: " + joinedArgs);
    //   }
    // }
  }
};












////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////


















Blockly.Blocks['argument_container'] = {
  init: function() {
    this.appendDummyInput().appendField('inputs');
    this.appendStatementInput('STACK');
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['argument_input'] = {
  init: function() {
    this.appendDummyInput()
        .appendField('input name')
        .appendField(new Blockly.FieldTextInput('x'), 'NAME');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};










////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////








/// Neuer Block für den Aufruf des benutzerdefinierten Blocks
Blockly.Blocks['callconstructor'] = {
  init: function() {
    this.appendDummyInput()
        .appendField("Objekt erstellen");
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setOutput(true, 'CLASS');
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
    this.arguments_ = [];
    this.updateShape_();
  },

  mutationToDom: function() {
    var container = document.createElement('mutation');
    
    for (var i = 0; i < this.arguments_.length; i++) {
      var argument = document.createElement('arg');
      argument.setAttribute('name', this.arguments_[i]);
      container.appendChild(argument);
    }
    return container;
  },

  domToMutation: function(xmlElement) {
    this.arguments_ = [];
    for (var i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() == 'arg') {
        this.arguments_.push(childNode.getAttribute('name'));
      }
    }
    this.updateShape_();
  },

  updateShape_: function() {
    // Entfernen Sie alle vorhandenen Argumenteingaben
    for (var i = 0; this.getInput('ARG' + i); i++) {
      this.removeInput('ARG' + i);
    }
    
    // Fügen Sie neue Argumenteingaben hinzu
    for (var i = 0; i < this.arguments_.length; i++) {
      this.appendValueInput('ARG' + i)
          .setCheck(null)
          .appendField(this.arguments_[i]);
    }
  }
};
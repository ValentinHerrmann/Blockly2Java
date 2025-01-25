import { icons } from 'blockly/core';
import { prototype } from 'blockly/core';

import * as Blockly from 'blockly/core';
import {getClassName} from '../generators/javascript/javascript_generator';

let prefix = "_";

Blockly.Blocks["defconstructor"] = {
  init: function () {
    this.appendDummyInput('TOP_LINE')
      .appendField("Konstruktor "+getClassName());
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
  },

  mutationToDom: function () {
    var container = document.createElement('mutation');

    for (var i = 0; i < this.arguments_.length; i++) {
      var name = this.arguments_[i];
      var argument = document.createElement('arg');

      if (!name.startsWith(prefix)) {
        name = prefix + name;
      }

      this.arguments_[i] = name;
      argument.setAttribute('name', name);

      if (!this.workspace.getVariable(name)) {
        this.workspace.createVariable(name);
      }
      var id = this.workspace.getVariable(name).getId();
      argument.setAttribute('varid', id);
      container.appendChild(argument);
    }
    this.updateShape_();
    return container;
  },

  domToMutation: function (xmlElement) {
    this.arguments_ = [];

    for (var i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() == 'arg') {
        var name = childNode.getAttribute('name');
        if (!name.startsWith(prefix)) {
          name = prefix + name;
        }
        this.arguments_.push(name);
        if(childNode) {
          childNode.setAttribute('name', name);
        }
      }
    }
    this.updateShape_();
  },

  decompose: function (workspace) {
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

  compose: function (containerBlock) {
    var itemBlock = containerBlock.getInputTargetBlock('STACK');
    this.arguments_ = [];
    var connections = [];
    while (itemBlock) {
      var name = itemBlock.getFieldValue('NAME');
      if (!name.startsWith(prefix)) {
        name = prefix + name;
      }
      itemBlock.setFieldValue(name, 'NAME');
      this.arguments_.push(name);
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.nextConnection &&
        itemBlock.nextConnection.targetBlock();
    }
    this.updateShape_();
  },

  updateShape_: function () {
    if (this.getInput('ARGUMENTS')) {
      this.removeInput('ARGUMENTS');
    }
    if (this.arguments_.length) {
      //console.log("Arguments: " + this.arguments_);
      let joinedArgs = this.arguments_.join(", ");
      let topLine = this.getInput('TOP_LINE');
      if (topLine) {
        topLine.fieldRow = topLine.fieldRow.slice(0, 1);
        topLine.appendField("with: " + joinedArgs);
      }
    }
    else {
      //console.log("No arguments");
      let topLine = this.getInput('TOP_LINE');
      topLine.fieldRow = topLine.fieldRow.slice(0, 1);
    }
  },
  getVarModels: function() {
    var varModels = [];
    for (var i = 0; i < this.arguments_.length; i++) {
      var name = this.arguments_[i];
      varModels.push(this.workspace.getVariable(name));
    }
    return varModels;
  }
};












////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////














Blockly.Blocks['argument_container'] = {
  init: function () {
    this.appendDummyInput().appendField('inputs');
    this.appendStatementInput('STACK');
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
  }
};

Blockly.Blocks['argument_input'] = {
  init: function () {
    this.appendDummyInput()
      .appendField('input name')
      .appendField(new Blockly.FieldTextInput('_x'), 'NAME');
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
  init: function () {
    this.appendDummyInput()
      .appendField("new "+getClassName());
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setOutput(true, 'CLASS');
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
    this.arguments_ = [];
    this.updateShape_();
  },

  mutationToDom: function () {
    var container = document.createElement('mutation');
    

    for (var i = 0; i < this.arguments_.length; i++) {
      var argument = document.createElement('arg');
      argument.setAttribute('name', this.arguments_[i]);
      container.appendChild(argument);
    }
    return container;
  },

  domToMutation: function (xmlElement) {
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

    let ctrBlocks = this.workspace.getBlocksByType('defconstructor');
    if(ctrBlocks.length > 0) {
      let ctrBlock = ctrBlocks[0];
      this.arguments_ = ctrBlock.arguments_;
      //console.log("ctrArgs: "+this.arguments_);
      // Fügen Sie neue Argumenteingaben hinzu
      for (var i = 0; i < this.arguments_.length; i++) {
        var name = this.arguments_[i];
        var id = this.workspace.getVariable(name).getId();
        console.log("id: "+id);
        console.log("name: "+name);

        if(this.getInput(id)) {
          this.removeInput(id);
        }

        this.appendValueInput(id)
          .setCheck(null)
          .appendField(name);
      }
    }
  }
};
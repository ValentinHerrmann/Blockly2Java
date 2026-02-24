import { icons } from 'blockly/core';
import { prototype } from 'blockly/core';

import * as Blockly from 'blockly/core';
import {getClassName} from '../generators/javascript/javascript_generator';
import LocalStorageManager from '../utils/LocalStorageManager';

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
    let container = document.createElement('mutation');

    for (let i = 0; i < this.arguments_.length; i++) {
      let name = this.arguments_[i];
      let argument = document.createElement('arg');

      if (!name.startsWith(prefix)) {
        name = prefix + name;
      }

      this.arguments_[i] = name;
      argument.setAttribute('name', name);

      if (!this.workspace.getVariable(name)) {
        this.workspace.createVariable(name);
      }
      let id = this.workspace.getVariable(name).getId();
      argument.setAttribute('varid', id);
      container.appendChild(argument);
    }
    this.updateShape_();
    return container;
  },

  domToMutation: function (xmlElement) {
    this.arguments_ = [];

    for (let i = 0, childNode; childNode = xmlElement.childNodes[i]; i++) {
      if (childNode.nodeName.toLowerCase() == 'arg') {
        let name = childNode.getAttribute('name');
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
    let containerBlock = workspace.newBlock('argument_container');
    containerBlock.initSvg();
    let connection = containerBlock.getInput('STACK').connection;
    for (const element of this.arguments_) {
      let argumentBlock = workspace.newBlock('argument_input');
      argumentBlock.initSvg();
      argumentBlock.setFieldValue(element, 'NAME');
      connection.connect(argumentBlock.previousConnection);
      connection = argumentBlock.nextConnection;
    }
    return containerBlock;
  },

  compose: function (containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock('STACK');
    this.arguments_ = [];
    let connections = [];
    while (itemBlock) {
      let name = itemBlock.getFieldValue('NAME');
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
      let joinedArgs = this.arguments_.join(", ");
      let topLine = this.getInput('TOP_LINE');
      if (topLine) {
        topLine.fieldRow = topLine.fieldRow.slice(0, 1);
        topLine.appendField("with: " + joinedArgs);
      }
    }
    else {
      let topLine = this.getInput('TOP_LINE');
      topLine.fieldRow = topLine.fieldRow.slice(0, 1);
    }
  },
  getVarModels: function() {
    let varModels = [];
    for (const element of this.arguments_) {
      let name = element;
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
  init: function () {
    const block = this;
    this.appendDummyInput('TOP_LINE')
      .appendField("new ")
      .appendField(
        new Blockly.FieldDropdown(
          () => block.getConstructorOptions_(),
          function (newValue) {
            // Validator fires synchronously when the field value is set,
            // including during JSON deserialization — before connections are
            // restored. Create the ARG_ inputs here so they exist in time.
            if (block.updateShape_) {
              block.updateShape_(newValue);
            }
            return newValue;
          }
        ),
        'CONSTRUCTOR_CLASS'
      );
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setOutput(true, 'CLASS');
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
    this.arguments_ = [];
    this.updateShape_();
  },

  /** Build dropdown options from all constructors stored in LocalStorage. */
  getConstructorOptions_: function () {
    const allCtrs = LocalStorageManager.getAllConstructors();
    const options = [];
    const seen = new Set();
    for (const [className, ctrs] of Object.entries(allCtrs)) {
      for (const ctr of ctrs) {
        const args = (ctr.arguments || []);
        const display = `${className}(${args.join(', ')})`;
        const value = `${className}:::${args.join(',')}`;
        if (!seen.has(value)) {
          seen.add(value);
          options.push([display, value]);
        }
      }
      if(ctrs.length === 0) {
        const display = `${className}()`;
        const value = `${className}:::`;
        if (!seen.has(value)) {
          seen.add(value);
          options.push([display, value]);
        }
      }
    }
    
    if (options.length === 0) {
      options.push(['(keine)', 'NONE']);
    }
    return options;
  },

  saveExtraState: function () {
    return { constructorValue: this.getFieldValue('CONSTRUCTOR_CLASS') };
  },

  loadExtraState: function (state) {
    const value = state && state.constructorValue;
    if (value && value !== 'NONE') {
      this.updateShape_(value);
    }
  },

  onchange: function (event) {
    if (
      event.type === Blockly.Events.BLOCK_CHANGE &&
      event.blockId === this.id &&
      event.name === 'CONSTRUCTOR_CLASS'
    ) {
      this.updateShape_();
    }
  },

  updateShape_: function (value) {
    // Accept value as argument (called from validator before field is committed)
    // or fall back to reading the field (called from onchange / loadExtraState).
    if (value === undefined) {
      value = this.getFieldValue('CONSTRUCTOR_CLASS');
    }

    // Remove inputs created for previous argument list.
    for (const arg of this.arguments_) {
      const inputId = 'ARG_' + arg;
      if (this.getInput(inputId)) {
        this.removeInput(inputId);
      }
    }

    if (!value || value === 'NONE') {
      this.arguments_ = [];
      return;
    }

    // Value format: "ClassName:::arg1,arg2"
    const sepIdx = value.indexOf(':::');
    const argsStr = sepIdx >= 0 ? value.slice(sepIdx + 3) : '';
    this.arguments_ = argsStr ? argsStr.split(',').filter(a => a) : [];

    for (const arg of this.arguments_) {
      const inputId = 'ARG_' + arg;
      if (!this.getInput(inputId)) {
        this.appendValueInput(inputId)
          .setCheck(null)
          .appendField(arg);
      }
    }
  }
};
import { icons } from 'blockly/core';
import { prototype } from 'blockly/core';

import * as Blockly from 'blockly/core';
import {getClassName} from '../generators/javascript/javascript_generator';
import LocalStorageManager from '../utils/LocalStorageManager';

Blockly.Blocks["defconstructor"] = {
  init: function () {
    this.appendDummyInput('TOP_LINE')
      .appendField('Konstruktor')
      .appendField(new Blockly.FieldLabel('()'), 'PARAMS');
    this.appendStatementInput('STACK')
      .setCheck(null);
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
    this.arguments_ = [];
    this.setMutator(new Blockly.icons.MutatorIcon(['argument_input'], this));
  },

  mutationToDom: function () {
    let container = document.createElement('mutation');

    for (let i = 0; i < this.arguments_.length; i++) {
      const name = this.arguments_[i];
      const argument = document.createElement('arg');
      argument.setAttribute('name', name);

      if (!this.workspace.getVariable(name, 'param')) {
        this.workspace.createVariable(name, 'param');
      }
      const id = this.workspace.getVariable(name, 'param').getId();
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
        const name = childNode.getAttribute('name');
        this.arguments_.push(name);
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
    const oldArguments = this.arguments_.slice();
    let itemBlock = containerBlock.getInputTargetBlock('STACK');
    this.arguments_ = [];
    while (itemBlock) {
      const name = itemBlock.getFieldValue('NAME');
      this.arguments_.push(name);
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
    // Delete workspace variables for params that no longer exist.
    for (const oldName of oldArguments) {
      if (!this.arguments_.includes(oldName)) {
        const oldVar = this.workspace.getVariable(oldName, 'param');
        if (oldVar) this.workspace.deleteVariableById(oldVar.getId());
      }
    }
    // Ensure workspace variables exist for every current param.
    for (const name of this.arguments_) {
      if (!this.workspace.getVariable(name, 'param')) {
        this.workspace.createVariable(name, 'param');
      }
    }
    this.updateShape_();
  },

  updateShape_: function () {
    const display = this.arguments_.length
      ? '(' + this.arguments_.join(', ') + ')'
      : '()';
    this.setFieldValue(display, 'PARAMS');
  },
  getVarModels: function() {
    return this.arguments_
      .map(name => this.workspace.getVariable(name, 'param'))
      .filter(Boolean);
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
    this.arguments_ = [];
    this._updatingShape_ = false;
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setOutput(true, 'CLASS');
    this.setColour(230);
    this.setTooltip('');
    this.setHelpUrl('');
    // updateShape_ builds TOP_LINE (with the dropdown) and any ARG inputs.
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
    // Guard against re-entrancy (FieldDropdown init triggers the validator
    // which would call updateShape_ again).
    if (this._updatingShape_) return;
    this._updatingShape_ = true;
    try {
      this._updateShapeInner_(value);
    } finally {
      this._updatingShape_ = false;
    }
  },

  _updateShapeInner_: function (value) {
    // Accept value as argument (called from validator before field is committed)
    // or fall back to reading the field (called from onchange / loadExtraState).
    if (value === undefined) {
      value = this.getFieldValue('CONSTRUCTOR_CLASS');
    }

    // Save connections from existing ARG inputs.
    const savedConns = {};
    for (const arg of (this.arguments_ || [])) {
      const inp = this.getInput('ARG_' + arg);
      if (inp && inp.connection) savedConns[arg] = inp.connection.targetConnection;
    }

    // Remove all existing ARG inputs.
    for (const arg of (this.arguments_ || [])) {
      if (this.getInput('ARG_' + arg)) this.removeInput('ARG_' + arg);
    }
    // Remove TOP_LINE so we can recreate it in the right style.
    if (this.getInput('TOP_LINE')) this.removeInput('TOP_LINE');

    if (!value || value === 'NONE') {
      this.arguments_ = [];
      this.setOutput(true, 'CLASS');
      const block = this;
      const dd = new Blockly.FieldDropdown(
        () => block.getConstructorOptions_(),
        function (newVal) { if (block.updateShape_) block.updateShape_(newVal); return newVal; }
      );
      this.appendDummyInput('TOP_LINE').appendField('new ').appendField(dd, 'CONSTRUCTOR_CLASS');
      return;
    }

    // Value format: "ClassName:::arg1,arg2"
    const sepIdx = value.indexOf(':::');
    const className = sepIdx >= 0 ? value.slice(0, sepIdx) : value;
    const argsStr = sepIdx >= 0 ? value.slice(sepIdx + 3) : '';
    this.arguments_ = argsStr ? argsStr.split(',').filter(a => a) : [];

    this.setOutput(true, className);

    const block = this;
    const makeDropdown = () => {
      const dd = new Blockly.FieldDropdown(
        () => block.getConstructorOptions_(),
        function (newVal) { if (block.updateShape_) block.updateShape_(newVal); return newVal; }
      );
      return dd;
    };

    if (this.arguments_.length === 0) {
      const dd = makeDropdown();
      this.appendDummyInput('TOP_LINE').appendField('new ').appendField(dd, 'CONSTRUCTOR_CLASS');
      // Force the field to the correct value after appending.
      const field = this.getField('CONSTRUCTOR_CLASS');
      if (field && value) {
        const origOpts = field.getOptions.bind(field);
        field.getOptions = () => { const opts = origOpts(); if (!opts.find(([, v]) => v === value)) opts.push([className + '()', value]); return opts; };
        field.setValue(value);
        field.getOptions = origOpts;
      }
    } else {
      // First arg connector on the same row as 'new ClassName('.
      const firstArg = this.arguments_[0];
      const dd = makeDropdown();
      this.appendValueInput('ARG_' + firstArg)
        .appendField('new ')
        .appendField(dd, 'CONSTRUCTOR_CLASS')
        .appendField('( ' + firstArg + (this.arguments_.length > 1 ? ' ,' : ' )'));
      // Force the field to the correct value.
      const field = this.getField('CONSTRUCTOR_CLASS');
      if (field && value) {
        const origOpts = field.getOptions.bind(field);
        field.getOptions = () => { const opts = origOpts(); if (!opts.find(([, v]) => v === value)) opts.push([className + '(' + this.arguments_.join(', ') + ')', value]); return opts; };
        field.setValue(value);
        field.getOptions = origOpts;
      }
      // Restore first-arg connection.
      if (savedConns[firstArg] && savedConns[firstArg].getSourceBlock && savedConns[firstArg].getSourceBlock().workspace) {
        this.getInput('ARG_' + firstArg).connection.connect(savedConns[firstArg]);
      }
      // Remaining args below, right-aligned.
      for (let j = 1; j < this.arguments_.length; j++) {
        const arg = this.arguments_[j];
        this.appendValueInput('ARG_' + arg)
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField(arg + (j + 1 === this.arguments_.length ? ' )' : ' ,'));
        if (savedConns[arg] && savedConns[arg].getSourceBlock && savedConns[arg].getSourceBlock().workspace) {
          this.getInput('ARG_' + arg).connection.connect(savedConns[arg]);
        }
      }
    }
  }
};

// ── Colour shared by the two inheritance blocks ───────────────────────────
const INHERIT_COLOUR = '#5B6B8A';

// ─────────────────────────────────────────────────────────────────────────────
// java_extends – declares the parent class (inheritance)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_extends'] = {
  init: function () {
    const block = this;
    this.appendDummyInput('TOP_LINE')
      .appendField('erbt von')
      .appendField(
        new Blockly.FieldDropdown(() => block.getClassOptions_()),
        'PARENT_CLASS'
      );
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setColour(INHERIT_COLOUR);
    this.setTooltip('Legt die Elternklasse (Vererbung) für diese Klasse fest.');
    this.setHelpUrl('');
  },

  /** Build dropdown options from all classes registered in LocalStorage. */
  getClassOptions_: function () {
    const allCtrs = LocalStorageManager.getAllConstructors();
    const options = Object.keys(allCtrs)
      .filter(name => name !== getClassName())   // exclude the current class
      .map(name => [name, name]);
    if (options.length === 0) {
      options.push(['(keine)', 'NONE']);
    }
    return options;
  },

  saveExtraState: function () {
    return { parentClass: this.getFieldValue('PARENT_CLASS') || 'NONE' };
  },

  loadExtraState: function (state) {
    const saved = (state && state.parentClass) || 'NONE';
    if (saved && saved !== 'NONE') {
      // The dynamic dropdown may not include the saved value until options are
      // computed; force-set the field value after deserialization.
      const field = this.getField('PARENT_CLASS');
      if (field) {
        // Temporarily extend the option list so setValue doesn't reject it.
        const origGetOptions = field.getOptions.bind(field);
        field.getOptions = () => {
          const opts = origGetOptions();
          if (!opts.find(([, v]) => v === saved)) opts.push([saved, saved]);
          return opts;
        };
        field.setValue(saved);
        field.getOptions = origGetOptions;
      }
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// java_super_call – calls the parent constructor  super(arg1, arg2, …)
// Arguments are auto-determined from the parent class constructor stored in
// LocalStorage (populated when the parent class is generated).
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_super_call'] = {
  init: function () {
    this.argNames_ = [];
    this.appendDummyInput('TOP_LINE').appendField('super()', 'SUPER_LABEL');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(INHERIT_COLOUR);
    this.setTooltip('Ruft den Konstruktor der Elternklasse auf.');
    this.setHelpUrl('');
  },

  /** Finds the parent class from the java_extends block in the same workspace. */
  _getParentClass: function () {
    if (!this.workspace) return null;
    const extendsBlocks = this.workspace.getBlocksByType('java_extends', false);
    if (!extendsBlocks.length) return null;
    const val = extendsBlocks[0].getFieldValue('PARENT_CLASS');
    return (val && val !== 'NONE') ? val : null;
  },

  /**
   * Reads the parent class's constructors from LocalStorage and rebuilds the
   * value inputs.  Called automatically when the workspace finishes loading or
   * when the java_extends block changes.
   */
  refreshFromParent_: function () {
    const parentClass = this._getParentClass();
    let argNames = [];
    if (parentClass) {
      const allCtrs = LocalStorageManager.getAllConstructors();
      const ctrs = allCtrs[parentClass] || [];
      if (ctrs.length > 0) argNames = ctrs[0].arguments || [];
    }
    this.updateShape_(argNames);
  },

  onchange: function (event) {
    if (!this.workspace || this.isInserted && !this.isInserted()) return;
    const needsRefresh =
      event.type === Blockly.Events.FINISHED_LOADING ||
      (event.type === Blockly.Events.BLOCK_CREATE &&
        event.ids && event.ids.includes(this.id)) ||
      (event.type === Blockly.Events.BLOCK_CHANGE &&
        event.name === 'PARENT_CLASS');
    if (needsRefresh) {
      this.refreshFromParent_();
    }
  },

  /**
   * Rebuilds value inputs ARG0..ARGn from argNames.
   * The first arg connector sits on the same row as the 'super(' label,
   * matching the visual style of normal method-call blocks.
   * Existing connections are preserved if the arg count doesn't shrink.
   */
  updateShape_: function (argNames) {
    // Save existing connections.
    const saved = [];
    for (let i = 0; this.getInput('ARG' + i); i++) {
      const conn = this.getInput('ARG' + i).connection;
      saved[i] = conn && conn.targetConnection;
    }

    // Remove old ARG inputs.
    let i = 0;
    while (this.getInput('ARG' + i)) { this.removeInput('ARG' + i); i++; }

    this.argNames_ = argNames || [];

    // Rebuild TOP_LINE and arg inputs.
    if (this.getInput('TOP_LINE')) { this.removeInput('TOP_LINE'); }

    if (this.argNames_.length === 0) {
      // No args: plain dummy with 'super()' label.
      this.appendDummyInput('TOP_LINE').appendField('super()', 'SUPER_LABEL');
    } else {
      // First arg connector on the same row as the 'super(' label.
      const label0 = this.argNames_[0];
      this.appendValueInput('ARG0')
        .appendField('super( ' + label0 + (this.argNames_.length > 1 ? ' ,' : ' )'));
      if (saved[0] && saved[0].getSourceBlock().workspace) {
        this.getInput('ARG0').connection.connect(saved[0]);
      }
      // Remaining args below, right-aligned.
      for (let j = 1; j < this.argNames_.length; j++) {
        const label = this.argNames_[j];
        this.appendValueInput('ARG' + j)
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField(label + (j + 1 === this.argNames_.length ? ' )' : ' ,'));
        if (saved[j] && saved[j].getSourceBlock().workspace) {
          this.getInput('ARG' + j).connection.connect(saved[j]);
        }
      }
    }
  },

  saveExtraState: function () {
    return { argNames: this.argNames_ };
  },

  loadExtraState: function (state) {
    this.updateShape_((state && state.argNames) || []);
  },
};
/**
 * Custom Blockly blocks for Java static methods:
 *  - java_static_method_noreturn  → public static void name(params) { body }
 *  - java_static_method_return    → public static type name(params) { body return …; }
 *  - java_static_method_call_noreturn  → MethodName(args);
 *  - java_static_method_call_return    → MethodName(args)  [value block]
 *
 * Parameter handling reuses the same 'argument_container' / 'argument_input'
 * mutator helper blocks that are already defined for defconstructor.
 *
 * Defined static methods are persisted in LocalStorage via LocalStorageManager
 * so that call blocks can show a dropdown of available methods.
 */

import * as Blockly from 'blockly/core';

const STATIC_METHOD_COLOUR = '#AA5555';  // red-ish – static methods
const NORMAL_METHOD_COLOUR = '#995599';  // purple-ish – instance methods (additional blocks)

// ─────────────────────────────────────────────────────────────────────────────
// Helper: shared mutation / decompose / compose logic for both method blocks
// ─────────────────────────────────────────────────────────────────────────────
const paramMixin = {
  mutationToDom: function () {
    const container = document.createElement('mutation');
    for (let i = 0; i < this.arguments_.length; i++) {
      const name = this.arguments_[i];
      const arg = document.createElement('arg');
      arg.setAttribute('name', name);
      if (!this.workspace.getVariable(name, 'param')) {
        this.workspace.createVariable(name, 'param');
      }
      arg.setAttribute('varid', this.workspace.getVariable(name, 'param').getId());
      container.appendChild(arg);
    }
    this.updateShape_();
    return container;
  },

  domToMutation: function (xmlElement) {
    this.arguments_ = [];
    for (let i = 0, child; (child = xmlElement.childNodes[i]); i++) {
      if (child.nodeName.toLowerCase() === 'arg') {
        this.arguments_.push(child.getAttribute('name'));
      }
    }
    this.updateShape_();
  },

  decompose: function (workspace) {
    const container = workspace.newBlock('argument_container');
    container.initSvg();
    let connection = container.getInput('STACK').connection;
    for (const element of this.arguments_) {
      const argBlock = workspace.newBlock('argument_input');
      argBlock.initSvg();
      argBlock.setFieldValue(element, 'NAME');
      connection.connect(argBlock.previousConnection);
      connection = argBlock.nextConnection;
    }
    return container;
  },

  compose: function (containerBlock) {
    // Snapshot old args before overwriting so we can clean up stale variables.
    const oldArguments = this.arguments_.slice();

    let itemBlock = containerBlock.getInputTargetBlock('STACK');
    this.arguments_ = [];
    while (itemBlock) {
      this.arguments_.push(itemBlock.getFieldValue('NAME'));
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

  /**
   * Only updates the text of the named FieldLabel 'PARAMS'.
   * Never adds/removes/moves inputs — that would trigger renders before SVG
   * elements are ready when the block appears in the flyout.
   */
  updateShape_: function () {
    const display = this.arguments_.length
      ? '(' + this.arguments_.join(', ') + ')'
      : '()';
    this.setFieldValue(display, 'PARAMS');
  },

  getVarModels: function () {
    return this.arguments_.map(name => this.workspace.getVariable(name, 'param')).filter(Boolean);
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. STATIC METHOD – NO RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_static_method_noreturn'] = {
  init: function () {
    // Inputs are created in their final order — updateShape_ must not move them.
    this.appendDummyInput('TOP_LINE')
      .appendField('Klassen-Methode')
      .appendField(new Blockly.FieldTextInput('methode'), 'NAME')
      .appendField(new Blockly.FieldLabel('()'), 'PARAMS');
    this.appendStatementInput('STACK');
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setColour(STATIC_METHOD_COLOUR);
    this.setTooltip('Definiert eine Klassen-Methode ohne Rückgabewert.');
    this.setHelpUrl('');
    this.arguments_ = [];
    this.setMutator(new Blockly.icons.MutatorIcon(['argument_input'], this));
  },
  ...paramMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. STATIC METHOD – WITH RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_static_method_return'] = {
  init: function () {
    this.appendDummyInput('TOP_LINE')
      .appendField('Klassen-Methode')
      .appendField(new Blockly.FieldTextInput('methode'), 'NAME')
      .appendField(new Blockly.FieldLabel('()'), 'PARAMS');
    this.appendStatementInput('STACK');
    this.appendValueInput('RETURN')
      .setAlign(Blockly.inputs.Align.RIGHT)
      .appendField('return');
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setColour(STATIC_METHOD_COLOUR);
    this.setTooltip('Definiert eine Klassen-Methode mit Rückgabewert.');
    this.setHelpUrl('');
    this.arguments_ = [];
    this.setMutator(new Blockly.icons.MutatorIcon(['argument_input'], this));
  },
  ...paramMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. NORMAL INSTANCE METHOD – NO RETURN  (standalone block, separate from PROCEDURE category)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_method_noreturn'] = {
  init: function () {
    this.appendDummyInput('TOP_LINE')
      .appendField('Methode')
      .appendField(new Blockly.FieldTextInput('methode'), 'NAME')
      .appendField(new Blockly.FieldLabel('()'), 'PARAMS');
    this.appendStatementInput('STACK');
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setColour(NORMAL_METHOD_COLOUR);
    this.setTooltip('Definiert eine Instanzmethode ohne Rückgabewert.');
    this.setHelpUrl('');
    this.arguments_ = [];
    this.setMutator(new Blockly.icons.MutatorIcon(['argument_input'], this));
  },
  ...paramMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. NORMAL INSTANCE METHOD – WITH RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_method_return'] = {
  init: function () {
    this.appendDummyInput('TOP_LINE')
      .appendField('Methode')
      .appendField(new Blockly.FieldTextInput('methode'), 'NAME')
      .appendField(new Blockly.FieldLabel('()'), 'PARAMS');
    this.appendStatementInput('STACK');
    this.appendValueInput('RETURN')
      .setAlign(Blockly.inputs.Align.RIGHT)
      .appendField('return');
    this.setPreviousStatement(false, null);
    this.setNextStatement(false, null);
    this.setColour(NORMAL_METHOD_COLOUR);
    this.setTooltip('Definiert eine Instanzmethode mit Rückgabewert.');
    this.setHelpUrl('');
    this.arguments_ = [];
    this.setMutator(new Blockly.icons.MutatorIcon(['argument_input'], this));
  },
  ...paramMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper blocks for *call* mutator (add/remove argument value slots)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['call_arg_container'] = {
  init: function () {
    this.appendDummyInput().appendField('Argumente');
    this.appendStatementInput('STACK');
    this.setColour(230);
    this.setTooltip('Argumente hinzufügen oder entfernen.');
    this.setHelpUrl('');
  },
};

Blockly.Blocks['call_arg_input'] = {
  init: function () {
    this.appendDummyInput().appendField('Argument');
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour(230);
    this.setTooltip('Ein Argument.');
    this.setHelpUrl('');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared mixin for call blocks (manages ARG0, ARG1, … value inputs)
// ─────────────────────────────────────────────────────────────────────────────
const callArgMixin = {
  argCount_: 0,
  argNames_: [],
  methodName_: '',
  headerText_: '',

  mutationToDom: function () {
    const container = document.createElement('mutation');
    container.setAttribute('method', this.methodName_ || '');
    container.setAttribute('args', this.argCount_);
    (this.argNames_ || []).forEach((n, i) => container.setAttribute('name' + i, n));
    return container;
  },

  domToMutation: function (xmlElement) {
    this.methodName_ = xmlElement.getAttribute('method') || '';
    this.argCount_ = parseInt(xmlElement.getAttribute('args') || '0', 10);
    this.argNames_ = [];
    for (let i = 0; i < this.argCount_; i++) {
      this.argNames_.push(xmlElement.getAttribute('name' + i) || ('arg ' + (i + 1)));
    }
    this.updateArgInputs_();
  },

  decompose: function (workspace) {
    const container = workspace.newBlock('call_arg_container');
    container.initSvg();
    let connection = container.getInput('STACK').connection;
    for (let i = 0; i < this.argCount_; i++) {
      const argBlock = workspace.newBlock('call_arg_input');
      argBlock.initSvg();
      connection.connect(argBlock.previousConnection);
      connection = argBlock.nextConnection;
    }
    return container;
  },

  compose: function (containerBlock) {
    // Save existing connections so blocks plugged into ARG inputs survive.
    const savedConns = [];
    for (let i = 0; i < this.argCount_; i++) {
      const inp = this.getInput('ARG' + i);
      savedConns[i] = inp && inp.connection && inp.connection.targetConnection;
    }

    let newCount = 0;
    let itemBlock = containerBlock.getInputTargetBlock('STACK');
    while (itemBlock) {
      newCount++;
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
    this.argCount_ = newCount;
    this.updateArgInputs_();

    // Reconnect surviving blocks.
    for (let i = 0; i < savedConns.length && i < this.argCount_; i++) {
      if (savedConns[i] && savedConns[i].getSourceBlock().workspace) {
        this.getInput('ARG' + i).connection.connect(savedConns[i]);
      }
    }
  },

  updateArgInputs_: function () {
    // Remove existing ARG inputs.
    let i = 0;
    while (this.getInput('ARG' + i)) { this.removeInput('ARG' + i); i++; }
    // Rebuild TOP_LINE / header.
    if (this.getInput('TOP_LINE')) { this.removeInput('TOP_LINE'); }

    const header      = this.headerText_ || '';
    const name        = this.methodName_ || '';
    const paramsDisplay = this.argCount_ > 0
      ? '(' + (this.argNames_ || []).join(', ') + ')'
      : '()';

    if (this.argCount_ === 0) {
      // No args: plain dummy so the block still shows nicely.
      this.appendDummyInput('TOP_LINE')
        .appendField(header)
        .appendField(new Blockly.FieldLabel(name),        'NAME')
        .appendField(new Blockly.FieldLabel(paramsDisplay), 'PARAMS');
    } else {
      // Attach ALL header labels to ARG0 so its connector sits at the top row.
      const label0 = (this.argNames_ && this.argNames_[0]) || 'arg 1';
      this.appendValueInput('ARG0')
        .appendField(header)
        .appendField(new Blockly.FieldLabel(name),        'NAME')
        .appendField(new Blockly.FieldLabel(paramsDisplay), 'PARAMS')
        .appendField(label0);
      // Remaining args stack below, right-aligned.
      for (let j = 1; j < this.argCount_; j++) {
        const label = (this.argNames_ && this.argNames_[j]) || ('arg ' + (j + 1));
        this.appendValueInput('ARG' + j)
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField(label);
      }
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. STATIC METHOD CALL – NO RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_static_method_call_noreturn'] = {
  init: function () {
    this.headerText_ = '';
    this.methodName_ = '';
    this.argCount_ = 0;
    this.argNames_ = [];
    this.appendDummyInput('TOP_LINE')
      .appendField(this.headerText_)
      .appendField(new Blockly.FieldLabel(''), 'NAME');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(STATIC_METHOD_COLOUR);
    this.setTooltip('Ruft eine Klassen-Methode ohne Rückgabewert auf.');
    this.setHelpUrl('');
  },
  ...callArgMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. STATIC METHOD CALL – WITH RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_static_method_call_return'] = {
  init: function () {
    this.headerText_ = '';
    this.methodName_ = '';
    this.argCount_ = 0;
    this.argNames_ = [];
    this.appendDummyInput('TOP_LINE')
      .appendField(this.headerText_)
      .appendField(new Blockly.FieldLabel(''), 'NAME');
    this.setOutput(true, null);
    this.setColour(STATIC_METHOD_COLOUR);
    this.setTooltip('Ruft eine Klassen-Methode mit Rückgabewert auf.');
    this.setHelpUrl('');
  },
  ...callArgMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. NORMAL METHOD CALL – NO RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_method_call_noreturn'] = {
  init: function () {
    this.headerText_ = '';
    this.methodName_ = '';
    this.argCount_ = 0;
    this.argNames_ = [];
    this.appendDummyInput('TOP_LINE')
      .appendField(this.headerText_)
      .appendField(new Blockly.FieldLabel(''), 'NAME');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(NORMAL_METHOD_COLOUR);
    this.setTooltip('Ruft eine Instanzmethode ohne Rückgabewert auf (implizit auf this).');
    this.setHelpUrl('');
  },
  ...callArgMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. NORMAL METHOD CALL – WITH RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_method_call_return'] = {
  init: function () {
    this.headerText_ = '';
    this.methodName_ = '';
    this.argCount_ = 0;
    this.argNames_ = [];
    this.appendDummyInput('TOP_LINE')
      .appendField(this.headerText_)
      .appendField(new Blockly.FieldLabel(''), 'NAME');
    this.setOutput(true, null);
    this.setColour(NORMAL_METHOD_COLOUR);
    this.setTooltip('Ruft eine Instanzmethode mit Rückgabewert auf (implizit auf this).');
    this.setHelpUrl('');
  },
  ...callArgMixin,
};

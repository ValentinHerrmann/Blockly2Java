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
// Helper: shared mutation / decompose / compose logic for method blocks.
//
// Option A: Parameter metadata (name, unique ID, type) is stored directly on
// the block instance and in mutation DOM — NO workspace-level 'param' variables
// are created or looked up.  This avoids Blockly's VariableMap collision bug
// where two methods with same-named parameters would conflict.
//
// Data structures on the block:
//   paramIds_   : string[] — unique Blockly UIDs per parameter slot
//   paramTypes_ : string[] — explicit type per parameter slot (e.g. "String")
//                 populated when the user writes "int count" in the mutator.
// ─────────────────────────────────────────────────────────────────────────────
const paramMixin = {

  /**
   * Parse a parameter name string for an optional explicit type prefix.
   * E.g. "int count" → { type: 'int', name: 'count' }
   *      "count"      → { type: null,    name: 'count' }
   */
  _parseParamName_: function (name) {
    // Common Java types to check for.
    const knownTypes = [
      'int', 'long', 'float', 'double', 'boolean', 'char', 'byte', 'short',
      'String', 'Object', 'boolean',
    ];
    for (const t of knownTypes) {
      const regex = new RegExp('^' + t + '\\s+(.+)');
      const m = name.match(regex);
      if (m) {
        return { type: t, name: m[1] };
      }
    }
    return { type: null, name: name };
  },

  mutationToDom: function () {
    const container = document.createElement('mutation');
    if (!this.paramIds_) this.paramIds_ = [];
    if (!this.paramTypes_) this.paramTypes_ = [];
    // Ensure we have a paramId and paramType for each argument.
    while (this.paramIds_.length < this.arguments_.length) {
      this.paramIds_.push(Blockly.utils.idGenerator.genUid());
    }
    while (this.paramTypes_.length < this.arguments_.length) {
      this.paramTypes_.push('');
    }
    for (let i = 0; i < this.arguments_.length; i++) {
      const arg = document.createElement('arg');
      arg.setAttribute('name', this.arguments_[i]);
      arg.setAttribute('varid', this.paramIds_[i]);
      const parsed = this._parseParamName_(this.arguments_[i]);
      if (parsed.type) {
        arg.setAttribute('type', parsed.type);
      }
      container.appendChild(arg);
    }
    this.updateShape_();
    return container;
  },

  domToMutation: function (xmlElement) {
    this.arguments_ = [];
    this.paramIds_ = [];
    this.paramTypes_ = [];
    for (let i = 0, child; (child = xmlElement.childNodes[i]); i++) {
      if (child.nodeName.toLowerCase() === 'arg') {
        const rawName = child.getAttribute('name');
        this.arguments_.push(rawName);
        // Always ensure a valid unique ID exists for this slot.
        const varid = child.getAttribute('varid') || Blockly.utils.idGenerator.genUid();
        this.paramIds_.push(varid);
        // Restore explicit type if present in mutation DOM.
        const t = child.getAttribute('type');
        this.paramTypes_.push(t || '');
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
    // Snapshot old args and IDs before overwriting so we can track changes.
    const oldArguments = this.arguments_.slice();
    const oldParamIds  = this.paramIds_  ? this.paramIds_.slice()  : [];
    const oldParamTypes = this.paramTypes_ ? this.paramTypes_.slice() : [];

    let itemBlock = containerBlock.getInputTargetBlock('STACK');
    this.arguments_  = [];
    this.paramIds_   = [];
    this.paramTypes_ = [];

    while (itemBlock) {
      const rawName = itemBlock.getFieldValue('NAME');
      this.arguments_.push(rawName);
      // Reuse the existing ID if this param name survived the edit,
      // otherwise generate a fresh unique ID.
      const oldIdx = oldArguments.indexOf(rawName);
      const reuseId = (oldIdx >= 0 && oldParamIds[oldIdx])
        ? oldParamIds[oldIdx]
        : Blockly.utils.idGenerator.genUid();
      this.paramIds_.push(reuseId);
      // Restore type annotation if name survived.
      this.paramTypes_.push(oldIdx >= 0 ? (oldParamTypes[oldIdx] || '') : '');
      itemBlock = itemBlock.nextConnection?.targetBlock();
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

  /**
   * Returns an array of parameter metadata objects instead of Blockly
   * variable models.  Each object has: { id, name, type }.
   *
   * This replaces getVarModels() which relied on workspace variables.
   */
  getParams: function () {
    const params = [];
    for (let i = 0; i < this.arguments_.length; i++) {
      const rawName = this.arguments_[i];
      const parsed = this._parseParamName_(rawName);
      params.push({
        id: this.paramIds_ ? this.paramIds_[i] : null,
        name: parsed.name,
        // Explicit type from prefix takes priority; fall back to paramTypes_
        // stored in mutation DOM (for cross-class type hints).
        type: parsed.type || ((this.paramTypes_ && this.paramTypes_[i]) || ''),
      });
    }
    return params;
  },

  /**
   * Set the inferred type for a parameter by slot index.
   * Used by the generator to store cross-class type hints back on the block.
   */
  setParamType: function (index, type) {
    if (!this.paramTypes_) {
      this.paramTypes_ = [];
    }
    while (this.paramTypes_.length <= index) {
      this.paramTypes_.push('');
    }
    this.paramTypes_[index] = type;
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. STATIC METHOD – NO RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_static_method_noreturn'] = {
  init: function () {
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
    this.paramIds_ = [];
    this.paramTypes_ = [];
    this.setMutator(new Blockly.icons.MutatorIcon(['argument_input'], this));
    this.setCommentText('');
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
    this.paramIds_ = []; // Unique variable IDs for each parameter (fixes same-name collision)
    this.paramTypes_ = [];
    this.setMutator(new Blockly.icons.MutatorIcon(['argument_input'], this));
    this.setCommentText('');
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
    this.paramIds_ = []; // Unique variable IDs for each parameter (fixes same-name collision)
    this.paramTypes_ = [];
    this.setMutator(new Blockly.icons.MutatorIcon(['argument_input'], this));
    this.setCommentText('');
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
    this.paramIds_ = []; // Unique variable IDs for each parameter (fixes same-name collision)
    this.paramTypes_ = [];
    this.setMutator(new Blockly.icons.MutatorIcon(['argument_input'], this));
    this.setCommentText('');
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
    this.argCount_ = Number.parseInt(xmlElement.getAttribute('args') || '0', 10);
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
      savedConns[i] = inp?.connection?.targetConnection;
    }

    let newCount = 0;
    let itemBlock = containerBlock.getInputTargetBlock('STACK');
    while (itemBlock) {
      newCount++;
      itemBlock = itemBlock.nextConnection?.targetBlock()
    }
    this.argCount_ = newCount;
    this.updateArgInputs_();

    // Reconnect surviving blocks.
    for (let i = 0; i < savedConns.length && i < this.argCount_; i++) {
      if (savedConns[i]?.getSourceBlock().workspace) {
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

    if (this.argCount_ === 0) {
      // No args: plain dummy so the block still shows nicely.
      this.appendDummyInput('TOP_LINE')
        .appendField(header)
        .appendField(new Blockly.FieldLabel(name),        'NAME');
    } else {
      // Attach ALL header labels to ARG0 so its connector sits at the top row.
      const label0 = (this.argNames_?.[0]) || 'arg 1';
      this.appendValueInput('ARG0')
        .appendField(header)
        .appendField(new Blockly.FieldLabel(name),        'NAME')
        .appendField('( ' + label0 + (this.argCount_ > 1 ? ' ,' : ' ) '));
      // Remaining args stack below, right-aligned.
      for (let j = 1; j < this.argCount_; j++) {
        const label = (this.argNames_?.[j]) || ('arg ' + (j + 1));
        this.appendValueInput('ARG' + j)
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField(label + (j + 1 === this.argCount_ ? ' )' : ' ,'));
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

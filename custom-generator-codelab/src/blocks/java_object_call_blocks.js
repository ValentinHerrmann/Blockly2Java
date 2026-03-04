/**
 * Custom Blockly blocks for calling methods on objects and static methods
 * of external / other classes:
 *
 *  - java_obj_method_call_noreturn  → variable.method(args);
 *  - java_obj_method_call_return    → variable.method(args)  [value block]
 *  - java_ext_static_call_noreturn  → ClassName.method(args);
 *  - java_ext_static_call_return    → ClassName.method(args) [value block]
 *
 * All four blocks share the callArgMixin mutator helper blocks
 * (call_arg_container / call_arg_input) that are already defined in
 * java_method_blocks.js.
 *
 * "Object call" blocks have a VALUE input OBJ (any expression can be plugged in)
 * plus a text field METHOD – so the user can call methods of the same class on
 * another instance OR call library methods (e.g. string.length()).
 *
 * "External static" blocks have two text fields: CLASS and METHOD.
 */

import * as Blockly from 'blockly/core';

// ─── Colour constants ─────────────────────────────────────────────────────────
const OBJ_CALL_COLOUR = '#2288AA';   // teal-blue  – method call on an object
const EXT_STA_COLOUR  = '#AA8822';   // amber/gold – static method of another class

// ─────────────────────────────────────────────────────────────────────────────
// Shared mixin for "call on object" blocks (java_obj_method_call_*)
//
// Layout:
//   Row 0  (value input OBJ)  : "Methode auf  [OBJ ←]"
//   Row 1+ (managed by mutator):
//     0 args  →  dummy    ".methode()"
//     n args  →  value    ".methode( arg1 , [ARG0 ←]"
//                value    "         arg2 ) [ARG1 ←]"
//                ...
// ─────────────────────────────────────────────────────────────────────────────
const objCallMixin = {
  argCount_: 0,
  argNames_: [],

  mutationToDom() {
    const container = document.createElement('mutation');
    const method = (this.getField('METHOD') ? this.getFieldValue('METHOD') : null) || 'methode';
    container.setAttribute('method', method);
    container.setAttribute('args', this.argCount_);
    (this.argNames_ || []).forEach((n, i) => container.setAttribute('name' + i, n));
    return container;
  },

  domToMutation(xmlElement) {
    this.argCount_ = parseInt(xmlElement.getAttribute('args') || '0', 10);
    this.argNames_ = [];
    for (let i = 0; i < this.argCount_; i++) {
      this.argNames_.push(xmlElement.getAttribute('name' + i) || 'arg ' + (i + 1));
    }
    const method = xmlElement.getAttribute('method') || 'methode';
    this._updateCallLine(method);
  },

  decompose(workspace) {
    const container = workspace.newBlock('call_arg_container');
    container.initSvg();
    let conn = container.getInput('STACK').connection;
    for (let i = 0; i < this.argCount_; i++) {
      const argBlock = workspace.newBlock('call_arg_input');
      argBlock.initSvg();
      conn.connect(argBlock.previousConnection);
      conn = argBlock.nextConnection;
    }
    return container;
  },

  compose(containerBlock) {
    // Save existing arg connections so plugged blocks survive a mutator change.
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

    // Extend or trim argNames_ to match the new count so labels and
    // serialization always stay in sync with the actual arg count.
    this.argNames_ = this.argNames_ || [];
    while (this.argNames_.length < newCount) {
      this.argNames_.push('arg ' + (this.argNames_.length + 1));
    }
    this.argNames_ = this.argNames_.slice(0, newCount);

    this.argCount_ = newCount;
    this._updateCallLine();

    for (let i = 0; i < savedConns.length && i < this.argCount_; i++) {
      if (savedConns[i] && savedConns[i].getSourceBlock().workspace) {
        this.getInput('ARG' + i).connection.connect(savedConns[i]);
      }
    }
  },

  /**
   * Rebuild the CALL_LINE / ARG* inputs that sit below the OBJ value input.
   * @param {string} [defaultMethod] – fall-back method name when the field
   *   does not yet exist (first call from domToMutation).
   */
  _updateCallLine(defaultMethod) {
    // Preserve the method name the user typed, or use the supplied default.
    const method =
      (this.getField('METHOD') ? this.getFieldValue('METHOD') : null) ||
      defaultMethod ||
      'methode';

    // Remove stale ARG inputs.
    let i = 0;
    while (this.getInput('ARG' + i)) this.removeInput('ARG' + i++);
    // Remove the old call-line dummy (or old ARG0 that carried the method label).
    if (this.getInput('CALL_LINE')) this.removeInput('CALL_LINE');

    if (this.argCount_ === 0) {
      this.appendDummyInput('CALL_LINE')
        .appendField('.')
        .appendField(new Blockly.FieldTextInput(method), 'METHOD')
        .appendField('()');
    } else {
      const label0 = (this.argNames_ && this.argNames_[0]) || 'arg 1';
      const suffix0 = this.argCount_ > 1 ? ' ,' : ' )';
      this.appendValueInput('ARG0')
        .appendField('.')
        .appendField(new Blockly.FieldTextInput(method), 'METHOD')
        .appendField('( ' + label0 + suffix0);
      for (let j = 1; j < this.argCount_; j++) {
        const label = (this.argNames_ && this.argNames_[j]) || 'arg ' + (j + 1);
        const suffix = j + 1 < this.argCount_ ? ' ,' : ' )';
        this.appendValueInput('ARG' + j)
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField(label + suffix);
      }
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Shared mixin for "external static class" blocks (java_ext_static_call_*)
//
// Layout:
//   0 args  →  dummy   "Klasse.methode()"
//   n args  →  value   "Klasse.methode( arg1 , [ARG0 ←]"
//               value  "                arg2 ) [ARG1 ←]"
// ─────────────────────────────────────────────────────────────────────────────
const extStaticCallMixin = {
  argCount_: 0,
  argNames_: [],

  mutationToDom() {
    const container = document.createElement('mutation');
    const cls     = (this.getField('CLASS')  ? this.getFieldValue('CLASS')  : null) || 'Klasse';
    const method  = (this.getField('METHOD') ? this.getFieldValue('METHOD') : null) || 'methode';
    container.setAttribute('class',  cls);
    container.setAttribute('method', method);
    container.setAttribute('args', this.argCount_);
    (this.argNames_ || []).forEach((n, i) => container.setAttribute('name' + i, n));
    return container;
  },

  domToMutation(xmlElement) {
    this.argCount_ = parseInt(xmlElement.getAttribute('args') || '0', 10);
    this.argNames_ = [];
    for (let i = 0; i < this.argCount_; i++) {
      this.argNames_.push(xmlElement.getAttribute('name' + i) || 'arg ' + (i + 1));
    }
    const cls    = xmlElement.getAttribute('class')  || 'Klasse';
    const method = xmlElement.getAttribute('method') || 'methode';
    this._updateCallLine(cls, method);
  },

  decompose(workspace) {
    const container = workspace.newBlock('call_arg_container');
    container.initSvg();
    let conn = container.getInput('STACK').connection;
    for (let i = 0; i < this.argCount_; i++) {
      const argBlock = workspace.newBlock('call_arg_input');
      argBlock.initSvg();
      conn.connect(argBlock.previousConnection);
      conn = argBlock.nextConnection;
    }
    return container;
  },

  compose(containerBlock) {
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

    this.argNames_ = this.argNames_ || [];
    while (this.argNames_.length < newCount) {
      this.argNames_.push('arg ' + (this.argNames_.length + 1));
    }
    this.argNames_ = this.argNames_.slice(0, newCount);

    this.argCount_ = newCount;
    this._updateCallLine();

    for (let i = 0; i < savedConns.length && i < this.argCount_; i++) {
      if (savedConns[i] && savedConns[i].getSourceBlock().workspace) {
        this.getInput('ARG' + i).connection.connect(savedConns[i]);
      }
    }
  },

  /**
   * @param {string} [defaultClass]
   * @param {string} [defaultMethod]
   */
  _updateCallLine(defaultClass, defaultMethod) {
    const cls    = (this.getField('CLASS')  ? this.getFieldValue('CLASS')  : null) || defaultClass  || 'Klasse';
    const method = (this.getField('METHOD') ? this.getFieldValue('METHOD') : null) || defaultMethod || 'methode';

    let i = 0;
    while (this.getInput('ARG' + i)) this.removeInput('ARG' + i++);
    if (this.getInput('CALL_LINE')) this.removeInput('CALL_LINE');

    if (this.argCount_ === 0) {
      this.appendDummyInput('CALL_LINE')
        .appendField(new Blockly.FieldTextInput(cls),    'CLASS')
        .appendField('.')
        .appendField(new Blockly.FieldTextInput(method), 'METHOD')
        .appendField('()');
    } else {
      const label0 = (this.argNames_ && this.argNames_[0]) || 'arg 1';
      const suffix0 = this.argCount_ > 1 ? ' ,' : ' )';
      this.appendValueInput('ARG0')
        .appendField(new Blockly.FieldTextInput(cls),    'CLASS')
        .appendField('.')
        .appendField(new Blockly.FieldTextInput(method), 'METHOD')
        .appendField('( ' + label0 + suffix0);
      for (let j = 1; j < this.argCount_; j++) {
        const label  = (this.argNames_ && this.argNames_[j]) || 'arg ' + (j + 1);
        const suffix = j + 1 < this.argCount_ ? ' ,' : ' )';
        this.appendValueInput('ARG' + j)
          .setAlign(Blockly.inputs.Align.RIGHT)
          .appendField(label + suffix);
      }
    }
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. OBJECT METHOD CALL – NO RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_obj_method_call_noreturn'] = {
  init() {
    this.argCount_ = 0;
    this.argNames_ = [];
    // Row 0: constant value input for the receiver object.
    this.appendValueInput('OBJ')
      .appendField('Methode auf');
    // Row 1+: managed by mutator (starts with no-arg dummy).
    this.appendDummyInput('CALL_LINE')
      .appendField('.')
      .appendField(new Blockly.FieldTextInput('methode'), 'METHOD')
      .appendField('()');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(OBJ_CALL_COLOUR);
    this.setTooltip('Ruft eine Methode auf einem Objekt auf (kein Rückgabewert).');
    this.setHelpUrl('');
    this.setMutator(new Blockly.icons.MutatorIcon(['call_arg_input'], this));
  },
  ...objCallMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. OBJECT METHOD CALL – WITH RETURN VALUE
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_obj_method_call_return'] = {
  init() {
    this.argCount_ = 0;
    this.argNames_ = [];
    this.appendValueInput('OBJ')
      .appendField('Methode auf');
    this.appendDummyInput('CALL_LINE')
      .appendField('.')
      .appendField(new Blockly.FieldTextInput('methode'), 'METHOD')
      .appendField('()');
    this.setOutput(true, null);
    this.setColour(OBJ_CALL_COLOUR);
    this.setTooltip('Ruft eine Methode auf einem Objekt auf und gibt den Rückgabewert zurück.');
    this.setHelpUrl('');
    this.setMutator(new Blockly.icons.MutatorIcon(['call_arg_input'], this));
  },
  ...objCallMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXTERNAL STATIC CLASS METHOD CALL – NO RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_ext_static_call_noreturn'] = {
  init() {
    this.argCount_ = 0;
    this.argNames_ = [];
    this.appendDummyInput('CALL_LINE')
      .appendField(new Blockly.FieldTextInput('Klasse'),   'CLASS')
      .appendField('.')
      .appendField(new Blockly.FieldTextInput('methode'),  'METHOD')
      .appendField('()');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(EXT_STA_COLOUR);
    this.setTooltip('Ruft eine statische Methode einer anderen Klasse auf (kein Rückgabewert).');
    this.setHelpUrl('');
    this.setMutator(new Blockly.icons.MutatorIcon(['call_arg_input'], this));
  },
  ...extStaticCallMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. EXTERNAL STATIC CLASS METHOD CALL – WITH RETURN VALUE
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_ext_static_call_return'] = {
  init() {
    this.argCount_ = 0;
    this.argNames_ = [];
    this.appendDummyInput('CALL_LINE')
      .appendField(new Blockly.FieldTextInput('Klasse'),   'CLASS')
      .appendField('.')
      .appendField(new Blockly.FieldTextInput('methode'),  'METHOD')
      .appendField('()');
    this.setOutput(true, null);
    this.setColour(EXT_STA_COLOUR);
    this.setTooltip('Ruft eine statische Methode einer anderen Klasse auf und gibt den Rückgabewert zurück.');
    this.setHelpUrl('');
    this.setMutator(new Blockly.icons.MutatorIcon(['call_arg_input'], this));
  },
  ...extStaticCallMixin,
};

export const OBJ_CALL_COLOUR_EXPORT = OBJ_CALL_COLOUR;
export const EXT_STA_COLOUR_EXPORT  = EXT_STA_COLOUR;

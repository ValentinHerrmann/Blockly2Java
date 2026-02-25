/**
 * Custom Blockly blocks for Java-specific variable kinds:
 *  - java_local_var_get  / java_local_var_set   → local variable inside a method
 *  - java_static_attr_get / java_static_attr_set → static (class-level) attribute
 *
 * Block appearance intentionally mirrors Blockly's built-in variables_get /
 * variables_set (same layout, no prefix label).  Only the colour differs so
 * students can visually distinguish the three kinds.
 *
 * The toolbox categories use custom flyout callbacks (JAVA_LOCAL_VAR and
 * JAVA_STATIC_ATTR) which behave exactly like the built-in VARIABLE flyout:
 * a "create variable" button followed by a get+set pair per variable.
 * Register these callbacks on the workspace after injection (see index.js).
 */

import * as Blockly from 'blockly/core';

// ─── Type & colour constants ────────────────────────────────────────────────
// These type strings are the Blockly variable-type tags used to separate the
// three kinds.  '' is the default for normal attributes (built-in VARIABLE).
export const VAR_TYPE_NORMAL = '';        // normal instance attribute
export const VAR_TYPE_LOCAL  = 'local';   // local variable inside a method
export const VAR_TYPE_STATIC = 'static';  // static class-level attribute
export const VAR_TYPE_PARAM  = 'param';   // method parameter (read-only in body)

export const LOCAL_COLOUR  = '#55AA55';   // green  – local variable
export const STATIC_COLOUR = '#5555AA';   // indigo – static attribute

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOCAL VARIABLE – GET  (looks like variables_get, but green)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_local_var_get'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldVariable('lokaleVar', null, [VAR_TYPE_LOCAL], VAR_TYPE_LOCAL),
        'VAR');
    this.setOutput(true, null);
    this.setColour(LOCAL_COLOUR);
    this.setTooltip('Liest eine lokale Variable (wird nicht als Attribut deklariert).');
    this.setHelpUrl('');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. LOCAL VARIABLE – SET  (looks like variables_set, but green)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_local_var_set'] = {
  init: function () {
    this.appendValueInput('VALUE')
      .appendField('setze')
      .appendField(
        new Blockly.FieldVariable('lokaleVar', null, [VAR_TYPE_LOCAL], VAR_TYPE_LOCAL),
        'VAR')
      .appendField('auf');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(LOCAL_COLOUR);
    this.setTooltip('Deklariert / setzt eine lokale Variable (erzeugt keine Klassenvariable).');
    this.setHelpUrl('');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. STATIC ATTRIBUTE – GET  (looks like variables_get, but indigo)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_static_attr_get'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldVariable('statischesAttribut', null, [VAR_TYPE_STATIC], VAR_TYPE_STATIC),
        'VAR');
    this.setOutput(true, null);
    this.setColour(STATIC_COLOUR);
    this.setTooltip('Liest ein statisches Klassenattribut.');
    this.setHelpUrl('');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. STATIC ATTRIBUTE – SET  (looks like variables_set, but indigo)
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_static_attr_set'] = {
  init: function () {
    this.appendValueInput('VALUE')
      .appendField('setze')
      .appendField(
        new Blockly.FieldVariable('statischesAttribut', null, [VAR_TYPE_STATIC], VAR_TYPE_STATIC),
        'VAR')
      .appendField('auf');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(STATIC_COLOUR);
    this.setTooltip('Setzt ein statisches Klassenattribut (wird als private static deklariert).');
    this.setHelpUrl('');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. PARAMETER – GET  (read-only reference to a method parameter, orange)
// ─────────────────────────────────────────────────────────────────────────────
const PARAM_COLOUR = '#CC8800';

Blockly.Blocks['java_param_get'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldVariable('param', null, [VAR_TYPE_PARAM], VAR_TYPE_PARAM),
        'VAR');
    this.setOutput(true, null);
    this.setColour(PARAM_COLOUR);
    this.setTooltip('Liest einen Methodenparameter.');
    this.setHelpUrl('');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. NORMAL ATTRIBUTE – GET  (mirrors variables_get but type-restricted to '')
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_normal_attr_get'] = {
  init: function () {
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldVariable('attribut', null, [VAR_TYPE_NORMAL], VAR_TYPE_NORMAL),
        'VAR');
    this.setOutput(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Liest ein normales Instanzattribut.');
    this.setHelpUrl('');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. NORMAL ATTRIBUTE – SET  (mirrors variables_set but type-restricted to '')
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_normal_attr_set'] = {
  init: function () {
    this.appendValueInput('VALUE')
      .appendField('setze')
      .appendField(
        new Blockly.FieldVariable('attribut', null, [VAR_TYPE_NORMAL], VAR_TYPE_NORMAL),
        'VAR')
      .appendField('auf');
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle('variable_blocks');
    this.setTooltip('Setzt ein normales Instanzattribut.');
    this.setHelpUrl('');
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a flyout XML node for a variable field
// ─────────────────────────────────────────────────────────────────────────────
function varField(variable) {
  const field = Blockly.utils.xml.createElement('field');
  field.setAttribute('name', 'VAR');
  field.setAttribute('id', variable.getId());
  field.setAttribute('variabletype', variable.type ?? '');
  field.appendChild(document.createTextNode(variable.name));
  return field;
}

// ─────────────────────────────────────────────────────────────────────────────
// Flyout category callbacks – register these on the workspace after injection.
// Both mirror the built-in VARIABLE flyout: create-button + (set+get) per var.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Methods flyout – shows definition templates + dynamically generated call blocks
// for each method block currently in the workspace.
// ─────────────────────────────────────────────────────────────────────────────

const METHOD_GROUPS = [
  {
    label: 'Normale (Objekt-) Methoden',
    defs: [
      { type: 'java_method_noreturn' },
      { type: 'java_method_return' },
    ],
    calls: [
      { defType: 'java_method_noreturn',  callType: 'java_method_call_noreturn' },
      { defType: 'java_method_return',    callType: 'java_method_call_return'   },
    ],
  },
  {
    label: 'Klassen-Methoden k\xf6nnen ohne Objekt ausgef\xfchrt werden.',
    defs: [
      { type: 'java_static_method_noreturn' },
      { type: 'java_static_method_return'   },
    ],
    calls: [
      { defType: 'java_static_method_noreturn', callType: 'java_static_method_call_noreturn' },
      { defType: 'java_static_method_return',   callType: 'java_static_method_call_return'   },
    ],
  },
];

function makeLabel(text) {
  const lbl = Blockly.utils.xml.createElement('label');
  lbl.setAttribute('text', text);
  lbl.setAttribute('gap', '8');
  return lbl;
}

function makeBlockTemplate(type) {
  const b = Blockly.utils.xml.createElement('block');
  b.setAttribute('type', type);
  b.setAttribute('gap', '16');
  return b;
}

function makeCallBlock(callType, name, argNames) {
  const b = Blockly.utils.xml.createElement('block');
  b.setAttribute('type', callType);
  b.setAttribute('gap', '8');
  const mutation = Blockly.utils.xml.createElement('mutation');
  // Store method name inside mutation — FieldLabel is not XML-serializable
  // so <field name="NAME"> would be silently ignored by Blockly.
  mutation.setAttribute('method', name);
  mutation.setAttribute('args', String(argNames.length));
  argNames.forEach((paramName, i) => mutation.setAttribute('name' + i, paramName));
  b.appendChild(mutation);
  return b;
}

export function methodFlyoutCategory(workspace) {
  const xmlList = [];
  for (const group of METHOD_GROUPS) {
    xmlList.push(makeLabel(group.label));

    // Always show definition templates.
    for (const def of group.defs) {
      xmlList.push(makeBlockTemplate(def.type));
    }

    // Dynamically add call blocks + param-get blocks for each defined method.
    for (const { defType, callType } of group.calls) {
      for (const block of workspace.getBlocksByType(defType, true)) {
        const name = block.getFieldValue('NAME') || 'unbekannt';
        const argNames = block.arguments_ || [];

        // Call block — small gap so params feel attached.
        const callBlock = makeCallBlock(callType, name, argNames);
        callBlock.setAttribute('gap', argNames.length > 0 ? '4' : '16');
        xmlList.push(callBlock);

        // Param-get blocks directly below — tight gap between them,
        // larger gap after the last one to separate from the next method.
        for (let pi = 0; pi < argNames.length; pi++) {
          const paramVar = workspace.getVariable(argNames[pi], VAR_TYPE_PARAM);
          if (paramVar) {
            const getBlock = Blockly.utils.xml.createElement('block');
            getBlock.setAttribute('type', 'java_param_get');
            // Last param gets bigger gap to visually separate from next method.
            getBlock.setAttribute('gap', pi === argNames.length - 1 ? '20' : '4');
            getBlock.appendChild(varField(paramVar));
            xmlList.push(getBlock);
          }
        }
      }
    }
  }
  return xmlList;
}

export function normalAttrFlyoutCategory(workspace) {
  const xmlList = [];

  const button = Blockly.utils.xml.createElement('button');
  button.setAttribute('text', 'Neues Attribut');
  button.setAttribute('callbackKey', 'CREATE_JAVA_NORMAL_ATTR');
  xmlList.push(button);

  for (const variable of workspace.getVariablesOfType(VAR_TYPE_NORMAL)) {
    const setBlock = Blockly.utils.xml.createElement('block');
    setBlock.setAttribute('type', 'java_normal_attr_set');
    setBlock.setAttribute('gap', '8');
    setBlock.appendChild(varField(variable));
    xmlList.push(setBlock);

    const getBlock = Blockly.utils.xml.createElement('block');
    getBlock.setAttribute('type', 'java_normal_attr_get');
    getBlock.setAttribute('gap', '24');
    getBlock.appendChild(varField(variable));
    xmlList.push(getBlock);
  }

  return xmlList;
}

export function paramFlyoutCategory(workspace) {
  const xmlList = [];
  // No create-button: params are created via the method block mutator.
  for (const variable of workspace.getVariablesOfType(VAR_TYPE_PARAM)) {
    const getBlock = Blockly.utils.xml.createElement('block');
    getBlock.setAttribute('type', 'java_param_get');
    getBlock.setAttribute('gap', '8');
    getBlock.appendChild(varField(variable));
    xmlList.push(getBlock);
  }
  return xmlList;
}

export function localVarFlyoutCategory(workspace) {
  const xmlList = [];

  const button = Blockly.utils.xml.createElement('button');
  button.setAttribute('text', 'Neue lok. Variable');
  button.setAttribute('callbackKey', 'CREATE_JAVA_LOCAL_VAR');
  xmlList.push(button);

  // Only show variables of type 'local' (includes method parameters)
  for (const variable of workspace.getVariablesOfType(VAR_TYPE_LOCAL)) {
    const setBlock = Blockly.utils.xml.createElement('block');
    setBlock.setAttribute('type', 'java_local_var_set');
    setBlock.setAttribute('gap', '8');
    setBlock.appendChild(varField(variable));
    xmlList.push(setBlock);

    const getBlock = Blockly.utils.xml.createElement('block');
    getBlock.setAttribute('type', 'java_local_var_get');
    getBlock.setAttribute('gap', '24');
    getBlock.appendChild(varField(variable));
    xmlList.push(getBlock);
  }

  return xmlList;
}

export function staticAttrFlyoutCategory(workspace) {
  const xmlList = [];

  const button = Blockly.utils.xml.createElement('button');
  button.setAttribute('text', 'Neues stat. Attribut');
  button.setAttribute('callbackKey', 'CREATE_JAVA_STATIC_ATTR');
  xmlList.push(button);

  // Only show variables of type 'static'
  for (const variable of workspace.getVariablesOfType(VAR_TYPE_STATIC)) {
    const setBlock = Blockly.utils.xml.createElement('block');
    setBlock.setAttribute('type', 'java_static_attr_set');
    setBlock.setAttribute('gap', '8');
    setBlock.appendChild(varField(variable));
    xmlList.push(setBlock);

    const getBlock = Blockly.utils.xml.createElement('block');
    getBlock.setAttribute('type', 'java_static_attr_get');
    getBlock.setAttribute('gap', '24');
    getBlock.appendChild(varField(variable));
    xmlList.push(getBlock);
  }

  return xmlList;
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined flyout: Attribute + Stat. Attribute + Lok. Variablen in one panel
// ─────────────────────────────────────────────────────────────────────────────
export function allVariablesFlyoutCategory(workspace) {
  function sectionLabel(text) {
    const lbl = Blockly.utils.xml.createElement('label');
    lbl.setAttribute('text', text);
    lbl.setAttribute('gap', '8');
    return lbl;
  }

  return [
    sectionLabel('Lokale Variablen (nur in einer Methode)'),
    ...localVarFlyoutCategory(workspace),
    sectionLabel('Instanz-Attribute (gleich pro Objekt)'),
    ...normalAttrFlyoutCategory(workspace),
    sectionLabel('Klassen-Attribute (gleich pro Klasse)'),
    ...staticAttrFlyoutCategory(workspace),
  ];
}

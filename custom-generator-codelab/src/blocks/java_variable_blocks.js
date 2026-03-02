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
// Read-only FieldVariable for method parameters:
// Shows the variable dropdown but omits "Rename" and "Delete" entries so that
// parameters can only be managed via the method declaration block's mutator.
// ─────────────────────────────────────────────────────────────────────────────
class ParamFieldVariable extends Blockly.FieldVariable {
  getOptions(opt_useCache) {
    const options = super.getOptions(opt_useCache);
    // 'RENAME_VARIABLE_ID' / 'DELETE_VARIABLE_ID' are the constant string
    // values Blockly uses as the second element of the rename/delete menu items.
    return options.filter(
      ([, value]) => value !== 'RENAME_VARIABLE_ID' && value !== 'DELETE_VARIABLE_ID'
    );
  }
}

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
        new ParamFieldVariable('param', null, [VAR_TYPE_PARAM], VAR_TYPE_PARAM),
        'VAR');
    this.setOutput(true, null);
    this.setColour(PARAM_COLOUR);
    this.setTooltip('Liest einen Methodenparameter. Umbenennen nur über den Methodenkopf möglich.');
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
// Helper: show a small popup dialog with "Rename" / "Delete" choices.
// ─────────────────────────────────────────────────────────────────────────────
function _showVarManageDialog(workspace, varId) {
  const v = workspace.getVariableById(varId);
  if (!v) return;

  // Remove any existing dialog first.
  const existing = document.getElementById('b2j-var-manage-dialog');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'b2j-var-manage-dialog';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0', zIndex: '9999',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.45)',
  });

  const box = document.createElement('div');
  Object.assign(box.style, {
    background: '#2d2d2d', color: '#ddd', border: '1px solid #666',
    borderRadius: '6px', padding: '16px 20px', minWidth: '220px',
    fontFamily: 'Roboto, sans-serif', fontSize: '13px',
    display: 'flex', flexDirection: 'column', gap: '10px',
  });

  const title = document.createElement('div');
  title.textContent = 'Variable: ' + v.name;
  Object.assign(title.style, { fontWeight: 'bold', marginBottom: '4px' });
  box.appendChild(title);

  const btnRow = document.createElement('div');
  Object.assign(btnRow.style, { display: 'flex', gap: '8px' });

  function makeBtn(label, color, action) {
    const btn = document.createElement('button');
    btn.textContent = label;
    Object.assign(btn.style, {
      flex: '1', padding: '6px 10px', border: '1px solid #666',
      borderRadius: '4px', background: color, color: '#fff',
      cursor: 'pointer', fontSize: '13px',
    });
    btn.onclick = () => { overlay.remove(); action(); };
    return btn;
  }

  btnRow.appendChild(makeBtn('📝      Umbenennen', '#555', () => {
    const current = workspace.getVariableById(varId);
    if (!current) return;
    const newName = prompt('Neue Variable umbenennen:', current.name);
    if (newName && newName.trim() && newName.trim() !== current.name) {
      workspace.renameVariableById(varId, newName.trim());
    }
  }));
  btnRow.appendChild(makeBtn('🚮  Löschen', '#7a2020', () => {
    const current = workspace.getVariableById(varId);
    if (!current) return;
    if (confirm('Variable "' + current.name + '" wirklich löschen?')) {
      workspace.deleteVariableById(varId);
    }
  }));

  box.appendChild(btnRow);
  overlay.appendChild(box);
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  document.body.appendChild(overlay);
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper: register a single manage-button callback for one variable entry.
// Uses index-based keys so variable IDs with special chars cause no issues.
// Re-registered on every flyout refresh.
// ─────────────────────────────────────────────────────────────────────────────
function _registerManage(workspace, prefix, idx, varId) {
  workspace.registerButtonCallback('MANAGE_' + prefix + '_' + idx, () => {
    _showVarManageDialog(workspace, varId);
  });
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
  button.setAttribute('web-class', 'b2j-btn-normal-attr');
  xmlList.push(button);

  const variables = workspace.getVariablesOfType(VAR_TYPE_NORMAL);
  for (let idx = 0; idx < variables.length; idx++) {
    const variable = variables[idx];
    const id = variable.getId();
    _registerManage(workspace, 'NORMAL', idx, id);

    // Only show setter/getter blocks for the first variable.
    if (idx === 0) {
      const setBlock = Blockly.utils.xml.createElement('block');
      setBlock.setAttribute('type', 'java_normal_attr_set');
      setBlock.setAttribute('gap', '8');
      setBlock.appendChild(varField(variable));
      xmlList.push(setBlock);

      const getBlock = Blockly.utils.xml.createElement('block');
      getBlock.setAttribute('type', 'java_normal_attr_get');
      getBlock.setAttribute('gap', '8');
      getBlock.appendChild(varField(variable));
      xmlList.push(getBlock);
    }

    const manageBtn = Blockly.utils.xml.createElement('button');
    manageBtn.setAttribute('text', '📝     ' + variable.name);
    manageBtn.setAttribute('callbackKey', 'MANAGE_NORMAL_' + idx);
    manageBtn.setAttribute('web-class', 'b2j-btn-normal-attr');
    manageBtn.setAttribute('gap', '0');
    xmlList.push(manageBtn);
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
  button.setAttribute('web-class', 'b2j-btn-local-var');
  xmlList.push(button);

  const variables = workspace.getVariablesOfType(VAR_TYPE_LOCAL);
  for (let idx = 0; idx < variables.length; idx++) {
    const variable = variables[idx];
    const id = variable.getId();
    _registerManage(workspace, 'LOCAL', idx, id);

    // Only show setter/getter blocks for the first variable.
    if (idx === 0) {
      const setBlock = Blockly.utils.xml.createElement('block');
      setBlock.setAttribute('type', 'java_local_var_set');
      setBlock.setAttribute('gap', '8');
      setBlock.appendChild(varField(variable));
      xmlList.push(setBlock);

      const getBlock = Blockly.utils.xml.createElement('block');
      getBlock.setAttribute('type', 'java_local_var_get');
      getBlock.setAttribute('gap', '8');
      getBlock.appendChild(varField(variable));
      xmlList.push(getBlock);
    }

    const manageBtn = Blockly.utils.xml.createElement('button');
    manageBtn.setAttribute('text', '📝     ' + variable.name);
    manageBtn.setAttribute('callbackKey', 'MANAGE_LOCAL_' + idx);
    manageBtn.setAttribute('web-class', 'b2j-btn-local-var');
    manageBtn.setAttribute('gap', '4');
    xmlList.push(manageBtn);
  }

  return xmlList;
}

export function staticAttrFlyoutCategory(workspace) {
  const xmlList = [];

  const button = Blockly.utils.xml.createElement('button');
  button.setAttribute('text', 'Neues Klassen-Attribut');
  button.setAttribute('callbackKey', 'CREATE_JAVA_STATIC_ATTR');
  button.setAttribute('web-class', 'b2j-btn-static-attr');
  xmlList.push(button);

  const variables = workspace.getVariablesOfType(VAR_TYPE_STATIC);
  for (let idx = 0; idx < variables.length; idx++) {
    const variable = variables[idx];
    const id = variable.getId();
    _registerManage(workspace, 'STATIC', idx, id);

    // Only show setter/getter blocks for the first variable.
    if (idx === 0) {
      const setBlock = Blockly.utils.xml.createElement('block');
      setBlock.setAttribute('type', 'java_static_attr_set');
      setBlock.setAttribute('gap', '8');
      setBlock.appendChild(varField(variable));
      xmlList.push(setBlock);

      const getBlock = Blockly.utils.xml.createElement('block');
      getBlock.setAttribute('type', 'java_static_attr_get');
      getBlock.setAttribute('gap', '8');
      getBlock.appendChild(varField(variable));
      xmlList.push(getBlock);
    }

    const manageBtn = Blockly.utils.xml.createElement('button');
    manageBtn.setAttribute('text', '📝     ' + variable.name);
    manageBtn.setAttribute('callbackKey', 'MANAGE_STATIC_' + idx);
    manageBtn.setAttribute('web-class', 'b2j-btn-static-attr');
    manageBtn.setAttribute('gap', '4');
    xmlList.push(manageBtn);
  }

  return xmlList;
}

// ─────────────────────────────────────────────────────────────────────────────
// Combined flyout: Attribute + Stat. Attribute + Lok. Variablen in one panel
// ─────────────────────────────────────────────────────────────────────────────
export function allVariablesFlyoutCategory(workspace) {
  function sectionLabel(text, gap = '8') {
    const lbl = Blockly.utils.xml.createElement('label');
    lbl.setAttribute('text', text);
    lbl.setAttribute('gap', gap);
    return lbl;
  }

  return [
    sectionLabel('Lokale Variable'),
    ...localVarFlyoutCategory(workspace),
    sectionLabel('Instanz-Attribute'),
    sectionLabel('(1 Wert pro Objekt)'),
    ...normalAttrFlyoutCategory(workspace),
    sectionLabel('Klassen-Attribute'),
    sectionLabel('(1 Wert pro Klasse)'),
    ...staticAttrFlyoutCategory(workspace),
  ];
}

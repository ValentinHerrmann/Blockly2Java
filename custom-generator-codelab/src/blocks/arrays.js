import * as Blockly from 'blockly/core';
import LocalStorageManager from '../utils/LocalStorageManager';

Blockly.Blocks['lists_repeat'] = {
  init: function() {
    const dropdown = new Blockly.FieldDropdown(() => this.getTypeOptions_());
    this.appendDummyInput()
        .appendField(Blockly.Msg["LISTS_REPEAT_TITLE_TYPE"] || 'erzeuge Array vom Typ')
        .appendField(dropdown, 'TYPE')
        .appendField(Blockly.Msg["LISTS_REPEAT_TITLE_LENGTH"] || 'mit Länge');
    this.appendValueInput('NUM')
        .setCheck('Number');
    this.setInputsInline(true);
    this.setOutput(true, 'Array');
    this.setStyle('list_blocks');
    this.setTooltip(Blockly.Msg["LISTS_REPEAT_TOOLTIP"] || 'Erzeugt ein Array mit der angegebenen Länge ohne Werte.');
  },
  getTypeOptions_: function() {
    const options = [];
    try {
      const allCtrs = LocalStorageManager.getAllConstructors();
      if (allCtrs) {
        for (const name of Object.keys(allCtrs)) {
          if (name && !options.some(opt => opt[1] === name)) {
            options.push([name, name]);
          }
        }
      }
    } catch (e) {
      // Ignored for environments without storage
    }

    const defaultTypes = [
      ['int', 'int'],
      ['double', 'double'],
      ['boolean', 'boolean'],
      ['String', 'String'],
      ['Actor', 'Actor'],
      ['Shape', 'Shape'],
      ['Circle', 'Circle'],
      ['Ellipse', 'Ellipse'],
      ['Rectangle', 'Rectangle'],
      ['RoundedRectangle', 'RoundedRectangle'],
      ['Triangle', 'Triangle'],
      ['Line', 'Line'],
      ['Text', 'Text'],
      ['Turtle', 'Turtle'],
      ['Group', 'Group'],
      ['Bitmap', 'Bitmap'],
      ['Polygon', 'Polygon']
    ];

    for (const opt of defaultTypes) {
      if (!options.some(existing => existing[1] === opt[1])) {
        options.push(opt);
      }
    }
    return options;
  },
  saveExtraState: function() {
    return { typeValue: this.getFieldValue('TYPE') };
  },
  loadExtraState: function(state) {
    const val = state?.typeValue;
    if (val) {
      const field = this.getField('TYPE');
      if (field) {
        const origGet = field.getOptions.bind(field);
        field.getOptions = () => {
          const opts = origGet();
          if (!opts.some(([, v]) => v === val)) {
            opts.push([val, val]);
          }
          return opts;
        };
        field.setValue(val);
        field.getOptions = origGet;
      }
    }
  }
};

// Override lists_length to look like: array . Länge
Blockly.Blocks['lists_length'] = {
  init: function() {
    this.appendValueInput('VALUE')
        .setCheck('Array');
    this.appendDummyInput()
        .appendField('. Länge');
    this.setInputsInline(true);
    this.setOutput(true, 'Number');
    this.setStyle('list_blocks');
    this.setTooltip(Blockly.Msg["LISTS_LENGTH_TOOLTIP"] || 'Die Anzahl von Elementen im Array.');
  }
};

// Override lists_isEmpty to look like: array . ist leer
Blockly.Blocks['lists_isEmpty'] = {
  init: function() {
    this.appendValueInput('VALUE')
        .setCheck('Array');
    this.appendDummyInput()
        .appendField('. ist leer');
    this.setInputsInline(true);
    this.setOutput(true, 'Boolean');
    this.setStyle('list_blocks');
    this.setTooltip(Blockly.Msg["LISTS_ISEMPTY_TOOLTIP"] || 'Ist wahr, falls das Array leer ist.');
  }
};

// Override lists_getIndex to look like: array . an Stelle [ index ]
Blockly.Blocks['lists_getIndex'] = {
  init: function() {
    this.appendValueInput('VALUE')
        .setCheck('Array');
    this.appendValueInput('AT')
        .setCheck('Number')
        .appendField('. an Stelle');
    this.setInputsInline(true);
    this.setOutput(true);
    this.setStyle('list_blocks');
    this.setTooltip(Blockly.Msg["LISTS_GET_INDEX_TOOLTIP_GET_FROM"] || 'Extrahiert das Element an der angegebenen Position im Array.');
  }
};

// Override lists_setIndex to look like: array . an Stelle [ index ] auf [ value ] setzen
Blockly.Blocks['lists_setIndex'] = {
  init: function() {
    this.appendValueInput('LIST')
        .setCheck('Array');
    this.appendValueInput('AT')
        .setCheck('Number')
        .appendField('. an Stelle');
    this.appendValueInput('TO')
        .appendField('auf');
    this.appendDummyInput()
        .appendField('setzen');
    this.setInputsInline(true);
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle('list_blocks');
    this.setTooltip(Blockly.Msg["LISTS_SET_INDEX_TOOLTIP_SET_FROM"] || 'Setzt das Element an der angegebenen Position im Array.');
  }
};


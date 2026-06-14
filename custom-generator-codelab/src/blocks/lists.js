import * as Blockly from 'blockly/core';
import LocalStorageManager from '../utils/LocalStorageManager';

// Define aliases for standard list blocks under the new list_ namespace
Blockly.Blocks['list_create_with'] = Blockly.Blocks['lists_create_with'];
Blockly.Blocks['list_length'] = Blockly.Blocks['lists_length'];
Blockly.Blocks['list_isEmpty'] = Blockly.Blocks['lists_isEmpty'];
Blockly.Blocks['list_indexOf'] = Blockly.Blocks['lists_indexOf'];
Blockly.Blocks['list_getIndex'] = Blockly.Blocks['lists_getIndex'];
Blockly.Blocks['list_setIndex'] = Blockly.Blocks['lists_setIndex'];
Blockly.Blocks['list_getSublist'] = Blockly.Blocks['lists_getSublist'];
Blockly.Blocks['list_split'] = Blockly.Blocks['lists_split'];
Blockly.Blocks['list_sort'] = Blockly.Blocks['lists_sort'];
Blockly.Blocks['list_reverse'] = Blockly.Blocks['lists_reverse'];

Blockly.Blocks['list_repeat'] = {
  init: function() {
    const dropdown = new Blockly.FieldDropdown(() => this.getTypeOptions_());
    const dimDropdown = new Blockly.FieldDropdown(() => [
      ['[ ]', '[]'],
      ['[ ][ ] (2 dimensional)', '[][]']
    ]);
    this.appendDummyInput()
        .appendField(Blockly.Msg["LIST_REPEAT_TITLE_TYPE"] || 'erzeuge Liste vom Typ')
        .appendField(dropdown, 'TYPE')
        .appendField(' ')
        .appendField(dimDropdown, 'DIM')
        .appendField(Blockly.Msg["LIST_REPEAT_TITLE_LENGTH"] || 'mit Länge');
    this.appendValueInput('NUM')
        .setCheck('Number');
    this.setOutput(true, 'List');
    this.setStyle('list_blocks');
    this.setTooltip(Blockly.Msg["LIST_REPEAT_TOOLTIP"] || 'Erzeugt eine Liste mit der angegebenen Länge ohne Werte.');
  },
  getTypeOptions_: function() {
    const baseTypes = [];
    try {
      const allCtrs = LocalStorageManager.getAllConstructors();
      if (allCtrs) {
        for (const name of Object.keys(allCtrs)) {
          if (name && !baseTypes.includes(name)) {
            baseTypes.push(name);
          }
        }
      }
    } catch (e) {
      // Ignored for environments without storage
    }

    const defaultTypes = [
      'int', 'double', 'boolean', 'String', 'Actor', 'Shape', 'FilledShape', 'Circle',
      'Ellipse', 'Rectangle', 'RoundedRectangle', 'Triangle', 'Line',
      'Text', 'Turtle', 'Group', 'Bitmap', 'Polygon'
    ];

    for (const type of defaultTypes) {
      if (!baseTypes.includes(type)) {
        baseTypes.push(type);
      }
    }

    const options = [];
    for (const type of baseTypes) {
      options.push([type, type]);
    }
    return options;
  },
  saveExtraState: function() {
    return {
      typeValue: this.getFieldValue('TYPE'),
      dimValue: this.getFieldValue('DIM')
    };
  },
  loadExtraState: function(state) {
    let val = state?.typeValue;
    let dimVal = state?.dimValue;
    if (val) {
      if (!dimVal) {
        // backward compatibility for when TYPE was e.g. "int[]" or "int[][]"
        if (val.endsWith('[][]')) {
          dimVal = '[][]';
          val = val.slice(0, -4);
        } else if (val.endsWith('[]')) {
          dimVal = '[]';
          val = val.slice(0, -2);
        } else {
          dimVal = '[]';
        }
      }
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
    if (dimVal) {
      const dimField = this.getField('DIM');
      if (dimField) {
        dimField.setValue(dimVal);
      }
    }
  }
};

import * as Blockly from 'blockly/core';

Blockly.Blocks['text_println'] = {
  init: function () {
    this.jsonInit({
      message0: 'println %1',
      args0: [{type: 'input_value', name: 'TEXT'}],
      previousStatement: null,
      nextStatement: null,
      style: 'text_blocks',
      tooltip: 'Gibt den Text mit einem Zeilenumbruch am Ende aus (System.out.println).',
      helpUrl: '',
    });
  },
};

import * as Blockly from 'blockly/core';
import 'blockly/blocks.js';
import deLocale from 'blockly/msg/de.js';
Blockly.setLocale(deLocale);

const workspace = new Blockly.Workspace();
const block = workspace.newBlock('lists_getIndex');
const label = new Blockly.FieldLabel('nimm', null, { name: 'MODE' });
console.log("label name:", label.name);
// Add label to dummy input
block.appendDummyInput('DUMMY_LABEL').appendField(label, 'MODE');
console.log("getFieldValue('MODE'):", block.getFieldValue('MODE'));
workspace.dispose();

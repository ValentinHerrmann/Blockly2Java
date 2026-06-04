import * as Blockly from 'blockly/core';
import 'blockly/blocks.js';

console.log("Blockly.FieldLabel:", !!Blockly.FieldLabel);
console.log("Blockly.FieldLabel constructor:", Blockly.FieldLabel ? Blockly.FieldLabel.toString().substring(0, 100) : "null");

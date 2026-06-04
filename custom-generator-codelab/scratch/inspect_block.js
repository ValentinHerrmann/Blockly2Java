import * as Blockly from 'blockly/core';
import 'blockly/blocks.js';

console.log("lists_getIndex init:", Blockly.Blocks['lists_getIndex'].init.toString());
console.log("lists_getIndex keys:", Object.keys(Blockly.Blocks['lists_getIndex']));
if (Blockly.Blocks['lists_getIndex'].mixin) {
  console.log("lists_getIndex mixin keys:", Object.keys(Blockly.Blocks['lists_getIndex'].mixin));
}

/**
 * Custom override for the repeat block to expose the iteration variable
 * as a selectable `FieldVariable` of type 'local'. This makes the loop
 * counter accessible to `java_local_var_get` blocks.
 */
import * as Blockly from 'blockly/core';

Blockly.Blocks['controls_repeat_ext'] = {
  init: function() {
    // Generate a unique default name for the loop counter variable in this workspace.
    const workspace = this.workspace || null;
    let defaultName = 'i';
    if (workspace && Blockly.Variables && typeof Blockly.Variables.generateUniqueName === 'function') {
      defaultName = Blockly.Variables.generateUniqueName(workspace);
    }

    this.appendDummyInput()
        .appendField('repeat')
        .appendField(new Blockly.FieldVariable(defaultName, null, ['local'], 'local'), 'VAR');
    this.appendValueInput('TIMES')
        .setCheck('Number');
    this.appendDummyInput()
        .appendField('times');
    this.appendStatementInput('DO')
        .setCheck(null);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(120);
    this.setTooltip('Repeat n times. Iteration variable is a local variable.');
  }
};

// Also expose short name alias to preserve existing references
Blockly.Blocks['controls_repeat'] = Blockly.Blocks['controls_repeat_ext'];

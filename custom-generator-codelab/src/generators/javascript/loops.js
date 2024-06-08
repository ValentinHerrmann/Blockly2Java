/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating JavaScript for loop blocks.
 */

// Former goog.module ID: Blockly.JavaScript.loops

import * as Blockly from 'blockly/core';
// import * as stringUtils from 'blockly/core/utils/string.js';
// import {NameType} from 'blockly/core/names.js';
import {Order, TYPES} from './javascript_generator.js';


export function controls_repeat_ext(block, generator) {
  // Wiederhole n-mal.
  let repeats;
  if (block.getField('TIMES')) {
    // Interne Zahl.
    repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // Externe Zahl.
    repeats =
        generator.valueToCode(block, 'TIMES', Order.ASSIGNMENT) ||
        '0';
  }
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code = '';
  const loopVar =
      generator.nameDB_.getDistinctName('count', Blockly.Names.NameType.VARIABLE);
  let endVar = repeats;
  if (!repeats.match(/^\w+$/) && !Blockly.utils.string.isNumber(repeats)) {
    endVar =
        generator.nameDB_.getDistinctName(
            'repeat_end', Blockly.Names.NameType.VARIABLE);
    code += 'int ' + endVar + ' = ' + repeats + ';\n';
  }
  code += '\nfor (int ' + loopVar + ' = 0; ' + loopVar + ' < ' + endVar + '; ' +
      loopVar + '++) {\n' + branch + '}\n';
  return code;
};

export const controls_repeat = controls_repeat_ext;

export function controls_whileUntil(block, generator) {
  // Do while/until loop in Java.
  const until = block.getFieldValue('MODE') === 'UNTIL';
  let argument0 =
      generator.valueToCode(
          block, 'BOOL',
          until ? Order.LOGICAL_NOT : Order.NONE) ||
      'false';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  if (until) {
    argument0 = '!' + argument0;
  }
  return '\nwhile (' + argument0 + ') {\n' + branch + '}\n';
};

export function controls_for(block, generator) {
  // For loop in Java.
  const variable0 =
      generator.getVariableName(block.getFieldValue('VAR'));
  // console.log("ForType: " + block.getField('VAR').type);
  const argument0 =
      generator.valueToCode(block, 'FROM', Order.ASSIGNMENT) || '0';
  const argument1 =
      generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || '0';
  const increment =
      generator.valueToCode(block, 'BY', Order.ASSIGNMENT) || '1';
  // argument0.includes(".") || increment.includes(".") ? generator.getName(block.getFieldValue('VAR'), ) : generator.getName(block.getFieldValue('VAR'), TYPES.INTEGER);
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code;


  const up = Number(argument0) <= Number(argument1);
  code = 'for (int ' + variable0 + ' = ' + argument0 + '; ' + variable0 +
      (up ? ' < ' : ' > ') + argument1 + '; ' + variable0;

  var inc = '';
  const step = Number(increment); //Math.abs(Number(increment));
  if (step === 1) { inc += '++'; } 
  else if (step === -1) { inc += '--'; } 
  else if (!Blockly.utils.string.isNumber(increment)) { 
    inc += ' += ' + increment; } 
  else {
    inc += (step < 0 ? ' -= ' : ' += ') + Math.abs(step);
  }

  if (Blockly.utils.string.isNumber(argument0) && Blockly.utils.string.isNumber(argument1)) 
  {    
    code += inc;
    code += ') {\n' + branch + '}\n';
  } 
  else 
  {
    code = '';
    // Cache non-trivial values to variables to prevent repeated look-ups.
    let startVar = argument0;
    if (!argument0.match(/^\w+$/) && !Blockly.utils.string.isNumber(argument0)) {
      startVar = generator.nameDB_.getDistinctName(
          variable0 + '_start', Blockly.Names.NameType.VARIABLE);
      code += 'int ' + startVar + ' = ' + argument0 + ';\n';
    }
    let endVar = argument1;
    if (!argument1.match(/^\w+$/) && !Blockly.utils.string.isNumber(argument1)) {
      endVar = generator.nameDB_.getDistinctName(
          variable0 + '_end', Blockly.Names.NameType.VARIABLE);
      code += 'int ' + endVar + ' = ' + argument1 + ';\n';
    }
    // Determine loop direction at start, in case one of the bounds
    // changes during loop execution.
    const incVar = generator.nameDB_.getDistinctName(
        variable0 + '_inc', Blockly.Names.NameType.VARIABLE);

    var comparison = ' != ';
    if(Blockly.utils.string.isNumber(increment))
      {
        comparison = Number(increment) < 0 ? ' > ' : ' < '
      }
        
    const cast = Blockly.utils.string.isNumber(startVar) ? '' : '(int)';
    code += 
    'for (int ' + variable0 + ' = ' + cast + startVar + '; ' + 
        variable0 + comparison + endVar + '; ' + 
        variable0 + inc + ') {\n' +
        branch + '}\n';
  }
  return code;
};

export function controls_forEach(block, generator) {
  // For each loop in Java.
  const variable0 =
      generator.getVariableName(block.getFieldValue('VAR'));
  const argument0 =
      generator.valueToCode(block, 'LIST', Order.ASSIGNMENT) ||
      '[]';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code = '';
  // Cache non-trivial values to variables to prevent repeated look-ups.
  let listVar = argument0;
  if (!argument0.match(/^\w+$/)) {
    listVar = generator.nameDB_.getDistinctName(
        variable0 + '_list', Blockly.Names.NameType.VARIABLE);
    code += 'List<Object> ' + listVar + ' = ' + argument0 + ';\n';
  }
  const indexVar = generator.nameDB_.getDistinctName(
      variable0 + '_index', Blockly.Names.NameType.VARIABLE);
  code += '\nfor (Object ' + variable0 + ' : ' + listVar + ') {\n' +
      branch + '}\n';
  return code;
};

export function controls_flow_statements(block, generator) {
  // Flow statements: continue, break in Java.
  let xfix = '';
  if (generator.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    xfix += generator.injectId(
        generator.STATEMENT_PREFIX, block);
  }
  if (generator.STATEMENT_SUFFIX) {
    // Inject any statement suffix here since the regular one at the end
    // will not get executed if the break/continue is triggered.
    xfix += generator.injectId(
        generator.STATEMENT_SUFFIX, block);
  }
  if (generator.STATEMENT_PREFIX) {
    const loop = block.getSurroundLoop();
    if (loop && !loop.suppressPrefixSuffix) {
      // Inject loop's statement prefix here since the regular one at the end
      // of the loop will not get executed if 'continue' is triggered.
      // In the case of 'break', a prefix is needed due to the loop's suffix.
      xfix += generator.injectId(
          generator.STATEMENT_PREFIX, loop);
    }
  }
  switch (block.getFieldValue('FLOW')) {
    case 'BREAK':
      return xfix + 'break;\n';
    case 'CONTINUE':
      return xfix + 'continue;\n';
  }
  throw Error('Unknown flow statement.');
};

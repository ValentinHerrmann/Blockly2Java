/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating JavaScript for variable blocks.
 */

// Former goog.module ID: Blockly.JavaScript.variables

import {Order,adjustStaticName} from './javascript_generator.js';


export function variables_get(block, generator) {
  // Variable getter.
  const code = adjustStaticName(generator.getVariableName(block.getFieldValue('VAR')));
  // console.log("variables_get: " + code);
  return [code, Order.ATOMIC];
};

export function variables_set(block, generator) {
  // Variable setter.
  //console.log("variables_set: "+ block);
  const argument0 = generator.valueToCode(
                        block, 'VALUE', Order.ASSIGNMENT) || '';
  //console.log("argument0: "+ argument0);                        
  const varName = adjustStaticName(generator.getVariableName(block.getFieldValue('VAR')));
  //console.log("varName: "+ varName);       
  if(argument0 === '')
    {
      return '// ' + varName + ' = ' + argument0 + ';    // Wert fehlt\n';
    }
  // console.log("variables_set: " + varName + ' = ' + argument0 + ';\n');
  return varName + ' = ' + argument0 + ';\n';
};

/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating JavaScript for procedure blocks.
 */

// Former goog.module ID: Blockly.JavaScript.procedures

import { javascriptGenerator } from 'blockly/javascript.js';
import {getType, getVariableType, Order, getClassName, TYPES} from './javascript_generator.js';
import * as Blockly from "blockly";

export function defconstructor(block, generator) {
    console.log("\n\nTRANSLATING DEF CONSTUCTUR");
  const funcName = getClassName(); //generator.getProcedureName(block.getFieldValue('NAME'));
  let xfix1 = '';
  console.log(generator.STATEMENT_PREFIX);
  if (generator.STATEMENT_PREFIX) {
    xfix1 += generator.injectId(
        generator.STATEMENT_PREFIX, block);
  }
  if (generator.STATEMENT_SUFFIX) {
    xfix1 += generator.injectId(
        generator.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = generator.prefixLines(xfix1, generator.INDENT);
  }
  let loopTrap = '';
  if (generator.INFINITE_LOOP_TRAP) {
    loopTrap = generator.prefixLines(
        generator.injectId(
          generator.INFINITE_LOOP_TRAP, block),
        generator.INDENT);
  }
  console.log("Loop Trap: " + loopTrap);
  console.log("Statement to Code: " + generator.statementToCode(block, 'STACK'));
  console.log("Block: " + block);
  

  const branch = generator.statementToCode(block, 'STACK');

  let xfix2 = '';
  const ws = Blockly.getMainWorkspace();

  const args = [];
  //const variables = block.getVars();
  const variables = block.arguments_;
  console.log("Variables: " + variables);

  if(variables !== null) {
    let vars = block.getVarModels();
    let paramTypes = [];
    for(let j = 0; j < vars.length; j++)
    {
      paramTypes[j] = getVariableType(ws, vars[j].getId(), true);
      if(paramTypes[j] === 'var')
      {
        paramTypes[j] = 'Object';
      }
    }
    for (let i = 0; i < variables.length; i++) {
      args[i] = paramTypes[i] + ' ' + variables[i];
    }
  }
  console.log("Arguments: " + args);

  let code = 'public ' + funcName + '(' + args.join(', ') + ') {\n' + xfix1 +
      loopTrap + branch + xfix2 + '}';
  code = generator.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  generator.definitions_['%' + funcName] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
//export const procedures_defnoreturn = procedures_defreturn;

export function callconstructor(block, generator) {
  console.log("\n\nTRANSLATING CALL CONSTUCTUR");
  const funcName = getClassName(); //generator.getProcedureName(block.getFieldValue('NAME'));
  console.log("Function Name: " + funcName);
  const args = [];
  const variables = block.getVars();
  console.log("Variables: " + variables);
  for (let i = 0; i < variables.length; i++) {
    args[i] = generator.valueToCode(block, 'ARG' + i, Order.NONE) ||
        'null';
  }
  const code = funcName + '(' + args.join(', ') + ')';
  return [code, Order.FUNCTION_CALL];
};
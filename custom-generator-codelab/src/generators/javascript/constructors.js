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
import LocalStorageManager from '../../utils/LocalStorageManager.js';





export function defconstructor(block, generator) {
  const className = getClassName();
  LocalStorageManager.storeCtrs_thisClass(className, block);
  let xfix1 = '';
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
  

  const branch = generator.statementToCode(block, 'STACK');

  let xfix2 = '';
  const ws = Blockly.getMainWorkspace();

  const args = [];
  const variables = block.arguments_;

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
    console.log("variables: " + variables);
    for (let i = 0; i < variables.length; i++) {
      args[i] = paramTypes[i] + ' ' + variables[i];
    }
  }

  let code = 'public ' + className + '(' + args.join(', ') + ') {\n' + xfix1 +
      loopTrap + branch + xfix2 + '}';
  code = generator.scrub_(block, code);
  // Add % so as not to collide with helper functions in definitions list.
  generator.definitions_['%' + className] = code;
  return null;
};

// Defining a procedure without a return value uses the same generator as
// a procedure with a return value.
//export const procedures_defnoreturn = procedures_defreturn;

export function callconstructor(block, generator) {
  console.log("\n\nTRANSLATING CALL CONSTUCTUR");
  const funcName = getClassName();
  const args = [];
  console.log(block);
  const variables = block.childBlocks_;
  console.log("Variables: "+variables);

  for (let inputNr = 1; inputNr < block.inputList.length; inputNr++) {
      if(block.inputList[inputNr].connection != null) {
        let inputBlock = block.inputList[inputNr].connection.targetBlock();
        console.log("Input block: "+inputBlock);
        let paramId = block.inputList[inputNr].name
        console.log("ParamId: "+paramId);
        if(inputBlock != null) {
          let val = generator.valueToCode(block, paramId, Order.NONE);
          console.log("Value: "+val);
          args[inputNr-1] = val;
        }
        else {
          args[inputNr-1] = 'null';
        }
      }
    }
    console.log("Args: "+args);

  const code = 'new ' + funcName + '(' + args.join(', ') + ')';
  return [code, Order.FUNCTION_CALL];
};
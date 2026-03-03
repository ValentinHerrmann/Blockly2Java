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
import {getType, getVariableType, Order, getClassName, setExtendsClass, TYPES} from './javascript_generator.js';
import * as Blockly from "blockly";
import LocalStorageManager from '../../utils/LocalStorageManager.js';





export function defconstructor(block, generator) {
  const className = getClassName();
  LocalStorageManager.storeConstructors(className, block);

  // Reset per-method local-variable tracking so the first use inside every
  // constructor is always emitted as a declaration, not a plain assignment.
  generator.declaredLocalVarIds_ = new Set();

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
  // Read the selected constructor from the dropdown field.
  // Value format: "ClassName:::arg1,arg2" or "NONE".
  const dropdownValue = block.getFieldValue('CONSTRUCTOR_CLASS') || 'NONE';
  const sepIdx = dropdownValue.indexOf(':::');
  const funcName = sepIdx >= 0 ? dropdownValue.slice(0, sepIdx) : getClassName();

  const args = [];
  // inputList[0] is the TOP_LINE dummy input; argument inputs start at index 1.
  for (let inputNr = 1; inputNr < block.inputList.length; inputNr++) {
    if (block.inputList[inputNr].connection != null) {
      const paramId = block.inputList[inputNr].name;
      const inputBlock = block.inputList[inputNr].connection.targetBlock();
      if (inputBlock != null) {
        args[inputNr - 1] = generator.valueToCode(block, paramId, Order.NONE);
      } else {
        args[inputNr - 1] = 'null';
      }
    }
  }

  const code = 'new ' + funcName + '(' + args.join(', ') + ')';
  return [code, Order.FUNCTION_CALL];
};

// ── java_extends – inheritance declaration ────────────────────────────────
export function java_extends(block, generator) {
  const parentClass = block.getFieldValue('PARENT_CLASS');
  if (parentClass && parentClass !== 'NONE') {
    setExtendsClass(parentClass);
  }
  return null;
};

// ── java_super_call – super-constructor call ──────────────────────────────
export function java_super_call(block, generator) {
  const args = [];
  const argNames = block.argNames_ || [];
  for (let i = 0; i < argNames.length; i++) {
    const inp = block.getInput('ARG' + i);
    if (inp && inp.connection && inp.connection.targetBlock()) {
      args.push(generator.valueToCode(block, 'ARG' + i, Order.NONE) || 'null');
    } else {
      args.push('null');
    }
  }
  return 'super(' + args.join(', ') + ');\n';
};
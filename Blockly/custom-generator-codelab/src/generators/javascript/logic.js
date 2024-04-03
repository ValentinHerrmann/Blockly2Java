/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating JavaScript for logic blocks.
 */

// Former goog.module ID: Blockly.JavaScript.logic

import {Order} from './javascript_generator.js';


export function controls_if(block, generator) {
  // If/elseif/else condition in Java.
  let n = 0;
  let code = '';
  if (generator.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block. Add manually.
    code += generator.injectId(generator.STATEMENT_PREFIX, block);
  }

  const indent = generator.INDENT; // Define indentation
  do {
    const conditionCode =
        generator.valueToCode(block, 'IF' + n, Order.NONE) || 'false';
    let branchCode = generator.statementToCode(block, 'DO' + n);
    if (generator.STATEMENT_SUFFIX) {
      branchCode = generator.prefixLines(
          generator.injectId(generator.STATEMENT_SUFFIX, block),
          indent
      ) + branchCode;
    }
    code += (n > 0 ? '\nelse ' : '\n') + 'if (' + conditionCode + ') {\n' +
        branchCode + '}';
    n++;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE') || generator.STATEMENT_SUFFIX) {
    let branchCode = generator.statementToCode(block, 'ELSE');
    if (generator.STATEMENT_SUFFIX) {
      branchCode = generator.prefixLines(
          generator.injectId(generator.STATEMENT_SUFFIX, block),
          indent
      ) + branchCode;
    }
    code += '\nelse {\n' + branchCode + '}';
  }
  return code + '\n';
};

export const controls_ifelse = controls_if;

export function logic_compare(block, generator) {
  // Vergleichsoperator in Java.
  const OPERATORS = {
    'EQ': "==",
    'NEQ': "!=",
    'LT': "<",
    'LTE': "<=",
    'GT': ">",
    'GTE': ">="
  };
  const operator = OPERATORS[block.getFieldValue('OP')];
  const order = (operator === "==" || operator === "!=") ?
      Order.EQUALITY :
      Order.RELATIONAL;
  const argument0 = generator.valueToCode(block, 'A', order) || "0";
  const argument1 = generator.valueToCode(block, 'B', order) || "0";
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

export function logic_operation(block, generator) {
  // Operationen 'und' und 'oder' in Java.
  const operator = (block.getFieldValue('OP') === 'AND') ? '&&' : '||';
  const order = (operator === '&&') ? Order.LOGICAL_AND : Order.LOGICAL_OR;
  let argument0 = generator.valueToCode(block, 'A', order);
  let argument1 = generator.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // Wenn keine Argumente vorhanden sind, ist der Rückgabewert falsch.
    argument0 = 'false';
    argument1 = 'false';
  } else {
    // Fehlende einzelne Argumente haben keinen Einfluss auf den Rückgabewert.
    const defaultArgument = (operator === '&&') ? 'true' : 'false';
    if (!argument0) {
      argument0 = defaultArgument;
    }
    if (!argument1) {
      argument1 = defaultArgument;
    }
  }
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
};

export function logic_negate(block, generator) {
  // Negation in Java.
  const order = Order.LOGICAL_NOT;
  const argument0 = generator.valueToCode(block, 'BOOL', order) || 'true';
  const code = '!' + argument0;
  return [code, order];
};

export function logic_boolean(block, generator) {
  // Boolean-Werte true und false in Java.
  const code = (block.getFieldValue('BOOL') === 'TRUE') ? 'true' : 'false';
  return [code, Order.ATOMIC];
};

export function logic_null(block, generator) {
  // Null-Datentyp in Java.
  return ['null', Order.ATOMIC];
};

export function logic_ternary(block, generator) {
  // Ternärer Operator in Java.
  const value_if = generator.valueToCode(block, 'IF', Order.CONDITIONAL) || 'false';
  const value_then = generator.valueToCode(block, 'THEN', Order.CONDITIONAL) || 'null';
  const value_else = generator.valueToCode(block, 'ELSE', Order.CONDITIONAL) || 'null';
  const code = '(' + value_if + ') ? (' + value_then + ') : (' + value_else + ')';
  return [code, Order.CONDITIONAL];
};

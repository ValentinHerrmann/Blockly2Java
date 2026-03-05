/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Java code generator for the custom static- and instance-method
 * blocks (java_static_method_noreturn, java_static_method_return,
 * java_method_noreturn, java_method_return).
 *
 * These blocks use the same argument-mutator (argument_container /
 * argument_input) as defconstructor, so parameter types are resolved with
 * the existing getVariableType helper.
 */

import {getType, getVariableType, Order, getClassName, TYPES} from './javascript_generator.js';
import * as Blockly from 'blockly';
import LocalStorageManager from '../../utils/LocalStorageManager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper: compute the Java return type of a method block.
// Returns the type string (e.g. 'int', 'String', 'MyClass') or 'void'.
// ─────────────────────────────────────────────────────────────────────────────
function _computeReturnType(block) {
  const retBlock = block.getInputTargetBlock('RETURN');
  if (!retBlock) return 'void';
  let returnType = getType(retBlock.type);
  if (returnType === 'var') {
    const id = retBlock.getFieldValue('VAR');
    if (id) {
      returnType = getVariableType(Blockly.getMainWorkspace(), id, true);
      if (returnType === 'var') returnType = 'Object';
    } else {
      returnType = 'Object';
    }
  }
  return returnType;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper: build the full method body code.
// Returns the complete "public [static] [returnType] name(params) { … }" string.
// ─────────────────────────────────────────────────────────────────────────────
function buildMethodCode(block, generator, isStatic) {
  const funcName = block.getFieldValue('NAME') || 'unbekannt';

  // Reset per-method local-variable tracking so the first use inside every
  // method is always emitted as a declaration, not a plain assignment.
  generator.declaredLocalVarIds_ = new Set();

  // --- statement body ---
  let xfix1 = '';
  if (generator.STATEMENT_PREFIX) {
    xfix1 += generator.injectId(generator.STATEMENT_PREFIX, block);
  }
  if (generator.STATEMENT_SUFFIX) {
    xfix1 += generator.injectId(generator.STATEMENT_SUFFIX, block);
  }
  if (xfix1) {
    xfix1 = generator.prefixLines(xfix1, generator.INDENT);
  }
  let loopTrap = '';
  if (generator.INFINITE_LOOP_TRAP) {
    loopTrap = generator.prefixLines(
      generator.injectId(generator.INFINITE_LOOP_TRAP, block),
      generator.INDENT
    );
  }

  const branch = generator.statementToCode(block, 'STACK');

  // --- return value (if present) ---
  let returnValue = generator.valueToCode(block, 'RETURN', Order.NONE) || '';
  let returnType = 'void';
  let xfix2 = '';
  if (returnValue) {
    if (branch) xfix2 = xfix1; // revisit block after body
    const retBlock = block.getInputTargetBlock('RETURN');
    if (retBlock) {
      returnType = getType(retBlock.type);
      if (returnType === 'var') {
        const id = retBlock.getFieldValue('VAR');
        if (id) {
          returnType = getVariableType(Blockly.getMainWorkspace(), id, true);
          if (returnType === 'var') returnType = 'Object';
        } else {
          returnType = 'Object';
        }
      }
    }
    returnValue = generator.INDENT + 'return ' + returnValue + ';\n';
  }

  // --- parameters ---
  const ws = Blockly.getMainWorkspace();
  const args = [];
  if (block.arguments_ && block.arguments_.length) {
    const varModels = block.getVarModels ? block.getVarModels() : [];
    for (let i = 0; i < block.arguments_.length; i++) {
      let paramType = varModels[i]
        ? getVariableType(ws, varModels[i].getId(), true)
        : 'Object';
      if (paramType === 'var' || !paramType) paramType = 'Object';
      if (paramType === 'forint') paramType = 'int';
      // Keep the leading '_' prefix consistent with the defconstructor convention
      // so that variables_get/set inside the body reference the same name.
      const paramName = block.arguments_[i];
      args.push(paramType + ' ' + paramName);
    }
  }

  const staticMod = isStatic ? 'static ' : '';
  const signature = `public ${staticMod}${returnType} ${funcName}(${args.join(', ')})`;
  const code = `${signature} {\n${xfix1}${loopTrap}${branch}${xfix2}${returnValue}}`;
  return generator.scrub_(block, code);
}

// ─────────────────────────────────────────────────────────────────────────────
// Block generators
// ─────────────────────────────────────────────────────────────────────────────

export function java_static_method_noreturn(block, generator) {
  const funcName = block.getFieldValue('NAME') || 'unbekannt';
  const code = buildMethodCode(block, generator, true);
  generator.definitions_['%static_' + funcName] = code;
  LocalStorageManager.storeMethods(getClassName(), { name: funcName, arguments: block.arguments_ || [], isStatic: true, hasReturn: false });
  return null;
}

export function java_static_method_return(block, generator) {
  const funcName = block.getFieldValue('NAME') || 'unbekannt';
  const returnType = _computeReturnType(block);
  const code = buildMethodCode(block, generator, true);
  generator.definitions_['%static_' + funcName] = code;
  LocalStorageManager.storeMethods(getClassName(), { name: funcName, arguments: block.arguments_ || [], isStatic: true, hasReturn: true, returnType });
  return null;
}

export function java_method_noreturn(block, generator) {
  const funcName = block.getFieldValue('NAME') || 'unbekannt';
  const code = buildMethodCode(block, generator, false);
  generator.definitions_['%method_' + funcName] = code;
  LocalStorageManager.storeMethods(getClassName(), { name: funcName, arguments: block.arguments_ || [], isStatic: false, hasReturn: false });
  return null;
}

export function java_method_return(block, generator) {
  const funcName = block.getFieldValue('NAME') || 'unbekannt';
  const returnType = _computeReturnType(block);
  const code = buildMethodCode(block, generator, false);
  generator.definitions_['%method_' + funcName] = code;
  LocalStorageManager.storeMethods(getClassName(), { name: funcName, arguments: block.arguments_ || [], isStatic: false, hasReturn: true, returnType });
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Call-block generators
// ─────────────────────────────────────────────────────────────────────────────

function buildCallArgs(block, generator) {
  const args = [];
  for (let i = 0; block.getInput('ARG' + i); i++) {
    args.push(generator.valueToCode(block, 'ARG' + i, Order.NONE) || 'null');
  }
  return args.join(', ');
}

export function java_static_method_call_noreturn(block, generator) {
  const name = block.getFieldValue('NAME');
  const args = buildCallArgs(block, generator);
  return `${getClassName()}.${name}(${args});
`;
}

export function java_static_method_call_return(block, generator) {
  const name = block.getFieldValue('NAME');
  const args = buildCallArgs(block, generator);
  return [`${getClassName()}.${name}(${args})`, Order.ATOMIC];
}

export function java_method_call_noreturn(block, generator) {
  const name = block.getFieldValue('NAME');
  const args = buildCallArgs(block, generator);
  return `this.${name}(${args});
`;
}

export function java_method_call_return(block, generator) {
  const name = block.getFieldValue('NAME');
  const args = buildCallArgs(block, generator);
  return [`this.${name}(${args})`, Order.ATOMIC];
}

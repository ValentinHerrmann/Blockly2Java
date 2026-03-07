/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating JavaScript for variable blocks.
 */

// Former goog.module ID: Blockly.JavaScript.variables

import * as Blockly from 'blockly';
import {Order, adjustStaticName, getVariableType, getVarCodeName} from './javascript_generator.js';


export function variables_get(block, generator) {
  // Variable getter.
  const code = adjustStaticName(getVarCodeName(block.workspace, generator, block.getFieldValue('VAR')));
  // console.log("variables_get: " + code);
  return [code, Order.ATOMIC];
};

export function variables_set(block, generator) {
  // Variable setter.
  //console.log("variables_set: "+ block);
  const argument0 = generator.valueToCode(
                        block, 'VALUE', Order.ASSIGNMENT) || '';
  //console.log("argument0: "+ argument0);                        
  const varName = adjustStaticName(getVarCodeName(block.workspace, generator, block.getFieldValue('VAR')));
  //console.log("varName: "+ varName);       
  if(argument0 === '')
    {
      return '// ' + varName + ' = ' + argument0 + ';    // Wert fehlt\n';
    }
  // console.log("variables_set: " + varName + ' = ' + argument0 + ';\n');
  return varName + ' = ' + argument0 + ';\n';
};

// ─── NORMAL ATTRIBUTE (type-restricted custom blocks) ───────────────────────
// These mirror variables_get/set but are restricted to type '' in FieldVariable.

export function java_normal_attr_get(block, generator) {
  const name = adjustStaticName(getVarCodeName(block.workspace, generator, block.getFieldValue('VAR')));
  return [name, Order.MEMBER];
};

export function java_normal_attr_set(block, generator) {
  const name = adjustStaticName(getVarCodeName(block.workspace, generator, block.getFieldValue('VAR')));
  const argument0 = generator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '';
  if (argument0 === '') {
    return '// ' + name + ' = ;    // Wert fehlt\n';
  }
  return name + ' = ' + argument0 + ';\n';
};

// ─── STATIC ATTRIBUTE ────────────────────────────────────────────────────────
// Declaration is handled in javascript_generator.js init() — same as normal
// variables but detected as static there. The getter/setter emit ClassName.name.

export function java_static_attr_get(block, generator) {
  const name = adjustStaticName(getVarCodeName(block.workspace, generator, block.getFieldValue('VAR')));
  return [name, Order.MEMBER];
};

export function java_static_attr_set(block, generator) {
  const name = adjustStaticName(getVarCodeName(block.workspace, generator, block.getFieldValue('VAR')));
  const value = generator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '';
  if (value === '') {
    return '// ' + name + ' = ;    // Wert fehlt\n';
  }
  return name + ' = ' + value + ';\n';
};

// ─── PARAMETER GET ────────────────────────────────────────────────────────────
// Parameters are method arguments, not class-level variables.
// The generator simply emits the variable name (same as variables_get).

export function java_param_get(block, generator) {
  const code = getVarCodeName(block.workspace, generator, block.getFieldValue('VAR'));
  return [code, Order.ATOMIC];
};
// No class-level declaration is generated for local variables.
// The setter outputs "type name = value;" (inline declaration with inferred type).

export function java_local_var_get(block, generator) {
  const code = getVarCodeName(block.workspace, generator, block.getFieldValue('VAR'));
  return [code, Order.ATOMIC];
};

export function java_local_var_set(block, generator) {
  const varId  = block.getFieldValue('VAR');
  const varName = getVarCodeName(block.workspace, generator, varId);
  const value   = generator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '';

  // Only declare the type on the first assignment; subsequent ones are plain assignments.
  const isFirstDeclaration = !generator.declaredLocalVarIds_?.has(varId);
  if (isFirstDeclaration) {
    if (!generator.declaredLocalVarIds_) generator.declaredLocalVarIds_ = new Set();
    generator.declaredLocalVarIds_.add(varId);
  }

  const ws = Blockly.getMainWorkspace();
  let varType = getVariableType(ws, varId, true);
  if (varType === 'var' || !varType) varType = 'Object';
  if (varType === 'forint') varType = 'int';

  if (!isFirstDeclaration) {
    // Already declared — plain assignment only.
    if (value === '') return '// ' + varName + ' = ;    // Wert fehlt\n';
    return varName + ' = ' + value + ';\n';
  }

  if (value === '') {
    return varType + ' ' + varName + ';    // Wert fehlt\n';
  }
  return varType + ' ' + varName + ' = ' + value + ';\n';
};

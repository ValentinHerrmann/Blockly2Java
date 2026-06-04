/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating JavaScript for list blocks.
 * @suppress {missingRequire}
 */

import * as Blockly from 'blockly/core';
import {Order, resolveArgBlockType} from './javascript_generator.js';

export function lists_create_empty(block, generator) {
  // Create an empty array in Java.
  return ["new Object[0]", Order.ATOMIC];
}

export function lists_create_with(block, generator) {
  // Create an array with any number of elements of any type in Java.
  const elements = new Array(block.itemCount_);
  for (let i = 0; i < block.itemCount_; i++) {
    elements[i] =
        generator.valueToCode(block, 'ADD' + i, Order.NONE) || 'null';
  }
  let elementType = 'Object';
  if (block.itemCount_ > 0) {
    const elementTypes = [];
    for (let i = 0; i < block.itemCount_; i++) {
      const target = block.getInputTargetBlock('ADD' + i);
      elementTypes.push(resolveArgBlockType(target, block.workspace));
    }
    const firstType = elementTypes[0];
    if (firstType && firstType !== 'var' && elementTypes.every(t => t === firstType)) {
      elementType = firstType;
    }
  }
  const code = "{" + elements.join(', ') + "}";
  return [code, Order.ATOMIC];
}

export function lists_repeat(block, generator) {
  // Create an array with specified length but without values in Java.
  const type = block.getFieldValue('TYPE') || 'Object';
  const repeatCount =
      generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  const code = 'new ' + type + '[' + repeatCount + ']';
  return [code, Order.ATOMIC];
}

export function lists_length(block, generator) {
  // Array length in Java.
  const array =
      generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new Object[0]";
  return [array + ".length", Order.MEMBER];
}

export function lists_isEmpty(block, generator) {
  // Checks if the array is empty in Java.
  const array =
      generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new Object[0]";
  return [array + ".length == 0", Order.EQUALITY];
}



export function lists_getIndex(block, generator) {
  // Get element at index in Java.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  let array = generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new Object[0]";

  let at;
  switch (where) {
    case 'FIRST':
      at = '0';
      break;
    case 'LAST':
      at = array + '.length - 1';
      break;
    case 'FROM_START':
      at = generator.getAdjusted(block, 'AT', 1);
      break;
    case 'FROM_END':
      at = array + '.length - ' + generator.getAdjusted(block, 'AT', 1);
      break;
    case 'RANDOM':
      at = 'Random.randint(0, ' + array + '.length-1)';
      break;
  }

  if (mode === 'GET') {
    return [array + '[' + at + ']', Order.MEMBER];
  } else {
    // REMOVE or GET_REMOVE: since arrays are fixed-size, we can't remove in-place.
    // Fall back to safe alternatives or comments.
    if (mode === 'GET_REMOVE') {
      return [array + '[' + at + ']', Order.MEMBER];
    } else if (mode === 'REMOVE') {
      return '// entfernen auf Arrays nicht unterstützt\n';
    }
  }
  throw Error('Unhandled combination (lists_getIndex).');
}

export function lists_setIndex(block, generator) {
  // Set element at index in Java.
  let array = generator.valueToCode(block, 'LIST', Order.MEMBER) || 'new Object[0]';
  const mode = block.getFieldValue('MODE') || 'SET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const value = generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || 'null';

  let at;
  switch (where) {
    case 'FIRST':
      at = '0';
      break;
    case 'LAST':
      at = array + '.length - 1';
      break;
    case 'FROM_START':
      at = generator.getAdjusted(block, 'AT', 1);
      break;
    case 'FROM_END':
      at = array + '.length - ' + generator.getAdjusted(block, 'AT', 1);
      break;
    case 'RANDOM':
      at = 'Random.randint(0, ' + array + '.length-1)';
      break;
  }

  if (mode === 'SET') {
    return array + '[' + at + '] = ' + value + ';\n';
  } else if (mode === 'INSERT') {
    return '// Einfügen auf Arrays nicht unterstützt\n';
  }
  throw Error('Unhandled combination (lists_setIndex).');
}





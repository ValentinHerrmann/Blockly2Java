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
  // Create an array with one element repeated in Java.
  const functionName = generator.provideFunction_('listsRepeat', `
public static Object[] ${generator.FUNCTION_NAME_PLACEHOLDER_}(Object value, int n) {
  Object[] array = new Object[n];
  for (int i = 0; i < n; i++) {
    array[i] = value;
  }
  return array;
}
`);
  const element =
      generator.valueToCode(block, 'ITEM', Order.NONE) || 'null';
  const repeatCount =
      generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  const code = functionName + '(' + element + ', ' + repeatCount + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_length(block, generator) {
  // Array length in Java.
  const list =
      generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new Object[0]";
  return [list + ".length", Order.MEMBER];
}

export function lists_isEmpty(block, generator) {
  // Checks if the array is empty in Java.
  const list =
      generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new Object[0]";
  return [list + ".length == 0", Order.EQUALITY];
}

export function lists_indexOf(block, generator) {
  // Find an item in the array in Java.
  const operator =
      block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
  const item =
      generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const list =
      generator.valueToCode(block, 'VALUE', Order.NONE) || "new Object[0]";
  let functionName;
  if (operator === 'indexOf') {
    functionName = generator.provideFunction_('listsIndexOf', `
public static int ${generator.FUNCTION_NAME_PLACEHOLDER_}(Object[] array, Object item) {
  if (array == null) return -1;
  for (int i = 0; i < array.length; i++) {
    if ((array[i] == null && item == null) || (array[i] != null && array[i].equals(item))) {
      return i;
    }
  }
  return -1;
}
`);
  } else {
    functionName = generator.provideFunction_('listsLastIndexOf', `
public static int ${generator.FUNCTION_NAME_PLACEHOLDER_}(Object[] array, Object item) {
  if (array == null) return -1;
  for (int i = array.length - 1; i >= 0; i--) {
    if ((array[i] == null && item == null) || (array[i] != null && array[i].equals(item))) {
      return i;
    }
  }
  return -1;
}
`);
  }
  const code = functionName + '(' + list + ', ' + item + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_getIndex(block, generator) {
  // Get element at index in Java.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  let list = generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new Object[0]";

  let at;
  switch (where) {
    case 'FIRST':
      at = '0';
      break;
    case 'LAST':
      at = list + '.length - 1';
      break;
    case 'FROM_START':
      at = generator.getAdjusted(block, 'AT')+1;
      break;
    case 'FROM_END':
      at = list + '.length - ' + generator.getAdjusted(block, 'AT', 1, true);
      break;
    case 'RANDOM':
      at = 'Random.randint(0, ' + list + '.length-1)';
      break;
  }

  if (mode === 'GET') {
    return [list + '[' + at + ']', Order.MEMBER];
  } else {
    // REMOVE or GET_REMOVE: since arrays are fixed-size, we can't remove in-place.
    // Fall back to safe alternatives or comments.
    if (mode === 'GET_REMOVE') {
      return [list + '[' + at + ']', Order.MEMBER];
    } else if (mode === 'REMOVE') {
      return '// entfernen auf Arrays nicht unterstützt\n';
    }
  }
  throw Error('Unhandled combination (lists_getIndex).');
}

export function lists_setIndex(block, generator) {
  // Set element at index in Java.
  let list = generator.valueToCode(block, 'LIST', Order.MEMBER) || 'new Object[0]';
  const mode = block.getFieldValue('MODE') || 'SET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const value = generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || 'null';

  let at;
  switch (where) {
    case 'FIRST':
      at = '0';
      break;
    case 'LAST':
      at = list + '.length - 1';
      break;
    case 'FROM_START':
      at = generator.getAdjusted(block, 'AT')+1;
      break;
    case 'FROM_END':
      at = list + '.length - ' + generator.getAdjusted(block, 'AT', 1, true);
      break;
    case 'RANDOM':
      at = 'Random.randint(0, ' + list + '.length-1)';
      break;
  }

  if (mode === 'SET') {
    return list + '[' + at + '] = ' + value + ';\n';
  } else if (mode === 'INSERT') {
    return '// Einfügen auf Arrays nicht unterstützt\n';
  }
  throw Error('Unhandled combination (lists_setIndex).');
}

export function lists_getSublist(block, generator) {
  // Get sublist (range copy) in Java.
  const list = generator.valueToCode(block, 'LIST', Order.MEMBER) || 'new Object[0]';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');

  let at1;
  switch (where1) {
    case 'FROM_START':
      at1 = generator.getAdjusted(block, 'AT1');
      break;
    case 'FROM_END':
      at1 = list + '.length - ' + generator.getAdjusted(block, 'AT1', 1, false, Order.SUBTRACTION);
      break;
    case 'FIRST':
      at1 = '0';
      break;
    default:
      throw Error('Unhandled option (lists_getSublist).');
  }

  let at2;
  switch (where2) {
    case 'FROM_START':
      at2 = generator.getAdjusted(block, 'AT2', 1);
      break;
    case 'FROM_END':
      at2 = list + '.length - ' + generator.getAdjusted(block, 'AT2', 0, false, Order.SUBTRACTION);
      break;
    case 'LAST':
      at2 = list + '.length';
      break;
    default:
      throw Error('Unhandled option (lists_getSublist).');
  }

  const code = 'java.util.Arrays.copyOfRange(' + list + ', ' + at1 + ', ' + at2 + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_sort(block, generator) {
  // Block for sorting an array in Java.
  const list =
      generator.valueToCode(block, 'LIST', Order.NONE) || 'new Object[0]';
  const direction = block.getFieldValue('DIRECTION') === '1' ? 1 : -1;
  const type = block.getFieldValue('TYPE');

  const functionName = generator.provideFunction_('listsSort', `
public static Object[] ${generator.FUNCTION_NAME_PLACEHOLDER_}(Object[] array, final String type, final int direction) {
  Object[] copy = java.util.Arrays.copyOf(array, array.length);
  java.util.Arrays.sort(copy, new java.util.Comparator<Object>() {
    @Override
    public int compare(Object a, Object b) {
      if (type.equals("NUMERIC")) {
        double d1 = Double.parseDouble(String.valueOf(a));
        double d2 = Double.parseDouble(String.valueOf(b));
        return Double.compare(d1, d2) * direction;
      } else if (type.equals("IGNORE_CASE")) {
        return String.valueOf(a).compareToIgnoreCase(String.valueOf(b)) * direction;
      } else {
        return String.valueOf(a).compareTo(String.valueOf(b)) * direction;
      }
    }
  });
  return copy;
}
`);
  const code = functionName + '(' + list + ', "' + type + '", ' + direction + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_split(block, generator) {
  // Block for splitting text into an array, or joining an array into text in Java.
  let input = generator.valueToCode(block, 'INPUT', Order.MEMBER);
  const delimiter =
      generator.valueToCode(block, 'DELIM', Order.NONE) || "''";
  const mode = block.getFieldValue('MODE');
  if (mode === 'SPLIT') {
    if (!input) {
      input = "\"\"";
    }
    const code = input + '.split(' + delimiter + ')';
    return [code, Order.FUNCTION_CALL];
  } else if (mode === 'JOIN') {
    if (!input) {
      input = 'new Object[0]';
    }
    const functionName = generator.provideFunction_('listsJoin', `
public static String ${generator.FUNCTION_NAME_PLACEHOLDER_}(String delimiter, Object[] array) {
  if (array == null || array.length == 0) return "";
  StringBuilder sb = new StringBuilder();
  sb.append(array[0]);
  for (int i = 1; i < array.length; i++) {
    sb.append(delimiter).append(array[i]);
  }
  return sb.toString();
}
`);
    const code = functionName + '(' + delimiter + ', ' + input + ')';
    return [code, Order.FUNCTION_CALL];
  } else {
    throw Error('Unknown mode: ' + mode);
  }
}

export function lists_reverse(block, generator) {
  // Block for reversing an array in Java.
  const list =
      generator.valueToCode(block, 'LIST', Order.NONE) || 'new Object[0]';
  const functionName = generator.provideFunction_('listsReverse', `
public static Object[] ${generator.FUNCTION_NAME_PLACEHOLDER_}(Object[] array) {
  Object[] copy = java.util.Arrays.copyOf(array, array.length);
  for (int i = 0; i < copy.length / 2; i++) {
    Object temp = copy[i];
    copy[i] = copy[copy.length - 1 - i];
    copy[copy.length - 1 - i] = temp;
  }
  return copy;
}
`);
  const code = functionName + '(' + list + ')';
  return [code, Order.FUNCTION_CALL];
}

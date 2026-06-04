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

export function list_create_empty(block, generator) {
  // Create an empty list in Java.
  return ["new Object[0]", Order.ATOMIC];
}

export function list_create_with(block, generator) {
  // Create a list with any number of elements of any type in Java.
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

export function list_repeat(block, generator) {
  // Create a list with specified length but without values in Java.
  const type = block.getFieldValue('TYPE') || 'Object';
  const repeatCount =
      generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  const code = 'new ' + type + '[' + repeatCount + ']';
  return [code, Order.ATOMIC];
}

export function list_length(block, generator) {
  // List length in Java.
  const array =
      generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new Object[0]";
  return [array + ".length", Order.MEMBER];
}

export function list_isEmpty(block, generator) {
  // Checks if the list is empty in Java.
  const array =
      generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new Object[0]";
  return [array + ".length == 0", Order.EQUALITY];
}

export function list_indexOf(block, generator) {
  // Find an item in the list in Java.
  const operator =
      block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
  const item =
      generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const array =
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
  const code = functionName + '(' + array + ', ' + item + ')';
  return [code, Order.FUNCTION_CALL];
}

export function list_getIndex(block, generator) {
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
    if (mode === 'GET_REMOVE') {
      return [array + '[' + at + ']', Order.MEMBER];
    } else if (mode === 'REMOVE') {
      return '// entfernen auf Listen nicht unterstützt\n';
    }
  }
  throw Error('Unhandled combination (list_getIndex).');
}

export function list_setIndex(block, generator) {
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
    return '// Einfügen auf Listen nicht unterstützt\n';
  }
  throw Error('Unhandled combination (list_setIndex).');
}

export function list_getSublist(block, generator) {
  // Get sublist (range copy) in Java.
  const array = generator.valueToCode(block, 'LIST', Order.MEMBER) || 'new Object[0]';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');

  let at1;
  switch (where1) {
    case 'FROM_START':
      at1 = generator.getAdjusted(block, 'AT1');
      break;
    case 'FROM_END':
      at1 = array + '.length - ' + generator.getAdjusted(block, 'AT1', 1, false, Order.SUBTRACTION);
      break;
    case 'FIRST':
      at1 = '0';
      break;
    default:
      throw Error('Unhandled option (list_getSublist).');
  }

  let at2;
  switch (where2) {
    case 'FROM_START':
      at2 = generator.getAdjusted(block, 'AT2', 1);
      break;
    case 'FROM_END':
      at2 = array + '.length - ' + generator.getAdjusted(block, 'AT2', 0, false, Order.SUBTRACTION);
      break;
    case 'LAST':
      at2 = array + '.length';
      break;
    default:
      throw Error('Unhandled option (list_getSublist).');
  }

  const code = 'java.util.Arrays.copyOfRange(' + array + ', ' + at1 + ', ' + at2 + ')';
  return [code, Order.FUNCTION_CALL];
}

export function list_sort(block, generator) {
  // Block for sorting a list in Java.
  const array =
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
  const code = functionName + '(' + array + ', "' + type + '", ' + direction + ')';
  return [code, Order.FUNCTION_CALL];
}

export function list_split(block, generator) {
  // Block for splitting text into a list, or joining a list into text in Java.
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

export function list_reverse(block, generator) {
  // Block for reversing a list in Java.
  const array =
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
  const code = functionName + '(' + array + ')';
  return [code, Order.FUNCTION_CALL];
}

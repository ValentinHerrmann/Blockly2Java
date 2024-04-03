/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating JavaScript for list blocks.
 * @suppress {missingRequire}
 */

// Former goog.module ID: Blockly.JavaScript.lists

import * as Blockly from 'blockly/core';
// import {NameType} from 'blockly/core/names.js';
import {Order} from './javascript_generator.js';

export function lists_create_empty(block, generator) {
  // Create an empty list in Java.
  return ["new ArrayList<>()", Order.ATOMIC];
};

export function lists_create_with(block, generator) {
  // Create a list with any number of elements of any type in Java.
  const elements = new Array(block.itemCount_);
  for (let i = 0; i < block.itemCount_; i++) {
    elements[i] =
        generator.valueToCode(block, 'ADD' + i, Order.NONE) || 'null';
  }
  const code = "Arrays.asList( new Object[] {" + elements.join(', ') + "} )";
  return [code, Order.ATOMIC];
};

export function lists_repeat(block, generator) {
  // Create a list with one element repeated in Java.
  const functionName = generator.provideFunction_('listsRepeat', `
public List<Object> ${generator.FUNCTION_NAME_PLACEHOLDER_}(Object value, int n) {
  List<Object> array = new ArrayList<>();
  for (int i = 0; i < n; i++) {
    array.add(value);
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
};

export function lists_length(block, generator) {
  // String or array length in Java.
  const list =
      generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new ArrayList<>()";
  return [list + ".size()", Order.MEMBER];
};

export function lists_isEmpty(block, generator) {
  // Checks if the list is null or empty in Java.
  const list =
      generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new ArrayList<>()";
  return ["!" + list + ".isEmpty()", Order.LOGICAL_NOT];
};

export function lists_indexOf(block, generator) {
  // Find an item in the list in Java.
  const operator =
      block.getFieldValue('END') === 'FIRST' ? 'indexOf' : 'lastIndexOf';
  const item =
      generator.valueToCode(block, 'FIND', Order.NONE) || "''";
  const list =
      generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new ArrayList<>()";
  let code = list + '.' + operator + '(' + item + ')';
  /*if (block.workspace.options.oneBasedIndex) { // is this necessary?
    code += ' + 1';
  }*/
  return [code, Order.FUNCTION_CALL];
};

export function lists_getIndex(block, generator) {
  // Get element at index in Java.
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  let list = generator.valueToCode(block, 'VALUE', Order.MEMBER) || "new ArrayList<>()";

  switch (where) {
    case ('FIRST'):
      if (mode === 'GET') {
        return [list + ".get(0)", Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        return [list + ".remove(0)", Order.MEMBER];
      } else if (mode === 'REMOVE') {
        return list + ".remove(0);\n";
      }
      break;
    case ('LAST'):
      if (mode === 'GET') {
        return [list + ".get(" + list + ".size() - 1)", Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        return [list + ".remove(" + list + ".size() - 1)", Order.MEMBER];
      } else if (mode === 'REMOVE') {
        return list + ".remove(" + list + ".size() - 1);\n";
      }
      break;
    case ('FROM_START'): {
      const at = generator.getAdjusted(block, 'AT');
      if (mode === 'GET') {
        return [list + ".get(" + at + ")", Order.MEMBER];
      } else if (mode === 'GET_REMOVE') {
        return [list + ".remove(" + at + ")", Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + ".remove(" + at + ");\n";
      }
      break;
    }
    case ('FROM_END'): {
      const at = generator.getAdjusted(block, 'AT', 1, true);
      if (mode === 'GET') {
        return [list + ".get(" + list + ".size() - " + at + ")", Order.FUNCTION_CALL];
      } else if (mode === 'GET_REMOVE') {
        return [list + ".remove(" + list + ".size() - " + at + ")", Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return list + ".remove(" + list + ".size() - " + at + ");\n";
      }
      break;
    }
    case ('RANDOM'): {
      const functionName = generator.provideFunction_('listsGetRandomItem', `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(list, remove) {
  var x = new Random().nextInt(list.size());
  if (remove) {
    return list.remove(x);
  } else {
    return list.get(x);
  }
}
`);
      const code = functionName + '(' + list + ', ' + (mode !== 'GET') + ')';
      if (mode === 'GET' || mode === 'GET_REMOVE') {
        return [code, Order.FUNCTION_CALL];
      } else if (mode === 'REMOVE') {
        return code + ';\n';
      }
      break;
    }
  }
  throw Error('Unhandled combination (lists_getIndex).');
};

export function lists_setIndex(block, generator) {
  // Set element at index in Java.
  let list = generator.valueToCode(block, 'LIST', Order.MEMBER) || 'new ArrayList<>()';
  const mode = block.getFieldValue('MODE') || 'GET';
  const where = block.getFieldValue('WHERE') || 'FROM_START';
  const value = generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || 'null';

  switch (where) {
    case ('FIRST'):
      if (mode === 'SET') {
        return list + ".set(0, " + value + ");\n";
      } else if (mode === 'INSERT') {
        return list + ".add(0, " + value + ");\n";
      }
      break;
    case ('LAST'):
      if (mode === 'SET') {
        return list + ".set(" + list + ".size() - 1, " + value + ");\n";
      } else if (mode === 'INSERT') {
        return list + ".add(" + value + ");\n";
      }
      break;
    case ('FROM_START'): {
      const at = generator.getAdjusted(block, 'AT');
      if (mode === 'SET') {
        return list + ".set(" + at + ", " + value + ");\n";
      } else if (mode === 'INSERT') {
        return list + ".add(" + at + ", " + value + ");\n";
      }
      break;
    }
    case ('FROM_END'): {
      const at = generator.getAdjusted(block, 'AT', 1, false, Order.SUBTRACTION);
      if (mode === 'SET') {
        return list + ".set(" + list + ".size() - " + at + ", " + value + ");\n";
      } else if (mode === 'INSERT') {
        return list + ".add(" + (list + ".size() - " + at) + ", " + value + ");\n";
      }
      break;
    }
    case ('RANDOM'): {
      const xVar = generator.nameDB_.getDistinctName('tmpX', Blockly.Names.NameType.VARIABLE);
      const randomCode = 'int ' + xVar + ' = new Random().nextInt(' + list + '.size());\n';
      if (mode === 'SET') {
        return randomCode + list + ".set(" + xVar + ", " + value + ");\n";
      } else if (mode === 'INSERT') {
        return randomCode + list + ".add(" + xVar + ", " + value + ");\n";
      }
      break;
    }
  }
  throw Error('Unhandled combination (lists_setIndex).');
};

/**
 * Returns an expression calculating the index into a list.
 * @param {string} listName Name of the list, used to calculate length.
 * @param {string} where The method of indexing, selected by dropdown in Blockly
 * @param {string=} opt_at The optional offset when indexing from start/end.
 * @return {string|undefined} Index expression.
 */
const getSubstringIndex = function(listName, where, opt_at) {
  if (where === 'FIRST') {
    return '0';
  } else if (where === 'FROM_END') {
    return listName + '.size() - 1 - ' + opt_at;
  } else if (where === 'LAST') {
    return listName + '.size() - 1';
  } else {
    return opt_at;
  }
};

export function lists_getSublist(block, generator) {
  // Get sublist in Java.
  const list = generator.valueToCode(block, 'LIST', Order.MEMBER) || 'new ArrayList<>()';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  let code;
  if (where1 === 'FIRST' && where2 === 'LAST') {
    code = list + '.subList(0, ' + list + '.size())';
  } else if (
      list.match(/^\w+$/) ||
      (where1 !== 'FROM_END' && where2 === 'FROM_START')
  ) {
    // If the list is a variable or doesn't require a call for length, don't
    // generate a helper function.
    let at1;
    switch (where1) {
      case 'FROM_START':
        at1 = generator.getAdjusted(block, 'AT1');
        break;
      case 'FROM_END':
        at1 = generator.getAdjusted(block, 'AT1', 1, false, Order.SUBTRACTION);
        at1 = list + '.size() - ' + at1;
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
        at2 = generator.getAdjusted(block, 'AT2', 0, false, Order.SUBTRACTION);
        at2 = list + '.size() - ' + at2;
        break;
      case 'LAST':
        at2 = list + '.size()';
        break;
      default:
        throw Error('Unhandled option (lists_getSublist).');
    }
    code = list + '.subList(' + at1 + ', ' + at2 + ')';
  } else {
    const at1 = generator.getAdjusted(block, 'AT1');
    const at2 = generator.getAdjusted(block, 'AT2');
    const wherePascalCase = {
      FIRST: 'First',
      LAST: 'Last',
      FROM_START: 'FromStart',
      FROM_END: 'FromEnd',
    };
    // The value for 'FROM_END' and 'FROM_START' depends on `at` so
    // we add it as a parameter.
    const at1Param =
        where1 === 'FROM_END' || where1 === 'FROM_START' ? ', at1' : '';
    const at2Param =
        where2 === 'FROM_END' || where2 === 'FROM_START' ? ', at2' : '';
    const functionName = generator.provideFunction_(
        'subsequence' + wherePascalCase[where1] + wherePascalCase[where2],
        `
      ArrayList<String> ${generator.FUNCTION_NAME_PLACEHOLDER_}(ArrayList<String> sequence${at1Param}${at2Param}) {
        int start = ${getSubstringIndex('sequence', where1, 'at1')};
        int end = ${getSubstringIndex('sequence', where2, 'at2')} + 1;
        return new ArrayList<>(sequence.subList(start, end));
      }
      `
    );
    code =
        functionName +
        '(' +
        list +
        // The value for 'FROM_END' and 'FROM_START' depends on `at` so we
        // pass it.
        (where1 === 'FROM_END' || where1 === 'FROM_START' ? ', ' + at1 : '') +
        (where2 === 'FROM_END' || where2 === 'FROM_START' ? ', ' + at2 : '') +
        ')';
  }
  return [code, Order.FUNCTION_CALL];
};

export function lists_sort(block, generator) {
  // Block for sorting a list in Java.
  const list =
      generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) || 'new ArrayList<>()';
  const direction = block.getFieldValue('DIRECTION') === '1' ? 1 : -1;
  const type = block.getFieldValue('TYPE');

  let compareFunction = '';

  switch (type) {
    case 'NUMERIC':
      compareFunction = `(a, b) -> Integer.compare(Integer.parseInt(a), Integer.parseInt(b))`;
      break;
    case 'TEXT':
      compareFunction = `Comparator.naturalOrder()`;
      break;
    case 'IGNORE_CASE':
      compareFunction = `String.CASE_INSENSITIVE_ORDER`;
      break;
    default:
      compareFunction = `Comparator.naturalOrder()`;
      break;
  }

  /*const getCompareFunctionName = generator.provideFunction_(
      'listsGetSortCompare',
      `
    Comparator<String> ${generator.FUNCTION_NAME_PLACEHOLDER_}(String type, int direction) {
      HashMap<String, Comparator<String>> compareFuncs = new HashMap<>();
      compareFuncs.put("NUMERIC", (a, b) -> Integer.compare(Integer.parseInt(a), Integer.parseInt(b)));
      compareFuncs.put("TEXT", Comparator.naturalOrder());
      compareFuncs.put("IGNORE_CASE", String.CASE_INSENSITIVE_ORDER);

      Comparator<String> compare = compareFuncs.get(type);
      return (a, b) -> compare.compare(a, b) * direction;
    }
    `
  );*/
  const reversedOrder = direction === 1 ? '' : '.reversed()';
  return [
    `Collections.sort(new ArrayList<>(Arrays.asList(${list})), ${compareFunction}${reversedOrder}.thenComparing())`,
    Order.FUNCTION_CALL
  ];
};

export function lists_split(block, generator) {
  // Block for splitting text into a list, or joining a list into text in Java.
  let input = generator.valueToCode(block, 'INPUT', Order.MEMBER);
  const delimiter =
      generator.valueToCode(block, 'DELIM', Order.NONE) || "''";
  const mode = block.getFieldValue('MODE');
  let methodName, joinDelimiter;
  if (mode === 'SPLIT') {
    if (!input) {
      input = "''";
    }
    methodName = "split";
    joinDelimiter = '", "';
  } else if (mode === 'JOIN') {
    if (!input) {
      input = 'new ArrayList<>()';
    }
    methodName = "String.join";
    joinDelimiter = '", " + ';
  } else {
    throw Error('Unknown mode: ' + mode);
  }
  const code = methodName === 'String.join' ?
      methodName + '(' + delimiter + joinDelimiter + input + ')' :
      input + '.' + methodName + '(' + delimiter + ')';
  return [code, Order.FUNCTION_CALL];
};

export function lists_reverse(block, generator) {
  // Block for reversing a list in Java.
  const list =
      generator.valueToCode(block, 'LIST', Order.FUNCTION_CALL) || 'new ArrayList<>()';
  const code = 'Collections.reverse(' + list + ')';
  return [code, Order.FUNCTION_CALL];
};

/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Generating JavaScript for math blocks.
 * @suppress {missingRequire}
 */

// Former goog.module ID: Blockly.JavaScript.math

import {Order} from './javascript_generator.js';


export function math_number(block, generator) {
  // Numeric value.
  const code = Number(block.getFieldValue('NUM'));
  const order = code >= 0 ? Order.ATOMIC :
              Order.UNARY_NEGATION;
  return [code, order];
};

export function math_arithmetic(block, generator) {
  // Basic arithmetic operators, and power.
  const OPERATORS = {
    'ADD': [' + ', Order.ADDITION],
    'MINUS': [' - ', Order.SUBTRACTION],
    'MULTIPLY': [' * ', Order.MULTIPLICATION],
    'DIVIDE': [' / ', Order.DIVISION],
    'POWER': [null, Order.NONE],  // Handle power separately.
  };
  const tuple = OPERATORS[block.getFieldValue('OP')];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = generator.valueToCode(block, 'A', order) || '0';
  const argument1 = generator.valueToCode(block, 'B', order) || '0';
  let code;
  // Power in JavaScript requires a special case since it has no operator.
  if (!operator) {
    code = 'Math.pow(' + argument0 + ', ' + argument1 + ')';
    return [code, Order.FUNCTION_CALL];
  }
  code = argument0 + operator + argument1;
  return [code, order];
};

export function math_single(block, generator) {
  // Math operators with single operand.
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = generator.valueToCode(block, 'NUM',
        Order.UNARY_NEGATION) || '0';
    if (arg[0] === '-') {
      // --3 is not legal in JS.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Order.UNARY_NEGATION];
  }
  if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
    arg = generator.valueToCode(block, 'NUM',
        Order.DIVISION) || '0';
  } else {
    arg = generator.valueToCode(block, 'NUM',
        Order.NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'Math.abs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'Math.sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'Math.log(' + arg + ')';
      break;
    case 'EXP':
      code = 'Math.exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'Math.pow(10,' + arg + ')';
      break;
    case 'ROUND':
      code = 'Math.round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'Math.ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'Math.floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'Math.sin(' + arg + ' / 180 * Math.PI)';
      break;
    case 'COS':
      code = 'Math.cos(' + arg + ' / 180 * Math.PI)';
      break;
    case 'TAN':
      code = 'Math.tan(' + arg + ' / 180 * Math.PI)';
      break;
  }
  if (code) {
    return [code, Order.FUNCTION_CALL];
  }
  // Second, handle cases which generate values that may need parentheses
  // wrapping the code.
  switch (operator) {
    case 'LOG10':
      code = 'Math.log(' + arg + ') / Math.log(10)';
      break;
    case 'ASIN':
      code = 'Math.asin(' + arg + ') / Math.PI * 180';
      break;
    case 'ACOS':
      code = 'Math.acos(' + arg + ') / Math.PI * 180';
      break;
    case 'ATAN':
      code = 'Math.atan(' + arg + ') / Math.PI * 180';
      break;
    default:
      throw Error('Unknown math operator: ' + operator);
  }
  return [code, Order.DIVISION];
};

export function math_constant(block, generator) {
  // Constants: PI, E, the Golden Ratio, sqrt(2), 1/sqrt(2), INFINITY.
  const CONSTANTS = {
    'PI': ['Math.PI', Order.MEMBER],
    'E': ['Math.E', Order.MEMBER],
    'GOLDEN_RATIO': ['(1 + Math.sqrt(5)) / 2', Order.DIVISION],
    'SQRT2': ['Math.SQRT2', Order.MEMBER],
    'SQRT1_2': ['Math.SQRT1_2', Order.MEMBER],
    'INFINITY': ['Infinity', Order.ATOMIC],
  };
  return CONSTANTS[block.getFieldValue('CONSTANT')];
};

export function math_number_property(block, generator) {
  // Check if a number is even, odd, prime, whole, positive, or negative
  // or if it is divisible by a certain number. Returns true or false.
  const PROPERTIES = {
    'EVEN': [' % 2 == 0', Order.MODULUS, Order.EQUALITY],
    'ODD': [' % 2 == 1', Order.MODULUS, Order.EQUALITY],
    'WHOLE': [' % 1 == 0', Order.MODULUS, Order.EQUALITY],
    'POSITIVE': [' > 0', Order.RELATIONAL, Order.RELATIONAL],
    'NEGATIVE': [' < 0', Order.RELATIONAL, Order.RELATIONAL],
    'DIVISIBLE_BY': [' % ', Order.MODULUS, Order.EQUALITY],
    'PRIME': [null, Order.NONE, Order.FUNCTION_CALL],
  };
  const dropdownProperty = block.getFieldValue('PROPERTY');
  const [suffix, inputOrder, outputOrder] = PROPERTIES[dropdownProperty];
  const numberToCheck =
      generator.valueToCode(block, 'NUMBER_TO_CHECK', inputOrder) || '0';
  let code;
  if (dropdownProperty === 'PRIME') {
    // Prime is a special case as it is not a one-liner test.
    const functionName = generator.provideFunction_('mathIsPrime', `
      public boolean ${generator.FUNCTION_NAME_PLACEHOLDER_}(int n) {
        if (n == 2 || n == 3) {
          return true;
        }
        if (n <= 1 || n % 2 == 0 || n % 3 == 0) {
          return false;
        }
        for (int i = 5; i * i <= n; i += 6) {
          if (n % i == 0 || n % (i + 2) == 0) {
            return false;
          }
        }
        return true;
      }
    `);
    code = `${functionName}(${numberToCheck})`;
  } else if (dropdownProperty === 'DIVISIBLE_BY') {
    const divisor = generator.valueToCode(block, 'DIVISOR', Order.MODULUS) || '0';
    code = `${numberToCheck} % ${divisor} == 0`;
  } else {
    code = `${numberToCheck}${suffix}`;
  }
  return [code, outputOrder];
};

export function math_change(block, generator) {
  // Add to a variable in place.
  const argument0 = generator.valueToCode(block, 'DELTA', Order.ADDITION) || '0';
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return `${varName} = (${varName} instanceof Number ? ${varName}.intValue() : 0) + ${argument0};\n`;
}


// Rounding functions have a single operand.
export const math_round = math_single;
// Trigonometry functions have a single operand.
export const math_trig = math_single;

export function math_on_list(block, generator) {
  // Math functions for lists.
  const func = block.getFieldValue('OP');
  let list;
  let code;
  switch (func) {
    case 'SUM':
      list = generator.valueToCode(block, 'LIST', Order.MEMBER) || 'new ArrayList<>()';
      code = list + ".stream().reduce(0, Integer::sum)";
      break;
    case 'MIN':
      list = generator.valueToCode(block, 'LIST', Order.NONE) || 'new ArrayList<>()';
      code = "Collections.min(" + list + ")";
      break;
    case 'MAX':
      list = generator.valueToCode(block, 'LIST', Order.NONE) || 'new ArrayList<>()';
      code = "Collections.max(" + list + ")";
      break;
    case 'AVERAGE': {
      const functionName = generator.provideFunction_('mathMean', `
public double ${generator.FUNCTION_NAME_PLACEHOLDER_}(List<Integer> myList) {
  return myList.stream().mapToInt(Integer::intValue).average().orElse(0);
}
`);
      list = generator.valueToCode(block, 'LIST', Order.NONE) || 'new ArrayList<>()';
      code = functionName + "(" + list + ")";
      break;
    }
    case 'MEDIAN': {
      const functionName = generator.provideFunction_('mathMedian', `
public double ${generator.FUNCTION_NAME_PLACEHOLDER_}(List<Integer> myList) {
  List<Integer> localList = myList.stream().filter(Objects::nonNull).sorted(Comparator.reverseOrder()).collect(Collectors.toList());
  if (localList.isEmpty()) return 0;
  int size = localList.size();
  if (size % 2 == 0) {
    return (localList.get(size / 2 - 1) + localList.get(size / 2)) / 2.0;
  } else {
    return localList.get(size / 2);
  }
}
`);
      list = generator.valueToCode(block, 'LIST', Order.NONE) || 'new ArrayList<>()';
      code = functionName + "(" + list + ")";
      break;
    }
    case 'MODE': {
      const functionName = generator.provideFunction_('mathModes', `
public List<Integer> ${generator.FUNCTION_NAME_PLACEHOLDER_}(List<Integer> values) {
  Map<Integer, Long> counts = values.stream().filter(Objects::nonNull)
                          .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()));
  long maxCount = counts.values().stream().max(Long::compareTo).orElse(0L);
  return counts.entrySet().stream()
          .filter(entry -> entry.getValue() == maxCount)
          .map(Map.Entry::getKey)
          .collect(Collectors.toList());
}
`);
      list = generator.valueToCode(block, 'LIST', Order.NONE) || 'new ArrayList<>()';
      code = functionName + "(" + list + ")";
      break;
    }
    case 'STD_DEV': {
      const functionName = generator.provideFunction_('mathStandardDeviation', `
public double ${generator.FUNCTION_NAME_PLACEHOLDER_}(List<Integer> numbers) {
  int n = numbers.size();
  if (n == 0) return 0;
  double mean = numbers.stream().mapToInt(Integer::intValue).average().orElse(0);
  double variance = numbers.stream().mapToDouble(num -> Math.pow(num - mean, 2)).sum() / n;
  return Math.sqrt(variance);
}
`);
      list = generator.valueToCode(block, 'LIST', Order.NONE) || 'new ArrayList<>()';
      code = functionName + "(" + list + ")";
      break;
    }
    case 'RANDOM': {
      const functionName = generator.provideFunction_('mathRandomList', `
public int ${generator.FUNCTION_NAME_PLACEHOLDER_}(List<Integer> list) {
  Random rand = new Random();
  return list.get(rand.nextInt(list.size()));
}
`);
      list = generator.valueToCode(block, 'LIST', Order.NONE) || 'new ArrayList<>()';
      code = functionName + "(" + list + ")";
      break;
    }
    default:
      throw Error('Unknown operator: ' + func);
  }
  return [code, Order.FUNCTION_CALL];
};

export function math_modulo(block, generator) {
  // Remainder computation.
  const argument0 = generator.valueToCode(block, 'DIVIDEND',
      Order.MODULUS) || '0';
  const argument1 = generator.valueToCode(block, 'DIVISOR',
      Order.MODULUS) || '0';
  const code = argument0 + ' % ' + argument1;
  return [code, Order.MODULUS];
};

export function math_constrain(block, generator) {
  // Constrain a number between two limits.
  const argument0 = generator.valueToCode(block, 'VALUE',
      Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'LOW',
      Order.NONE) || '0';
  const argument2 = generator.valueToCode(block, 'HIGH',
      Order.NONE) || 'Infinity';
  const code = 'Math.min(Math.max(' + argument0 + ', ' + argument1 + '), ' +
      argument2 + ')';
  return [code, Order.FUNCTION_CALL];
};

export function math_random_int(block, generator) {
  // Random integer between [X] and [Y].
  const argument0 = generator.valueToCode(block, 'FROM', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'TO', Order.NONE) || '0';
  const functionName = generator.provideFunction_('mathRandomInt', `
  public int ${generator.FUNCTION_NAME_PLACEHOLDER_}(int a, int b) {
    if (a > b) {
      // Swap a and b to ensure a is smaller.
      int c = a;
      a = b;
      b = c;
    }
    return (int) (Math.floor(Math.random() * (b - a + 1)) + a);
  }
  `);
  const code = `${functionName}(${argument0}, ${argument1})`;
  return [code, Order.FUNCTION_CALL];
};

export function math_random_float(block, generator) {
  // Random fraction between 0 and 1.
  return ["Math.random()", Order.FUNCTION_CALL];
};

export function math_atan2(block, generator) {
  // Arctangent of point (X, Y) in degrees from -180 to 180.
  const argument0 = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const argument1 = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  return ["Math.toDegrees(Math.atan2(" + argument1 + ", " + argument0 + "))", Order.DIVISION];
};

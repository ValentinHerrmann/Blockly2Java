/**
 * @license
 * Copyright 2012 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Helper functions for generating JavaScript for blocks.
 * @suppress {checkTypes|globalThis}
 */

// Former goog.module ID: Blockly.JavaScript

import * as Blockly from 'blockly/core';
import LocalStorageManager from '../../utils/LocalStorageManager.js';
//\import { block } from 'blockly/core/tooltip';
//import { block } from 'blockly/core/tooltip';
// import type {Block} from '../../core/block.js';

// import type {Workspace} from '../../core/workspace.js';
// import {inputTypes} from 'blockly/core/inputs/input_types.js';


let className = "";

export function setClassName(name) {
  className = name;
}

export function getClassName() {
  return className;
}

let extendsClass = '';

export function setExtendsClass(name) {
  extendsClass = name;
}

export function getExtendsClass() {
  return extendsClass;
}

export var ctrCount = 0;

/**
 * Order of operation ENUMs.
 * https://developer.mozilla.org/en/JavaScript/Reference/Operators/Operator_Precedence
 * @enum {number}
 */
export const Order = {
  ATOMIC: 0,            // 0 "" ...
  NEW: 1.1,             // new
  MEMBER: 1.2,          // . []
  FUNCTION_CALL: 2,     // ()
  INCREMENT: 3,         // ++
  DECREMENT: 3,         // --
  BITWISE_NOT: 4.1,     // ~
  UNARY_PLUS: 4.2,      // +
  UNARY_NEGATION: 4.3,  // -
  LOGICAL_NOT: 4.4,     // !
  TYPEOF: 4.5,          // typeof
  VOID: 4.6,            // void
  DELETE: 4.7,          // delete
  AWAIT: 4.8,           // await
  EXPONENTIATION: 5.0,  // **
  MULTIPLICATION: 5.1,  // *
  DIVISION: 5.2,        // /
  MODULUS: 5.3,         // %
  SUBTRACTION: 6.1,     // -
  ADDITION: 6.2,        // +
  BITWISE_SHIFT: 7,     // << >> >>>
  RELATIONAL: 8,        // < <= > >=
  IN: 8,                // in
  INSTANCEOF: 8,        // instanceof
  EQUALITY: 9,          // == != === !==
  BITWISE_AND: 10,      // &
  BITWISE_XOR: 11,      // ^
  BITWISE_OR: 12,       // |
  LOGICAL_AND: 13,      // &&
  LOGICAL_OR: 14,       // ||
  CONDITIONAL: 15,      // ?:
  ASSIGNMENT: 16,       //: += -= **= *= /= %= <<= >>= ...
  YIELD: 17,            // yield
  COMMA: 18,            // ,
  NONE: 99,             // (...)
};

export const TYPES = {
  BOOLEAN: 'boolean',
  INTEGER: 'int',
  STRING: 'String',
  DOUBLE: 'double',
  LIST: 'List<Object>',
  OBJECT: 'Object',
  FORINT: 'forint',
  UNKNOWN: 'var',
  CLASS: '__CLASS__'
};

/**
 * Parses an explicit Java type prefix from a Blockly variable or method display name.
 *
 * If the user names a variable/parameter/method "int test", this returns
 * {type: "int", name: "test"}, allowing the explicit type to override inference.
 * The name part must be a single identifier (no spaces).
 * The type part may include generics or array notation, e.g. "List<String> items".
 *
 * Returns null when no valid type prefix is present (no space, or either part
 * contains characters that are not valid in Java identifiers/type expressions).
 */
export function parseExplicitType(rawName) {
  if (!rawName) return null;
  const spaceIdx = rawName.lastIndexOf(' ');
  if (spaceIdx <= 0) return null;
  const typePart = rawName.slice(0, spaceIdx);
  const namePart = rawName.slice(spaceIdx + 1).trim();
  if (!typePart || !namePart) return null;
  // typePart: Java type identifier, may include package qualifiers (.), generics
  // (<...>, including wildcards like "? extends Foo"), or arrays ([]).
  // For security: avoid complex backtracking regexes. Use a deterministic
  // character/structure validator to prevent catastrophic backtracking.
  if (!isValidTypeString(typePart)) return null;
  // namePart: simple Java identifier (no spaces or special chars)
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(namePart)) return null;
  return { type: typePart, name: namePart };
}

/**
 * Lightweight, deterministic validator for Java-style type strings.
 * Avoids any nested/ambiguous regex constructs to prevent catastrophic
 * backtracking on untrusted input. Returns true for plausible type
 * expressions such as "java.util.List<String[]>" or "MyClass".
 */
function isValidTypeString(s) {
  if (!s || typeof s !== 'string') return false;
  // Impose a reasonable length limit to bound processing cost.
  if (s.length > 200) return false;

  // Allowed characters (plus dot and whitespace). Validate per-character
  // rather than using a single complex regex.
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    const ok = (
      (ch >= 'A' && ch <= 'Z') || (ch >= 'a' && ch <= 'z') ||
      (ch >= '0' && ch <= '9') || ch === '_' || ch === '$' ||
      ch === '.' || ch === '<' || ch === '>' || ch === '[' || ch === ']' ||
      ch === ',' || ch === '?' || ch === ' ' || ch === '\t'
    );
    if (!ok) return false;
  }

  // Must not start or end with a dot and no consecutive dots.
  if (s.startsWith('.') || s.endsWith('.') || s.includes('..')) return false;

  // Each dot-separated segment must start with a Java identifier start char.
  const segments = s.split('.');
  for (const seg of segments) {
    const segTrim = seg.trim();
    if (segTrim.length === 0) return false;
    const first = segTrim.charAt(0);
    if (!(/[A-Za-z_$]/.test(first))) return false;
  }

  // Check balanced angle brackets and square brackets and reasonable nesting
  let angleDepth = 0;
  let squareDepth = 0;
  for (let i = 0; i < s.length; i++) {
    const ch = s.charAt(i);
    if (ch === '<') {
      angleDepth++;
      // limit nesting depth to avoid pathological inputs
      if (angleDepth > 10) return false;
    } else if (ch === '>') {
      if (angleDepth <= 0) return false;
      angleDepth--;
    } else if (ch === '[') {
      squareDepth++;
      if (squareDepth > 10) return false;
    } else if (ch === ']') {
      if (squareDepth <= 0) return false;
      squareDepth--;
    }
  }
  if (angleDepth !== 0 || squareDepth !== 0) return false;

  return true;
}

/**
 * Returns the Java code identifier for a variable, stripping any explicit type
 * prefix that the user may have written into the variable's display name.
 *
 * E.g. if the variable's display name is "int test", returns "test".
 * Falls back to generator.getVariableName(varId) for variables without a prefix.
 */
export function getVarCodeName(workspace, generator, varId) {
  const varModel = workspace?.getVariableById?.(varId);
  if (varModel) {
    const parsed = parseExplicitType(varModel.name);
    if (parsed) return parsed.name;
  }
  return generator.getVariableName(varId);
}


export const validRoots = [
  'procedures_defnoreturn',
  'procedures_defreturn',
  'defconstructor',
  'java_static_method_noreturn',
  'java_static_method_return',
  'java_method_noreturn',
  'java_method_return',
];

//converts a block type into a variable type
export function getType(var_type) {
  //console.log("getType: " + var_type);

  switch (var_type) {
    case 'logic_compare': 
    case 'logic_operation': 
    case 'logic_negate': 
    case 'logic_boolean': 
    case 'text_isEmpty': 
    case 'lists_isEmpty': 
    case 'controls_if':
      return TYPES.BOOLEAN;
    case 'lists_length': 
    case 'lists_getIndex': 
    case 'text_length': 
    case 'text_indexOf':
    case 'math_random_int':
      return TYPES.INTEGER;
    case 'math_number': 
    case 'math_arithmetic': 
    case 'math_single': 
    case 'math_trig': 
    case 'math_constant': 
    case 'math_number_property': 
    case 'math_round': 
    case 'math_on_list': 
    case 'math_modulo': 
    case 'math_constrain':  
    case 'math_random_float': 
    case 'math_change':
    case 'controls_repeat_ext':
        return TYPES.DOUBLE;
    case 'colour_picker': 
    case 'colour_random': 
    case 'colour_rgb': 
    case 'colour_blend':
    case 'text': 
    case 'text_multiline': 
    case 'text_join': 
    case 'text_charAt': 
    case 'text_getSubstring': 
    case 'text_changeCase': 
    case 'text_trim': 
    case 'text_print':
    case 'text_append':
      return TYPES.STRING;
    case 'lists_create_empty': 
    case 'lists_create_with': 
    case 'lists_repeat': 
    case 'lists_getSublist': 
    case 'lists_split': 
    case 'lists_sort':
      return TYPES.LIST;
    case 'logic_null':
      return TYPES.OBJECT;
    case 'CLASS':
    case 'callconstructor':
      return TYPES.CLASS;
    default:
      //return TYPES.OBJECT;
      break;
  }
  return TYPES.UNKNOWN;
}


/**
 * Resolves the Java type of a block connected as an argument value.
 *
 * Unlike the simple `getType(block.type)`, this handles:
 *  - callconstructor → extracts the actual class name from the dropdown
 *  - method call return blocks → looks up the matching def block
 *  - variable getters → delegates to getVariableType, then falls back to
 *    cross-workspace constructor-callsite hints stored in LocalStorage
 *
 * Exported so other generators can use it without circular imports.
 *
 * @param {Blockly.Block} argBlock
 * @param {Blockly.Workspace} workspace
/**
 * Resolves the class name from a callconstructor block's dropdown value.
 * @param {Blockly.Block} argBlock
 * @returns {string}
 */
function _resolveConstructorArgType(argBlock) {
  const dv = argBlock.getFieldValue('CONSTRUCTOR_CLASS') || '';
  const sep = dv.indexOf(':::');
  return (sep >= 0 ? dv.slice(0, sep) : '') || TYPES.UNKNOWN;
}

/**
 * Resolves the return type of a method-call block by scanning def blocks.
 * @param {Blockly.Block} argBlock
 * @param {Blockly.Workspace} workspace
 * @returns {string}
 */
function _resolveMethodCallType(argBlock, workspace) {
  const methodName = argBlock.getFieldValue('NAME');
  const defType = argBlock.type === 'java_static_method_call_return'
    ? 'java_static_method_return' : 'java_method_return';
  for (const defBlock of workspace.getBlocksByType(defType, true)) {
    if (defBlock.getFieldValue('NAME') === methodName) {
      const returnBlock = defBlock.getInputTargetBlock('RETURN');
      if (returnBlock) {
        const t = resolveArgBlockType(returnBlock, workspace);
        if (t !== TYPES.UNKNOWN) return t;
      }
    }
  }
  return TYPES.UNKNOWN;
}

/**
 * Resolves the type of a variable-getter block, falling back to cross-workspace
 * callsite hints stored in LocalStorage.
 * @param {Blockly.Block} argBlock
 * @param {Blockly.Workspace} workspace
 * @returns {string}
 */
function _resolveGetterType(argBlock, workspace) {
  const varId = argBlock.getFieldValue('VAR');
  if (!varId) return TYPES.UNKNOWN;
  const t = getVariableType(workspace, varId, false);
  if (t && t !== 'var' && t !== TYPES.UNKNOWN) return t;
  // Check callsite hints for constructor parameters from other classes.
  const ctorBlocks = workspace.getBlocksByType('defconstructor', false);
  for (const ctorBlock of ctorBlocks) {
    const varModels = ctorBlock.getVarModels?.() ?? [];
    const idx = varModels.findIndex(v => v.getId() === varId);
    if (idx >= 0) {
      const callsiteHints = LocalStorageManager.getConstructorCallsiteHints(getClassName());
      if (callsiteHints?.[idx] != null) return callsiteHints[idx];
      break;
    }
  }
  return TYPES.UNKNOWN;
}

/** All block types that represent a variable read (any kind). */
const GETTER_ARG_TYPES = new Set([
  'variables_get', 'java_local_var_get', 'java_static_attr_get',
  'java_normal_attr_get', 'java_param_get',
]);

/**
 * @returns {string} Java type string, or TYPES.UNKNOWN
 */
export function resolveArgBlockType(argBlock, workspace) {
  if (!argBlock) return TYPES.UNKNOWN;
  if (argBlock.type === 'callconstructor') return _resolveConstructorArgType(argBlock);
  if (argBlock.type === 'java_method_call_return' ||
      argBlock.type === 'java_static_method_call_return') {
    return _resolveMethodCallType(argBlock, workspace);
  }
  if (GETTER_ARG_TYPES.has(argBlock.type)) return _resolveGetterType(argBlock, workspace);
  return getType(argBlock.type);
}

export function adjustStaticName(name) {
  if(name.startsWith('static_')) {
    return name.replace('static_', '');
  }
  return name;
}

// ── Polymorphism / inheritance helpers ───────────────────────────────────────

/**
 * Returns the direct parent class name for `className` by reading:
 *  1. The super-call type hints store (populated when a sub-class is generated).
 *  2. The class's saved workspace JSON (looking for a java_extends block),
 *     so the hierarchy is available even before the sub-class has been generated.
 */
function getClassParent(className) {
  // 1. Super-call type hints (fastest, populated at generation time).
  const raw = globalThis.localStorage?.getItem(LocalStorageManager.SUPER_CALL_TYPE_HINTS_KEY);
  if (raw) {
    const store = JSON.parse(raw) || {};
    const entry = store[className];
    if (entry?.parentClass) return entry.parentClass;
  }
  // 2. Read the class's saved workspace JSON and look for a java_extends block.
  //    This works even when the sub-class has never been "generated" yet.
  try {
    const workspaceRaw = LocalStorageManager.loadWorkspace(className);
    if (workspaceRaw) {
      const parsed = JSON.parse(workspaceRaw);
      const topBlocks = parsed?.blocks?.blocks ?? [];
      for (const block of topBlocks) {
        if (block.type === 'java_extends' &&
            block.fields?.PARENT_CLASS &&
            block.fields.PARENT_CLASS !== 'NONE') {
          return block.fields.PARENT_CLASS;
        }
      }
    }
  } catch (e) {
    // Intentionally ignored — parse errors in saved workspaces should not crash
    // the inheritance hierarchy lookup.
    console.debug('[Blockly2Java] Could not parse workspace for parent lookup:', e);
  }
  return null;
}

/**
 * Returns the ancestor chain for a class (including itself), ordered from the
 * class itself up to the root.
 * e.g.  Child → ["Child", "Super"]  (if Super has no recorded parent)
 */
function getAncestorChain(className, maxDepth = 30) {
  const chain = [];
  let current = className;
  const seen = new Set();
  while (current && !seen.has(current) && chain.length < maxDepth) {
    chain.push(current);
    seen.add(current);
    current = getClassParent(current);
  }
  return chain;
}

/**
 * Given a non-empty list of Java type strings that may represent class names,
 * returns their lowest common ancestor (LCA) in the recorded inheritance
 * hierarchy.  Falls back to 'Object' when no shared ancestor is found.
 *
 * Only meaningful when every element looks like a class name (not a Java
 * primitive such as int/boolean/String).
 */
function findCommonSupertype(types) {
  if (types.length === 0) return TYPES.UNKNOWN;
  if (types.length === 1) return types[0];
  if (types.every(t => t === types[0])) return types[0];

  // Build ancestor chains for each type.
  const chains = types.map(t => getAncestorChain(t));

  // Search breadth-first across ALL chains (not just chains[0]) so that we
  // find the LCA even when the first type's chain is incomplete.
  // We iterate by depth level: at depth 0 we check each chain's direct class,
  // at depth 1 its parent, etc.
  const maxLen = Math.max(...chains.map(c => c.length));
  for (let depth = 0; depth < maxLen; depth++) {
    for (const chain of chains) {
      if (depth < chain.length) {
        const candidate = chain[depth];
        if (chains.every(c => c.includes(candidate))) {
          return candidate;
        }
      }
    }
  }
  return 'Object';
}

/** Primitive / built-in Java types that are NOT class names. */
const PRIMITIVE_TYPES = new Set(['int', 'double', 'boolean', 'String', 'Object', 'List<Object>', 'forint', 'void']);

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hard call-budget for getVariableType.
 *
 * Every entry into _getVariableTypeImpl decrements this counter.
 * It is reset to MAX_VAR_TYPE_CALLS at the start of each *fresh* (non-nested)
 * call to getVariableType so unrelated type lookups each get a full budget,
 * while any runaway chain of mutual variable references is capped globally.
 *
 * 100 calls is far more than any realistic workspace needs (a project with
 * 20 variables each queried via 3 heuristics = ~60 calls), but small enough
 * to stop tight cycles within a few milliseconds.
 */
const MAX_VAR_TYPE_CALLS = 100;
let _varTypeBudget = MAX_VAR_TYPE_CALLS;
let _varTypeDepth = 0;   // nesting depth – 0 means we are in an outer call

//returns variable type by searching for usage context.
export function getVariableType(workSpace, varId, useCompares, recursionDeepness = 10) {
  // Reset the budget once per top-level call so every fresh query gets a
  // full allowance while still bounding any cycle reachable from it.
  const isOuterCall = (_varTypeDepth === 0);
  if (isOuterCall) {
    _varTypeBudget = MAX_VAR_TYPE_CALLS;
  }

  if (_varTypeBudget <= 0) {
    return 'var';
  }

  _varTypeBudget--;
  _varTypeDepth++;
  try {
    return _getVariableTypeImpl(workSpace, varId, useCompares, recursionDeepness);
  } finally {
    _varTypeDepth--;
  }
}

// ─── Type-inference sub-routines ────────────────────────────────────────────

/** Checks whether varId is used as a for-loop counter. */
function _searchForLoopVar(workSpace, varId) {
  for (const b of workSpace.getBlocksByType('controls_for', true)) {
    if (b.getFieldValue('VAR') === varId) return TYPES.FORINT;
  }
  return null;
}

/**
 * Scans all setter blocks and collects every concrete Java type assigned to
 * varId.  Also populates varsAssignedToThis with the ids of variables whose
 * value is copied into varId.
 */
function _collectSetterTypes(workSpace, varId, GETTER_TYPES, varsAssignedToThis) {
  const types = [];
  const blocks = [
    ...workSpace.getBlocksByType('variables_set', true),
    ...workSpace.getBlocksByType('java_normal_attr_set', true),
    ...workSpace.getBlocksByType('java_static_attr_set', true),
    ...workSpace.getBlocksByType('java_local_var_set', true),
  ];
  for (const block of blocks) {
    if (block.getFieldValue('VAR') !== varId) continue;
    const valueBlock = block.getInputTargetBlock('VALUE');
    if (!valueBlock) continue;
    if (GETTER_TYPES.has(valueBlock.type) && valueBlock.getFieldValue('VAR') !== varId) {
      varsAssignedToThis.push(valueBlock.getFieldValue('VAR'));
    }
    types.push(_resolveAssignedBlockType(workSpace, valueBlock));
  }
  return types.filter(t => t !== 'var');
}

/** Resolves the Java type of a value block used in an assignment. */
function _resolveAssignedBlockType(workSpace, valueBlock) {
  if (valueBlock.type === 'callconstructor') {
    const dv = valueBlock.getFieldValue('CONSTRUCTOR_CLASS') || '';
    const si = dv.indexOf(':::');
    return si >= 0 ? dv.slice(0, si) : TYPES.CLASS;
  }
  if (valueBlock.type === 'java_static_method_call_return' ||
      valueBlock.type === 'java_method_call_return') {
    const mn = valueBlock.getFieldValue('NAME');
    const dt = valueBlock.type === 'java_static_method_call_return'
      ? 'java_static_method_return' : 'java_method_return';
    for (const def of workSpace.getBlocksByType(dt, true)) {
      if (def.getFieldValue('NAME') === mn) {
        const rb = def.getInputTargetBlock('RETURN');
        if (rb) { const t = getType(rb.type); if (t !== TYPES.UNKNOWN) return t; }
      }
    }
    return 'var';
  }
  // External static class method call (java_ext_static_call_return)
  if (valueBlock.type === 'java_ext_static_call_return') {
    const cls = valueBlock.getFieldValue('CLASS');
    const mn  = valueBlock.getFieldValue('METHOD');
    if (cls && mn) {
      // Check stored return type from LocalStorageManager (other classes).
      const allMethods = LocalStorageManager.getAllMethods();
      const classMethods = allMethods[cls] || [];
      const stored = classMethods.find(m => m.isStatic && m.name === mn && m.returnType);
      if (stored?.returnType) return stored.returnType;
      // Fall back: look in current workspace static-method def blocks.
      for (const def of workSpace.getBlocksByType('java_static_method_return', true)) {
        if (def.getFieldValue('NAME') === mn) {
          const rb = def.getInputTargetBlock('RETURN');
          if (rb) { const t = getType(rb.type); if (t !== TYPES.UNKNOWN) return t; }
        }
      }
    }
    return 'var';
  }
  // Instance method call on another object (java_obj_method_call_return)
  if (valueBlock.type === 'java_obj_method_call_return') {
    const mn = valueBlock.getFieldValue('METHOD');
    if (mn) {
      // Check current workspace instance method def blocks.
      for (const def of workSpace.getBlocksByType('java_method_return', true)) {
        if (def.getFieldValue('NAME') === mn) {
          const rb = def.getInputTargetBlock('RETURN');
          if (rb) { const t = getType(rb.type); if (t !== TYPES.UNKNOWN) return t; }
        }
      }
      // Check stored return type from LocalStorageManager (other classes).
      const allMethods = LocalStorageManager.getAllMethods();
      for (const classMethods of Object.values(allMethods)) {
        const stored = classMethods.find(m => !m.isStatic && m.name === mn && m.returnType);
        if (stored?.returnType) return stored.returnType;
      }
    }
    return 'var';
  }
  return getType(valueBlock.type);
}

/** Checks math_change blocks; returns type or null. */
function _searchMathChangeVar(workSpace, varId) {
  for (const block of workSpace.getBlocksByType('math_change', true)) {
    if (block.getFieldValue('VAR') === varId) {
      const inputList = block.inputList;
      const blockType = inputList.length > 0 ? inputList[0].connection.targetBlock().type : 'math_number';
      const t = getType(blockType);
      if (t !== 'var') return t;
    }
  }
  return null;
}

/**
 * Searches all getter blocks for context-clues about varId's type.
 * Populates varsAssignedFromThis when the variable is used to set another.
 * Returns a non-'var' type string when found, otherwise 'var'.
 */
function _searchGetterContextVar(workSpace, varId, useCompares, varsAssignedFromThis, recursionDeepness) {
  const SETTER_TYPES = new Set([
    'variables_set', 'java_static_attr_set', 'java_normal_attr_set', 'java_local_var_set',
  ]);
  const getterBlocks = [
    ...workSpace.getBlocksByType('variables_get', true),
    ...workSpace.getBlocksByType('java_static_attr_get', true),
    ...workSpace.getBlocksByType('java_local_var_get', true),
    ...workSpace.getBlocksByType('java_normal_attr_get', true),
    ...workSpace.getBlocksByType('java_param_get', true),
  ];
  let varType = 'var';
  for (const gb of getterBlocks) {
    if (gb.getFieldValue('VAR') !== varId) continue;
    const parent = gb.getParent();
    if (parent) {
      if (parent.type === 'logic_compare' && useCompares) {
        return compareControl(workSpace, parent, varId, recursionDeepness - 1);
      }
      if (SETTER_TYPES.has(parent.type) && parent.getFieldValue('VAR') !== varId) {
        varsAssignedFromThis.push(parent.getFieldValue('VAR'));
      }
      varType = getType(parent.type);
    }
    if (varType !== 'var') return varType;
  }
  return varType;
}

/** Checks callconstructor inputs to see if varId is one of them. Returns type or null. */
function _searchCallconstructorInput(workSpace, varId) {
  for (const b of workSpace.getBlocksByType('callconstructor', true)) {
    for (let n = 1; n < b.inputList.length; n++) {
      if (b.inputList[n].connection != null && b.inputList[n].name === varId) {
        const ib = b.inputList[n].connection.targetBlock();
        if (ib != null) return getType(ib.type);
      }
    }
  }
  return null;
}

/** Checks built-in procedure call blocks. Returns type or null. */
function _searchProcedureCallInput(workSpace, varId) {
  const returnBlocks = workSpace.getBlocksByType('procedures_callreturn', true);
  const noReturnBlocks = workSpace.getBlocksByType('procedures_callnoreturn', true);
  const blocks = (returnBlocks && noReturnBlocks) ? returnBlocks.concat(noReturnBlocks)
    : (returnBlocks || noReturnBlocks || []);
  for (const b of blocks) {
    for (let n = 1; n < b.inputList.length; n++) {
      if (b.inputList[n].connection) {
        if (b.getVarModels()[n - 1]?.getId() === varId) {
          const ib = b.inputList[n].connection.targetBlock();
          if (ib) return getType(ib.type);
        }
      }
    }
  }
  return null;
}

/** Checks custom method/static-method call blocks. Returns type or null. */
function _searchMethodCallInput(workSpace, varId, useCompares, recursionDeepness) {
  const GETTER_TYPES2 = new Set([
    'variables_get', 'java_local_var_get', 'java_static_attr_get',
    'java_normal_attr_get', 'java_param_get',
  ]);
  const methodDefCallPairs = [
    ['java_method_noreturn',        'java_method_call_noreturn'],
    ['java_method_return',          'java_method_call_return'],
    ['java_static_method_noreturn', 'java_static_method_call_noreturn'],
    ['java_static_method_return',   'java_static_method_call_return'],
  ];
  for (const [defType, callType] of methodDefCallPairs) {
    const result = _searchMethodDefCallPair(workSpace, varId, defType, callType, GETTER_TYPES2, useCompares, recursionDeepness);
    if (result) return result;
  }
  return null;
}

/** Helper for one def/call pair inside _searchMethodCallInput. */
function _searchMethodDefCallPair(workSpace, varId, defType, callType, GETTER_TYPES2, useCompares, recursionDeepness) {
  for (const defBlock of workSpace.getBlocksByType(defType, true)) {
    const varModels = defBlock.getVarModels?.() ?? [];
    const numParams = defBlock.arguments_?.length ?? 0;
    for (let argIdx = 0; argIdx < numParams; argIdx++) {
      if (varModels[argIdx]?.getId() !== varId) continue;
      const methodName = defBlock.getFieldValue('NAME');
      for (const callBlock of workSpace.getBlocksByType(callType, true)) {
        if (callBlock.getFieldValue('NAME') !== methodName) continue;
        const argBlock = callBlock.getInputTargetBlock('ARG' + argIdx);
        if (!argBlock) continue;
        const t = getType(argBlock.type);
        if (t !== TYPES.UNKNOWN) return t;
        if (recursionDeepness > 0 && GETTER_TYPES2.has(argBlock.type)) {
          const argVarId = argBlock.getFieldValue('VAR');
          if (argVarId && argVarId !== varId) {
            const t2 = getVariableType(workSpace, argVarId, useCompares, recursionDeepness - 1);
            if (t2 !== TYPES.UNKNOWN && t2 !== 'var') return t2;
          }
        }
      }
    }
  }
  return null;
}

/** Checks assigned-variable ids recursively. Returns type string or 'var'. */
function _resolveByAssignedVars(workSpace, vars, recursionDeepness) {
  for (const assignedId of vars) {
    const t = getVariableType(workSpace, assignedId, true, recursionDeepness - 1);
    if (t === 'forint') return 'int';
    if (t !== 'var') return t;
  }
  return 'var';
}

// ────────────────────────────────────────────────────────────────────────────

function _resolveSetterType(setterTypes) {
  if (setterTypes.length === 0) return null;
  if (setterTypes.every(t => t === setterTypes[0])) return setterTypes[0];
  if (setterTypes.every(t => !PRIMITIVE_TYPES.has(t))) return findCommonSupertype(setterTypes);
  return setterTypes[0];
}

function _getVariableTypeImpl(workSpace, varId, useCompares, recursionDeepness) {
  // If the variable's display name encodes an explicit type (e.g. "int test"),
  // that type unconditionally overrides any automatic inference.
  const _varModel = workSpace.getVariableById?.(varId);
  if (_varModel) {
    const _explicit = parseExplicitType(_varModel.name);
    if (_explicit) return _explicit.type;
  }

  const forLoopType = _searchForLoopVar(workSpace, varId);
  if (forLoopType) return forLoopType;

  const GETTER_BLOCK_TYPES = new Set([
    'variables_get', 'java_local_var_get', 'java_static_attr_get',
    'java_normal_attr_get', 'java_param_get',
  ]);
  const varsAssignedToThis = [];
  const setterTypes = _collectSetterTypes(workSpace, varId, GETTER_BLOCK_TYPES, varsAssignedToThis);
  const setterType = _resolveSetterType(setterTypes);
  if (setterType) return setterType;

  const mathType = _searchMathChangeVar(workSpace, varId);
  const varsAssignedFromThis = [];

  const resolvers = [
    () => mathType,
    () => {
      const getterType = _searchGetterContextVar(workSpace, varId, useCompares, varsAssignedFromThis, recursionDeepness);
      return getterType !== 'var' ? getterType : null;
    },
    () => _searchCallconstructorInput(workSpace, varId),
    () => _searchProcedureCallInput(workSpace, varId),
    () => _searchMethodCallInput(workSpace, varId, useCompares, recursionDeepness),
  ];

  for (const resolver of resolvers) {
    const resolved = resolver();
    if (resolved) return resolved;
  }

  if (recursionDeepness <= 0) {
    console.log('Recursion limit reached while searching for variable type');
    return 'var';
  }

  const fromAssigned = _resolveByAssignedVars(workSpace, varsAssignedToThis, recursionDeepness);
  if (fromAssigned !== 'var') return fromAssigned;

  return _resolveByAssignedVars(workSpace, varsAssignedFromThis, recursionDeepness);
}


//takes a logic_compare block and checks what is compared
//only to be used by the getVarType function
export function compareControl(workSpace, block, varId, recursionDeepness = 9) {
  if(block.type !== 'logic_compare') {
    return null;
  }

  if (recursionDeepness <= 0) return 'var';

  let left = block.getInputTargetBlock('A');
  let right = block.getInputTargetBlock('B');
  if(left === null || right === null){
    return 'var';
  }

  // All block types that represent a variable read (any kind)
  const GETTER_TYPES = new Set([
    'variables_get',
    'java_local_var_get',
    'java_static_attr_get',
    'java_normal_attr_get',
    'java_param_get',
  ]);

  const leftIsVar  = GETTER_TYPES.has(left.type);
  const rightIsVar = GETTER_TYPES.has(right.type);

  if(leftIsVar && left.getFieldValue('VAR') === varId) {
    if(rightIsVar) {
      return getVariableType(workSpace, right.getFieldValue('VAR'), false, recursionDeepness);
    }
    return getType(right.type);
  }
  else if(rightIsVar && right.getFieldValue('VAR') === varId) {
    if(leftIsVar) {
      return getVariableType(workSpace, left.getFieldValue('VAR'), false, recursionDeepness);
    }
    return getType(left.type);
  }

  return 'var';
}

/**
 * JavaScript code generator class.
 */
export class JavascriptGenerator extends Blockly.CodeGenerator {
  /**
   * List of outer-inner pairings that do NOT require parentheses.
   * @type {!Array<!Array<number>>}
   */

  INDENT = '    ';

  ORDER_OVERRIDES = [
    // (foo()).bar -> foo().bar
    // (foo())[0] -> foo()[0]
    [Order.FUNCTION_CALL, Order.MEMBER],
    // (foo())() -> foo()()
    [Order.FUNCTION_CALL, Order.FUNCTION_CALL],
    // (foo.bar).baz -> foo.bar.baz
    // (foo.bar)[0] -> foo.bar[0]
    // (foo[0]).bar -> foo[0].bar
    // (foo[0])[1] -> foo[0][1]
    [Order.MEMBER, Order.MEMBER],
    // (foo.bar)() -> foo.bar()
    // (foo[0])() -> foo[0]()
    [Order.MEMBER, Order.FUNCTION_CALL],

    // !(!foo) -> !!foo
    [Order.LOGICAL_NOT, Order.LOGICAL_NOT],
    // a * (b * c) -> a * b * c
    [Order.MULTIPLICATION, Order.MULTIPLICATION],
    // a + (b + c) -> a + b + c
    [Order.ADDITION, Order.ADDITION],
    // a && (b && c) -> a && b && c
    [Order.LOGICAL_AND, Order.LOGICAL_AND],
    // a || (b || c) -> a || b || c
    [Order.LOGICAL_OR, Order.LOGICAL_OR]
  ];


  constructor(name) {
    super(name ?? 'Java');
    this.isInitialized = false;

    // Copy Order values onto instance for backwards compatibility
    // while ensuring they are not part of the publically-advertised
    // API.
    //
    // TODO(#7085): deprecate these in due course.  (Could initially
    // replace data properties with get accessors that call
    // deprecate.warn().)
    for (const key in Order) {
      this['ORDER_' + key] = Order[key];
    }

    // List of illegal variable names.  This is not intended to be a
    // security feature.  Blockly is 100% client-side, so bypassing
    // this list is trivial.  This is intended to prevent users from
    // accidentally clobbering a built-in object or function.
    this.addReservedWords(
        // Java keywords: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html
        'abstract,assert,boolean,break,byte,case,catch,char,class,const,continue,default,' +
        'do,double,else,enum,extends,final,finally,float,for,if,implements,import,' +
        'instanceof,int,interface,long,native,new,package,private,protected,public,' +
        'return,short,static,strictfp,super,switch,synchronized,this,throw,throws,' +
        'transient,try,void,volatile,while,' +
        // Java literals: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_keywords.html
        'false,null,true,' +
        // Java reserved characters in context: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/_reserved.html
        'goto,const,' +
        // Everything in the current environment (835 items in Chrome,
        // 104 in Node).
        Object.getOwnPropertyNames(globalThis).join(',')
    );
  }

  /**
   * Initialise the database of variable names.
   * @param {!Workspace} workspace Workspace to generate code from.
   */
  init(workspace) {
    super.init(workspace);

    // Reset per-generation tracking for local variable first-declaration.
    this.declaredLocalVarIds_ = new Set();

    // Reset extends-class so that a removed java_extends block takes effect.
    extendsClass = '';

    if (!this.nameDB_) {
      this.nameDB_ = new Blockly.Names(this.RESERVED_WORDS_);
    } else {
      this.nameDB_.reset();
    }

    this.nameDB_.setVariableMap(workspace.getVariableMap());
    this.nameDB_.populateVariables(workspace);
    this.nameDB_.populateProcedures(workspace);

    const defvars = [];
    // Add developer variables (not created or named by the user).
    const devVarList = Blockly.Variables.allDeveloperVariables(workspace);
    for (let i = 0; i < devVarList.length; i++) {
      defvars.push(
          this.nameDB_.getName(devVarList[i], Blockly.Names.NameType.DEVELOPER_VARIABLE));
    }


    // ── Classify variables by their Blockly type tag ────────────────────────
    // Now that all three kinds use typed workspace variables, we can simply
    // ask the workspace instead of scanning block types.
    const blocks = workspace.getAllBlocks(false);
    const staticAttrVarIds = new Set(
      workspace.getVariablesOfType('static').map(v => v.getId())
    );
    // 'param' vars (method parameters) also must not get class-level declarations.
    const localVarIds = new Set([
      ...workspace.getVariablesOfType('local').map(v => v.getId()),
      ...workspace.getVariablesOfType('param').map(v => v.getId()),
    ]);

    let def_map = new Map();
    const variables = [];
    let c = 0;
    ctrCount = 0;
    // Iterate through every block and add each variable to the list.
    for (let i = 0; i < blocks.length; i++) {
      if (blocks[i].type === 'defconstructor') {
        ctrCount++;
      }
      if( validRoots.includes(blocks[i].getRootBlock().type)
          &&
          !(validRoots.includes(blocks[i].type)))
        {
        const blockVariables = blocks[i].getVarModels();
        if (blockVariables) {
          for (let j = 0; j < blockVariables.length; j++) {
            const variable = blockVariables[j];
            const id = variable.getId();
            if (id) {
              variables[c] = variable;
              c++;
            }
          }
        }
      }
    }

    // Find variables used as parameters or in foreach loops
    let funcs = [];
    let params = [];
    c = 0;

    for(let b = 0; b < blocks.length; b++)
    {
      if(validRoots.includes(blocks[b].type) ||
          blocks[b].type === 'controls_forEach' ||
          blocks[b].type === 'controls_for')
      {
        funcs[c] = blocks[b];
        c++;
      }
    }
    c = 0;
    for(let f = 0; f < funcs.length; f++)
    {
      let blockParams = funcs[f].getVarModels();
      for(let g = 0; g < blockParams.length; g++)
      {
        params[c] = blockParams[g];
        c++;
      }
    }

    //Add definitions for not parameter variables
    for (let i = 0; i < variables.length; i++) {
      const varId = variables[i].getId();

      // Local variables: skip class-level declaration (declared inline by java_local_var_set)
      if (localVarIds.has(varId)) continue;

      let par = false;

      for(let j = 0; j < params.length; j++) {

        if(params[j] === variables[i]) {
          par = true;
          break;
        }
      }

      if(!par) {
        let name = this.nameDB_.getName(varId, Blockly.Names.NameType.VARIABLE);
        // bare name part as the base for the code identifier (e.g. "int test" → "test"),
        // but still run it through nameDB_ to ensure it is safe and unique.
        const _rawVarName = workspace.getVariableById(varId)?.name ?? '';
        const _parsedVarName = parseExplicitType(_rawVarName);
        if (_parsedVarName) {
          name = this.nameDB_.getDistinctName(
            _parsedVarName.name,
            Blockly.Names.NameType.VARIABLE,
          );
        }
        if (_parsedVarName) name = _parsedVarName.name;
        let orgType = getVariableType(workspace, varId, true);
        let type = orgType;
        let definition = def_map.get(orgType);
        // Dynamic class names (from callconstructor dropdown) won't have a bucket yet.
        if (!definition) {
          definition = [];
          def_map.set(orgType, definition);
        }

        if(orgType === 'var')
        {
          // Type could not be inferred — fall back to Object so the
          // attribute is still declared in the class body.
          const fallbackType = staticAttrVarIds.has(varId) ? 'static Object' : 'Object';
          if (name.startsWith('static_')) name = name.replace('static_', '');
          definition.push(fallbackType + ' ' + name);
        }
        else if(orgType === 'forint')
        {
          // Loop variable – declared locally in the for-loop header; skip class attribute.
          continue;
        }
        else
        {
          // Static attribute: detected either by new block type or old static_ prefix
          if (staticAttrVarIds.has(varId) || name.startsWith('static_'))
          {
            if (name.startsWith('static_')) name = name.replace('static_', '');
            type = 'static ' + orgType;
          }
          definition.push(type + ' ' + name);
        }
        def_map.set(orgType, definition);
      }
    }

    let variable_definitions = "";
    for (let [key, value] of def_map)
    {
      if (value.length > 0) 
      {
        let uniqueValues = [...new Set(value)];
        for(let v of uniqueValues)
        {
          //console.log('Variable: ' + v);
          //if(v.includes('var ')){

            let comment = '\n'; 
            let modifier = 'private ';
            let varName = substringAfterLastSpace(v);
            //console.log('Variable: ' + varName + " | " + v);
            //console.log(variable_definitions);
            if(variable_definitions.includes(" "+varName+";")) {
              comment = "// Attribut doppelt! \n";
              modifier = '//'+modifier;
            }
            v=v.replace('var ', 'Object ');
            variable_definitions += modifier + v + "; "+comment;
          // }
          // else {
          //   console.log('Variable ' + v + ' not defined');
          // }
        }
      }
    }
    this.definitions_['variables'] = variable_definitions;

    // Declare all of the variables.
    /*if (defvars.length) {
      this.definitions_['variables'] = 'var ' + defvars.join(', ') + ';';
    }*/
    // ── Scan callconstructor blocks → store cross-class parameter type hints ──
    // When this workspace calls new OtherClass(arg, ...) we persist the inferred
    // argument types so OtherClass's defconstructor can use them even though the
    // call site lives in a different class workspace.
    const _callerClass = getClassName();
    if (_callerClass) {
      const _callHintsByCallee = {};
      for (const callBlock of workspace.getBlocksByType('callconstructor', true)) {
        const _dv = callBlock.getFieldValue('CONSTRUCTOR_CLASS') || '';
        const _sep = _dv.indexOf(':::');
        if (_sep < 0) continue;
        const _calledClass = _dv.slice(0, _sep);
        if (!_calledClass || _calledClass === 'NONE') continue;
        const _types = [];
        // inputList[0] is the TOP_LINE dummy; argument inputs start at 1.
        for (let _n = 1; _n < callBlock.inputList.length; _n++) {
          const _conn = callBlock.inputList[_n].connection;
          const _argBlock = _conn ? _conn.targetBlock() : null;
          const _t = resolveArgBlockType(_argBlock, workspace);
          _types.push(_t === TYPES.UNKNOWN ? null : _t);
        }
        if (_types.some(_t => _t !== null)) {
          _callHintsByCallee[_calledClass] = _types;
        }
      }
      LocalStorageManager.storeConstructorCallsiteHintsByClass(_callerClass, _callHintsByCallee);
    }

    // ── Scan java_obj_method_call_* and java_ext_static_call_* blocks ─────────
    // Collect the inferred argument types so that the called class's method
    // definition (generated in a separate pass) can resolve parameter types even
    // when the call originates from a different class workspace.
    // Instance-method key: "methodName"
    // Static-method key:   "TargetClass::methodName"
    if (_callerClass) {
      const _objCallHints = {};
      const _collectArgTypes = (callBlock) => {
        const _types = [];
        for (let _n = 0; callBlock.getInput('ARG' + _n); _n++) {
          const _argBlock = callBlock.getInput('ARG' + _n)?.connection?.targetBlock();
          const _t = resolveArgBlockType(_argBlock, workspace);
          _types.push(_t === TYPES.UNKNOWN ? null : _t);
        }
        return _types;
      };
      for (const _bType of ['java_obj_method_call_noreturn', 'java_obj_method_call_return']) {
        for (const _cb of workspace.getBlocksByType(_bType, true)) {
          const _mName = _cb.getFieldValue('METHOD');
          if (!_mName || _mName === '__none__') continue;
          const _types = _collectArgTypes(_cb);
          if (_types.some(_t => _t !== null)) {
            // Merge with any already collected hints for the same method name.
            if (_objCallHints[_mName]) {
              for (let _i = 0; _i < _types.length; _i++) {
                if (_objCallHints[_mName][_i] == null && _types[_i] != null) {
                  _objCallHints[_mName][_i] = _types[_i];
                }
              }
            } else {
              _objCallHints[_mName] = _types;
            }
          }
        }
      }
      for (const _bType of ['java_ext_static_call_noreturn', 'java_ext_static_call_return']) {
        for (const _cb of workspace.getBlocksByType(_bType, true)) {
          const _cls   = _cb.getFieldValue('CLASS');
          const _mName = _cb.getFieldValue('METHOD');
          if (!_cls || !_mName) continue;
          const _key   = `${_cls}::${_mName}`;
          const _types = _collectArgTypes(_cb);
          if (_types.some(_t => _t !== null)) {
            if (_objCallHints[_key]) {
              for (let _i = 0; _i < _types.length; _i++) {
                if (_objCallHints[_key][_i] == null && _types[_i] != null) {
                  _objCallHints[_key][_i] = _types[_i];
                }
              }
            } else {
              _objCallHints[_key] = _types;
            }
          }
        }
      }
      // Always replace the previously stored hints for this caller class so
      // stale data from a prior generation never survives.  (clearMethods has
      // already wiped them, but storeObjCallTypeHints replaces anyway.)
      LocalStorageManager.storeObjCallTypeHints(_callerClass, _objCallHints);
    }

    this.isInitialized = true;
  }

  /**
   * Prepend the generated code with the variable definitions.
   * @param {string} code Generated code.
   * @return {string} Completed code.
   */
  finish(code) {
    // Convert the definitions dictionary into a list.
    const definitions = Object.values(this.definitions_);
    // Call Blockly.CodeGenerator's finish.
    super.finish(code);
    this.isInitialized = false;

    this.nameDB_.reset();
    //console.log(definitions);
    return definitions.join('\n\n') + '\n\n\n' + code;
  }

  /**
   * Naked values are top-level blocks with outputs that aren't plugged into
   * anything.  A trailing semicolon is needed to make this legal.
   * @param {string} line Line of generated code.
   * @return {string} Legal line of code.
   */
  scrubNakedValue(line) {
    return line + '\n';
  }

  /**
   * Encode a string as a properly escaped JavaScript string, complete with
   * quotes.
   * @param {string} string Text to encode.
   * @return {string} JavaScript string.
   */
  quote_(string) {
    // Can't use goog.string.quote since Google's style guide recommends
    // JS string literals use single quotes.
    string = string.replace(/\\/g, '\\\\')
        .replace(/\n/g, '\\\n')
        .replace(/'/g, '\\\'');
    return '\"' + string + '\"';
  }

  /**
   * Encode a string as a properly escaped multiline JavaScript string, complete
   * with quotes.
   * @param {string} string Text to encode.
   * @return {string} JavaScript string.
   */
  multiline_quote_(string) {
    // Can't use goog.string.quote since Google's style guide recommends
    // JS string literals use single quotes.
    const lines = string.split(/\n/g).map(this.quote_);
    return lines.join(' + \"\\n\" +\n');
  }

  /**
   * Common tasks for generating JavaScript from blocks.
   * Handles comments for the specified block and any connected value blocks.
   * Calls any statements following this block.
   * @param {!Block} block The current block.
   * @param {string} code The JavaScript code created for this block.
   * @param {boolean=} opt_thisOnly True to generate code for only this
   *     statement.
   * @return {string} JavaScript code with comments and subsequent blocks added.
   * @protected
   */
  scrub_(block, code, opt_thisOnly) {
    if (!validRoots.includes(block.getRootBlock().type)) {
      return '!!! Warnung, ein Block wurde nicht übersetzt !!!';
    }
      let commentCode = '';
      // Only collect comments for blocks that aren't inline.
      if (!block.outputConnection || !block.outputConnection.targetConnection) {
        // Collect comment for this block.
        let comment = block.getCommentText();
        if (comment) {
          const javadocBlockTypes = [
            'java_static_method_noreturn', 'java_static_method_return',
            'java_method_noreturn', 'java_method_return', 'defconstructor',
          ];
          if (javadocBlockTypes.includes(block.type)) {
            // Render as Javadoc comment for method/constructor definition blocks.
            const lines = comment.split('\n');
            commentCode += '/**\n' + lines.map(l => ' * ' + l).join('\n') + '\n */\n';
          } else {
            comment = Blockly.utils.string.wrap(comment, this.COMMENT_WRAP - 3);
            commentCode += this.prefixLines(comment + '\n', '// ');
          }
        }
        // Collect comments for all value arguments.
        // Don't collect comments for nested statements.
        for (let i = 0; i < block.inputList.length; i++) {
          if (block.inputList[i].type === Blockly.inputTypes.VALUE) {
            const childBlock = block.inputList[i].connection.targetBlock();
            if (childBlock) {
              comment = this.allNestedComments(childBlock);
              if (comment) {
                commentCode += this.prefixLines(comment, '// ');
              }
            }
          }
        }
      }
      const nextBlock =
          block.nextConnection && block.nextConnection.targetBlock();
      const nextCode = opt_thisOnly ? '' : this.blockToCode(nextBlock);
      return commentCode + code + nextCode;
  }

  /**
   * Gets a property and adjusts the value while taking into account indexing.
   * @param {!Block} block The block.
   * @param {string} atId The property ID of the element to get.
   * @param {number=} opt_delta Value to add.
   * @param {boolean=} opt_negate Whether to negate the value.
   * @param {number=} opt_order The highest order acting on this value.
   * @return {string|number}
   */
  getAdjusted(block, atId, opt_delta, opt_negate, opt_order) {
    let delta = opt_delta || 0;
    let order = opt_order || this.ORDER_NONE;
    if (block.workspace.options.oneBasedIndex) {
      delta--;
    }
    const defaultAtIndex = block.workspace.options.oneBasedIndex ? '1' : '0';

    let innerOrder;
    let outerOrder = order;
    if (delta > 0) {
      outerOrder = this.ORDER_ADDITION;
      innerOrder = this.ORDER_ADDITION;
    } else if (delta < 0) {
      outerOrder = this.ORDER_SUBTRACTION;
      innerOrder = this.ORDER_SUBTRACTION;
    } else if (opt_negate) {
      outerOrder = this.ORDER_UNARY_NEGATION;
      innerOrder = this.ORDER_UNARY_NEGATION;
    }

    let at = this.valueToCode(block, atId, outerOrder) || defaultAtIndex;

    if (Blockly.utils.string.isNumber(at)) {
      // If the index is a naked number, adjust it right now.
      at = Number(at) + delta;
      if (opt_negate) {
        at = -at;
      }
    } else {
      // If the index is dynamic, adjust it in code.
      if (delta > 0) {
        at = at + ' + ' + delta;
      } else if (delta < 0) {
        at = at + ' - ' + -delta;
      }
      if (opt_negate) {
        if (delta) {
          at = '-(' + at + ')';
        } else {
          at = '-' + at;
        }
      }
      innerOrder = Math.floor(innerOrder);
      order = Math.floor(order);
      if (innerOrder && order >= innerOrder) {
        at = '(' + at + ')';
      }
    }
    return at;
  }

}


function substringAfterLastSpace(str) {
  let lastIndex = str.lastIndexOf(' ');
  if (lastIndex === -1) {
    return str; // Kein Leerzeichen gefunden, gesamte Zeichenkette zurückgeben
  }
  return str.substring(lastIndex + 1);
}
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

import {getType, getVariableType, parseExplicitSignature, Order, getClassName, TYPES} from './javascript_generator.js';
import * as Blockly from 'blockly';
import LocalStorageManager from '../../utils/LocalStorageManager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Scope-aware parameter type inference.
//
// Blockly's VariableMap enforces a (name, type) uniqueness constraint.  When
// two methods share a same-named parameter, the java_param_get onchange handler
// may redirect one method's block to reuse the other method's variable ID.
// A workspace-wide, ID-based lookup (getVariableType) then finds usages in the
// WRONG method and returns a wrong type.
//
// Fix: walk only the current method's descendant blocks and match java_param_get
// blocks by their *display name* — no IDs involved, no cross-method leakage.
// ─────────────────────────────────────────────────────────────────────────────

const TYPE_AGNOSTIC_PARENTS = new Set([
  'text_join', 'text_print', 'text_append',
]);

function isDescendantOf(block, ancestor) {
  let anc = block.getParent?.();
  while (anc) {
    if (anc === ancestor) return true;
    anc = anc.getParent?.();
  }
  return false;
}

function _checkParamBlock(pb, paramName, ws) {
  const varId = pb.getFieldValue('VAR');
  if (!varId) return null;
  const varModel = ws?.getVariableById(varId);
  const displayName = varModel?.name ?? pb.getField('VAR')?.getText?.() ?? '';
  if (displayName !== paramName) return null;

  const parent = pb.getParent();
  if (!parent || TYPE_AGNOSTIC_PARENTS.has(parent.type)) return null;
  const t = getType(parent.type);
  return (t && t !== TYPES.UNKNOWN) ? t : null;
}

function _scanDescendantsForParamType(methodBlock, paramName, ws) {
  for (const descendant of methodBlock.getDescendants(false)) {
    if (descendant.type === 'java_param_get') {
      const t = _checkParamBlock(descendant, paramName, ws);
      if (t) return t;
    }
  }
  return null;
}

function _scanWorkspaceForParamType(methodBlock, paramName, ws) {
  if (!ws) return null;
  for (const pb of ws.getBlocksByType('java_param_get', false)) {
    if (isDescendantOf(pb, methodBlock)) {
      const t = _checkParamBlock(pb, paramName, ws);
      if (t) return t;
    }
  }
  return null;
}

function _inferParamTypeInScope(methodBlock, paramIndex) {
  const paramName = methodBlock.arguments_?.[paramIndex];
  if (!paramName) return TYPES.UNKNOWN;

  const ws = methodBlock.workspace;
  return _scanDescendantsForParamType(methodBlock, paramName, ws)
    || _scanWorkspaceForParamType(methodBlock, paramName, ws)
    || TYPES.UNKNOWN;
}


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
// Shared helper: build parameter type declarations.
// ─────────────────────────────────────────────────────────────────────────────
function _buildParams(block, funcName, isStatic) {
  const args = [];
  if (!block.arguments_ || !block.arguments_.length) {
    return args;
  }
  // Retrieve any cross-class call-site type hints stored by other classes
  // that called this method via java_obj_method_call_* / java_ext_static_call_*.
  // Key: "methodName" for instance methods, "ClassName::methodName" for static.
  const _hintKey = isStatic ? (getClassName() + '::' + funcName) : funcName;
  const _crossClassHints = LocalStorageManager.getObjCallTypeHints(_hintKey);
  for (let i = 0; i < block.arguments_.length; i++) {
    const rawParamName = block.arguments_[i];
    // Allow an explicit type prefix in the parameter name (e.g. "int count" → type "int", identifier "count").
    const _parsedParam = parseExplicitSignature(rawParamName);
    if (_parsedParam?.type) {
      args.push(_parsedParam.type + ' ' + _parsedParam.name);
      continue;
    }
    const paramName = _parsedParam ? _parsedParam.name : rawParamName;
    // getVariableType looks up how the variable is actually *used* in the
    // body to infer its type.
    // ── Scoped inference: search only this method's body by display name ──
    // Two strategies (getDescendants + ancestor walk) ensure we find the
    // block even if getDescendants has edge-case gaps.
    // NO fallback to workspace-wide getVariableType: that would pick up
    // java_param_get blocks from OTHER methods that share a redirected ID,
    // producing cross-method type contamination.
    const scopedType = _inferParamTypeInScope(block, i);
    let paramType = (scopedType && scopedType !== TYPES.UNKNOWN) ? scopedType : 'Object';
    if (paramType === 'forint') paramType = 'int';
    // Fall back to cross-class call-site hints when the workspace-internal
    // inference couldn't determine a concrete type.
    if (paramType === 'Object' && _crossClassHints) {
      const _hint = _crossClassHints[i];
      if (_hint && _hint !== 'var') paramType = _hint;
    }
    args.push(paramType + ' ' + paramName);
  }
  return args;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helper: build the full method body code.
// Returns the complete "public [static] [returnType] name(params) { … }" string.
// ─────────────────────────────────────────────────────────────────────────────
function buildMethodCode(block, generator, isStatic) {
  const rawFuncName = block.getFieldValue('NAME') || 'unbekannt';
  // Allow an explicit return type prefix in the method name:
  // e.g. "int myMethod" → return type "int", method name "myMethod".
  const _parsedFuncName = parseExplicitSignature(rawFuncName);
  const funcName = _parsedFuncName ? _parsedFuncName.name : rawFuncName;
  const explicitReturnType = _parsedFuncName?.type ?? null;
  const explicitModifier = _parsedFuncName?.modifier ?? null;

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
    returnType = _computeReturnType(block);
    returnValue = generator.INDENT + 'return ' + returnValue + ';\n';
  }

  // An explicit return type written into the method name (e.g. "int myMethod")
  // overrides the type inferred from the connected return block.
  if (explicitReturnType) returnType = explicitReturnType;

  // --- parameters ---
  const args = _buildParams(block, funcName, isStatic);

  const staticMod = isStatic ? 'static ' : '';
  const accessMod = explicitModifier || 'public';
  const signature = `${accessMod} ${staticMod}${returnType} ${funcName}(${args.join(', ')})`;
  const code = `${signature} {\n${xfix1}${loopTrap}${branch}${xfix2}${returnValue}}`;
  return generator.scrub_(block, code);
}


// ─────────────────────────────────────────────────────────────────────────────
// Block generators
// ─────────────────────────────────────────────────────────────────────────────

export function java_static_method_noreturn(block, generator) {
  const rawFuncName = block.getFieldValue('NAME') || 'unbekannt';
  const _p = parseExplicitSignature(rawFuncName);
  const funcName = _p ? _p.name : rawFuncName;
  const code = buildMethodCode(block, generator, true);
  generator.definitions_['%static_' + funcName] = code;
  LocalStorageManager.storeMethods(getClassName(), { name: funcName, arguments: block.arguments_ || [], isStatic: true, hasReturn: false });
  return null;
}

export function java_static_method_return(block, generator) {
  const rawFuncName = block.getFieldValue('NAME') || 'unbekannt';
  const _p = parseExplicitSignature(rawFuncName);
  const funcName = _p ? _p.name : rawFuncName;
  const returnType = _p?.type ?? _computeReturnType(block);
  const code = buildMethodCode(block, generator, true);
  generator.definitions_['%static_' + funcName] = code;
  LocalStorageManager.storeMethods(getClassName(), { name: funcName, arguments: block.arguments_ || [], isStatic: true, hasReturn: true, returnType });
  return null;
}

export function java_method_noreturn(block, generator) {
  const rawFuncName = block.getFieldValue('NAME') || 'unbekannt';
  const _p = parseExplicitSignature(rawFuncName);
  const funcName = _p ? _p.name : rawFuncName;
  const code = buildMethodCode(block, generator, false);
  generator.definitions_['%method_' + funcName] = code;
  LocalStorageManager.storeMethods(getClassName(), { name: funcName, arguments: block.arguments_ || [], isStatic: false, hasReturn: false });
  return null;
}

export function java_method_return(block, generator) {
  const rawFuncName = block.getFieldValue('NAME') || 'unbekannt';
  const _p = parseExplicitSignature(rawFuncName);
  const funcName = _p ? _p.name : rawFuncName;
  const returnType = _p?.type ?? _computeReturnType(block);
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
  const rawName = block.getFieldValue('NAME');
  const _p = parseExplicitSignature(rawName);
  const name = _p ? _p.name : rawName;
  const args = buildCallArgs(block, generator);
  return `${name}(${args});
`;
}

export function java_static_method_call_return(block, generator) {
  const rawName = block.getFieldValue('NAME');
  const _p = parseExplicitSignature(rawName);
  const name = _p ? _p.name : rawName;
  const args = buildCallArgs(block, generator);
  return [`${name}(${args})`, Order.ATOMIC];
}

export function java_method_call_noreturn(block, generator) {
  const rawName = block.getFieldValue('NAME');
  const _p = parseExplicitSignature(rawName);
  const name = _p ? _p.name : rawName;
  const args = buildCallArgs(block, generator);
  return `${name}(${args});
`;
}

export function java_method_call_return(block, generator) {
  const rawName = block.getFieldValue('NAME');
  const _p = parseExplicitSignature(rawName);
  const name = _p ? _p.name : rawName;
  const args = buildCallArgs(block, generator);
  return [`${name}(${args})`, Order.ATOMIC];
}

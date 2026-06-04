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

/**
 * Infers the Java type of a method parameter from how java_param_get blocks
 * with matching display-name are used inside THIS method's body only.
 *
 * @param {Blockly.Block} methodBlock – the method/constructor def block
 * @param {number} paramIndex         – index into methodBlock.arguments_
 * @returns {string} Java type string, or TYPES.UNKNOWN ('var') if undetermined
 */
function _inferParamTypeInScope(methodBlock, paramIndex) {
  const paramName = methodBlock.arguments_?.[paramIndex];
  if (!paramName) return TYPES.UNKNOWN;

  const ws = methodBlock.workspace;

  // These parent block types accept any Java Object and therefore do NOT
  // constrain the type of the value plugged into them.
  const TYPE_AGNOSTIC_PARENTS = new Set([
    'text_join', 'text_print', 'text_append',
  ]);

  /**
   * Given a java_param_get block, checks whether its variable matches paramName
   * and, if so, returns the Java type inferred from how it is connected.
   * Returns null when no conclusion can be drawn.
   */
  function _checkParamBlock(pb) {
    // Match by the workspace variable's display name, NOT by ID.
    // The ID may have been redirected to another method's variable by the
    // onchange handler, but the display name is always correct.
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

  // ── Strategy 1: fast path via getDescendants ──────────────────────────────
  // Works in all normal cases (method block is a proper container).
  for (const descendant of methodBlock.getDescendants(false)) {
    if (descendant.type !== 'java_param_get') continue;
    const t = _checkParamBlock(descendant);
    if (t) return t;
  }

  // ── Strategy 2: workspace scan with explicit ancestor check ───────────────
  // Fallback for edge cases where getDescendants misses connected blocks.
  if (ws) {
    for (const pb of ws.getBlocksByType('java_param_get', false)) {
      // Walk up the parent chain to verify this block is inside methodBlock.
      let anc = pb.getParent?.();
      let inside = false;
      while (anc) {
        if (anc === methodBlock) { inside = true; break; }
        anc = anc.getParent?.();
      }
      if (!inside) continue;
      const t = _checkParamBlock(pb);
      if (t) return t;
    }
  }

  return TYPES.UNKNOWN;
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

  // An explicit return type written into the method name (e.g. "int myMethod")
  // overrides the type inferred from the connected return block.
  if (explicitReturnType) returnType = explicitReturnType;

  // --- parameters ---
  const ws = Blockly.getMainWorkspace();
  const args = [];
  if (block.arguments_ && block.arguments_.length) {
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
      // Use the param's own ID from paramIds_ (not getVarModels which is undefined
      // on paramMixin and always returns []).  getVariableType looks up how the
      // variable is actually *used* in the body to infer its type.
      const paramId = block.paramIds_ ? block.paramIds_[i] : null;
      let paramType = 'Object';
      // ── Scoped inference: search only this method's body by display name ──
      // Two strategies (getDescendants + ancestor walk) ensure we find the
      // block even if getDescendants has edge-case gaps.
      // NO fallback to workspace-wide getVariableType: that would pick up
      // java_param_get blocks from OTHER methods that share a redirected ID,
      // producing cross-method type contamination.
      const scopedType = _inferParamTypeInScope(block, i);
      paramType = (scopedType && scopedType !== TYPES.UNKNOWN) ? scopedType : 'Object';
      if (paramType === 'forint') paramType = 'int';
      // Fall back to cross-class call-site hints when the workspace-internal
      // inference couldn't determine a concrete type.
      if (paramType === 'Object' && _crossClassHints) {
        const _hint = _crossClassHints[i];
        if (_hint && _hint !== 'var') paramType = _hint;
      }
      args.push(paramType + ' ' + paramName);
    }
  }

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

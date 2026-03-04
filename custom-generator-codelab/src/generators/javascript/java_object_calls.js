/**
 * @fileoverview Java code generator for object-method-call and external-static
 * method-call blocks.
 *
 *  java_obj_method_call_noreturn  → obj.methode(args);
 *  java_obj_method_call_return    → [obj.methode(args), Order.FUNCTION_CALL]
 *  java_ext_static_call_noreturn  → Klasse.methode(args);
 *  java_ext_static_call_return    → [Klasse.methode(args), Order.FUNCTION_CALL]
 */

import { Order } from './javascript_generator.js';

// ─── Shared helper ────────────────────────────────────────────────────────────
function buildCallArgs(block, generator) {
  const args = [];
  for (let i = 0; block.getInput('ARG' + i); i++) {
    args.push(generator.valueToCode(block, 'ARG' + i, Order.NONE) || 'null');
  }
  return args.join(', ');
}

// ─────────────────────────────────────────────────────────────────────────────
// Object method calls
// ─────────────────────────────────────────────────────────────────────────────

/**
 * java_obj_method_call_noreturn
 * Generates:  obj.methode(args);
 */
export function java_obj_method_call_noreturn(block, generator) {
  const obj    = generator.valueToCode(block, 'OBJ', Order.MEMBER) || 'null';
  const method = block.getFieldValue('METHOD') || 'methode';
  const args   = buildCallArgs(block, generator);
  return `${obj}.${method}(${args});\n`;
}

/**
 * java_obj_method_call_return
 * Generates:  [obj.methode(args), Order.FUNCTION_CALL]
 */
export function java_obj_method_call_return(block, generator) {
  const obj    = generator.valueToCode(block, 'OBJ', Order.MEMBER) || 'null';
  const method = block.getFieldValue('METHOD') || 'methode';
  const args   = buildCallArgs(block, generator);
  return [`${obj}.${method}(${args})`, Order.FUNCTION_CALL];
}

// ─────────────────────────────────────────────────────────────────────────────
// External static class method calls
// ─────────────────────────────────────────────────────────────────────────────

/**
 * java_ext_static_call_noreturn
 * Generates:  Klasse.methode(args);
 */
export function java_ext_static_call_noreturn(block, generator) {
  const cls    = block.getFieldValue('CLASS')  || 'Klasse';
  const method = block.getFieldValue('METHOD') || 'methode';
  const args   = buildCallArgs(block, generator);
  return `${cls}.${method}(${args});\n`;
}

/**
 * java_ext_static_call_return
 * Generates:  [Klasse.methode(args), Order.FUNCTION_CALL]
 */
export function java_ext_static_call_return(block, generator) {
  const cls    = block.getFieldValue('CLASS')  || 'Klasse';
  const method = block.getFieldValue('METHOD') || 'methode';
  const args   = buildCallArgs(block, generator);
  return [`${cls}.${method}(${args})`, Order.FUNCTION_CALL];
}

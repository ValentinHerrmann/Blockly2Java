/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.utils.idGenerator

/**
 * Legal characters for the universally unique IDs.  Should be all on
 * a US keyboard.  No characters that conflict with XML or JSON.
 * Requests to remove additional 'problematic' characters from this
 * soup will be denied.  That's your failure to properly escape in
 * your own environment.  Issues #251, #625, #682, #1304.
 */
const soup =
  '!#$%()*+,-./:;=?@[]^_`{|}~' +
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Namespace object for internal implementations we want to be able to
 * stub in tests. Do not use externally.
 *
 * @internal
 */
const internal = {
  /**
   * Generate a random unique ID.  This should be globally unique.
   * 87 characters ^ 20 length is greater than 128 bits (better than a UUID).
   *
   * @returns A globally unique ID string.
   */
  genUid: () => {
    const length = 20;
    const soupLength = soup.length;
    const id = [];
    const bytes = secureRandomBytes(length);
    for (let i = 0; i < length; i++) {
      id[i] = soup.charAt(bytes[i] % soupLength);
    }
    return id.join('');
  },
};
export const TEST_ONLY = internal;

/** Return cryptographically secure random bytes when available. */
function secureRandomBytes(n: number): Uint8Array {
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto && typeof (globalThis as any).crypto.getRandomValues === 'function') {
    const arr = new Uint8Array(n);
    (globalThis as any).crypto.getRandomValues(arr);
    return arr;
  }
  try {
    // Node.js fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('node:crypto');
    return nodeCrypto.randomBytes(n);
  } catch (e) {
    // Last-resort fallback to Math.random (non-crypto). Keep bounded and
    // small to avoid predictable outputs for most usages.
    const arr = new Uint8Array(n);
    for (let i = 0; i < n; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
  }
}

/**
 * Return a random integer in [0, max).
 * Uses cryptographically secure source when possible.
 */
export function randomInt(max: number): number {
  if (max <= 0) return 0;
  const uint32 = secureRandomUint32();
  return uint32 % max;
}

function secureRandomUint32(): number {
  if (typeof globalThis !== 'undefined' && (globalThis as any).crypto && typeof (globalThis as any).crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    (globalThis as any).crypto.getRandomValues(arr);
    return arr[0];
  }
  try {
    const nodeCrypto = require('node:crypto');
    return nodeCrypto.randomBytes(4).readUInt32LE(0);
  } catch (e) {
    return Math.floor(Math.random() * 0xffffffff);
  }
}

/** Return a numeric suffix string similar to String(Math.random()).substring(2) */
export function randomSuffix(digits = 10): string {
  const bytes = secureRandomBytes(digits);
  let s = '';
  for (let i = 0; i < digits; i++) {
    s += (bytes[i] % 10).toString();
  }
  return s;
}

/** Next unique ID to use. */
let nextId = 0;

/**
 * Generate the next unique element IDs.
 * IDs are compatible with the HTML4 'id' attribute restrictions:
 * Use only ASCII letters, digits, '_', '-' and '.'
 *
 * For UUIDs use genUid (below) instead; this ID generator should
 * primarily be used for IDs that end up in the DOM.
 *
 * @returns The next unique identifier.
 */
export function getNextUniqueId(): string {
  return 'blockly-' + (nextId++).toString(36);
}

/**
 * Generate a random unique ID.
 *
 * @see internal.genUid
 * @returns A globally unique ID string.
 */
export function genUid(): string {
  return internal.genUid();
}

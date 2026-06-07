// Native Node.js test runner using built-in node:test framework and JSDOM.
// Treats this file as an ES module due to the .mjs extension.
import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize JSDOM environment to mock browser APIs required by Blockly and generators
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost/'
});
globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.sessionStorage = dom.window.sessionStorage;
globalThis.localStorage = dom.window.localStorage;
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  writable: true,
  configurable: true
});

// Import standard Blockly blocks
import 'blockly/blocks.js';

import * as Blockly from 'blockly/core';
import deLocale from 'blockly/msg/de.js';
Blockly.setLocale(deLocale);

// Import custom blocks to register them
import '../src/blocks/constructor.js';
import '../src/blocks/java_method_blocks.js';
import '../src/blocks/java_object_call_blocks.js';
import '../src/blocks/java_graphics_blocks.js';
import '../src/blocks/text.js';
import '../src/blocks/custom_loops.js';
import '../src/blocks/arrays.js';
import '../src/blocks/lists.js';
import { javaGenerator, setClassName, setExtendsClass } from '../src/generators/java.js';
import { CodeTransformer } from '../src/utils/CodeTransformer.js';

describe('Blockly to Java Translation Tests', () => {
  const fixturesDir = path.resolve(__dirname, 'fixtures');

  if (!fs.existsSync(fixturesDir)) {
    throw new Error(`Fixtures directory not found at: ${fixturesDir}`);
  }

  function runTestCase(className, jsonPath, javaPath) {
    const workspaceJson = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    const expectedJava = fs.readFileSync(javaPath, 'utf-8');

    // Reset state for each test case
    setClassName(className);
    setExtendsClass('');

    const workspace = new Blockly.Workspace();
    Blockly.common.setMainWorkspace(workspace);
    try {
      Blockly.serialization.workspaces.load(workspaceJson, workspace);
      const rawCode = javaGenerator.workspaceToCode(workspace);
      const generatedCode = CodeTransformer.transformCode(rawCode);

      // Compare outputs normalizing line endings and trimming
      const normalize = str => str.replace(/\r\n/g, '\n').trim();
      const normGenerated = normalize(generatedCode);
      const normExpected = normalize(expectedJava);
      assert.strictEqual(
        normGenerated,
        normExpected,
        `Generated code does not match expected output.\n\nACTUAL:\n${normGenerated}\n\nEXPECTED:\n${normExpected}`
      );
    } finally {
      workspace.dispose();
    }
  }

  describe('Project: empty_main', () => {
    it('should translate empty_main/test_main correctly to Java', () => {
      runTestCase('test_main', path.join(fixturesDir, 'empty_main', 'test_main.json'), path.join(fixturesDir, 'empty_main', 'test_main.java'));
    });
  });

  describe('Project: twoclass_mtdctr_params', () => {
    it('should translate twoclass_mtdctr_params/Main correctly to Java', () => {
      runTestCase('Main', path.join(fixturesDir, 'twoclass_mtdctr_params', 'Main.json'), path.join(fixturesDir, 'twoclass_mtdctr_params', 'Main.java'));
    });

    it('should translate twoclass_mtdctr_params/Test correctly to Java', () => {
      runTestCase('Test', path.join(fixturesDir, 'twoclass_mtdctr_params', 'Test.json'), path.join(fixturesDir, 'twoclass_mtdctr_params', 'Test.java'));
    });
  });

  describe('Project: twomethod_parameters', () => {
    it('should translate twomethod_parameters/Main correctly to Java', () => {
      runTestCase('Main', path.join(fixturesDir, 'twomethod_parameters', 'Main.json'), path.join(fixturesDir, 'twomethod_parameters', 'Main.java'));
    });
  });

  describe('Project: arrays', () => {
    it('should translate arrays/Main correctly to Java', () => {
      runTestCase('Main', path.join(fixturesDir, 'arrays', 'Main.json'), path.join(fixturesDir, 'arrays', 'Main.java'));
    });
  });

  describe('Project: arrays_types', () => {
    it('should translate arrays_types/Main correctly to Java', () => {
      runTestCase('Main', path.join(fixturesDir, 'arrays_types', 'Main.json'), path.join(fixturesDir, 'arrays_types', 'Main.java'));
    });
  });
});


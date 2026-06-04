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

// Import custom blocks to register them
import '../src/blocks/constructor.js';
import '../src/blocks/java_method_blocks.js';
import '../src/blocks/java_object_call_blocks.js';
import '../src/blocks/java_graphics_blocks.js';
import '../src/blocks/text.js';
import '../src/blocks/custom_loops.js';
import { javaGenerator, setClassName, setExtendsClass } from '../src/generators/java.js';
import { CodeTransformer } from '../src/utils/CodeTransformer.js';
import * as Blockly from 'blockly/core';

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
    try {
      Blockly.serialization.workspaces.load(workspaceJson, workspace);
      const rawCode = javaGenerator.workspaceToCode(workspace);
      const generatedCode = CodeTransformer.transformCode(rawCode);

      // Compare outputs normalizing line endings and trimming
      const normalize = str => str.replace(/\r\n/g, '\n').trim();
      assert.strictEqual(normalize(generatedCode), normalize(expectedJava));
    } finally {
      workspace.dispose();
    }
  }

  const files = fs.readdirSync(fixturesDir);
  const singleTestCases = [];
  const projects = [];

  files.forEach(file => {
    const filePath = path.join(fixturesDir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      projects.push({
        name: file,
        dir: filePath
      });
    } else if (file.endsWith('.json')) {
      singleTestCases.push(path.basename(file, '.json'));
    }
  });

  // Run single-file test cases
  singleTestCases.forEach(testCase => {
    it(`should translate ${testCase} correctly to Java`, () => {
      const jsonPath = path.join(fixturesDir, `${testCase}.json`);
      const javaPath = path.join(fixturesDir, `${testCase}.java`);
      runTestCase(testCase, jsonPath, javaPath);
    });
  });

  // Run project-based test cases (folders)
  projects.forEach(project => {
    describe(`Project: ${project.name}`, () => {
      const projectFiles = fs.readdirSync(project.dir);
      const testCases = projectFiles
        .filter(file => file.endsWith('.json'))
        .map(file => path.basename(file, '.json'));

      testCases.forEach(testCase => {
        it(`should translate ${project.name}/${testCase} correctly to Java`, () => {
          const jsonPath = path.join(project.dir, `${testCase}.json`);
          const javaPath = path.join(project.dir, `${testCase}.java`);
          runTestCase(testCase, jsonPath, javaPath);
        });
      });
    });
  });
});

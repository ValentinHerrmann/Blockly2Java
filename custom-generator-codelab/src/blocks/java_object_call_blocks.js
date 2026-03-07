/**
 * Custom Blockly blocks for calling methods on objects and static methods
 * of external / other classes:
 *
 *  - java_obj_method_call_noreturn  → variable.method(args);
 *  - java_obj_method_call_return    → variable.method(args)  [value block]
 *  - java_ext_static_call_noreturn  → ClassName.method(args);
 *  - java_ext_static_call_return    → ClassName.method(args) [value block]
 *
 * METHOD and CLASS fields use FieldDropdown:
 *  - java_obj_method_call_*  : METHOD dropdown lists all instance methods
 *    currently defined in the workspace (java_method_noreturn / java_method_return).
 *    Selecting a method auto-populates the correct argument slots.
 *
 *  - java_ext_static_call_*  : CLASS dropdown lists all classes that have
 *    known static methods (from LocalStorageManager or current workspace static
 *    method blocks).  METHOD dropdown filters to static methods of the chosen
 *    class.  Selecting a method auto-populates argument slots.
 *
 * Serialisation:
 *   - CLASS / METHOD field values are serialized by Blockly's standard field
 *     mechanism (no need to duplicate them in mutation).
 *   - argCount_ and argNames_ are stored in <mutation> so the block shape can
 *     be restored without re-running the auto-detection.
 */

import * as Blockly from 'blockly/core';
import LocalStorageManager from '../utils/LocalStorageManager.js';
import { getClassName } from '../generators/javascript/javascript_generator.js';

// ─── Colour constants ─────────────────────────────────────────────────────────
const OBJ_CALL_COLOUR = '#ae42ae';   // teal-blue  – method call on an object
const EXT_STA_COLOUR  = '#b94646';   // amber/gold – static method of another class

function normalizeDropdownToken(value) {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function normalizeArgumentNames(args) {
  if (!Array.isArray(args)) return [];
  return args
    .map((name) => normalizeDropdownToken(name))
    .filter((name) => name !== null);
}

// ─────────────────────────────────────────────────────────────────────────────
// Option generators (called by FieldDropdown at open-time — always fresh)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns [[displayName, value], …] for all instance methods defined in ws.
 * Falls back to a placeholder when no methods have been defined yet.
 * @param {Blockly.Workspace|null} ws
 * @returns {Array<[string,string]>}
 */
function getInstanceMethodOptions() {
  const seen = new Set();
  const opts = [];

  // 1. Methods from previously generated / saved classes (LocalStorageManager).
  const allMethods = LocalStorageManager.getAllMethods();
  for (const methods of Object.values(allMethods)) {
    for (const m of methods) {
      const methodName = normalizeDropdownToken(m?.name);
      if (!m?.isStatic && methodName && !seen.has(methodName)) {
        opts.push([methodName, methodName]);
        seen.add(methodName);
      }
    }
  }

  // 2. Methods defined in the currently open workspace.
  const workspace = Blockly.getMainWorkspace();
  if (workspace) {
    for (const type of ['java_method_noreturn', 'java_method_return']) {
      for (const blk of workspace.getBlocksByType(type, true)) {
        const name = normalizeDropdownToken(blk.getFieldValue('NAME'));
        if (name && !seen.has(name)) {
          opts.push([name, name]);
          seen.add(name);
        }
      }
    }
  }

  return opts.length > 0 ? opts : [['(keine Methoden)', '__none__']];
}

/**
 * Returns [[className, className], …] for all classes with known static methods.
 * Sources: LocalStorageManager (previously generated classes) and the current
 * workspace's static def-blocks.
 * @param {Blockly.Workspace|null} ws
 * @returns {Array<[string,string]>}
 */
function getStaticClassOptions(_ws) {
  const workspace  = Blockly.getMainWorkspace();
  const classNames = new Set();

  // Classes stored from previous code generations.
  const allMethods = LocalStorageManager.getAllMethods();
  for (const [cls, methods] of Object.entries(allMethods)) {
    const className = normalizeDropdownToken(cls);
    if (!className) continue;
    if ((methods || []).some((m) => m?.isStatic && normalizeDropdownToken(m?.name))) {
      classNames.add(className);
    }
  }

  // Current workspace class if it has static method def-blocks.
  // Use getClassName() when available; if not set yet, try to add the class
  // anyway by checking for the presence of static def-blocks.
  if (workspace) {
    const staticBlocks = ['java_static_method_noreturn', 'java_static_method_return']
      .flatMap(t => workspace.getBlocksByType(t, true));
    if (staticBlocks.length > 0) {
      const cls = normalizeDropdownToken(getClassName());
      if (cls) classNames.add(cls);
    }
  }

  const opts = [...classNames].map(c => [c, c]);
  return opts.length > 0 ? opts : [['Klasse', 'Klasse']];
}

/**
 * Returns metadata for all static methods of className.
 * Merges LocalStorageManager data with workspace def-blocks (for the current class).
 * @param {string}                 className
 * @param {Blockly.Workspace|null} ws
 * @returns {Array<{name:string, arguments:string[], isStatic:boolean, hasReturn:boolean}>}
 */
function getStaticMethodsForClass(className, _ws) {
  const normalizedClassName = normalizeDropdownToken(className);
  if (!normalizedClassName || normalizedClassName === 'Klasse') return [];
  const workspace = Blockly.getMainWorkspace();
  const methods   = [];
  const seen      = new Set();

  // From LocalStorageManager (methods stored during previous code generations).
  const allMethods = LocalStorageManager.getAllMethods();
  for (const m of (allMethods[normalizedClassName] || [])) {
    const methodName = normalizeDropdownToken(m?.name);
    if (m?.isStatic && methodName && !seen.has(methodName)) {
      methods.push({
        ...m,
        name: methodName,
        arguments: normalizeArgumentNames(m?.arguments),
      });
      seen.add(methodName);
    }
  }

  // From workspace def-blocks.
  // Include when className matches the currently open class OR when getClassName()
  // hasn't been set yet (code not yet generated for this class).
  const currentClass = normalizeDropdownToken(getClassName());
  if (workspace && (normalizedClassName === currentClass || !currentClass)) {
    for (const type of ['java_static_method_noreturn', 'java_static_method_return']) {
      for (const blk of workspace.getBlocksByType(type, true)) {
        const name = normalizeDropdownToken(blk.getFieldValue('NAME'));
        if (name && !seen.has(name)) {
          methods.push({
            name,
            arguments: normalizeArgumentNames(blk.arguments_),
            isStatic:  true,
            hasReturn: type === 'java_static_method_return',
          });
          seen.add(name);
        }
      }
    }
  }

  return methods;
}

/**
 * Returns [[name, name], …] for static methods of className.
 * @param {string}                 className
 * @param {Blockly.Workspace|null} ws
 * @returns {Array<[string,string]>}
 */
function getStaticMethodOptions(className, ws) {
  const methods = getStaticMethodsForClass(className, ws);
  const opts = methods
    .map((m) => {
      const methodName = normalizeDropdownToken(m?.name);
      return methodName ? [methodName, methodName] : null;
    })
    .filter(Boolean);
  return opts.length > 0 ? opts : [['methode', 'methode']];
}

/**
 * Returns [[name, name], …] for void (no-return) static methods of className.
 */
function getStaticMethodOptionsVoid(className, ws) {
  const methods = getStaticMethodsForClass(className, ws);
  const opts = methods
    .filter(m => !m.hasReturn)
    .map((m) => {
      const methodName = normalizeDropdownToken(m?.name);
      return methodName ? [methodName, methodName] : null;
    })
    .filter(Boolean);
  return opts.length > 0 ? opts : [['methode', 'methode']];
}

/**
 * Returns [[name, name], …] for static methods with a return value of className.
 */
function getStaticMethodOptionsWithReturn(className, ws) {
  const methods = getStaticMethodsForClass(className, ws);
  const opts = methods
    .filter(m => m.hasReturn)
    .map((m) => {
      const methodName = normalizeDropdownToken(m?.name);
      return methodName ? [methodName, methodName] : null;
    })
    .filter(Boolean);
  return opts.length > 0 ? opts : [['methode', 'methode']];
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared utility: read a <field name="…"> text value from a <block> XML node.
// Returns null when the element is absent (e.g. during fresh block creation).
// Used by domToMutation to pre-read field values before Blockly applies them,
// so FieldDropdown instances start with valid values and don't crash renders.
// ─────────────────────────────────────────────────────────────────────────────
function _readXmlField(blockEl, fieldName) {
  if (!blockEl) return null;
  for (const child of blockEl.children) {
    if (child.tagName?.toLowerCase() === 'field' &&
        child.getAttribute('name') === fieldName) {
      return child.textContent ?? null;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared utility: silently restore a FieldDropdown value after a rebuild.
// Events are disabled so the change doesn't re-trigger onchange.
// Skips the call when value is null or not in the current option list.
// ─────────────────────────────────────────────────────────────────────────────
function _restoreFieldValue(block, fieldName, value) {
  if (value == null) return;
  const field = block.getField(fieldName);
  if (!field) return;
  if (typeof field.getOptions === 'function') {
    const opts = field.getOptions();
    if (opts && !opts.find(o => o[1] === value)) return;
  }
  Blockly.Events.disable();
  try { field.setValue(value); } catch (_) { /* ignore */ }
  finally { Blockly.Events.enable(); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mixin: "call on object"   (java_obj_method_call_*)
//
// Layout
//   VALUE  "Methode auf  [OBJ ←]"
//   DUMMY  "." [METHOD ▾] "()"          ← 0 args
//   VALUE  "." [METHOD ▾] "( arg1 ,"    ← 1+ args (first row)
//   VALUE  "  argN … )"                 ← subsequent args (right-aligned)
// ─────────────────────────────────────────────────────────────────────────────
const objCallMixin = {
  argCount_:  0,
  argNames_:  [],
  _inUpdate_: false,

  // ── Serialisation ────────────────────────────────────────────────────────

  mutationToDom() {
    const container = document.createElement('mutation');
    container.setAttribute('args', this.argCount_);
    // Persist the currently selected METHOD so that the value is available
    // during domToMutation in JSON-serialisation mode.  In XML mode the value
    // can be read from sibling <field> elements via _readXmlField, but in JSON
    // mode the mutation is embedded as an XML string whose parent node has no
    // field children, so _readXmlField always returns null.  Storing it here
    // as an attribute ensures the FieldDropdown starts with the right value
    // regardless of serialisation mode, preventing silent fallback to the
    // first available option when LocalStorage is temporarily empty.
    const method = this.getField('METHOD') ? this.getFieldValue('METHOD') : '';
    if (method) container.setAttribute('method', method);
    (this.argNames_ || []).forEach((n, i) => container.setAttribute('name' + i, n));
    return container;
  },

  domToMutation(xmlElement) {
    this.argCount_ = Number.parseInt(xmlElement.getAttribute('args') || '0', 10);
    this.argNames_ = [];
    for (let i = 0; i < this.argCount_; i++) {
      this.argNames_.push(xmlElement.getAttribute('name' + i) || 'arg ' + (i + 1));
    }
    // Read METHOD from the mutation attribute (works in both XML and JSON modes).
    // Fall back to reading from sibling <field> elements on the parent <block>
    // node, which only works in XML-serialisation mode.
    const methodFromAttr = xmlElement.getAttribute('method') || null;
    const blockEl = xmlElement.parentNode;
    const method  = methodFromAttr || _readXmlField(blockEl, 'METHOD');
    this._updateCallLine(method);
  },

  // ── Shape builder ────────────────────────────────────────────────────────

  /**
   * Rebuilds CALL_LINE (and ARG* inputs) to match current argCount_/argNames_.
   * A fresh FieldDropdown for METHOD is created each time; its previous value
   * is restored silently after the inputs are re-attached.
   *
   * @param {string|null} [methodOverride] – value to restore; when null the
   *   current field value is snapshotted before inputs are removed.
   */
  _updateCallLine(methodOverride) {
    if (this._inUpdate_) return;
    this._inUpdate_ = true;
    try {
      const method = methodOverride != null
        ? methodOverride
        : (this.getField('METHOD') ? this.getFieldValue('METHOD') : null);

      // Remove stale inputs.
      let i = 0;
      while (this.getInput('ARG' + i)) this.removeInput('ARG' + i++);
      if (this.getInput('CALL_LINE')) this.removeInput('CALL_LINE');

      const block       = this;
      const methodField = new Blockly.FieldDropdown(() => {
        const opts = getInstanceMethodOptions();
        // If the captured method value is not in the live options (e.g. during
        // an intermediate render before METHOD is formally restored), add it so
        // getTextContent() never returns null and crashes the renderer.
        if (method && !opts.find(o => o[1] === method)) opts.unshift([method, method]);
        return opts;
      });
      methodField.setValidator(function(newValue) {
        if (!block._inUpdate_ && newValue !== '__none__') {
          setTimeout(() => { if (!block._inUpdate_) block._autoApplyMethod(newValue); }, 0);
        }
        return newValue;
      });

      if (this.argCount_ === 0) {
        this.appendDummyInput('CALL_LINE')
          .appendField('.')
          .appendField(methodField, 'METHOD')
          .appendField('()');
      } else {
        const label0  = this.argNames_[0] || 'arg 1';
        const suffix0 = this.argCount_ > 1 ? ' ,' : ' )';
        this.appendValueInput('ARG0')
          .appendField('.')
          .appendField(methodField, 'METHOD')
          .appendField('( ' + label0 + suffix0);
        for (let j = 1; j < this.argCount_; j++) {
          const label  = this.argNames_[j] || 'arg ' + (j + 1);
          const suffix = j + 1 < this.argCount_ ? ' ,' : ' )';
          this.appendValueInput('ARG' + j)
            .setAlign(Blockly.inputs.Align.RIGHT)
            .appendField(label + suffix);
        }
      }

      _restoreFieldValue(this, 'METHOD', method);

      // Ensure newly created FieldDropdowns have their SVG elements
      // initialised.  When _updateCallLine runs from a deferred
      // setTimeout callback the block has already been through
      // initSvg() but block.rendered is still false (set only by
      // renderEfficiently), so insertFieldAt skips field.init().
      // Re-calling initSvg() is safe because field.init() is
      // idempotent (guarded by fieldGroup_).
      if (this.workspace?.rendered && this.initSvg) {
        try { this.initSvg(); } catch (_) { /* headless / disposed */ }
      }
    } finally {
      this._inUpdate_ = false;
    }
  },

  // ── Auto-detection ──────────────────────────────────────────────────────

  /**
   * Looks up methodName in workspace def-blocks, then updates argCount_/
   * argNames_ and rebuilds the shape when found.
   *
   * Skips the rebuild when the current shape already matches the method's
   * argument list — this prevents tearing down (and thus disconnecting) value
   * blocks that the user has already plugged into ARG inputs.
   * @param {string} methodName
   */
  _autoApplyMethod(methodName) {
    const ws = Blockly.getMainWorkspace();

    // 1. Search current workspace def-blocks first.
    if (ws) {
      for (const type of ['java_method_noreturn', 'java_method_return']) {
        for (const block of ws.getBlocksByType(type, true)) {
          if (block.getFieldValue('NAME') === methodName) {
            const argNames = block.arguments_ || [];
            // Skip rebuild when the shape is already correct.
            if (this.argCount_ === argNames.length &&
                argNames.every((n, i) => this.argNames_[i] === n)) {
              return;
            }
            this.argCount_ = argNames.length;
            this.argNames_ = argNames.slice();
            this._updateCallLine(methodName);
            return;
          }
        }
      }
    }

    // 2. Fall back to LocalStorageManager (methods from previously generated classes).
    const allMethods = LocalStorageManager.getAllMethods();
    for (const methods of Object.values(allMethods)) {
      for (const m of methods) {
        const name = normalizeDropdownToken(m?.name);
        if (!m?.isStatic && name === methodName) {
          const argNames = normalizeArgumentNames(m?.arguments);
          // Skip rebuild when the shape is already correct.
          if (this.argCount_ === argNames.length &&
              argNames.every((n, i) => this.argNames_[i] === n)) {
            return;
          }
          this.argCount_ = argNames.length;
          this.argNames_ = argNames.slice();
          this._updateCallLine(methodName);
          return;
        }
      }
    }

    // Method not found anywhere — keep current shape.
  },

  // ── Change listener ─────────────────────────────────────────────────────
  // onchange is intentionally omitted: shape updates are driven by field
  // validators set on the METHOD FieldDropdown inside _updateCallLine/init.
};

// ─────────────────────────────────────────────────────────────────────────────
// Mixin: "external static class"   (java_ext_static_call_*)
//
// Layout
//   DUMMY  "[CLASS ▾] . [METHOD ▾] ()"          ← 0 args
//   VALUE  "[CLASS ▾] . [METHOD ▾] ( arg1 ,"    ← 1+ args (first row)
//   VALUE  "                         argN … )"  ← subsequent args (right-aligned)
//
// Linked dropdowns: selecting CLASS → resets METHOD to first available + auto-applies args.
//                   selecting METHOD → auto-applies args for current CLASS.
// ─────────────────────────────────────────────────────────────────────────────
const extStaticCallMixin = {
  argCount_:  0,
  argNames_:  [],
  _inUpdate_: false,

  // ── Serialisation ────────────────────────────────────────────────────────

  mutationToDom() {
    const container = document.createElement('mutation');
    container.setAttribute('args', this.argCount_);
    // Persist CLASS and METHOD in the mutation so they survive JSON-based
    // deserialization (same reason as in objCallMixin — see its mutationToDom).
    const cls    = this.getField('CLASS')  ? this.getFieldValue('CLASS')  : '';
    const method = this.getField('METHOD') ? this.getFieldValue('METHOD') : '';
    if (cls)    container.setAttribute('class',  cls);
    if (method) container.setAttribute('method', method);
    (this.argNames_ || []).forEach((n, i) => container.setAttribute('name' + i, n));
    return container;
  },

  domToMutation(xmlElement) {
    this.argCount_ = Number.parseInt(xmlElement.getAttribute('args') || '0', 10);
    this.argNames_ = [];
    for (let i = 0; i < this.argCount_; i++) {
      this.argNames_.push(xmlElement.getAttribute('name' + i) || 'arg ' + (i + 1));
    }
    // Read CLASS + METHOD from mutation attributes first (works in both modes),
    // then fall back to sibling <field> elements (XML mode only).
    const clsFromAttr    = xmlElement.getAttribute('class')  || null;
    const methodFromAttr = xmlElement.getAttribute('method') || null;
    const blockEl = xmlElement.parentNode;
    const cls    = clsFromAttr    || _readXmlField(blockEl, 'CLASS');
    const method = methodFromAttr || _readXmlField(blockEl, 'METHOD');
    this._updateCallLine(cls, method);
  },

  // ── Shape builder ────────────────────────────────────────────────────────

  /**
   * Rebuilds CALL_LINE (and ARG* inputs).
   * Fresh CLASS and METHOD FieldDropdown instances are created per-rebuild.
   * METHOD options are evaluated lazily via a closure that reads the current
   * CLASS field value at dropdown-open time.
   *
   * @param {string|null} [classOverride]
   * @param {string|null} [methodOverride]
   */
  _updateCallLine(classOverride, methodOverride) {
    if (this._inUpdate_) return;
    this._inUpdate_ = true;
    try {
      const cls    = classOverride  != null ? classOverride
                   : (this.getField('CLASS')  ? this.getFieldValue('CLASS')  : null);
      const method = methodOverride != null ? methodOverride
                   : (this.getField('METHOD') ? this.getFieldValue('METHOD') : null);

      // Remove stale inputs.
      let i = 0;
      while (this.getInput('ARG' + i)) this.removeInput('ARG' + i++);
      if (this.getInput('CALL_LINE')) this.removeInput('CALL_LINE');

      const block      = this;
      const classField = new Blockly.FieldDropdown(() => {
        const opts = getStaticClassOptions();
        // If the captured cls value is not in the live options (e.g. during an
        // intermediate render before CLASS is formally restored), add it so
        // getTextContent() never returns null and crashes the renderer.
        if (cls && !opts.find(o => o[1] === cls)) opts.unshift([cls, cls]);
        return opts;
      });
      classField.setValidator(function(newValue) {
        if (!block._inUpdate_) {
          setTimeout(() => {
            if (block._inUpdate_) return;
            const wantsReturn = block.type === 'java_ext_static_call_return';
            const allMethods  = getStaticMethodsForClass(newValue, null);
            const methods     = allMethods.filter(m => wantsReturn ? m.hasReturn : !m.hasReturn);
            // Skip rebuild when the currently selected method is still valid
            // for this class and the shape already matches its arg list.
            // This prevents tearing out connected value blocks when the
            // validator fires after workspace restore (load) without the user
            // having actually changed the class.
            const currentMethod = block.getField?.('METHOD') ? block.getFieldValue('METHOD') : null;
            if (currentMethod) {
              const currentMethodData = methods.find(m => m.name === currentMethod);
              if (currentMethodData) {
                const newArgNames = currentMethodData.arguments || [];
                if (block.argCount_ === newArgNames.length &&
                    newArgNames.every((n, i) => block.argNames_[i] === n)) {
                  return; // shape already correct, skip rebuild
                }
              }
            }
            if (methods.length > 0) {
              const first = methods[0];
              block.argCount_ = (first.arguments || []).length;
              block.argNames_ = (first.arguments || []).slice();
              block._updateCallLine(newValue, first.name);
            } else {
              block.argCount_ = 0;
              block.argNames_ = [];
              block._updateCallLine(newValue, null);
            }
          }, 0);
        }
        return newValue;
      });

      // METHOD options depend on CLASS — evaluated at dropdown-open time.
      const methodField = new Blockly.FieldDropdown(() => {
        const selectedCls = block.getField?.('CLASS')
          ? block.getFieldValue('CLASS')
          : (cls || 'Klasse');
        const wantsReturn = block.type === 'java_ext_static_call_return';
        const opts = wantsReturn
          ? getStaticMethodOptionsWithReturn(selectedCls, null)
          : getStaticMethodOptionsVoid(selectedCls, null);
        // Guarantee the captured method value is always present so
        // getTextContent() never returns null during intermediate renders
        // (e.g. when Blockly sets CLASS before it sets METHOD).
        if (method && !opts.find(o => o[1] === method)) opts.unshift([method, method]);
        return opts;
      });
      methodField.setValidator(function(newValue) {
        if (!block._inUpdate_) {
          setTimeout(() => {
            if (!block._inUpdate_) {
              const selectedCls = block.getField?.('CLASS')
                ? block.getFieldValue('CLASS')
                : (cls || 'Klasse');
              block._autoApplyStaticMethod(selectedCls, newValue);
            }
          }, 0);
        }
        return newValue;
      });

      if (this.argCount_ === 0) {
        this.appendDummyInput('CALL_LINE')
          .appendField(classField,  'CLASS')
          .appendField('.')
          .appendField(methodField, 'METHOD')
          .appendField('()');
      } else {
        const label0  = this.argNames_[0] || 'arg 1';
        const suffix0 = this.argCount_ > 1 ? ' ,' : ' )';
        this.appendValueInput('ARG0')
          .appendField(classField,  'CLASS')
          .appendField('.')
          .appendField(methodField, 'METHOD')
          .appendField('( ' + label0 + suffix0);
        for (let j = 1; j < this.argCount_; j++) {
          const label  = this.argNames_[j] || 'arg ' + (j + 1);
          const suffix = j + 1 < this.argCount_ ? ' ,' : ' )';
          this.appendValueInput('ARG' + j)
            .setAlign(Blockly.inputs.Align.RIGHT)
            .appendField(label + suffix);
        }
      }

      // Restore CLASS first so the METHOD options function has the right class.
      _restoreFieldValue(this, 'CLASS',  cls);
      _restoreFieldValue(this, 'METHOD', method);

      // Ensure newly created FieldDropdowns have their SVG elements
      // initialised (see objCallMixin._updateCallLine for full explanation).
      if (this.workspace?.rendered && this.initSvg) {
        try { this.initSvg(); } catch (_) { /* headless / disposed */ }
      }
    } finally {
      this._inUpdate_ = false;
    }
  },

  // ── Auto-detection ──────────────────────────────────────────────────────

  /**
   * Looks up methodName among static methods of className, then updates
   * argCount_/argNames_ and rebuilds the shape when found.
   *
   * Skips the rebuild when the current shape already matches the method's
   * argument list — this prevents tearing down (and thus disconnecting) value
   * blocks that the user has already plugged into ARG inputs.
   * @param {string} className
   * @param {string} methodName
   */
  _autoApplyStaticMethod(className, methodName) {
    const methods = getStaticMethodsForClass(className, null);
    const method  = methods.find(m => m.name === methodName);
    if (!method) return;
    const newArgNames = (method.arguments || []);
    // Skip rebuild when the shape is already correct.
    if (this.argCount_ === newArgNames.length &&
        newArgNames.every((n, i) => this.argNames_[i] === n)) {
      return;
    }
    this.argCount_ = newArgNames.length;
    this.argNames_ = newArgNames.slice();
    this._updateCallLine(className, methodName);
  },

  // ── Change listener ─────────────────────────────────────────────────────
  // onchange is intentionally omitted: shape updates are driven by validators
  // set on CLASS and METHOD FieldDropdown instances inside _updateCallLine/init.
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. OBJECT METHOD CALL – NO RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_obj_method_call_noreturn'] = {
  init() {
    this.argCount_  = 0;
    this.argNames_  = [];
    this._inUpdate_ = false;

    // Fixed receiver row.
    this.appendValueInput('OBJ').appendField('Objekt');

    // Initial 0-arg CALL_LINE.
    const block       = this;
    const methodField = new Blockly.FieldDropdown(getInstanceMethodOptions);
    methodField.setValidator(function(newValue) {
      if (!block._inUpdate_ && newValue !== '__none__') {
        setTimeout(() => { if (!block._inUpdate_) block._autoApplyMethod(newValue); }, 0);
      }
      return newValue;
    });
    this.appendDummyInput('CALL_LINE')
      .appendField('.')
      .appendField(methodField, 'METHOD')
      .appendField('()');

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(OBJ_CALL_COLOUR);
    this.setTooltip(
      'Ruft eine Methode auf einem Objekt auf (kein Rückgabewert). ' +
      'Wähle die Methode im Dropdown – Argumente werden automatisch angelegt.',
    );
    this.setHelpUrl('');
  },
  ...objCallMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. OBJECT METHOD CALL – WITH RETURN VALUE
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_obj_method_call_return'] = {
  init() {
    this.argCount_  = 0;
    this.argNames_  = [];
    this._inUpdate_ = false;

    this.appendValueInput('OBJ').appendField('Objekt');

    const block       = this;
    const methodField = new Blockly.FieldDropdown(getInstanceMethodOptions);
    methodField.setValidator(function(newValue) {
      if (!block._inUpdate_ && newValue !== '__none__') {
        setTimeout(() => { if (!block._inUpdate_) block._autoApplyMethod(newValue); }, 0);
      }
      return newValue;
    });
    this.appendDummyInput('CALL_LINE')
      .appendField('.')
      .appendField(methodField, 'METHOD')
      .appendField('()');

    this.setOutput(true, null);
    this.setColour(OBJ_CALL_COLOUR);
    this.setTooltip(
      'Ruft eine Methode auf einem Objekt auf und gibt den Rückgabewert zurück. ' +
      'Wähle die Methode im Dropdown – Argumente werden automatisch angelegt.',
    );
    this.setHelpUrl('');
  },
  ...objCallMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXTERNAL STATIC CLASS METHOD CALL – NO RETURN
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_ext_static_call_noreturn'] = {
  init() {
    this.argCount_  = 0;
    this.argNames_  = [];
    this._inUpdate_ = false;

    const block      = this;
    const classField = new Blockly.FieldDropdown(getStaticClassOptions);
    classField.setValidator(function(newValue) {
      if (!block._inUpdate_) {
        setTimeout(() => {
          if (block._inUpdate_) return;
          const methods = getStaticMethodsForClass(newValue, null).filter(m => !m.hasReturn);
          const currentMethod = block.getField?.('METHOD') ? block.getFieldValue('METHOD') : null;
          if (currentMethod) {
            const currentMethodData = methods.find(m => m.name === currentMethod);
            if (currentMethodData) {
              const newArgNames = currentMethodData.arguments || [];
              if (block.argCount_ === newArgNames.length &&
                  newArgNames.every((n, i) => block.argNames_[i] === n)) {
                return;
              }
            }
          }
          if (methods.length > 0) {
            const first = methods[0];
            block.argCount_ = (first.arguments || []).length;
            block.argNames_ = (first.arguments || []).slice();
            block._updateCallLine(newValue, first.name);
          } else {
            block.argCount_ = 0;
            block.argNames_ = [];
            block._updateCallLine(newValue, null);
          }
        }, 0);
      }
      return newValue;
    });
    const methodField = new Blockly.FieldDropdown(() => {
      const cls = block.getField?.('CLASS') ? block.getFieldValue('CLASS') : 'Klasse';
      return getStaticMethodOptionsVoid(cls, null);
    });
    methodField.setValidator(function(newValue) {
      if (!block._inUpdate_) {
        setTimeout(() => {
          if (!block._inUpdate_) {
            const cls = block.getField?.('CLASS') ? block.getFieldValue('CLASS') : 'Klasse';
            block._autoApplyStaticMethod(cls, newValue);
          }
        }, 0);
      }
      return newValue;
    });

    this.appendDummyInput('CALL_LINE')
      .appendField(classField,  'CLASS')
      .appendField('.')
      .appendField(methodField, 'METHOD')
      .appendField('()');

    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour(EXT_STA_COLOUR);
    this.setTooltip(
      'Ruft eine statische Methode einer anderen Klasse auf (kein Rückgabewert). ' +
      'Klasse wählen → Methode wählen – Argumente werden automatisch angelegt.',
    );
    this.setHelpUrl('');
  },
  ...extStaticCallMixin,
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. EXTERNAL STATIC CLASS METHOD CALL – WITH RETURN VALUE
// ─────────────────────────────────────────────────────────────────────────────
Blockly.Blocks['java_ext_static_call_return'] = {
  init() {
    this.argCount_  = 0;
    this.argNames_  = [];
    this._inUpdate_ = false;

    const block      = this;
    const classField = new Blockly.FieldDropdown(getStaticClassOptions);
    classField.setValidator(function(newValue) {
      if (!block._inUpdate_) {
        setTimeout(() => {
          if (block._inUpdate_) return;
          const methods = getStaticMethodsForClass(newValue, null).filter(m => m.hasReturn);
          const currentMethod = block.getField?.('METHOD') ? block.getFieldValue('METHOD') : null;
          if (currentMethod) {
            const currentMethodData = methods.find(m => m.name === currentMethod);
            if (currentMethodData) {
              const newArgNames = currentMethodData.arguments || [];
              if (block.argCount_ === newArgNames.length &&
                  newArgNames.every((n, i) => block.argNames_[i] === n)) {
                return;
              }
            }
          }
          if (methods.length > 0) {
            const first = methods[0];
            block.argCount_ = (first.arguments || []).length;
            block.argNames_ = (first.arguments || []).slice();
            block._updateCallLine(newValue, first.name);
          } else {
            block.argCount_ = 0;
            block.argNames_ = [];
            block._updateCallLine(newValue, null);
          }
        }, 0);
      }
      return newValue;
    });
    const methodField = new Blockly.FieldDropdown(() => {
      const cls = block.getField?.('CLASS') ? block.getFieldValue('CLASS') : 'Klasse';
      return getStaticMethodOptionsWithReturn(cls, null);
    });
    methodField.setValidator(function(newValue) {
      if (!block._inUpdate_) {
        setTimeout(() => {
          if (!block._inUpdate_) {
            const cls = block.getField?.('CLASS') ? block.getFieldValue('CLASS') : 'Klasse';
            block._autoApplyStaticMethod(cls, newValue);
          }
        }, 0);
      }
      return newValue;
    });

    this.appendDummyInput('CALL_LINE')
      .appendField(classField,  'CLASS')
      .appendField('.')
      .appendField(methodField, 'METHOD')
      .appendField('()');

    this.setOutput(true, null);
    this.setColour(EXT_STA_COLOUR);
    this.setTooltip(
      'Ruft eine statische Methode einer anderen Klasse auf und gibt den Rückgabewert zurück. ' +
      'Klasse wählen → Methode wählen – Argumente werden automatisch angelegt.',
    );
    this.setHelpUrl('');
  },
  ...extStaticCallMixin,
};

export const OBJ_CALL_COLOUR_EXPORT = OBJ_CALL_COLOUR;
export const EXT_STA_COLOUR_EXPORT  = EXT_STA_COLOUR;

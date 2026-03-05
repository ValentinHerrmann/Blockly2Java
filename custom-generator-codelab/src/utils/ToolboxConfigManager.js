/**
 * ToolboxConfigManager
 *
 * Reads a `blockly-config.json` file that is bundled in an exercise git
 * repository and applies it to the live Blockly workspace toolbox.
 *
 * Config format (blockly-config.json placed at the repo root):
 * {
 *   "version": 1,
 *   "description": "...",       // optional human-readable description
 *   "categories": [
 *     {
 *       "name": "Logik",        // must match the category 'name' in the toolbox
 *       "active": true,         // false → hide the entire category
 *       "blocks": [             // optional; fine-grained per-block control
 *         { "type": "controls_if",    "active": true  },
 *         { "type": "logic_compare",  "active": false }
 *       ]
 *     },
 *     {
 *       "name": "Variablen",    // dynamic flyout category
 *       "active": true,
 *       "subcategories": [      // controls which sections appear inside the flyout
 *         { "name": "Lokale Variablen",  "active": true  },
 *         { "name": "Globale Variablen", "active": false }
 *       ]
 *     },
 *     {
 *       "name": "Methoden",     // dynamic flyout category
 *       "active": true,
 *       "subcategories": [
 *         { "name": "Objekt-Methoden",  "active": true  },
 *         { "name": "Methoden auf Objekten", "active": true }
 *       ]
 *     },
 *     {
 *       "name": "K-Methoden", // dynamic flyout category for static methods
 *       "active": true,
 *       "subcategories": [
 *         { "name": "K-Methoden", "active": true  },
 *         { "name": "Externe Klassen-Methoden", "active": true }
 *       ]
 *     },
 *     {
 *       "name": "Attribute",    // dynamic flyout category
 *       "active": true,
 *       "subcategories": [
 *         { "name": "Instanz-Attribute",  "active": true },
 *         { "name": "Klassen-Attribute",  "active": true }
 *       ]
 *     },
 *     {
 *       "name": "Parameter",    // dynamic flyout: parameter blocks grouped by method
 *       "active": true          // false → hide entire category
 *     }
 *   ]
 * }
 *
 * Rules:
 *  - A category entry with "active": false removes the whole category.
 *  - A category entry with "active": true and no "blocks" array shows all blocks.
 *  - A category entry with "active": true and a "blocks" array shows only the
 *    blocks that are themselves marked "active": true.
 *  - A category entry with a "subcategories" array controls which sections are
 *    rendered inside the flyout of dynamic (custom) categories such as
 *    "Variablen", "Methoden", "Klassen-Methoden", and "Attribute".
 *    Unlisted subcategories default to active.
 *  - Categories without an entry in the config are shown unchanged (default-on).
 *  - Dynamic categories (those with a "custom" property) support only the
 *    category-level active flag and the subcategories array.
 */

import { toolbox as FULL_TOOLBOX } from '../toolboxGrade9.js';

export class ToolboxConfigManager {

  // ── Subcategory config store ────────────────────────────────────────────
  // Populated by apply() so flyout callbacks can consult it at render time.
  // Structure: Map< categoryName, Map< subcategoryName, boolean > >
  static _subcategoryConfigs = new Map();

  // ── Per-subcategory block config store ───────────────────────────────────
  // Holds optional block-level flags inside each subcategory.
  // Structure: Map< categoryName, Map< subcategoryName, Map< blockType, boolean > > >
  static _subcategoryBlockConfigs = new Map();

  /** localStorage key used to persist the active toolbox config across sessions. */
  static STORAGE_KEY = 'b2j_toolbox_config';

  /**
   * The last config object passed to apply(), or null when the full toolbox
   * is active.  Kept in sync with localStorage; use loadStored() to restore
   * it on page load.
   * @type {Object|null}
   */
  static lastConfig = null;

  /**
   * Reads the toolbox config that was last saved to localStorage.
   * Returns null when no config has been stored (full toolbox should be used).
   * @returns {Object|null}
   */
  static loadStored() {
    const raw = globalThis.localStorage?.getItem(this.STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  /**
   * Returns the subcategory active-flags for the given category name, or null
   * if no subcategory config was specified for it.
   * Flyout callbacks use this to selectively render sections.
   *
   * @param {string} categoryName
   * @returns {Map<string, boolean>|null}
   */
  static getSubcategoryConfig(categoryName) {
    return this._subcategoryConfigs.get(categoryName) ?? null;
  }

  /**
   * Returns the block active-flags for a specific subcategory, or null if no
   * block-level config was specified for it.
   * A null return means "show everything"; unlisted block types also default on.
   *
   * @param {string} categoryName
   * @param {string} subcategoryName
   * @returns {Map<string, boolean>|null}
   */
  static getSubcategoryBlockConfig(categoryName, subcategoryName) {
    return this._subcategoryBlockConfigs.get(categoryName)?.get(subcategoryName) ?? null;
  }

  /**
   * Returns whether the given category is active in the current config.
   * Defaults to true when the category has no config entry or when no config
   * is loaded at all (= full toolbox).
   *
   * @param {string} categoryName
   * @returns {boolean}
   */
  static isCategoryActive(categoryName) {
    if (!this.lastConfig?.categories) return true;
    const entry = this.lastConfig?.categories?.find(c => c.name === categoryName);
    return !entry || entry.active !== false;
  }

  /**
   * Parses `configJson` and updates the toolbox on the given Blockly workspace.
   *
   * Passing `null` / `undefined` resets the toolbox to the full default toolbox
   * (useful when cloning a repo that ships no blockly-config.json).
   *
   * @param {string|Object|null} configJson – raw JSON string, already-parsed object, or null to reset
   * @param {import('blockly').WorkspaceSvg} workspace
   */
  static applyConfig(configJson, workspace) {
    if (!workspace) return;

    let config = null;
    if (configJson != null) {
      try {
        config = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;
      } catch (err) {
        console.warn('[ToolboxConfigManager] Failed to parse blockly-config.json:', err);
        config = null;
      }
    }

    const filtered = this.buildFilteredToolbox(config);

    // Remember the last applied config in memory and in localStorage so it
    // survives page reloads / browser session restarts.
    this.lastConfig = config;
    if (config !== null) {
      globalThis.localStorage?.setItem(this.STORAGE_KEY, JSON.stringify(config));
    } else {
      globalThis.localStorage?.removeItem(this.STORAGE_KEY);
    }

    // ── Store subcategory configs for flyout callbacks ────────────────────
    this._subcategoryConfigs.clear();
    this._subcategoryBlockConfigs.clear();
    if (config?.categories) {
      for (const entry of config.categories) {
        if (entry.subcategories && Array.isArray(entry.subcategories)) {
          this._subcategoryConfigs.set(
            entry.name,
            new Map(entry.subcategories.map(s => [s.name, s.active !== false])),
          );
          // Store per-subcategory block flags when present.
          const blockConfigMap = new Map();
          for (const s of entry.subcategories) {
            if (s.blocks && Array.isArray(s.blocks) && s.blocks.length > 0) {
              blockConfigMap.set(s.name, new Map(s.blocks.map(b => [b.type, b.active !== false])));
            }
          }
          if (blockConfigMap.size > 0) {
            this._subcategoryBlockConfigs.set(entry.name, blockConfigMap);
          }
        }
      }
    }

    try {
      workspace.updateToolbox(filtered);
      console.info(
        config
          ? '[ToolboxConfigManager] Toolbox updated from repo config.'
          : '[ToolboxConfigManager] Toolbox reset to full default.',
      );
    } catch (err) {
      console.warn('[ToolboxConfigManager] updateToolbox failed:', err);
    }
  }

  /**
   * Opens a modal dialog that lets the user view and edit the current toolbox
   * config JSON. On save the new config is applied immediately.
   *
   * @param {import('blockly').WorkspaceSvg} workspace
   * @param {Object} fallbackConfig – config to show when no custom config is active
   */
  /**
   * Builds a full "everything active" preset config from FULL_TOOLBOX.
   * @param {Object|null} fallbackConfig – used to populate subcategories for dynamic categories
   * @returns {Object} preset config object
   */
  static _buildPresetAlles(fallbackConfig) {
    const categories = (FULL_TOOLBOX.contents ?? [])
      .filter(item => item.kind?.toLowerCase() === 'category')
      .map(cat => {
        const entry = { name: cat.name, active: true };
        if (cat.custom) {
          const fbCat = (fallbackConfig?.categories ?? []).find(c => c.name === cat.name);
          if (fbCat?.subcategories) {
            entry.subcategories = fbCat.subcategories.map(s => ({
              ...s,
              active: true,
              ...(s.blocks ? { blocks: s.blocks.map(b => ({ ...b, active: true })) } : {}),
            }));
          }
        } else if (cat.contents?.length) {
          entry.blocks = cat.contents
            .filter(b => b.kind?.toLowerCase() === 'block')
            .map(b => ({ type: b.type, active: true }));
        }
        return entry;
      });
    return { version: 1, description: 'Alle Blöcke aktiv', categories };
  }

  static openConfigEditor(workspace, fallbackConfig) {
    // Remove any stale dialog.
    document.getElementById('b2j-config-editor-overlay')?.remove();

    const currentJson = this.lastConfig
      ? JSON.stringify(this.lastConfig, null, 2)
      : JSON.stringify(fallbackConfig ?? {}, null, 2);

    // ── Overlay ──────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'b2j-config-editor-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '9999',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)',
    });

    // ── Dialog box ───────────────────────────────────────────────────────
    const box = document.createElement('div');
    Object.assign(box.style, {
      background: '#252526', color: '#d4d4d4',
      border: '1px solid #3c3c3c', borderRadius: '6px',
      padding: '14px 16px 12px', width: 'min(640px, 90vw)',
      maxHeight: '80vh', display: 'flex', flexDirection: 'column',
      gap: '10px', fontFamily: 'Consolas, monospace', fontSize: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    });

    const title = document.createElement('div');
    title.textContent = 'Toolbox-Konfiguration';
    Object.assign(title.style, {
      font: '600 12px Roboto, sans-serif', letterSpacing: '0.05em',
      textTransform: 'uppercase', opacity: '0.55', flexShrink: '0',
    });
    box.appendChild(title);

    // ── Preset shortcuts ─────────────────────────────────────────────────
    const presetRow = document.createElement('div');
    Object.assign(presetRow.style, {
      display: 'flex', alignItems: 'center', gap: '6px',
      flexShrink: '0', fontFamily: 'Roboto, sans-serif',
    });
    const presetLabel = document.createElement('span');
    presetLabel.textContent = 'Vorlage:';
    Object.assign(presetLabel.style, { fontSize: '11px', opacity: '0.5', marginRight: '2px' });
    presetRow.appendChild(presetLabel);

    const PRESET_ALLES = ToolboxConfigManager._buildPresetAlles(fallbackConfig);

    function makePresetBtn(label, getJson) {
      const btn = document.createElement('button');
      btn.textContent = label;
      Object.assign(btn.style, {
        padding: '3px 10px', border: '1px solid #4a4a4a',
        borderRadius: '3px', background: '#333', color: '#bbb',
        cursor: 'pointer', fontSize: '11px', fontFamily: 'Roboto, sans-serif',
      });
      btn.addEventListener('mouseenter', () => btn.style.background = '#404040');
      btn.addEventListener('mouseleave', () => btn.style.background = '#333');
      btn.onclick = () => { textarea.value = JSON.stringify(getJson(), null, 2); };
      return btn;
    }

    presetRow.appendChild(makePresetBtn('Alles', () => PRESET_ALLES));
    presetRow.appendChild(makePresetBtn('9. Klasse', () => fallbackConfig ?? PRESET_ALLES));
    box.appendChild(presetRow);

    const textarea = document.createElement('textarea');
    textarea.value = currentJson;
    textarea.spellcheck = false;
    Object.assign(textarea.style, {
      flex: '1', minHeight: '300px', maxHeight: '55vh',
      background: '#1c1c1c', color: '#d4d4d4',
      border: '1px solid #3c3c3c', borderRadius: '4px',
      padding: '8px', resize: 'vertical', outline: 'none',
      fontFamily: 'Consolas, monospace', fontSize: '12px',
      lineHeight: '1.5', tabSize: '2',
    });
    box.appendChild(textarea);

    const errMsg = document.createElement('div');
    Object.assign(errMsg.style, {
      color: '#f48771', fontSize: '11px', minHeight: '14px',
      fontFamily: 'Roboto, sans-serif', flexShrink: '0',
    });
    box.appendChild(errMsg);

    // ── Buttons ───────────────────────────────────────────────────────────
    const btnRow = document.createElement('div');
    Object.assign(btnRow.style, {
      display: 'flex', gap: '8px', justifyContent: 'flex-end', flexShrink: '0',
    });

    function makeBtn(label, bg) {
      const btn = document.createElement('button');
      btn.textContent = label;
      Object.assign(btn.style, {
        padding: '5px 14px', border: '1px solid #555',
        borderRadius: '4px', background: bg, color: '#d4d4d4',
        cursor: 'pointer', fontSize: '12px', fontFamily: 'Roboto, sans-serif',
      });
      return btn;
    }

    const resetBtn = makeBtn('Zurücksetzen', '#3a3a3a');
    resetBtn.title = 'Konfiguration löschen und Standard-Toolbox wiederherstellen';
    resetBtn.style.marginRight = 'auto';
    resetBtn.onclick = () => {
      if (!confirm('Toolbox-Konfiguration löschen und vollständige Standard-Toolbox wiederherstellen?')) return;
      this.applyConfig(null, workspace);
      overlay.remove();
    };

    const cancelBtn = makeBtn('Abbrechen', '#3a3a3a');
    cancelBtn.onclick = () => overlay.remove();

    const saveBtn = makeBtn('Speichern', '#0e639c');
    saveBtn.style.border = '1px solid #1177bb';
    saveBtn.onclick = () => {
      let parsed;
      try {
        parsed = JSON.parse(textarea.value);
      } catch (e) {
        errMsg.textContent = 'Ungültiges JSON: ' + e.message;
        return;
      }
      this.applyConfig(parsed, workspace);
      overlay.remove();
    };

    btnRow.appendChild(resetBtn);
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    box.appendChild(btnRow);

    overlay.appendChild(box);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
    textarea.focus();
  }

  /**
   * Returns a new toolbox definition derived from the full default toolbox,
   * filtered according to the given config object.
   *
   * Passing `null` returns the full toolbox unchanged.
   * Can be used independently of a live workspace (e.g. for testing).
   *
   * @param {Object|null} config – parsed blockly-config.json object, or null
   * @returns {Object} Blockly toolbox definition
   */
  static buildFilteredToolbox(config) {
    if (!config?.categories || !Array.isArray(config.categories)) {
      // No category list (or null config) → return full toolbox unchanged.
      return FULL_TOOLBOX;
    }

    // Build a lookup: categoryName → config entry
    const configMap = new Map(
      config.categories.map(entry => [entry.name, entry]),
    );

    const filteredContents = [];

    for (const item of FULL_TOOLBOX.contents) {
      // ── Separators pass through unchanged ────────────────────────────
      if (item.kind === 'sep' || item.kind === 'SEP') {
        filteredContents.push(item);
        continue;
      }

      // ── Category items ────────────────────────────────────────────────
      if (item.kind?.toLowerCase() !== 'category') {
        filteredContents.push(item);
        continue;
      }

      const entry = configMap.get(item.name);

      // No config entry for this category → show unchanged (default-on).
      if (!entry) {
        filteredContents.push(item);
        continue;
      }

      // Explicitly disabled → skip.
      if (entry.active === false) {
        continue;
      }

      // Dynamic category (custom flyout) – only category-level active flag applies.
      if (item.custom) {
        filteredContents.push(item);
        continue;
      }

      // No per-block restrictions → show full category.
      if (!entry.blocks || !Array.isArray(entry.blocks) || entry.blocks.length === 0) {
        filteredContents.push(item);
        continue;
      }

      // Per-block filtering ---------------------
      const blockMap = new Map(
        entry.blocks.map(b => [b.type, b.active !== false]),
      );

      const filteredBlocks = (item.contents ?? []).filter(block => {
        if (block.kind?.toLowerCase() !== 'block') return true; // keep non-block items (labels, buttons…)
        // If this block type is in the config, honour its flag.
        if (blockMap.has(block.type)) return blockMap.get(block.type);
        // Not mentioned → default-on.
        return true;
      });

      // If all blocks were removed, drop the whole category.
      if (filteredBlocks.length === 0) continue;

      filteredContents.push({ ...item, contents: filteredBlocks });
    }

    // Strip trailing separators (cosmetic clean-up).
    while (
      filteredContents.length > 0 &&
      filteredContents[filteredContents.length - 1].kind?.toLowerCase() === 'sep'
    ) {
      filteredContents.pop();
    }

    return { ...FULL_TOOLBOX, contents: filteredContents };
  }
}

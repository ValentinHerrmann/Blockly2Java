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
 *         { "name": "Attribute",           "active": true  },
 *         { "name": "Lokale Variablen",    "active": true  },
 *         { "name": "Statische Attribute", "active": false }
 *       ]
 *     },
 *     {
 *       "name": "Methoden",     // dynamic flyout category
 *       "active": true,
 *       "subcategories": [
 *         { "name": "Objekt-Methoden",  "active": true  },
 *         { "name": "Klassen-Methoden", "active": false }
 *       ]
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
 *    "Variablen" and "Methoden". Unlisted subcategories default to active.
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
   * Parses `configJson` and updates the toolbox on the given Blockly workspace.
   *
   * Passing `null` / `undefined` resets the toolbox to the full default toolbox
   * (useful when cloning a repo that ships no blockly-config.json).
   *
   * @param {string|Object|null} configJson – raw JSON string, already-parsed object, or null to reset
   * @param {import('blockly').WorkspaceSvg} workspace
   */
  static apply(configJson, workspace) {
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

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
      // Deep-clone so Blockly always sees new object references and performs
      // a full re-render rather than silently skipping an "unchanged" def.
      workspace.updateToolbox(JSON.parse(JSON.stringify(filtered)));
      // Reset any open flyout so the UI immediately reflects the new config.
      workspace.getToolbox()?.clearSelection?.();
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
  // ── Block display names (German) ──────────────────────────────────────
  static _blockDisplayNames = {
    // Logik
    controls_if:              'Wenn … tue',
    logic_compare:            'Vergleich (=, ≠, <, >)',
    logic_operation:          'Und / Oder',
    logic_negate:             'Nicht',
    logic_boolean:            'Wahr / Falsch',
    logic_null:               'Null',
    logic_ternary:            'Ternär-Operator (? :)',
    // Schleifen
    controls_repeat_ext:      'Wiederhole … mal',
    controls_whileUntil:      'Solange / Bis',
    controls_for:             'Für-Schleife (von … bis)',
    controls_forEach:         'Für jedes Element',
    controls_flow_statements: 'Abbrechen / Weiter (break/continue)',
    // Mathe
    math_number:              'Zahl',
    math_arithmetic:          'Grundrechenarten (+, −, ×, ÷)',
    math_single:              'Mathemat. Funktion (√, …)',
    math_trig:                'Trigonometrische Funktion',
    math_constant:            'Konstante (π, e, …)',
    math_number_property:     'Zahleneigenschaft (gerade, …)',
    math_round:               'Runden',
    math_on_list:             'Statistik auf Liste',
    math_modulo:              'Rest (Modulo %)',
    math_constrain:           'Wert begrenzen',
    math_random_int:          'Zufallszahl (ganzzahlig)',
    math_random_float:        'Zufallszahl (0 – 1)',
    math_atan2:               'Atan2',
    // Text
    text:                     'Textkonstante',
    text_multiline:           'Mehrzeiliger Text',
    text_join:                'Texte verbinden',
    text_append:              'Text anhängen',
    text_length:              'Länge',
    text_isEmpty:             'Ist leer?',
    text_indexOf:             'Position suchen',
    text_charAt:              'Zeichen an Position',
    text_getSubstring:        'Teilstring',
    text_changeCase:          'Groß-/Kleinschreibung',
    text_trim:                'Leerzeichen entfernen',
    text_count:               'Vorkommen zählen',
    text_replace:             'Ersetzen',
    text_reverse:             'Umkehren (Text)',
    text_print:               'Ausgeben (System.out.print)',
    text_prompt_ext:          'Eingabe (prompt)',
    // Listen
    lists_create_with:        'Liste erstellen',
    lists_repeat:             'Liste wiederholen',
    lists_length:             'Länge der Liste',
    lists_isEmpty:            'Liste leer?',
    lists_indexOf:            'Index suchen',
    lists_getIndex:           'Element lesen',
    lists_setIndex:           'Element setzen',
    lists_getSublist:         'Teilliste',
    lists_split:              'Aufteilen',
    lists_sort:               'Sortieren',
    lists_reverse:            'Umkehren (Liste)',
    // Farben
    colour_picker:            'Farbwähler',
    colour_random:            'Zufallsfarbe',
    colour_rgb:               'Farbe aus RGB',
    colour_blend:             'Farben mischen',
    // Klassen
    defconstructor:           'Konstruktor definieren',
    callconstructor:          'Objekt erzeugen (new)',
    java_extends:             'Klasse erbt von (extends)',
    java_super_call:          'super(…) aufrufen',
  };

  /**
   * Formats a block type string as a human-readable name.
   * Strips common prefixes and title-cases the remainder.
   * @param {string} type
   * @returns {string}
   */
  static _formatBlockType(type) {
    const prefixes = ['controls_', 'logic_', 'math_', 'text_', 'lists_', 'java_', 'colour_', 'variables_'];
    let name = type;
    for (const p of prefixes) {
      if (name.startsWith(p)) { name = name.slice(p.length); break; }
    }
    return name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  /**
   * Builds the initial check-state map used by the visual editor.
   * Merges the current config (if any) with fallbackConfig's subcategory
   * definitions so dynamic categories always show their sections.
   *
   * @param {Object|null} fallbackConfig
   * @returns {Map<string, {active:boolean, blocks?:Map<string,boolean>, subcats?:Map<string,boolean>}>}
   */
  static _buildEditorState(fallbackConfig) {
    const baseConfig = this.lastConfig ?? fallbackConfig;
    const catState = new Map();

    for (const catDef of (FULL_TOOLBOX.contents ?? [])) {
      if (catDef.kind?.toLowerCase() !== 'category') continue;
      const catName = catDef.name;
      const configEntry = baseConfig?.categories?.find(c => c.name === catName);
      const isActive = !configEntry || configEntry.active !== false;

      if (catDef.custom) {
        // Dynamic category – expose subcategory toggles.
        const subcatMap = new Map();
        const fbEntry = (fallbackConfig?.categories ?? []).find(c => c.name === catName);
        // Use fallback's subcategory list as the master list of known sections.
        const allSubcats = fbEntry?.subcategories ?? configEntry?.subcategories ?? [];
        for (const s of allSubcats) {
          const cur = (configEntry?.subcategories ?? []).find(sc => sc.name === s.name);
          subcatMap.set(s.name, cur ? cur.active !== false : true);
        }
        catState.set(catName, { active: isActive, subcats: subcatMap });
      } else {
        // Static category – expose per-block toggles.
        const blockMap = new Map();
        const configBlocks = configEntry?.blocks ?? [];
        const configBlockMap = new Map(configBlocks.map(b => [b.type, b.active !== false]));
        for (const block of (catDef.contents ?? [])) {
          if (block.kind?.toLowerCase() !== 'block') continue;
          blockMap.set(
            block.type,
            configBlockMap.has(block.type) ? configBlockMap.get(block.type) : true,
          );
        }
        catState.set(catName, { active: isActive, blocks: blockMap });
      }
    }
    return catState;
  }

  /**
   * Converts the visual editor's check-state map back into a toolbox
   * config object suitable for applyConfig().
   * Block-level sub-configs inside dynamic-category subcategories
   * (from the current or fallback config) are carried over unchanged.
   *
   * @param {Map} catState
   * @param {Object|null} [referenceConfig] – existing config to inherit sub-block configs from
   * @returns {Object}
   */
  static _buildConfigFromEditorState(catState, referenceConfig) {
    const categories = [];
    for (const [catName, state] of catState) {
      const entry = { name: catName, active: state.active };
      if (state.blocks) {
        entry.blocks = [...state.blocks].map(([type, active]) => ({ type, active }));
      }
      if (state.subcats) {
        // Carry over any per-block configs that were in the reference config
        // for subcategories of dynamic categories (e.g. Methoden, K-Methoden).
        const refCat = (referenceConfig?.categories ?? []).find(c => c.name === catName);
        entry.subcategories = [...state.subcats].map(([name, active]) => {
          const refSub = (refCat?.subcategories ?? []).find(s => s.name === name);
          const sub = { name, active };
          if (refSub?.blocks) sub.blocks = refSub.blocks;
          return sub;
        });
      }
      categories.push(entry);
    }
    return { version: 1, description: 'Benutzerdefinierte Toolbox-Konfiguration', categories };
  }

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
    // Delegate to the visual editor by default.
    ToolboxConfigManager.openVisualConfigEditor(workspace, fallbackConfig);
  }

  /**
   * Opens a visual (checkbox-based) toolbox editor overlay.
   * Categories and individual blocks can be toggled; pressing "Speichern"
   * builds a config from the current state and applies it live.
   *
   * @param {import('blockly').WorkspaceSvg} workspace
   * @param {Object} fallbackConfig – config to show when no custom config is active
   */
  static openVisualConfigEditor(workspace, fallbackConfig) {
    document.getElementById('b2j-config-editor-overlay')?.remove();

    // Build checkbox state from current config (or fallback).
    const catState = ToolboxConfigManager._buildEditorState(fallbackConfig);

    // ── Category colour helper ──────────────────────────────────────────
    const STYLE_COLORS = {
      logic_category:            '#5b80a5',
      loop_category:             '#5ba55b',
      math_category:             '#5b67a5',
      text_category:             '#a5945b',
      list_category:             '#745ba5',
      colour_category:           '#a5ad52',
      variable_category:         '#a57b5b',
      variable_dynamic_category: '#a55b80',
      procedure_category:        '#995ba5',
    };
    function getCatColor(catDef) {
      if (catDef.categorystyle) return STYLE_COLORS[catDef.categorystyle] ?? '#6d7a9a';
      if (catDef.colour != null) {
        const c = catDef.colour;
        if (typeof c === 'number') return `hsl(${c}, 42%, 45%)`;
        if (typeof c === 'string' && /^#/.test(c)) return c;
        const n = parseFloat(c);
        if (!isNaN(n)) return `hsl(${n}, 42%, 45%)`;
        return String(c);
      }
      return '#6d7a9a';
    }

    // ── UI helpers ────────────────────────────────────────────────────────
    function makeSmBtn(text, bg) {
      const b = document.createElement('button');
      b.textContent = text;
      Object.assign(b.style, {
        padding: '3px 9px', border: '1px solid #4a4a4a',
        borderRadius: '3px', background: bg || '#333', color: '#ccc',
        cursor: 'pointer', fontSize: '11px', fontFamily: 'Roboto, sans-serif',
      });
      b.addEventListener('mouseenter', () => { b.style.opacity = '0.8'; });
      b.addEventListener('mouseleave', () => { b.style.opacity = '1'; });
      return b;
    }
    function makeBtn(text, bg, border) {
      const b = document.createElement('button');
      b.textContent = text;
      Object.assign(b.style, {
        padding: '5px 14px', border: `1px solid ${border || '#555'}`,
        borderRadius: '4px', background: bg, color: '#d4d4d4',
        cursor: 'pointer', fontSize: '12px', fontFamily: 'Roboto, sans-serif',
      });
      return b;
    }

    // ── Overlay ────────────────────────────────────────────────────────────
    const overlay = document.createElement('div');
    overlay.id = 'b2j-config-editor-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '9999',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.55)',
    });

    const box = document.createElement('div');
    Object.assign(box.style, {
      background: '#252526', color: '#d4d4d4',
      border: '1px solid #3c3c3c', borderRadius: '6px',
      width: 'min(760px, 95vw)', maxHeight: '80vh',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Roboto, sans-serif', fontSize: '12px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.6)', overflow: 'hidden',
    });

    // ── Header ─────────────────────────────────────────────────────────────
    const header = document.createElement('div');
    Object.assign(header.style, {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '10px 14px 9px', borderBottom: '1px solid #3c3c3c', flexShrink: '0',
    });
    const titleEl = document.createElement('span');
    titleEl.textContent = 'Toolbox bearbeiten';
    Object.assign(titleEl.style, {
      font: '600 12px Roboto, sans-serif', letterSpacing: '0.05em',
      textTransform: 'uppercase', opacity: '0.6',
    });
    const hdrBtns = document.createElement('div');
    Object.assign(hdrBtns.style, { display: 'flex', gap: '6px' });
    const jsonBtn = makeSmBtn('JSON', '#3a3a3a');
    jsonBtn.title = 'Zur JSON-Ansicht wechseln';
    const closeHdrBtn = makeSmBtn('✕', '#3a3a3a');
    closeHdrBtn.onclick = () => overlay.remove();
    hdrBtns.append(jsonBtn, closeHdrBtn);
    header.append(titleEl, hdrBtns);
    box.appendChild(header);

    // ── Body: two columns ──────────────────────────────────────────────────
    const body = document.createElement('div');
    Object.assign(body.style, {
      display: 'flex', flex: '1', overflow: 'hidden', minHeight: '300px',
    });

    // Left column – category list
    const catCol = document.createElement('div');
    Object.assign(catCol.style, {
      width: '200px', flexShrink: '0', borderRight: '1px solid #3c3c3c',
      overflowY: 'auto', display: 'flex', flexDirection: 'column',
    });
    const catHead = document.createElement('div');
    catHead.textContent = 'Kategorien';
    Object.assign(catHead.style, {
      padding: '7px 10px 5px', fontSize: '10px', fontWeight: '600',
      opacity: '0.4', letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: '0',
    });
    catCol.appendChild(catHead);

    // Right column – block / subcategory list
    const blockCol = document.createElement('div');
    Object.assign(blockCol.style, {
      flex: '1', display: 'flex', flexDirection: 'column', minWidth: '0', overflow: 'hidden',
    });
    const blockHead = document.createElement('div');
    Object.assign(blockHead.style, {
      padding: '7px 10px 5px', fontSize: '10px', fontWeight: '600',
      opacity: '0.4', letterSpacing: '0.08em', textTransform: 'uppercase',
      flexShrink: '0', borderBottom: '1px solid #3c3c3c',
    });
    blockHead.textContent = '← Kategorie wählen';
    const blockList = document.createElement('div');
    Object.assign(blockList.style, { overflowY: 'auto', flex: '1' });
    blockCol.append(blockHead, blockList);

    body.append(catCol, blockCol);
    box.appendChild(body);

    // ── Footer ─────────────────────────────────────────────────────────────
    const footer = document.createElement('div');
    Object.assign(footer.style, {
      display: 'flex', gap: '8px', justifyContent: 'flex-end',
      padding: '10px 14px', borderTop: '1px solid #3c3c3c', flexShrink: '0',
    });
    const resetBtn = makeBtn('Zurücksetzen', '#3a3a3a');
    resetBtn.title = 'Konfiguration löschen und Standard-Toolbox wiederherstellen';
    resetBtn.style.marginRight = 'auto';
    resetBtn.onclick = () => {
      if (!confirm('Toolbox-Konfiguration löschen und vollständige Standard-Toolbox wiederherstellen?')) return;
      ToolboxConfigManager.applyConfig(null, workspace);
      overlay.remove();
    };
    const cancelBtn = makeBtn('Abbrechen', '#3a3a3a');
    cancelBtn.onclick = () => overlay.remove();
    const saveBtn = makeBtn('Speichern', '#0e639c', '#1177bb');
    saveBtn.onclick = () => {
      const refConfig = ToolboxConfigManager.lastConfig ?? fallbackConfig;
      const config = ToolboxConfigManager._buildConfigFromEditorState(catState, refConfig);
      ToolboxConfigManager.applyConfig(config, workspace);
      overlay.remove();
    };
    footer.append(resetBtn, cancelBtn, saveBtn);
    box.appendChild(footer);

    // ── Check-row factory ──────────────────────────────────────────────────
    function makeCheckRow(id, label, initialActive, accentColor, onChange, typeHint) {
      const row = document.createElement('div');
      Object.assign(row.style, {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '4px 10px', cursor: 'pointer', userSelect: 'none',
      });
      row.addEventListener('mouseenter', () => { row.style.background = '#2a2d2e'; });
      row.addEventListener('mouseleave', () => { row.style.background = ''; });

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.id = `b2j-ce-${id}`;
      cb.checked = initialActive;
      Object.assign(cb.style, { cursor: 'pointer', flexShrink: '0', accentColor });

      const info = document.createElement('div');
      Object.assign(info.style, { display: 'flex', flexDirection: 'column', minWidth: '0', gap: '1px' });

      const nameLbl = document.createElement('label');
      nameLbl.htmlFor = `b2j-ce-${id}`;
      nameLbl.textContent = label;
      Object.assign(nameLbl.style, {
        cursor: 'pointer', fontSize: '12px',
        opacity: initialActive ? '1' : '0.38',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      });
      info.appendChild(nameLbl);

      if (typeHint) {
        const sub = document.createElement('span');
        sub.textContent = typeHint;
        Object.assign(sub.style, {
          fontSize: '10px', fontFamily: 'Consolas, monospace',
          opacity: '0.35', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        });
        info.appendChild(sub);
      }

      cb.addEventListener('change', () => {
        nameLbl.style.opacity = cb.checked ? '1' : '0.38';
        onChange(cb.checked);
      });
      row.addEventListener('click', e => {
        if (e.target === cb || e.target.closest('label')) return;
        cb.click();
      });
      row.append(cb, info);
      return row;
    }

    // ── Render right column for a given category ───────────────────────────
    let selectedCatName = null;
    let selectedCatEl = null;

    function renderBlockList(catName) {
      blockList.innerHTML = '';
      const state = catState.get(catName);
      const catDef = FULL_TOOLBOX.contents.find(c => c.name === catName);
      const color = getCatColor(catDef ?? {});
      blockHead.textContent = `Blöcke in „${catName}“`;

      if (state.subcats) {
        // Dynamic category → show subcategory toggles
        if (state.subcats.size === 0) {
          const hint = document.createElement('div');
          hint.textContent = 'Keine Unterkategorien konfigurierbar.';
          Object.assign(hint.style, { padding: '12px 10px', opacity: '0.4' });
          blockList.appendChild(hint);
        } else {
          const subLbl = document.createElement('div');
          subLbl.textContent = 'Unterkategorien';
          Object.assign(subLbl.style, {
            padding: '6px 10px 3px', fontSize: '10px', opacity: '0.4',
            textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '600',
          });
          blockList.appendChild(subLbl);
          for (const [subcatName, active] of state.subcats) {
            blockList.appendChild(makeCheckRow(
              `sub-${catName}-${subcatName}`, subcatName, active, color,
              val => state.subcats.set(subcatName, val),
            ));
          }
        }
      } else if (state.blocks) {
        // Static category → "All on/off" + per-block rows
        const allRow = document.createElement('div');
        Object.assign(allRow.style, { display: 'flex', gap: '6px', padding: '6px 10px 4px' });
        const allOnBtn  = makeSmBtn('Alle an',  '#295228');
        const allOffBtn = makeSmBtn('Alle aus', '#522525');
        allOnBtn.onclick  = () => { state.blocks.forEach((_, t) => state.blocks.set(t, true));  renderBlockList(catName); };
        allOffBtn.onclick = () => { state.blocks.forEach((_, t) => state.blocks.set(t, false)); renderBlockList(catName); };
        allRow.append(allOnBtn, allOffBtn);
        blockList.appendChild(allRow);

        for (const [blockType, active] of state.blocks) {
          const displayName = ToolboxConfigManager._blockDisplayNames[blockType]
            ?? ToolboxConfigManager._formatBlockType(blockType);
          blockList.appendChild(makeCheckRow(
            `blk-${catName}-${blockType}`, displayName, active, color,
            val => state.blocks.set(blockType, val),
            blockType,
          ));
        }
      }
    }

    // ── Category list items ────────────────────────────────────────────────
    const catItemEls = [];
    for (const [catName, state] of catState) {
      const catDef = FULL_TOOLBOX.contents.find(c => c.name === catName);
      if (!catDef) continue;
      const color = getCatColor(catDef);

      const item = document.createElement('div');
      Object.assign(item.style, {
        display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 10px',
        cursor: 'pointer', userSelect: 'none', borderLeft: '3px solid transparent',
      });

      const dot = document.createElement('span');
      Object.assign(dot.style, {
        width: '8px', height: '8px', borderRadius: '50%',
        background: color, flexShrink: '0', opacity: state.active ? '1' : '0.3',
      });
      const cb = document.createElement('input');
      cb.type = 'checkbox'; cb.checked = state.active;
      Object.assign(cb.style, { cursor: 'pointer', flexShrink: '0', accentColor: color });
      const lbl = document.createElement('span');
      lbl.textContent = catName;
      Object.assign(lbl.style, {
        fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        opacity: state.active ? '1' : '0.4',
      });

      cb.addEventListener('change', () => {
        state.active = cb.checked;
        lbl.style.opacity = cb.checked ? '1' : '0.4';
        dot.style.opacity = cb.checked ? '1' : '0.3';
      });

      function selectItem(ci) {
        if (selectedCatEl) {
          selectedCatEl.style.background = '';
          selectedCatEl.style.borderLeftColor = 'transparent';
        }
        selectedCatName = ci.catName;
        selectedCatEl = ci.item;
        selectedCatColor = ci.color;
        ci.item.style.background = '#2c3a4a';
        ci.item.style.borderLeftColor = ci.color;
        renderBlockList(ci.catName);
      }

      const ci = { item, catName, color };
      catItemEls.push(ci);

      item.addEventListener('click', e => { if (e.target !== cb) selectItem(ci); });
      item.addEventListener('mouseenter', () => { if (selectedCatName !== catName) item.style.background = '#2a2d2e'; });
      item.addEventListener('mouseleave', () => { if (selectedCatName !== catName) item.style.background = ''; });

      item.append(dot, cb, lbl);
      catCol.appendChild(item);
    }

    // ── JSON fallback button ───────────────────────────────────────────────
    jsonBtn.onclick = () => {
      overlay.remove();
      ToolboxConfigManager._openJsonEditor(workspace, fallbackConfig);
    };

    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    // Select the first category automatically.
    if (catItemEls.length > 0) catItemEls[0].item.click();
  }

  /**
   * @deprecated Use openVisualConfigEditor instead. Kept for the "JSON" button fallback.
   */
  static _openJsonEditor(workspace, fallbackConfig) {
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

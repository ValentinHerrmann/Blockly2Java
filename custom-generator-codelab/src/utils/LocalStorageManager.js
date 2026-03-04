class LocalStorageManager {

    static WORKSPACE_STORAGE_KEY = '';
    static CTR_STORAGE_KEY = 'constructors';
    static METHODS_STORAGE_KEY = 'methodDefinitions';
    static SUPER_CALL_TYPE_HINTS_KEY = 'superCallTypeHints';
    static CONSTRUCTOR_CALLSITE_HINTS_KEY = 'constructorCallsiteHints';
    static JAVA_MODIFIED_KEY_PREFIX  = 'javaModified_';
    static JAVA_GENERATED_KEY_PREFIX = 'javaGenerated_';
    
    static clearConstructors(className) {
        if(className == null || className === '') {
            console.warn("No class name provided for clearing constructors.");
            return;
        }
        let ctrs = globalThis.localStorage?.getItem(this.CTR_STORAGE_KEY);
        let ctrObjs = JSON.parse(ctrs) || {};
        //console.log("Clearing constructors for class: "+className);
        //console.log("Stored constructors for class "+className+": "+ctrObjs[className]);
        ctrObjs[className] = [];
        globalThis.localStorage?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrObjs));
        //console.log("Remaining constructors: "+JSON.stringify(ctrObjs));
        // Clear any super-call type hints this class wrote as a sub-class.
        // This ensures stale hints are never used on the next generation.
        this.clearSubClassTypeHints(className);
        // Clear callsite hints this class stored as a caller.
        this._clearConstructorCallsiteHintsByCaller(className);
    }

    static clearAllConstructors() {
        globalThis.localStorage?.setItem(this.CTR_STORAGE_KEY, JSON.stringify({}));
        globalThis.localStorage?.setItem(this.SUPER_CALL_TYPE_HINTS_KEY, JSON.stringify({}));
        globalThis.localStorage?.setItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY, JSON.stringify({}));
        globalThis.localStorage?.setItem(this.METHODS_STORAGE_KEY, JSON.stringify({}));
        //console.log("Cleared all stored constructors.");
    }

    static storeConstructors(className, block) {
        let ctrs = globalThis.localStorage?.getItem(this.CTR_STORAGE_KEY);
        let ctrObjs = JSON.parse(ctrs) || {};
        //console.log("Storing constructors for class: "+className);

        if(ctrObjs[className] == null) {
            ctrObjs[className] = [];
        }

        // Extract only serializable data from the block
        const blockData = {
            id: block.id,
            type: block.type,
            arguments: block.arguments_,
            clz: className,
        };
        ctrObjs[className].push(blockData);
        globalThis.localStorage?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrObjs));
    }

    static getAllConstructors() {
        let ctrs = globalThis.localStorage?.getItem(this.CTR_STORAGE_KEY);
        const ret = JSON.parse(ctrs) || {};
        return ret;
    }

    // ── Super-call parameter type hints ──────────────────────────────────────
    //
    // Hints are keyed by SUB-CLASS name so they are automatically replaced
    // every time the sub-class is regenerated (clearConstructors clears them).
    //
    // Storage format:
    //   { "Test": { parentClass: "Super", hints: { x: "String" } }, … }

    /**
     * Stores/replaces inferred parameter types written by a java_super_call
     * block in a sub-class workspace.
     *
     * @param {string} subClassName   – the class that contains the super() call
     * @param {string} parentClassName – the class being called
     * @param {Object.<string, string>} typeHints – param name → Java type
     */
    static storeSuperCallTypeHints(subClassName, parentClassName, typeHints) {
        if (!subClassName || !parentClassName) return;
        const raw = globalThis.localStorage?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        // Replace entirely – don't merge so stale entries can't survive.
        store[subClassName] = { parentClass: parentClassName, hints: typeHints };
        globalThis.localStorage?.setItem(this.SUPER_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
    }

    /**
     * Clears hints written by the given sub-class.
     * Called from clearConstructors so stale data is removed before each
     * code-generation pass.
     *
     * @param {string} subClassName
     */
    static clearSubClassTypeHints(subClassName) {
        if (!subClassName) return;
        const raw = globalThis.localStorage?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        if (store[subClassName]) {
            delete store[subClassName];
            globalThis.localStorage?.setItem(this.SUPER_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
        }
    }

    /**
     * Retrieves the merged parameter type hints for a given parent class by
     * scanning all sub-class entries.
     *
     * @param {string} parentClassName
     * @returns {Object.<string, string>|null} param name → Java type, or null
     */
    // ── Constructor call-site type hints ──────────────────────────────────────
    //
    // When class A calls `new B(arg0, arg1)`, the inferred types of arg0/arg1
    // are stored here keyed by A (the caller).  When generating B, the stored
    // list for B is retrieved by scanning all callers.
    //
    // Storage format:
    //   { "Main": { "Child": ["double", null] }, "Other": { "Child": ["String"] } }

    /**
     * Replaces the callsite type hints stored by callerClass for every class
     * it calls with `new`.
     *
     * @param {string} callerClass
     * @param {Object.<string, Array<string|null>>} hintsByCallee
     *   Mapping from called-class name to an array of Java types indexed by
     *   constructor parameter position (null when type could not be inferred).
     */
    static storeConstructorCallsiteHintsByClass(callerClass, hintsByCallee) {
        if (!callerClass) return;
        const raw = globalThis.localStorage?.getItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        store[callerClass] = hintsByCallee || {};
        globalThis.localStorage?.setItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY, JSON.stringify(store));
    }

    /**
     * Clears all callsite hints that were stored by callerClass.
     * Called from clearConstructors so stale hints are wiped before each
     * code-generation pass.
     *
     * @param {string} callerClass
     */
    static _clearConstructorCallsiteHintsByCaller(callerClass) {
        if (!callerClass) return;
        const raw = globalThis.localStorage?.getItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        if (store[callerClass]) {
            delete store[callerClass];
            globalThis.localStorage?.setItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY, JSON.stringify(store));
        }
    }

    /**
     * Returns the merged parameter type array for calledClass by scanning all
     * caller entries (first non-null value per index wins).
     *
     * @param {string} calledClass
     * @returns {Array<string|null>|null}
     */
    static getConstructorCallsiteHints(calledClass) {
        const raw = globalThis.localStorage?.getItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        let merged = null;
        for (const calleeMap of Object.values(store)) {
            const types = calleeMap?.[calledClass];
            if (types) {
                if (merged) {
                    for (let i = 0; i < types.length; i++) {
                        if (merged[i] == null && types[i] != null) merged[i] = types[i];
                    }
                } else {
                    merged = types.slice();
                }
            }
        }
        return merged;
    }

    static getSuperCallTypeHints(parentClassName) {
        const raw = globalThis.localStorage?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        const merged = {};
        let found = false;
        for (const entry of Object.values(store)) {
            if (entry && entry.parentClass === parentClassName && entry.hints) {
                Object.assign(merged, entry.hints);
                found = true;
            }
        }
        return found ? merged : null;
    }

    // ── Method-definition storage ─────────────────────────────────────────────

    /**
     * Clears all stored method definitions for className so they can be
     * re-populated on the next code generation.
     * @param {string} className
     */
    static clearMethods(className) {
        if (!className) return;
        const raw = globalThis.localStorage?.getItem(this.METHODS_STORAGE_KEY);
        const store = JSON.parse(raw) || {};
        store[className] = [];
        globalThis.localStorage?.setItem(this.METHODS_STORAGE_KEY, JSON.stringify(store));
    }

    /**
     * Removes all stored method definitions for every class.
     */
    static clearAllMethods() {
        globalThis.localStorage?.setItem(this.METHODS_STORAGE_KEY, JSON.stringify({}));
    }

    /**
     * Stores a method definition for className.
     * @param {string} className
     * @param {{ name: string, arguments: string[], isStatic: boolean, hasReturn: boolean }} methodData
     */
    static storeMethods(className, methodData) {
        if (!className) return;
        const raw = globalThis.localStorage?.getItem(this.METHODS_STORAGE_KEY);
        const store = JSON.parse(raw) || {};
        if (!store[className]) store[className] = [];
        store[className].push(methodData);
        globalThis.localStorage?.setItem(this.METHODS_STORAGE_KEY, JSON.stringify(store));
    }

    /**
     * Returns all stored method definitions grouped by class name.
     * @returns {Object.<string, Array<{name:string, arguments:string[], isStatic:boolean, hasReturn:boolean}>>}
     */
    static getAllMethods() {
        const raw = globalThis.localStorage?.getItem(this.METHODS_STORAGE_KEY);
        return JSON.parse(raw) || {};
    }

    /** @param {string} className */
    static _removeCallsiteHintsForClass(className) {
        const csRaw = globalThis.localStorage?.getItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY);
        if (!csRaw) return;
        const csStore = JSON.parse(csRaw) || {};
        let csChanged = false;
        if (csStore[className]) { delete csStore[className]; csChanged = true; }
        for (const calleeMap of Object.values(csStore)) {
            if (calleeMap?.[className]) {
                delete calleeMap[className]; csChanged = true;
            }
        }
        if (csChanged) globalThis.localStorage?.setItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY, JSON.stringify(csStore));
    }

    /** @param {string} className */
    static _removeSuperHintsForClass(className) {
        const hintsRaw = globalThis.localStorage?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
        if (!hintsRaw) return;
        const store = JSON.parse(hintsRaw) || {};
        let changed = false;
        for (const [sub, entry] of Object.entries(store)) {
            if (sub === className || entry?.parentClass === className) {
                delete store[sub];
                changed = true;
            }
        }
        if (changed) globalThis.localStorage?.setItem(this.SUPER_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
    }

    static deleteClass(className) {
        let ctrs = globalThis.localStorage?.getItem(this.CTR_STORAGE_KEY);
        let ctrObjs = JSON.parse(ctrs) || {};
        if (ctrObjs[className] != null) {
            delete ctrObjs[className];
            globalThis.localStorage?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrObjs));
        }
        const key = this.WORKSPACE_STORAGE_KEY + className + '.json';
        globalThis.localStorage?.removeItem(key);
        // Also remove legacy .xml key if present.
        globalThis.localStorage?.removeItem(this.WORKSPACE_STORAGE_KEY + className + '.xml');
        // Clean up java-modified flag and generated-code cache.
        globalThis.localStorage?.removeItem(this.JAVA_MODIFIED_KEY_PREFIX  + className);
        globalThis.localStorage?.removeItem(this.JAVA_GENERATED_KEY_PREFIX + className);
        // Clean up stored method definitions.
        this.clearMethods(className);
        // Clean up callsite hints where this class appears as caller or callee.
        this._removeCallsiteHintsForClass(className);
        // Clean up super-call type hints where this class appears as either
        // the sub-class key or the parentClass value.
        this._removeSuperHintsForClass(className);
    }

    static renameClass(className, newClassName) {
        const oldKey = this.WORKSPACE_STORAGE_KEY + className + '.json';
        const newKey = this.WORKSPACE_STORAGE_KEY + newClassName + '.json';

        const savedData = globalThis.localStorage?.getItem(oldKey);
        if (savedData) {
            globalThis.localStorage.setItem(newKey, savedData);
            globalThis.localStorage.removeItem(oldKey);
        }

        // Migrate constructor data from old class name to new class name.
        const ctrsJSON = globalThis.localStorage?.getItem(this.CTR_STORAGE_KEY);
        if (ctrsJSON) {
            const ctrs = JSON.parse(ctrsJSON);
            if (ctrs[className] !== undefined) {
                ctrs[newClassName] = ctrs[className];
                delete ctrs[className];
                globalThis.localStorage?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrs));
            }
        }

        // Migrate java-modified flag.
        const modifiedVal = globalThis.localStorage?.getItem(this.JAVA_MODIFIED_KEY_PREFIX + className);
        if (modifiedVal != null) {
            globalThis.localStorage?.setItem(this.JAVA_MODIFIED_KEY_PREFIX + newClassName, modifiedVal);
            globalThis.localStorage?.removeItem(this.JAVA_MODIFIED_KEY_PREFIX + className);
        }

        // Migrate last-generated-code cache.
        const generatedVal = globalThis.localStorage?.getItem(this.JAVA_GENERATED_KEY_PREFIX + className);
        if (generatedVal != null) {
            globalThis.localStorage?.setItem(this.JAVA_GENERATED_KEY_PREFIX + newClassName, generatedVal);
            globalThis.localStorage?.removeItem(this.JAVA_GENERATED_KEY_PREFIX + className);
        }

        // Migrate callsite hints where className appears as caller or callee.
        const csRaw2 = globalThis.localStorage?.getItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY);
        if (csRaw2) {
            const csStore2 = JSON.parse(csRaw2) || {};
            let csChanged2 = false;
            if (csStore2[className] !== undefined) {
                csStore2[newClassName] = csStore2[className];
                delete csStore2[className];
                csChanged2 = true;
            }
            for (const calleeMap of Object.values(csStore2)) {
                if (calleeMap?.[className] !== undefined) {
                    calleeMap[newClassName] = calleeMap[className];
                    delete calleeMap[className];
                    csChanged2 = true;
                }
            }
            if (csChanged2) globalThis.localStorage?.setItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY, JSON.stringify(csStore2));
        }

        // Migrate method definitions keyed by class name.
        const methodDefsRaw = globalThis.localStorage?.getItem(this.METHODS_STORAGE_KEY);
        if (methodDefsRaw) {
            const methodDefsStore = JSON.parse(methodDefsRaw) || {};
            if (methodDefsStore[className] !== undefined) {
                methodDefsStore[newClassName] = methodDefsStore[className];
                delete methodDefsStore[className];
                globalThis.localStorage?.setItem(this.METHODS_STORAGE_KEY, JSON.stringify(methodDefsStore));
            }
        }
        // Migrate super-call type hints where className appears as either
        // the sub-class key or the parentClass value.
        this._migrateSuperHints(className, newClassName);
    }

    /**
     * Renames all super-call type hint entries that reference className.
     * @param {string} oldName
     * @param {string} newName
     */
    static _migrateSuperHints(oldName, newName) {
        const hintsRaw = globalThis.localStorage?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
        if (!hintsRaw) return;
        const store = JSON.parse(hintsRaw) || {};
        let changed = false;
        if (store[oldName] !== undefined) {
            store[newName] = store[oldName];
            delete store[oldName];
            changed = true;
        }
        for (const entry of Object.values(store)) {
            if (entry?.parentClass === oldName) {
                entry.parentClass = newName;
                changed = true;
            }
        }
        if (changed) globalThis.localStorage?.setItem(this.SUPER_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
    }

    static createClass(className) {
        let ctrs = globalThis.localStorage?.getItem(this.CTR_STORAGE_KEY);
        let ctrObjs = JSON.parse(ctrs) || {};
        ctrObjs[className] = []
        globalThis.localStorage?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrObjs));

        const key = this.WORKSPACE_STORAGE_KEY + className + '.json';
        globalThis.localStorage?.setItem(key, '');
    }

    static loadWorkspace(className) {
        const key = this.WORKSPACE_STORAGE_KEY + className + '.json';
        let data = globalThis.localStorage?.getItem(key);

        // Migrate legacy .xml key on first access.
        if (data == null) {
            const legacyKey = this.WORKSPACE_STORAGE_KEY + className + '.xml';
            const legacyData = globalThis.localStorage?.getItem(legacyKey);
            if (legacyData != null) {
                globalThis.localStorage?.setItem(key, legacyData);
                globalThis.localStorage?.removeItem(legacyKey);
                data = legacyData;
            }
        }

        return data;
    }

    static saveWorkspace(className, data) {
        const key = this.WORKSPACE_STORAGE_KEY + className + '.json';
        globalThis.localStorage?.setItem(key, JSON.stringify(data));
    }

    // ── Java-modified bulk helpers ────────────────────────────────────────────

    /**
     * Removes all java-modified flags and last-generated-code cache entries
     * from localStorage.  Call this when the entire workspace is reset.
     */
    static clearAllJavaModifiedData() {
        const ls = globalThis.localStorage;
        if (!ls) return;
        const toRemove = [];
        for (let i = 0; i < ls.length; i++) {
            const key = ls.key(i);
            if (key?.startsWith(this.JAVA_MODIFIED_KEY_PREFIX) ||
                key?.startsWith(this.JAVA_GENERATED_KEY_PREFIX)) {
                toRemove.push(key);
            }
        }
        for (const key of toRemove) ls.removeItem(key);
    }

    /**
     * Returns an array of class names whose java-modified flag is currently set.
     * Used when serialising the flag state into an export archive or git commit.
     * @returns {string[]}
     */
    static getAllJavaModifiedClassNames() {
        const result = [];
        const ls = globalThis.localStorage;
        if (!ls) return result;
        for (let i = 0; i < ls.length; i++) {
            const key = ls.key(i);
            if (key?.startsWith(this.JAVA_MODIFIED_KEY_PREFIX) && ls.getItem(key) === '1') {
                result.push(key.slice(this.JAVA_MODIFIED_KEY_PREFIX.length));
            }
        }
        return result;
    }

    /**
     * Clears all existing java-modified flags and restores the supplied set.
     * Also wipes the last-generated-code cache for every class so stale
     * baselines can't trigger false positives while the IDE settles after a
     * clone, pull, or import.
     * Used when importing an export archive or reading from a git clone/pull.
     * @param {string[]} classNames – class names (without .java) to flag as modified
     */
    static restoreJavaModifiedClassNames(classNames) {
        const ls = globalThis.localStorage;
        if (!ls) return;
        // Remove all existing flags AND all generated-code cache entries.
        const toRemove = [];
        for (let i = 0; i < ls.length; i++) {
            const key = ls.key(i);
            if (key?.startsWith(this.JAVA_MODIFIED_KEY_PREFIX) ||
                key?.startsWith(this.JAVA_GENERATED_KEY_PREFIX)) {
                toRemove.push(key);
            }
        }
        for (const key of toRemove) ls.removeItem(key);
        // Set the incoming flags.
        for (const name of classNames) {
            this.setJavaModified(name, true);
        }
    }

    // ── Java-modified flag ────────────────────────────────────────────────────

    /**
     * Returns true when the user has manually edited the Java code for this class
     * after the last Blockly-generated push, making the Blockly workspace stale.
     * @param {string} className
     * @returns {boolean}
     */
    static isJavaModified(className) {
        if (!className) return false;
        return globalThis.localStorage?.getItem(this.JAVA_MODIFIED_KEY_PREFIX + className) === '1';
    }

    /**
     * Sets or clears the java-modified flag for a class.
     * @param {string}  className
     * @param {boolean} modified
     */
    static setJavaModified(className, modified) {
        if (!className) return;
        const key = this.JAVA_MODIFIED_KEY_PREFIX + className;
        if (modified) {
            globalThis.localStorage?.setItem(key, '1');
        } else {
            globalThis.localStorage?.removeItem(key);
        }
    }

    // ── Last Blockly-generated code cache ────────────────────────────────────

    /**
     * Persists the Java code that was last pushed by Blockly so we can later
     * compare it against the IDE content to detect manual edits.
     * @param {string} className
     * @param {string} code
     */
    static saveLastGeneratedCode(className, code) {
        if (!className) return;
        globalThis.localStorage?.setItem(this.JAVA_GENERATED_KEY_PREFIX + className, code);
    }

    /**
     * Returns the last Blockly-generated Java code for this class, or null if
     * Blockly has never pushed code for it.
     * @param {string} className
     * @returns {string|null}
     */
    static loadLastGeneratedCode(className) {
        if (!className) return null;
        return globalThis.localStorage?.getItem(this.JAVA_GENERATED_KEY_PREFIX + className) ?? null;
    }
}

export default LocalStorageManager;
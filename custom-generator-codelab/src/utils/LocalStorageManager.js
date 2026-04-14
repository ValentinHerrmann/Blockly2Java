class LocalStorageManager {

    static WORKSPACE_STORAGE_KEY = '';
    static CTR_STORAGE_KEY = 'constructors';
    static METHODS_STORAGE_KEY = 'methodDefinitions';
    static SUPER_CALL_TYPE_HINTS_KEY = 'superCallTypeHints';
    static CONSTRUCTOR_CALLSITE_HINTS_KEY = 'constructorCallsiteHints';
    static OBJ_CALL_TYPE_HINTS_KEY = 'objCallTypeHints';
    static JAVA_MODIFIED_KEY_PREFIX  = 'javaModified_';
    static JAVA_GENERATED_KEY_PREFIX = 'javaGenerated_';

    static _migrationDone = false;

    static _isAppStorageKey(key) {
        if (!key) return false;
        if (key.endsWith('.json') || key.endsWith('.xml')) return true;
        if (key.startsWith(this.JAVA_MODIFIED_KEY_PREFIX)) return true;
        if (key.startsWith(this.JAVA_GENERATED_KEY_PREFIX)) return true;
        if (key.startsWith('b2j_') || key.startsWith('b2j.')) return true;
        return key === this.CTR_STORAGE_KEY ||
            key === this.METHODS_STORAGE_KEY ||
            key === this.SUPER_CALL_TYPE_HINTS_KEY ||
            key === this.CONSTRUCTOR_CALLSITE_HINTS_KEY ||
            key === this.OBJ_CALL_TYPE_HINTS_KEY;
    }

    static _migrateToSessionStorageIfNeeded() {
        if (this._migrationDone) return;
        this._migrationDone = true;
        const session = globalThis.sessionStorage;
        const local = globalThis.localStorage;
        if (!session || !local) return;
        const keys = [];
        for (let i = 0; i < local.length; i++) {
            const key = local.key(i);
            if (this._isAppStorageKey(key)) keys.push(key);
        }
        for (const key of keys) {
            const value = local.getItem(key);
            if (value == null) {
                continue;
            }

            let migrated = session.getItem(key) != null;
            if (!migrated) {
                try {
                    session.setItem(key, value);
                    migrated = true;
                } catch (e) {
                    migrated = false;
                }
            }

            if (migrated) {
                local.removeItem(key);
            }
        }
    }

    static _storage() {
        this._migrateToSessionStorageIfNeeded();
        return globalThis.sessionStorage ?? globalThis.localStorage;
    }

    static getStorage() {
        return this._storage();
    }

    static getItem(key) {
        return this._storage()?.getItem(key) ?? null;
    }

    static setItem(key, value) {
        this._storage()?.setItem(key, value);
    }

    static removeItem(key) {
        this._storage()?.removeItem(key);
    }

    static getAllKeys() {
        const storage = this._storage();
        if (!storage) return [];
        const keys = [];
        for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key) keys.push(key);
        }
        return keys;
    }

    static getStoredSelectedFileName() {
        return this.getItem('b2j.selected_file_name');
    }

    static setStoredSelectedFileName(fileName) {
        if (!fileName) {
            this.removeItem('b2j.selected_file_name');
            return;
        }
        this.setItem('b2j.selected_file_name', fileName);
    }

    static getStoredLastJavaFileName() {
        return this.getItem('b2j.last_java_file_name');
    }

    static setStoredLastJavaFileName(fileName) {
        if (!fileName) {
            this.removeItem('b2j.last_java_file_name');
            return;
        }
        this.setItem('b2j.last_java_file_name', fileName);
    }
    
    static clearConstructors(className) {
        if(className == null || className === '') {
            console.warn("No class name provided for clearing constructors.");
            return;
        }
        let ctrs = this._storage()?.getItem(this.CTR_STORAGE_KEY);
        let ctrObjs = JSON.parse(ctrs) || {};
        //console.log("Clearing constructors for class: "+className);
        //console.log("Stored constructors for class "+className+": "+ctrObjs[className]);
        ctrObjs[className] = [];
        this._storage()?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrObjs));
        //console.log("Remaining constructors: "+JSON.stringify(ctrObjs));
        // Clear any super-call type hints this class wrote as a sub-class.
        // This ensures stale hints are never used on the next generation.
        this.clearSubClassTypeHints(className);
        // Clear callsite hints this class stored as a caller.
        this._clearConstructorCallsiteHintsByCaller(className);
    }

    static clearAllConstructors() {
        this._storage()?.setItem(this.CTR_STORAGE_KEY, JSON.stringify({}));
        this._storage()?.setItem(this.SUPER_CALL_TYPE_HINTS_KEY, JSON.stringify({}));
        this._storage()?.setItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY, JSON.stringify({}));
        this._storage()?.setItem(this.METHODS_STORAGE_KEY, JSON.stringify({}));
        //console.log("Cleared all stored constructors.");
    }

    static storeConstructors(className, block) {
        let ctrs = this._storage()?.getItem(this.CTR_STORAGE_KEY);
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
        this._storage()?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrObjs));
    }

    static getAllConstructors() {
        let ctrs = this._storage()?.getItem(this.CTR_STORAGE_KEY);
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
        const raw = this._storage()?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        // Replace entirely – don't merge so stale entries can't survive.
        store[subClassName] = { parentClass: parentClassName, hints: typeHints };
        this._storage()?.setItem(this.SUPER_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
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
        const raw = this._storage()?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        if (store[subClassName]) {
            delete store[subClassName];
            this._storage()?.setItem(this.SUPER_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
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
        const raw = this._storage()?.getItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        store[callerClass] = hintsByCallee || {};
        this._storage()?.setItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY, JSON.stringify(store));
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
        const raw = this._storage()?.getItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        if (store[callerClass]) {
            delete store[callerClass];
            this._storage()?.setItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY, JSON.stringify(store));
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
        const raw = this._storage()?.getItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY);
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
        const raw = this._storage()?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
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

    static getSuperCallHintEntry(subClassName) {
        if (!subClassName) return null;
        const raw = this._storage()?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        return store[subClassName] ?? null;
    }

    // ── Object-method-call parameter type hints ───────────────────────────────
    //
    // When class B calls `obj.someMethod(arg0, arg1)` (java_obj_method_call_*)
    // or `ClassName.staticMethod(arg0)` (java_ext_static_call_*), the inferred
    // argument types are stored here keyed by callerClass.
    //
    // Storage format:
    //   {
    //     "CallerClass": {
    //       "methodName":            ["int", "String", null],  // instance call
    //       "TargetClass::method":   ["double"]                // static call
    //     }, …
    //   }

    /**
     * Stores/replaces method-call type hints written by callerClass.
     * hints maps method key → array of Java types indexed by param position.
     * Key format: "methodName" for instance calls, "TargetClass::methodName" for static.
     *
     * @param {string} callerClass
     * @param {Object.<string, Array<string|null>>} hints
     */
    static storeObjCallTypeHints(callerClass, hints) {
        if (!callerClass || !hints || Object.keys(hints).length === 0) return;
        const raw = this._storage()?.getItem(this.OBJ_CALL_TYPE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        store[callerClass] = hints;
        this._storage()?.setItem(this.OBJ_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
    }

    /**
     * Returns the merged param type array for the given method key across all callers.
     * First non-null value at each index wins.
     *
     * @param {string} methodKey  "methodName" or "TargetClass::methodName"
     * @returns {Array<string|null>|null}
     */
    static getObjCallTypeHints(methodKey) {
        const raw = this._storage()?.getItem(this.OBJ_CALL_TYPE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        let merged = null;
        for (const calleeMap of Object.values(store)) {
            const types = calleeMap?.[methodKey];
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

    /**
     * Clears all method-call type hints stored by callerClass.
     * Called before each code-generation pass so stale data is replaced.
     *
     * @param {string} callerClass
     */
    static clearObjCallTypeHintsByCaller(callerClass) {
        if (!callerClass) return;
        const raw = this._storage()?.getItem(this.OBJ_CALL_TYPE_HINTS_KEY);
        const store = JSON.parse(raw) || {};
        if (store[callerClass]) {
            delete store[callerClass];
            this._storage()?.setItem(this.OBJ_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
        }
    }

    // ── Method-definition storage ─────────────────────────────────────────────

    /**
     * Clears all stored method definitions for className so they can be
     * re-populated on the next code generation.
     * @param {string} className
     */
    static clearMethods(className) {
        if (!className) return;
        const raw = this._storage()?.getItem(this.METHODS_STORAGE_KEY);
        const store = JSON.parse(raw) || {};
        store[className] = [];
        this._storage()?.setItem(this.METHODS_STORAGE_KEY, JSON.stringify(store));
        // Clear method-call type hints stored by this class as a caller so they
        // are rebuilt fresh during the next code-generation pass.
        this.clearObjCallTypeHintsByCaller(className);
    }

    /**
     * Removes all stored method definitions for every class.
     */
    static clearAllMethods() {
        this._storage()?.setItem(this.METHODS_STORAGE_KEY, JSON.stringify({}));
    }

    /**
     * Stores a method definition for className.
     * @param {string} className
     * @param {{ name: string, arguments: string[], isStatic: boolean, hasReturn: boolean }} methodData
     */
    static storeMethods(className, methodData) {
        if (!className) return;
        const raw = this._storage()?.getItem(this.METHODS_STORAGE_KEY);
        const store = JSON.parse(raw) || {};
        if (!store[className]) store[className] = [];
        store[className].push(methodData);
        this._storage()?.setItem(this.METHODS_STORAGE_KEY, JSON.stringify(store));
    }

    /**
     * Returns all stored method definitions grouped by class name.
     * @returns {Object.<string, Array<{name:string, arguments:string[], isStatic:boolean, hasReturn:boolean}>>}
     */
    static getAllMethods() {
        const raw = this._storage()?.getItem(this.METHODS_STORAGE_KEY);
        return JSON.parse(raw) || {};
    }

    /** @param {string} className */
    static _removeCallsiteHintsForClass(className) {
        const csRaw = this._storage()?.getItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY);
        if (!csRaw) return;
        const csStore = JSON.parse(csRaw) || {};
        let csChanged = false;
        if (csStore[className]) { delete csStore[className]; csChanged = true; }
        for (const calleeMap of Object.values(csStore)) {
            if (calleeMap?.[className]) {
                delete calleeMap[className]; csChanged = true;
            }
        }
        if (csChanged) this._storage()?.setItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY, JSON.stringify(csStore));
    }

    /** @param {string} className */
    static _removeSuperHintsForClass(className) {
        const hintsRaw = this._storage()?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
        if (!hintsRaw) return;
        const store = JSON.parse(hintsRaw) || {};
        let changed = false;
        for (const [sub, entry] of Object.entries(store)) {
            if (sub === className || entry?.parentClass === className) {
                delete store[sub];
                changed = true;
            }
        }
        if (changed) this._storage()?.setItem(this.SUPER_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
    }

    static deleteClass(className) {
        let ctrs = this._storage()?.getItem(this.CTR_STORAGE_KEY);
        let ctrObjs = JSON.parse(ctrs) || {};
        if (ctrObjs[className] != null) {
            delete ctrObjs[className];
            this._storage()?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrObjs));
        }
        const key = this.WORKSPACE_STORAGE_KEY + className + '.json';
        this._storage()?.removeItem(key);
        // Also remove legacy .xml key if present.
        this._storage()?.removeItem(this.WORKSPACE_STORAGE_KEY + className + '.xml');
        // Clean up java-modified flag and generated-code cache.
        this._storage()?.removeItem(this.JAVA_MODIFIED_KEY_PREFIX  + className);
        this._storage()?.removeItem(this.JAVA_GENERATED_KEY_PREFIX + className);
        // Clean up stored method definitions.
        this.clearMethods(className);
        // Clean up callsite hints where this class appears as caller or callee.
        this._removeCallsiteHintsForClass(className);
        // Clean up super-call type hints where this class appears as either
        // the sub-class key or the parentClass value.
        this._removeSuperHintsForClass(className);
        // Clean up object-call type hints where this class appears as caller
        // or as the target prefix in a static-method key ("ClassName::method").
        this._removeObjCallHintsForClass(className);
    }

    /** @param {string} className */
    static _removeObjCallHintsForClass(className) {
        const raw = this._storage()?.getItem(this.OBJ_CALL_TYPE_HINTS_KEY);
        if (!raw) return;
        const store = JSON.parse(raw) || {};
        let changed = false;
        // Remove entry where this class is the caller.
        if (store[className]) { delete store[className]; changed = true; }
        // Remove static-method keys prefixed with "className::" from all callers.
        const prefix = className + '::';
        for (const calleeMap of Object.values(store)) {
            for (const key of Object.keys(calleeMap)) {
                if (key.startsWith(prefix)) { delete calleeMap[key]; changed = true; }
            }
        }
        if (changed) this._storage()?.setItem(this.OBJ_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
    }

    static renameClass(className, newClassName) {
        const oldKey = this.WORKSPACE_STORAGE_KEY + className + '.json';
        const newKey = this.WORKSPACE_STORAGE_KEY + newClassName + '.json';

        const savedData = this._storage()?.getItem(oldKey);
        if (savedData) {
            this._storage()?.setItem(newKey, savedData);
            this._storage()?.removeItem(oldKey);
        }

        // Migrate constructor data from old class name to new class name.
        const ctrsJSON = this._storage()?.getItem(this.CTR_STORAGE_KEY);
        if (ctrsJSON) {
            const ctrs = JSON.parse(ctrsJSON);
            if (ctrs[className] !== undefined) {
                ctrs[newClassName] = ctrs[className];
                delete ctrs[className];
                this._storage()?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrs));
            }
        }

        // Migrate java-modified flag.
        const modifiedVal = this._storage()?.getItem(this.JAVA_MODIFIED_KEY_PREFIX + className);
        if (modifiedVal != null) {
            this._storage()?.setItem(this.JAVA_MODIFIED_KEY_PREFIX + newClassName, modifiedVal);
            this._storage()?.removeItem(this.JAVA_MODIFIED_KEY_PREFIX + className);
        }

        // Migrate last-generated-code cache.
        const generatedVal = this._storage()?.getItem(this.JAVA_GENERATED_KEY_PREFIX + className);
        if (generatedVal != null) {
            this._storage()?.setItem(this.JAVA_GENERATED_KEY_PREFIX + newClassName, generatedVal);
            this._storage()?.removeItem(this.JAVA_GENERATED_KEY_PREFIX + className);
        }

        // Migrate callsite hints where className appears as caller or callee.
        const csRaw2 = this._storage()?.getItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY);
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
            if (csChanged2) this._storage()?.setItem(this.CONSTRUCTOR_CALLSITE_HINTS_KEY, JSON.stringify(csStore2));
        }

        // Migrate method definitions keyed by class name.
        const methodDefsRaw = this._storage()?.getItem(this.METHODS_STORAGE_KEY);
        if (methodDefsRaw) {
            const methodDefsStore = JSON.parse(methodDefsRaw) || {};
            if (methodDefsStore[className] !== undefined) {
                methodDefsStore[newClassName] = methodDefsStore[className];
                delete methodDefsStore[className];
                this._storage()?.setItem(this.METHODS_STORAGE_KEY, JSON.stringify(methodDefsStore));
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
        const hintsRaw = this._storage()?.getItem(this.SUPER_CALL_TYPE_HINTS_KEY);
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
        if (changed) this._storage()?.setItem(this.SUPER_CALL_TYPE_HINTS_KEY, JSON.stringify(store));
    }

    static createClass(className) {
        let ctrs = this._storage()?.getItem(this.CTR_STORAGE_KEY);
        let ctrObjs = JSON.parse(ctrs) || {};
        ctrObjs[className] = []
        this._storage()?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrObjs));

        const key = this.WORKSPACE_STORAGE_KEY + className + '.json';
        this._storage()?.setItem(key, '');
    }

    static loadWorkspace(className) {
        const key = this.WORKSPACE_STORAGE_KEY + className + '.json';
        let data = this._storage()?.getItem(key);

        // Migrate legacy .xml key on first access.
        if (data == null) {
            const legacyKey = this.WORKSPACE_STORAGE_KEY + className + '.xml';
            const legacyData = this._storage()?.getItem(legacyKey);
            if (legacyData != null) {
                this._storage()?.setItem(key, legacyData);
                this._storage()?.removeItem(legacyKey);
                data = legacyData;
            }
        }

        return data;
    }

    static saveWorkspace(className, data) {
        const key = this.WORKSPACE_STORAGE_KEY + className + '.json';
        this._storage()?.setItem(key, JSON.stringify(data));
    }

    // ── Java-modified bulk helpers ────────────────────────────────────────────

    /**
     * Removes all java-modified flags and last-generated-code cache entries
     * from localStorage.  Call this when the entire workspace is reset.
     */
    static clearAllJavaModifiedData() {
        const ls = this._storage();
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
        const ls = this._storage();
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
        const ls = this._storage();
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
        return this._storage()?.getItem(this.JAVA_MODIFIED_KEY_PREFIX + className) === '1';
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
            this._storage()?.setItem(key, '1');
        } else {
            this._storage()?.removeItem(key);
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
        this._storage()?.setItem(this.JAVA_GENERATED_KEY_PREFIX + className, code);
    }

    /**
     * Returns the last Blockly-generated Java code for this class, or null if
     * Blockly has never pushed code for it.
     * @param {string} className
     * @returns {string|null}
     */
    static loadLastGeneratedCode(className) {
        if (!className) return null;
        return this._storage()?.getItem(this.JAVA_GENERATED_KEY_PREFIX + className) ?? null;
    }
}

export default LocalStorageManager;
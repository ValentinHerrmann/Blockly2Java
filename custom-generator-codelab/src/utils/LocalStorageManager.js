class LocalStorageManager {

    static WORKSPACE_STORAGE_KEY = '';
    static CTR_STORAGE_KEY = 'constructors';
    
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
    }

    static clearAllConstructors() {
        globalThis.localStorage?.setItem(this.CTR_STORAGE_KEY, JSON.stringify({}));
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

    static deleteClass(className) {
        let ctrs = globalThis.localStorage?.getItem(this.CTR_STORAGE_KEY);
        let ctrObjs = JSON.parse(ctrs) || {};
        if(ctrObjs[className] != null) {
            delete ctrObjs[className];
            globalThis.localStorage?.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrObjs));
        }
        const key = this.WORKSPACE_STORAGE_KEY + className + '.json';
        globalThis.localStorage?.removeItem(key);
        // Also remove legacy .xml key if present.
        globalThis.localStorage?.removeItem(this.WORKSPACE_STORAGE_KEY + className + '.xml');
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
                globalThis.localStorage.setItem(this.CTR_STORAGE_KEY, JSON.stringify(ctrs));
            }
        }
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
}

export default LocalStorageManager;
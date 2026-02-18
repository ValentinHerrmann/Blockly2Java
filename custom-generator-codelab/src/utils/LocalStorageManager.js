class LocalStorageManager {
    
    static clearStoredCtrs_thisClass(className) {
        let ctrs = globalThis.localStorage?.getItem("constructors");
        let ctrObjs = JSON.parse(ctrs) || {};
        console.log("Clearing constructors for class: "+className);
        if(ctrs != null) {
            console.log("Stored constructors for class "+className+": "+ctrObjs[className]);
            ctrObjs[className] = [];
            globalThis.localStorage?.setItem("constructors", JSON.stringify(ctrObjs));
            console.log("Remaining constructors: "+JSON.stringify(ctrObjs));
        }
    }

    static clearStoredCtrs_all() {
        globalThis.localStorage?.setItem("constructors", JSON.stringify({}));
        console.log("Cleared all stored constructors.");
    }

    static storeCtrs_thisClass(className, block) {
        let ctrs = globalThis.localStorage?.getItem("constructors");
        let ctrObjs = JSON.parse(ctrs) || {};
        console.log("Storing constructors for class: "+className);

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
        globalThis.localStorage?.setItem("constructors", JSON.stringify(ctrObjs));
    }

    static deleteClass(className) {
        let ctrs = globalThis.localStorage?.getItem("constructors");
        let ctrObjs = JSON.parse(ctrs) || {};
        console.log("Deleting class: "+className);
        if(ctrObjs[className] != null) {
            delete ctrObjs[className];
            globalThis.localStorage?.setItem("constructors", JSON.stringify(ctrObjs));
            console.log("Deleted class "+className+". Remaining constructors: "+JSON.stringify(ctrObjs));
        }
    }
}

export default LocalStorageManager;
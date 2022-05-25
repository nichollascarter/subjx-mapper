class StorageProxy {

    constructor(store, path) {
        this.path = path;
        this.store = store;
    }

    get(path) {
        return this.store.get(path, this.path);
    }

    get value() {
        return this.store.getValue(this.path);
    }

    set value(val) {
        this.store.setValue(this.path, val);
    }

}

export { StorageProxy };

class Do {

    constructor() {
        this.listeners = new Set();
    }

    do(callback) {
        this.listeners.add(callback);
    }

    undo(callback) {
        this.listeners.delete(callback);
    }

    fire(...args) {
        for (const listener of this.listeners) {
            listener(...args);
        }
    }

}

export { Do };

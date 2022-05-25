class UndoStack {

    stack = [];
    index = -1;

    constructor(dispatcher, max = 100) {
        this.dispatcher = dispatcher;
        this.max = max;
    }

    save(state, suppress) {
        const { stack } = this;

        const nextIndex = this.index + 1;
        const toRemove = stack.length - nextIndex;
        stack.splice(nextIndex, toRemove, state);

        if (stack.length > this.max) {
            stack.shift();
        }

        this.index = stack.length - 1;

        if (!suppress)
            this.dispatcher.fire('state:save', state.description);
    }

    clear() {
        this.stack = [];
        this.index = -1;
    }

    undo() {
        if (this.index > 0) {
            this.dispatcher.fire('status', 'Undo: ' + this.get().description);
            this.index--;
        } else {
            this.dispatcher.fire('status', 'Nothing to undo');
        }

        return this.get();
    }

    redo() {
        if (this.index < this.stack.length - 1) {
            this.index++;
            this.dispatcher.fire('status', 'Redo: ' + this.get().description);
        } else {
            this.dispatcher.fire('status', 'Nothing to redo');
        }

        return this.get();
    }

    get() {
        return this.stack[this.index];
    }

}

export { UndoStack };
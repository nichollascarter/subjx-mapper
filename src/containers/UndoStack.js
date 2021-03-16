class UndoStack {

    constructor(self) {
        this.stack = [null];
        this.step = -1;
        this.self = self;
    }

    next() {
        const { stack } = this;
        if (stack[stack.length - 1] !== null) {
            this.step++;
            stack.push(null);
        }
    }

    setItem(data) {
        const { stack } = this;
        stack[stack.length - 1] = data;

        if (stack.length > 9) {
            stack.shift();
        };
    }

    push(data) {
        this.step++;

        this.stack.splice(this.step);
        this.stack.push(data);
    }

    undo() {
        let item;
        const { stack } = this;

        if (this.step >= 0) {
            item = stack[this.step];
            this.step--;
            return item;
        } else {
            return null;
        }
    }
    redo() {
        const { stack } = this;

        this.step = this.step === -1 ? 0 : this.step;
        if (stack.length - 1 > this.step) {
            return stack[this.step++];
        } else {
            return null;
        }
    }

    invalidateAll() {
        this.stack = [];
        this.step = -1;
    }

}

export default UndoStack;
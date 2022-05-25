class DragHandler {

    element;
    pointer = null;
    bounds;
    downCallback = () => true;
    ondown = _ => _;
    onmove = _ => _;
    onup = _ => _;

    constructor(element, ondown, onmove, onup, cb = () => true) {
        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseUp = this.onMouseUp.bind(this);
        this.onTouchMove = this.onTouchMove.bind(this);
        this.onTouchEnd = this.onTouchEnd.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onTouchStart = this.onTouchStart.bind(this);

        this.element = element;
        this.bounds = element.getBoundingClientRect();
        this.ondown = ondown;
        this.onmove = onmove;
        this.onup = onup;

        element.addEventListener('mousedown', this.onMouseDown);
        element.addEventListener('touchstart', this.onTouchStart);

        // this.release = function() {
        // 	element.removeEventListener('mousedown', this.onMouseDown);
        // 	element.removeEventListener('touchstart', this.onTouchStart);
        // };

        this.downCallback = cb;
    }

    onMouseDown(e) {
        this.handleStart(e);

        if (!this.downCallback(this.pointer)) {
            this.pointer = null;
            return;
        }

        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('mouseup', this.onMouseUp);

        this.ondown(this.pointer);

        e.preventDefault();
    }

    onMouseMove(e) {
        this.handleMove(e);
        this.onmove(this.pointer);
    }

    handleStart(e) {
        this.bounds = this.element.getBoundingClientRect();

        const { clientX, clientY } = e;
        this.pointer = {
            startX: clientX,
            startY: clientY,
            x: clientX,
            y: clientY,
            dx: 0,
            dy: 0,
            offsetX: clientX - this.bounds.left,
            offsetY: clientY - this.bounds.top,
            moved: false
        };
    }

    handleMove(e) {
        const { pointer } = this;
        const bounds = this.element.getBoundingClientRect();
        this.bounds = bounds;

        const { clientX, clientY } = e;

        let offsetX = clientX - bounds.left,
            offsetY = clientY - bounds.top;

        pointer.x = clientX;
        pointer.y = clientY;
        pointer.dx = clientX - pointer.startX;
        pointer.dy = clientY - pointer.startY;
        pointer.offsetX = offsetX;
        pointer.offsetY = offsetY;

        // If the pointer dx/dy is _ever_ non-zero, then it's moved
        pointer.moved = pointer.moved || pointer.dx !== 0 || pointer.dy !== 0;
    }

    onMouseUp(e) {
        this.handleMove(e);
        this.onup(this.pointer);
        this.pointer = null;

        document.removeEventListener('mousemove', this.onMouseMove);
        document.removeEventListener('mouseup', this.onMouseUp);
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            const e = e.touches[0];
            if (!this.downCallback(e)) return;

            e.preventDefault();
            this.handleStart(e);
            this.ondown(this.pointer);
        }

        this.element.addEventListener('touchmove', this.onTouchMove);
        this.element.addEventListener('touchend', this.onTouchEnd);
    }

    onTouchMove(e) {
        const ev = e.touches[0];
        this.onMouseMove(ev);
    }

    onTouchEnd(e) {
        this.onMouseUp(e);
        this.element.removeEventListener('touchmove', this.onTouchMove);
        this.element.removeEventListener('touchend', this.onTouchEnd);
    }

}

export { DragHandler };

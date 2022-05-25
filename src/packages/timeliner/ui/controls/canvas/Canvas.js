import { DragHandler } from '../../helpers/DragHandler';

class Canvas {

    dom = document.createElement('canvas');
    ctx = this.dom.getContext('2d');
    items = [];
    child = null;

    dragHandler = new DragHandler(
        this.dom,
        e => { if (this.child.onDown) this.child.onDown(e); },
        e => { if (this.child.onMove) this.child.onMove(e); },
        e => { if (this.child.onUp) this.child.onUp(e); },
        e => { if (this.child.onHit) this.child.onHit(e); }
    );

    constructor(width, height) {
        this.setSize(width, height);
    }

    setSize(width, height) {
        const { dom, child } = this;

        const dpr = window.devicePixelRatio;

        dom.width = (width - 50) * dpr;
        dom.height = height * dpr;
        dom.style.width = `${width - 50}px`;
        dom.style.height = `${width}px`;

        if (child) child.setSize(width, height);
    }

    paint(ctx) {
        const { items, child } = this;
        if (child) {
            if (!child.paint)
                console.warn('implement repaint()');
            child.paint(ctx);
        }

        items.map(item => item.paint());
    }

    repaint() {
        this.paint(this.ctx);
    }

    add(item) {
        this.items.push(item);
    }

    remove(item) {
        this.items.splice(this.items.indexOf(item), 1);
    }

    uses(child) {
        this.child = child;
        child.add = this.add;
        child.remove = this.remove;
    }

}

export default Canvas;

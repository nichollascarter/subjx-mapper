import { Theme } from '../theme';

class Rect {

    set(x, y, w, h, color, outline) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.color = color;
        this.outline = outline;
    }

    paint(ctx) {
        ctx.fillStyle = Theme.b;
        ctx.strokeStyle = Theme.c;

        this.shape(ctx);

        ctx.stroke();
        ctx.fill();
    }

    shape(ctx) {
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.w, this.h);
    }

    contains(x, y) {
        return x >= this.x && y >= this.y && x <= this.x + this.w && y <= this.y + this.h;
    }

}

const MARGINS = 15;

class ScrollCanvas {

    width;
    height;
    scroller = {
        left: 0,
        grip_length: 0,
        k: 1
    };
    draggingx = null;
    scrollRect = new Rect();

    constructor(dispatcher, data) {
        this.data = data;
        this.dispatcher = dispatcher;
        
        this.setSize = (w, h) => {
            this.width = w;
            this.height = h;
        };
    }

    onDown(e) {
        if (this.scrollRect.contains(e.offsetx - MARGINS, e.offsety - 5)) {
            this.draggingx = this.scroller.left;
            return;
        }

        const { value: totalTime } = this.data.get('ui:totalTime');
        //const pixels_per_second = this.data.get('ui:timeScale').value;
        const w = this.width - 2 * MARGINS;

        let time = (e.offsetx - MARGINS) / w * totalTime;
        time = Math.max(0, time);
        // data.get('ui:currentTime').value = t;
        this.dispatcher.fire('time.update', time);

        if (e.preventDefault) e.preventDefault();
    }

    paint(ctx) {
        const { data, width, height, scroller } = this;

        let totalTime = data.get('ui:totalTime').value;
        let scrollTime = data.get('ui:scrollTime').value;
        let currentTime = data.get('ui:currentTime').value;

        let pixels_per_second = data.get('ui:timeScale').value;

        ctx.save();
        let dpr = window.devicePixelRatio;
        ctx.scale(dpr, dpr);

        let w = width - 2 * MARGINS;
        let h = 16; // TOP_SCROLL_TRACK;

        ctx.clearRect(0, 0, width, height);
        ctx.translate(MARGINS, 5);

        // outline scroller
        ctx.beginPath();
        ctx.strokeStyle = Theme.b;
        ctx.rect(0, 0, w, h);
        ctx.stroke();

        let totalTimePixels = totalTime * pixels_per_second;
        let k = w / totalTimePixels;
        scroller.k = k;

        let grip_length = w * k;

        scroller.grip_length = grip_length;
        scroller.left = scrollTime / totalTime * w;

        this.scrollRect.set(scroller.left, 0, scroller.grip_length, h);
        this.scrollRect.paint(ctx);

        const r = currentTime / totalTime * w;

        ctx.fillStyle = Theme.c;
        ctx.lineWidth = 2;

        ctx.beginPath();

        // circle
        // ctx.arc(r, h2 / 2, h2 / 1.5, 0, Math.PI * 2);
        // line
        ctx.rect(r, 0, 2, h + 5);
        ctx.fill();

        ctx.fillText(currentTime && currentTime.toFixed(2), r, h + 14);
        // ctx.fillText(currentTime && currentTime.toFixed(3), 10, 10);
        ctx.fillText(totalTime, 300, 14);

        ctx.restore();
    }

    onMove(e) {
        const { draggingx, scroller, data, dispatcher } = this;

        if (draggingx != null) {
            const totalTime = data.get('ui:totalTime').value;
            const w = this.width - 2 * MARGINS;
            const scrollTime = (draggingx + e.dx) / w * totalTime;

            if (draggingx + e.dx + scroller.grip_length > w)
                return;

            dispatcher.fire('update.scrollTime', scrollTime);
        } else {
            this.onDown(e);
        }
    }

    onUp(e) {
        this.draggingx = null;
    }

}

export { ScrollCanvas };

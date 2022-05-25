import { scaledTime } from '../../helpers';
import { Theme } from '../../theme';
import easing from '../../../core/easing';

class EasingRect {

    constructor(startX, startY, endX, endY, frame, prevFrame, nextFrame, neighbourRectFrame, track) {
        this.track = track;

        this.path = (ctxWrap) => {
            drawRect(ctxWrap, Math.min(startX, endX), startY, Math.abs(endX - startX), endY - startY);
        };

        this.paint = (ctxWrap) => {
            this.path(ctxWrap);
            ctxWrap.fillStyle(frame._color || Theme.d);
            ctxWrap.fill();

            this.drawCurves(ctxWrap);
        };

        this.drawCurves = (ctxWrap) => {
            let color = parseInt((frame._color || '#ffffff').substring(1, 7), 16);
            color = 0xffffff ^ color;
            color = color.toString(16);
            color = '#' + color;

            ctxWrap.beginPath();
            ctxWrap.moveTo(startX, endY);
            const dy = startY - endY;
            const dx = endX - startX;

            for (let x3 = startX; x3 < endX; x3++) {
                const value = easing[frame.easing]((x3 - startX) / dx);
                ctxWrap.lineTo(x3, endY + value * (value < 0 ? -dy : dy));
            }

            ctxWrap.strokeStyle(color);
            ctxWrap.stroke();
        };

        this.mouseover = (trackCanvas) => {
            trackCanvas.style.cursor = 'ew-resize';
        };

        this.mouseout = (trackCanvas) => {
            trackCanvas.style.cursor = 'default';
        };

        this.mousedrag = (e, dispatcher) => {
            let t1 = scaledTime.xToTime(startX + e.dx);
            let t2 = scaledTime.xToTime(endX + e.dx);
            t1 = Math.max(0, t1);
            t2 = Math.max(0, t2);

            if ((!prevFrame || t1 > prevFrame.time) && (!neighbourRectFrame || t2 < neighbourRectFrame.time)) {
                frame.time = t1;
            } else {
                return;
            }

            if (t1 > 0 && (!neighbourRectFrame || t2 < neighbourRectFrame.time)) {
                nextFrame.time = t2;
            }

            dispatcher.fire('time.update', t1);
        };
    }

}

const drawRect = (ctx, x, y, width, height, radius = 6) => {
    const nextRadius = width > 0 ? radius : 0;

    const borders = {
        tl: nextRadius,
        tr: nextRadius,
        br: nextRadius,
        bl: nextRadius
    };

    const xLength = x + width;
    const yLength = y + height;

    ctx.beginPath();
    ctx.moveTo(x + borders.tl, y);
    ctx.lineTo(xLength - borders.tr, y);
    ctx.quadraticCurveTo(xLength, y, xLength, y + borders.tr);
    ctx.lineTo(xLength, yLength - borders.br);
    ctx.quadraticCurveTo(xLength, yLength, xLength - borders.br, yLength);
    ctx.lineTo(x + borders.bl, yLength);
    ctx.quadraticCurveTo(x, yLength, x, yLength - borders.bl);
    ctx.lineTo(x, y + borders.tl);
    ctx.quadraticCurveTo(x, y, x + borders.tl, y);
    ctx.closePath();
    //ctx.fill();

    return ctx;
};

export default EasingRect;

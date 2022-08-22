import { LAYOUT_CONSTANTS } from '../../consts';
import { Theme } from '../theme';
import {
    EasingRect,
    Diamond,
    Track
} from '../controls/canvas';
import { scaledTime } from '../helpers';

const {
    LINE_HEIGHT,
    width: WIDTH,
    STATE_MARKER_OFFSET
} = LAYOUT_CONSTANTS;

class TrackPattern {

    tracks = [];
    renderItems = [];
    over = null;
    dpr = window.devicePixelRatio;

    constructor(name, ctx, ctxWrap, canvas, tracks, renderType = 'timeline', states) {
        this.name = name;
        this.ctx = ctx;
        this.ctxWrap = ctxWrap;
        this.tracks = tracks;
        this.canvas = canvas;
        this.renderType = renderType;
        this.states = states;
    }

    setState(state) {
        this.tracks = state.value;
        this.repaint();
    }

    check(pointer, isMousedownPressed) {
        const {
            ctx,
            ctxWrap,
            renderItems,
            canvas,
            dpr,
            over: lastOver
        } = this;

        let item;
        let over = null;
        let overItem = null;

        let selectedItem = null;

        for (let i = renderItems.length; i-- > 0;) {
            item = renderItems[i];
            item.path(ctxWrap);

            if (ctx.isPointInPath(pointer.x * dpr, pointer.y * dpr)) {
                over = item;
                break;
            } else {
                if (item.mouseout)
                    item.mouseout(canvas, ctxWrap);
            }
        }

        if (over) {
            item = over;
            overItem = item;
            if (item.mouseover)
                item.mouseover(canvas, ctxWrap);

            if (isMousedownPressed) {
                selectedItem = item;
            }
        }

        if (lastOver && lastOver != item) {
            if (item && item.mouseout)
                item.mouseout(canvas, ctxWrap);
        }

        this.over = over;

        return selectedItem || overItem ? { overItem, item: selectedItem } : null;
    }

    paint(offset) {
        const { ctx, tracks, ctxWrap } = this;

        const OFFSET = offset * LINE_HEIGHT;

        // horizontal layer lines
        const { length: il } = tracks;

        ctx.strokeStyle = Theme.border;

        for (let i = 0; i <= il; i++) {
            let y = i * LINE_HEIGHT + OFFSET;
            y = ~~y - 0.5;

            ctxWrap
                .beginPath()
                .moveTo(0, y)
                .lineTo(WIDTH, y)
                .stroke();
        }

        let frame, prevFrame, nextFrame, neighbourRectFrame, renderItems = [];

        // Draw Easing Rects
        for (let i = 0; i < il; i++) {
            // check for keyframes
            const { values, values: { length: len } } = tracks[i];

            const y = i * LINE_HEIGHT + OFFSET;

            const track = new Track({ x: 0, y, w: WIDTH, h: LINE_HEIGHT }, tracks[i]);
            renderItems.push(track);

            if (this.renderType === 'timeline') {
                for (let j = 0; j < len; j++) {
                    frame = values[j];
                    prevFrame = j > 0 ? values[j - 1] : null;
                    nextFrame = values[j + 1] || {};
                    neighbourRectFrame = values[j + 2];

                    // Draw Tween Rect
                    const { time } = frame;
                    const { time: nextTime } = nextFrame;

                    const startX = scaledTime.timeToX(time);
                    const endX = scaledTime.timeToX(nextTime);

                    if (!frame.easing || frame.easing == 'none') continue;

                    const startY = y + 2;
                    const endY = y + LINE_HEIGHT - 2;

                    const easingRect = new EasingRect(
                        startX,
                        startY,
                        endX,
                        endY,
                        frame,
                        prevFrame,
                        nextFrame,
                        neighbourRectFrame,
                        tracks[i]
                    );

                    easingRect.paint(ctxWrap);
                    renderItems.push(easingRect);
                }
            } else if (this.renderType === 'selector') {
                for (let j = 0; j < this.states.length; j++) {
                    frame = values.find(({ state }) => state === this.states[j]);

                    if (!frame) continue;

                    prevFrame = j > 0 ? values.find(({ state }) => state === this.states[j - 1]) : null;
                    nextFrame = j < len - 1 ? values.find(({ state }) => state === this.states[j + 1]) : null;

                    neighbourRectFrame = null;

                    // Draw Tween Rect
                    // x value based on time value if it's timeline

                    const startX = scaledTime.timeToX(j + STATE_MARKER_OFFSET);
                    const endX = scaledTime.timeToX(j + 1);

                    if (!frame.easing || frame.easing == 'none') continue;

                    const startY = y + 2;
                    const endY = y + LINE_HEIGHT - 2;

                    const easingRect = new EasingRect(
                        startX,
                        startY,
                        endX,
                        endY,
                        frame,
                        prevFrame,
                        nextFrame,
                        neighbourRectFrame,
                        tracks[i]
                    );

                    easingRect.paint(ctxWrap);
                    renderItems.push(easingRect);
                }
            }

            if (this.renderType === 'timeline') {
                for (let j = 0; j < len; j++) {
                    frame = values[j];
                    prevFrame = j > 0 ? values[j - 1] : null;
                    nextFrame = j < len - 1 ? values[j + 1] : null;

                    const diamond = new Diamond(y, frame, prevFrame, nextFrame, tracks[i]);
                    diamond.paint(ctxWrap);
                    renderItems.push(diamond);
                }
            } else if (this.renderType === 'selector') {
                for (let j = 0; j < this.states.length; j++) {
                    frame = values.find(({ state }) => state === this.states[j]);
                    if (!frame) continue;

                    prevFrame = j > 0 ? values.find(({ state }) => state === this.states[j - 1]) : null;
                    nextFrame = j < len - 1 ? values.find(({ state }) => state === this.states[j + 1]) : null;

                    const currentFrame = { ...frame, time: j + STATE_MARKER_OFFSET };

                    const diamond = new Diamond(y, currentFrame, prevFrame, nextFrame, tracks[i]);
                    diamond.paint(ctxWrap);
                    renderItems.push(diamond);
                }
            }
        }

        this.renderItems = renderItems;
    }

}

export { TrackPattern };

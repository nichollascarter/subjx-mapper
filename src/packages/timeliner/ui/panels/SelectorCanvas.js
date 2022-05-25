import { LayoutConstants } from '../../consts';
import { Theme } from '../theme.js';
import { DragHandler, scaledTime } from '../helpers';
import { ScrollCanvas } from './ScrollCanvas';
import { Canvas } from '../controls/canvas';
import { TrackPattern } from './TrackPattern';
import { proxyCtx, formatFriendlySeconds } from '../../utils/common';

const {
    LEFT_GUTTER,
    width: WIDTH,
    height: HEIGHT,
    WIDTH_OFFSET,
    STATE_MARKER_OFFSET
} = LayoutConstants;

const TIME_SCROLLER_HEIGHT = 35,
    MARKER_TRACK_HEIGHT = 25;

class SelectorCanvas {

    dpr = window.devicePixelRatio;
    scrollCanvas = new Canvas(WIDTH, TIME_SCROLLER_HEIGHT);
    scrollTop = 0;
    scrollLeft = 0;
    scrollHeight;

    needsRepaint = false;

    currentTime;
    canvasBounds;
    overItem = null;

    dom = document.createElement('canvas');
    ctx = this.dom.getContext('2d');
    ctxWrap = proxyCtx(this.ctx);

    width = WIDTH;
    height = HEIGHT;

    states = [];

    constructor(data, dispatcher) {
        const {
            dom,
            ctx,
            ctxWrap,
            scrollCanvas
        } = this;

        this.data = data;
        this.dispatcher = dispatcher;

        dom.style.top = TIME_SCROLLER_HEIGHT + 'px';

        scrollCanvas.uses(new ScrollCanvas(dispatcher, data));

        this.resize();
        this.repaint();

        dom.addEventListener('dblclick', e => this.onDoubleClick(e));
        dom.addEventListener('mouseout', () => this.pointer = null);

        document.addEventListener('mousemove', e => this.onMouseMove(e));

        let mouseDownThenMove = false;

        this.dragHandler = new DragHandler(dom,
            e => {
                this.mousedown2 = true;
                this.pointer = {
                    x: e.offsetX,
                    y: e.offsetY
                };

                this.pointerEvents();

                if (!this.mousedownItem) {
                    const time = scaledTime.xToTime(e.offsetX);

                    const currentState = Math.trunc(time);
                    if (typeof this.states[currentState] !== 'undefined')
                        dispatcher.fire('time.update', currentState + STATE_MARKER_OFFSET);
                }
            },
            e => {
                this.mousedown2 = false;
                if (this.mousedownItem) {
                    mouseDownThenMove = true;

                    if (this.mousedownItem.mousedrag) {
                        //this.mousedownItem.mousedrag(e, dispatcher);
                    }
                } else {
                    let time = scaledTime.xToTime(e.offsetX);
                    //console.log(time)
                    //dispatcher.fire('time.update', time);
                }
            },
            e => {
                if (mouseDownThenMove) {
                    //dispatcher.fire('keyframe.move');
                } else {
                    const time = scaledTime.xToTime(e.offsetX);

                    const stateIndex = Math.trunc(time);
                    if (typeof this.states[stateIndex] !== 'undefined')
                        dispatcher.fire('time.update', stateIndex + STATE_MARKER_OFFSET);
                }

                this.mousedown2 = false;
                this.mousedownItem = null;
                mouseDownThenMove = false;
            }
        );

        this.trackContexts = data.get('tracks').value.map(({ name, tracks }) => (
            new TrackPattern(name, ctx, ctxWrap, dom, tracks, 'selector', this.states)
        ));
    }

    onDoubleClick() {
        const canvasBounds = this.dom.getBoundingClientRect();
        this.canvasBounds = canvasBounds;

        const currentState = Math.trunc(this.currentTime);

        if (this.overItem && typeof this.states[currentState] !== 'undefined') {
            this.dispatcher.fire(
                'selector:keyframe',
                this.overItem.track,
                currentState,
                this.states[currentState]
            );
        }
    }

    onMouseMove(e) {
        const canvasBounds = this.dom.getBoundingClientRect();

        this.onPointerMove(
            e.clientX - canvasBounds.left,
            e.clientY - canvasBounds.top
        );

        this.canvasBounds = canvasBounds;
    }

    onPointerMove(x, y) {
        if (this.mousedownItem) return;
        this.pointer = { x, y };
    }

    scrollTo(s, y) {
        const { height } = this.dom.getBoundingClientRect();

        this.scrollTop = s * Math.max(height - this.scrollHeight, 0);
        this.repaint();
    }

    resize(width, height) {
        const { dom } = this;

        this.width = width;
        this.height = height;

        const h = height - TIME_SCROLLER_HEIGHT;
        const dpr = window.devicePixelRatio;

        dom.width = (width * dpr) - WIDTH_OFFSET;
        dom.height = h * dpr;
        dom.style.width = width - WIDTH_OFFSET + 'px';
        dom.style.height = h + 'px';

        this.scrollHeight = height - TIME_SCROLLER_HEIGHT;
        this.scrollCanvas.setSize(width, TIME_SCROLLER_HEIGHT);

        this.dpr = dpr;
    }

    repaint() {
        this.needsRepaint = true;
    }

    setState(state) {
        const { ctx, ctxWrap, dom } = this;

        this.states = state.get('context:states').value || [];

        this.trackContexts = state.get('tracks').value.map(({ name, tracks }) => (
            new TrackPattern(name, ctx, ctxWrap, dom, tracks, 'selector', this.states)
        ));

        this.repaint();
    }

    pointerEvents() {
        if (!this.pointer) return;

        const {
            ctxWrap,
            dpr,
            scrollHeight,
            scrollLeft,
            scrollTop,
            pointer,
            trackContexts
        } = this;

        const checkPointerContext = () => {
            const { item, overItem } = trackContexts.reduce((next, track) => {
                const result = track.check(pointer, this.mousedown2);

                if (!result) return next;

                return result;
            }, {});

            this.overItem = overItem;

            if (item) this.mousedownItem = item;
        };

        ctxWrap
            .save()
            .scale(dpr, dpr)
            .translate(0, MARKER_TRACK_HEIGHT)
            .beginPath()
            .rect(0, 0, this.width, scrollHeight)
            .translate(-scrollLeft, -scrollTop)
            .clip()
            .run(checkPointerContext)
            .restore();
    }

    _paint() {
        const { ctx, ctxWrap, scrollCanvas, dom, dpr, scrollHeight } = this;

        let x, y;

        if (!this.needsRepaint) {
            this.pointerEvents();
            return;
        }

        scrollCanvas.repaint();

        this.setTimeScale();

        const { value: currentTime } = this.data.get('ui:currentTime');

        ctx.fillStyle = Theme.a;
        ctx.clearRect(0, 0, dom.width, dom.height);
        ctx.save();
        ctx.scale(dpr, dpr);

        ctx.lineWidth = 1;

        let units = scaledTime.getTick1Units();
        let offsetUnits = (scaledTime.frameStart * scaledTime.timeScale) % units;

        let count = (this.width - LEFT_GUTTER + offsetUnits) / units;

        // time_scale = pixels to 1 second (40)
        // tickMark1 = marks per second (marks / s)
        // units = pixels to every mark (40)
        // labels only
        for (let i = 0; i < this.states.length; i++) {
            x = i * units + LEFT_GUTTER - offsetUnits;

            ctx.strokeStyle = Theme.border;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();

            ctx.fillStyle = Theme.font;
            ctx.textAlign = 'center';

            let t = (i * units - offsetUnits) / scaledTime.timeScale + scaledTime.frameStart;
            t = formatFriendlySeconds(t);
            ctx.fillText(this.states[i], x + 30, 38);
        }

        // ctx.beginPath();
        // ctx.moveTo(x * 2, 0);
        // ctx.lineTo(x * 2, this.height);
        // ctx.stroke();

        units = scaledTime.getTick3Units();
        count = (this.width - LEFT_GUTTER + offsetUnits) / units;

        const paintTracks = (result, trackContext) => {
            trackContext.paint(result);

            return result + (trackContext.tracks || []).length + 1;
        };

        // Encapsulate a scroll rect for the tracks
        ctxWrap
            .save()
            .translate(0, MARKER_TRACK_HEIGHT)
            .beginPath()
            .rect(0, 0, this.width, scrollHeight)
            .translate(-this.scrollLeft, -this.scrollTop)
            .clip()
            .run(() => this.trackContexts.reduce(paintTracks, 1))
            .restore();

        // Current Marker / Cursor
        ctx.strokeStyle = Theme.cursor;
        x = (currentTime - scaledTime.frameStart) * scaledTime.timeScale + LEFT_GUTTER;

        const baseLine = 0, half_rect = 6;

        ctx.beginPath();
        ctx.moveTo(x, baseLine);
        ctx.lineTo(x, this.height);
        ctx.stroke();

        ctx.fillStyle = Theme.cursor;
        ctx.textAlign = 'center';

        ctx.beginPath();
        ctx.moveTo(x, baseLine + 8);
        ctx.lineTo(x + 8, baseLine);
        ctx.lineTo(x + half_rect, baseLine);
        ctx.lineTo(x + half_rect, baseLine);
        ctx.lineTo(x - half_rect, baseLine);
        ctx.lineTo(x - half_rect, baseLine);
        ctx.lineTo(x - 8, baseLine);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        this.needsRepaint = false;
        this.currentTime = currentTime;
        this.pointerEvents();
    }

    setTimeScale() {
        const { value: timeScale } = this.data.get('ui:timeScale');
        if (scaledTime.timeScale !== timeScale) {
            scaledTime.setTimeScale(timeScale);
        }
    }

}

export { SelectorCanvas };

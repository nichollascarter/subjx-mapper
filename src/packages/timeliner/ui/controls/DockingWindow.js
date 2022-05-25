import { Do } from '../../classes/Do';
import { LayoutConstants } from '../../consts';

const SNAP_FULL_SCREEN = 'full-screen';
const SNAP_TOP_EDGE = 'snap-top-edge'; // or actually top half
const SNAP_LEFT_EDGE = 'snap-left-edge';
const SNAP_RIGHT_EDGE = 'snap-right-edge';
const SNAP_BOTTOM_EDGE = 'snap-bottom-edge';
const SNAP_DOCK_BOTTOM = 'dock-bottom';

const setBounds = (element, x, y, w, h) => {
    element.style.left = x + 'px';
    element.style.top = y + 'px';
    element.style.width = w + 'px';
    element.style.height = h + 'px';
};

// Minimum resizable area
let minWidth = 100;
let minHeight = 80;

// Thresholds
const FULLSCREEN_MARGINS = 2;
const SNAP_MARGINS = 8;
const MARGINS = 2;

class DockingWindow {

    allowDragging = true;
    redraw = false;
    pointerStart = null;
    resizes = new Do();
    snapBounds = {};
    snapType = SNAP_DOCK_BOTTOM;
    bounds = { left: 0, top: 0, width: LayoutConstants.width, height: LayoutConstants.height };

    constructor(panel, ghostpanel) {
        this.panel = panel;
        this.ghostpanel = ghostpanel;

        this.init();
    }

    init() {
        const { panel, ghostpanel } = this;
        window.addEventListener('resize', () => this.resizeEdges());

        setBounds(panel, 0, 0, LayoutConstants.width, LayoutConstants.height);
        setBounds(ghostpanel, 0, 0, LayoutConstants.width, LayoutConstants.height);

        // Mouse events
        panel.addEventListener('mousedown', e => this.onMouseDown(e));
        document.addEventListener('mousemove', e => this.onMove(e));
        document.addEventListener('mouseup', e => this.onMouseUp(e));

        // Touch events
        panel.addEventListener('touchstart', e => this.onTouchDown(e));
        document.addEventListener('touchmove', e => this.onTouchMove(e));
        document.addEventListener('touchend', e => this.onTouchEnd(e));

        // use setTimeout as a hack to get dimensions correctly! :(
        setTimeout(() => this.resizeEdges());

        this.hideGhostPane();

        const self = this;

        function animate() {
            requestAnimationFrame(animate);

            if (!self.redraw) return;

            self.redraw = false;

            const { pointerStart, preSnapped, snapBounds, bounds, e } = self;

            let x = e.clientX - bounds.left,
                y = e.clientY - bounds.top;

            const {
                onTopEdge,
                onLeftEdge,
                onRightEdge,
                onBottomEdge
            } = self.calculateBounds(e);

            // style cursor
            if (onRightEdge && onBottomEdge || onLeftEdge && onTopEdge) {
                panel.style.cursor = 'nwse-resize';
            } else if (onRightEdge && onTopEdge || onBottomEdge && onLeftEdge) {
                panel.style.cursor = 'nesw-resize';
            } else if (onRightEdge || onLeftEdge) {
                panel.style.cursor = 'ew-resize';
            } else if (onBottomEdge || onTopEdge) {
                panel.style.cursor = 'ns-resize';
            } else if (self.canMove()) {
                panel.style.cursor = 'move';
            } else {
                panel.style.cursor = 'default';
            }

            if (!pointerStart)
                return;

            /* User is resizing */
            if (pointerStart.isResizing) {
                if (pointerStart.onRightEdge)
                    panel.style.width = Math.max(x, minWidth) + 'px';
                if (pointerStart.onBottomEdge)
                    panel.style.height = Math.max(y, minHeight) + 'px';

                if (pointerStart.onLeftEdge) {
                    let currentWidth = Math.max(pointerStart.cx - e.clientX + pointerStart.w, minWidth);
                    if (currentWidth > minWidth) {
                        panel.style.width = currentWidth + 'px';
                        panel.style.left = e.clientX + 'px';
                    }
                }

                if (pointerStart.onTopEdge) {
                    let currentHeight = Math.max(pointerStart.cy - e.clientY + pointerStart.h, minHeight);
                    if (currentHeight > minHeight) {
                        panel.style.height = currentHeight + 'px';
                        panel.style.top = e.clientY + 'px';
                    }
                }

                self.hideGhostPane();

                self.resizes.fire(bounds.width, bounds.height);

                return;
            }

            /* User is dragging */
            if (pointerStart.isMoving) {
                const snapType = self.checkSnapType(self.e);
                if (snapType) {
                    self.calcSnapBounds(snapType);

                    const { left, top, width, height } = snapBounds;
                    setBounds(ghostpanel, left, top, width, height);
                    ghostpanel.style.opacity = 0.2;
                } else {
                    self.hideGhostPane();
                }

                if (preSnapped) {
                    setBounds(panel,
                        e.clientX - preSnapped.width / 2,
                        e.clientY - Math.min(pointerStart.y, preSnapped.height),
                        preSnapped.width,
                        preSnapped.height
                    );

                    self.resizes.fire(preSnapped.width, preSnapped.height);
                    return;
                }

                // moving
                panel.style.top = (e.clientY - pointerStart.y) + 'px';
                panel.style.left = (e.clientX - pointerStart.x) + 'px';

                return;
            }
        }

        animate();
    }

    calcSnapBounds(snapType) {
        if (!snapType)
            return;

        const { bounds } = this;

        let width, height, left, top;

        switch (snapType) {

            case SNAP_FULL_SCREEN:
                width = window.innerWidth;
                height = window.innerHeight;
                left = 0;
                top = 0;
                break;
            case SNAP_TOP_EDGE:
                width = window.innerWidth;
                height = window.innerHeight / 2;
                left = 0;
                top = 0;
                break;
            case SNAP_LEFT_EDGE:
                width = window.innerWidth / 2;
                height = window.innerHeight;
                left = 0;
                top = 0;
                break;
            case SNAP_RIGHT_EDGE:
                width = window.innerWidth / 2;
                height = window.innerHeight;
                left = window.innerWidth - width;
                top = 0;
                break;
            case SNAP_BOTTOM_EDGE:
                width = window.innerWidth;
                height = window.innerHeight / 3;
                left = 0;
                top = window.innerHeight - height;
                break;
            case SNAP_DOCK_BOTTOM:
                width = bounds.width;
                height = bounds.height;
                left = (window.innerWidth - width) * 0.5;
                top = window.innerHeight - height;

        }

        this.snapBounds = {
            ...this.snapBounds,
            ...({ left, top, width, height })
        };
    }

    resizeEdges() {
        if (!this.snapType) return;

        this.calcSnapBounds(this.snapType);

        const { left, top, width, height } = this.snapBounds;

        setBounds(this.panel, left, top, width, height);

        this.resizes.fire(width, height);
    }

    onUp(e) {
        const bounds = this.panel.getBoundingClientRect();

        const pointerStart = {
            ...this.pointerStart || {},
            ...this.calculateBounds(e)
        };

        this.pointerStart = pointerStart;

        if (pointerStart && pointerStart.isMoving) {
            // Snap
            let snapType = this.checkSnapType(e);
            this.snapType = snapType;

            if (snapType) {
                this.preSnapped = {
                    width: bounds.width,
                    height: bounds.height,
                    top: bounds.top,
                    left: bounds.left
                };

                this.resizeEdges();
            } else {
                this.preSnapped = null;
            }

            this.hideGhostPane();
        }

        this.pointerStart = null;
    }

    allowMove(allow) {
        this.allowDragging = allow;
    }

    canMove() {
        return this.allowDragging;
    }

    maximize() {
        const { preSnapped, bounds } = this;
        if (!preSnapped) {
            this.preSnapped = {
                width: bounds.width,
                height: bounds.height,
                top: bounds.top,
                left: bounds.left
            };

            this.snapType = SNAP_FULL_SCREEN;
            this.resizeEdges();
        } else {
            setBounds(this.panel, bounds.left, bounds.top, bounds.width, bounds.height);
            this.calculateBounds();
            this.snapType = null;
            this.preSnapped = null;
        }
    }

    hideGhostPane() {
        const { bounds, ghostpanel } = this;
        // hide the hinter, animating to the pane's bounds
        setBounds(ghostpanel, bounds.left, bounds.top, bounds.width, bounds.height);
        ghostpanel.style.opacity = 0;
    }

    onTouchDown(e) {
        this.onDown(e.touches[0]);
        e.preventDefault();
    }

    onTouchMove(e) {
        this.onMove(e.touches[0]);
    }

    onTouchEnd(e) {
        if (e.touches.length == 0)
            this.onUp(e.changedTouches[0]);
    }

    onMouseDown(e) {
        this.onDown(e);
    }

    onMouseUp(e) {
        this.onUp(e);
    }

    onDown(e) {
        const {
            onTopEdge,
            onLeftEdge,
            onRightEdge,
            onBottomEdge
        } = this.calculateBounds(e);

        let isResizing = onRightEdge || onBottomEdge || onTopEdge || onLeftEdge;
        let isMoving = !isResizing && this.canMove();

        let x = e.clientX - this.bounds.left,
            y = e.clientY - this.bounds.top;

        this.pointerStart = {
            x: x,
            y: y,
            cx: e.clientX,
            cy: e.clientY,
            w: this.bounds.width,
            h: this.bounds.height,
            isResizing: isResizing,
            isMoving: isMoving,
            onTopEdge: onTopEdge,
            onLeftEdge: onLeftEdge,
            onRightEdge: onRightEdge,
            onBottomEdge: onBottomEdge
        };

        if (isResizing || isMoving) {
            e.preventDefault();
            e.stopPropagation();
        }

        this.e = e;
    }

    calculateBounds(e) {
        const bounds = this.panel.getBoundingClientRect();
        this.bounds = bounds;

        let x = e.clientX - bounds.left,
            y = e.clientY - bounds.top;

        return {
            onTopEdge: y < MARGINS,
            onLeftEdge: x < MARGINS,
            onRightEdge: x >= bounds.width - MARGINS,
            onBottomEdge: y >= bounds.height - MARGINS
        };
    }

    onMove(e) {
        this.calculateBounds(e);

        this.redraw = true;
        this.e = e;
    }

    checkSnapType(e) {
        // drag to full screen
        if (e.clientY < FULLSCREEN_MARGINS)
            return SNAP_FULL_SCREEN;

        // drag for top half screen
        if (e.clientY < SNAP_MARGINS)
            return SNAP_TOP_EDGE;

        // drag for left half screen
        if (e.clientX < SNAP_MARGINS)
            return SNAP_LEFT_EDGE;

        // drag for right half screen
        if (window.innerWidth - e.clientX < SNAP_MARGINS)
            return SNAP_RIGHT_EDGE;

        // drag for bottom half screen
        if (window.innerHeight - e.clientY < SNAP_MARGINS)
            return SNAP_BOTTOM_EDGE;
    }

}

export { DockingWindow };

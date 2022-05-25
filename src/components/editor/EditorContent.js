import React from 'react';
import { connect } from 'react-redux';
import subjx from 'subjx';
import DragSelect from 'dragselect';

import { setSelectedItems } from '../../actions';
import Animated from '../../packages/animated';
import { generateUUID } from '../../util';

const textItemEvents = [
    'letterSpacing',
    'wordSpacing',
    'lineHeight',
    'textContent'
];

const subjxConfiguration = {
    controlsContainer: '#controls-container',
    rotatorAnchor: 'n',
    rotatorOffset: 30
};


const mapDispatchToProps = (dispatch) => ({
    $setSelectedItems: (act) => dispatch(setSelectedItems(act))
});

const mapStateToProps = (state) => ({
    editorGridSize: state.editorGridSize,
    allowDragging: state.allowDragging,
    allowResizing: state.allowResizing,
    allowRotating: state.allowRotating,
    allowProportions: state.allowProportions,
    allowRestrictions: state.allowRestrictions,
    allowTransformOrigin: state.allowTransformOrigin,
    snapSteps: state.snapSteps,
    eventBus: state.eventBus,
    undoStack: state.undoStack
});

class EditorContainer extends React.Component {

    root = null;
    editable = false;
    selectable = null;
    items = [];
    currentLayer = null;
    ignoreStoring = false;

    timeliner;
    animated;

    itemsStorage = new WeakMap();

    shouldComponentUpdate(nextProps) {
        if (this.root) {
            if (nextProps.content !== this.props.content) {
                this.dropItems();
                this.currentLayer = this.root;

                if (nextProps.content && nextProps.content.childNodes) {
                    while (nextProps.content.childNodes.length) {
                        this.root.appendChild(nextProps.content.firstChild);
                    }
                } else {
                    this.handleDropLayer();
                    while (this.root.lastElementChild) {
                        this.root.removeChild(this.root.lastElementChild);
                    }
                }
            }
        }

        if (nextProps.dropLayer) {
            this.handleDropLayer();
        }

        if (
            (nextProps.dropItems === true || !nextProps.editable) &&
            this.items.length
        ) {
            this.dropItems();
        }

        if (nextProps.selectable !== Boolean(this.selectable)) {
            if (nextProps.selectable) {
                this.selectable = this.makeSelectables();
            }
            if (!nextProps.selectable && this.selectable) {
                this.selectable.stop();
                this.selectable = null;
            }
        }

        return false;
    }

    componentDidMount() {
        this.currentLayer = this.root;

        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleUndo = this.handleUndo.bind(this);
        this.handleRedo = this.handleRedo.bind(this);
        this.reloadDraggables = this.reloadDraggables.bind(this);

        this.root.addEventListener('mouseup', this.handleClick);
        this.root.addEventListener('dblclick', this.handleDoubleClick);
        document.addEventListener('keydown', this.handleKeyDown);

        this.root.classList.add('isolated-layer');

        this.subscribeToEvents();
    }

    componentWillUnmount() {
        this.root.removeEventListener('mouseup', this.handleClick);
        this.root.removeEventListener('dblclick', this.handleDoubleClick);
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    subscribeToEvents() {
        const { props: { eventBus } } = this;

        eventBus.on('undo', this.handleUndo);
        eventBus.on('redo', this.handleRedo);
        eventBus.on('settingUpdated', this.reloadDraggables);
        eventBus.on('toFront', () => this.changeLayerPosition('front'));
        eventBus.on('toBack', () => this.changeLayerPosition('back'));
        eventBus.on('forward', () => this.changeLayerPosition('up'));
        eventBus.on('backward', () => this.changeLayerPosition('down'));

        Object.entries({
            fill: 'fill',
            stroke: 'stroke',
            thickness: 'stroke-width',
            opacity: 'opacity',
            letterSpacing: 'letter-spacing',
            wordSpacing: 'word-spacing',
            lineHeight: 'line-height',
            textContent: 'text-content'
        }).map(([event, attribute]) => eventBus.on(event, (val) => {
            this.items.map(item => {
                if (val !== undefined) item.elements.map(el => el.setAttributeNS(null, attribute, val));
                if (textItemEvents.includes(event)) {
                    this.updateItemControls(item);
                }
            });
        }));

        Object.entries({
            l: 'alignLeft',
            r: 'alignRight',
            h: 'alignHorizontal',
            t: 'alignTop',
            b: 'alignBottom',
            v: 'alignVertical'
        }).map(([key, event]) => eventBus.on(event, () => this.applyAlignment(key)));

        eventBus.on('animate', data => {
            console.log(data);
    
            //this.playAnimations(data);
        });

        eventBus.on('variable-settings', (id) => console.log(id));
    }

    playAnimations(data) {
        const { items, animated } = this;

        if (items && items.length) {
            animated.transform(data);
            items.map(item => this.updateItemControls(item));
        }
    }

    changeLayerPosition(position) {
        const { items } = this;

        this.items = [];

        const nextItems = items.map((item) => {
            const { elements } = item;
            item.disable();

            const nextElements = elements.map((element) => {
                if (position === 'front')
                    element.parentNode.appendChild(element);

                if (position === 'back')
                    element.parentNode.insertBefore(element, element.parentNode.firstChild);

                if (element.previousElementSibling && position === 'up')
                    element.parentNode.insertBefore(element, element.previousElementSibling);

                if (element.nextElementSibling && position === 'down')
                    element.parentNode.insertBefore(element.nextElementSibling, element);

                return element;
            });

            return this.setDraggable(nextElements);
        });

        this.items = [...nextItems];
    }

    setEditable(value) {
        this.editable = value;
    }

    setDraggable(target) {
        const self = this;
        const {
            items,
            props
        } = this;

        const {
            undoStack,
            allowDragging,
            allowResizing,
            allowRotating,
            allowProportions,
            allowRestrictions,
            allowTransformOrigin,
            snapSteps,
            eventBus
        } = props;

        const targetEl = Array.isArray(target) ? target[0] : target;

        const originX = targetEl.getAttributeNS(null, 'data-origin-x');
        const originY = targetEl.getAttributeNS(null, 'data-origin-y');

        const nextDraggable = subjx(target).drag({
            ...subjxConfiguration,
            ...(allowRestrictions && { restrict: '#editor-grid' }),
            container: props.root.current,
            draggable: allowDragging,
            resizable: allowResizing,
            rotatable: allowRotating,
            transformOrigin: allowTransformOrigin,
            proportions: allowProportions,
            snap: {
                x: snapSteps.x,
                y: snapSteps.y,
                angle: snapSteps.y
            },
            ...(allowTransformOrigin && originX !== null && originY !== null && {
                transformOrigin: [originX, originY]
            }),
            onInit() {
                // eslint-disable-next-line no-console
                console.log('Draggable:: ', this.elements);

                if (this.elements.length === 1) {
                    let uuid = this.elements[0].getAttribute('data-uuid');

                    if (!uuid) {
                        uuid = generateUUID();
                        this.elements[0].setAttribute('data-uuid', uuid);
                    }

                    eventBus.emit('timeliner-payload', uuid);
                }

                this.options.scalable = this.elements.length === 1 && this.elements[0].tagName.toLowerCase() === 'text';

                // disables selection if active
                if (self.selectable && self.props.selectable) {
                    self.selectable.stop();
                }

                const { te } = this.storage.handles;

                const lx1 = te.x1.baseVal.value;
                const ly1 = te.y1.baseVal.value;
                const lx2 = te.x2.baseVal.value;
                const ly2 = te.y2.baseVal.value;

                const lineLength = [lx1 - lx2, ly1 - ly2];

                const [nextX, nextY] = self.calcTooltipPosition(
                    [lx2, ly2],
                    lineLength,
                    -30,
                    45
                );

                const tooltip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
                tooltip.setAttributeNS(null, 'transform', `translate(${nextX - 12}, ${nextY - 12})`);
                tooltip.classList.add('delete-sjx-item');

                const actionButton = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                actionButton.setAttributeNS(null, 'd', 'M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8');
                actionButton.setAttributeNS(null, 'pointer-events', 'bounding-box');
                actionButton.setAttributeNS(null, 'fill', 'rgb(237, 28, 36)');

                tooltip.addEventListener('click', () => self.removeDraggable(this));
                tooltip.appendChild(actionButton);

                this.controls.appendChild(tooltip);

                // update origin for animated element
                this.on('setPointEnd', () => {
                    const { transformOrigin, transformOrigin: { x, y } } = this.storage;

                    self.animated.setTransformOrigin(transformOrigin);
                    self.animated.updateState();

                    this.elements.map(element => {
                        element.setAttributeNS(null, 'data-origin-x', x);
                        element.setAttributeNS(null, 'data-origin-y', y);
                    });
                });
            },
            onResize({ dx, dy }) {
                self.setEditable(true);

                const { tr, tl } = this._getVertices();

                const lx1 = tl.x;
                const ly1 = tl.y;
                const lx2 = tr.x;
                const ly2 = tr.y;

                const lineLength = [lx1 - lx2, ly1 - ly2];

                const [nextX, nextY] = self.calcTooltipPosition(
                    [lx2, ly2],
                    lineLength,
                    -30,
                    45
                );

                const tooltip = this.controls.querySelector('.delete-sjx-item');
                tooltip.setAttributeNS(null, 'transform', `translate(${nextX - 12}, ${nextY - 12})`);

                if (self.ignoreStoring) return self.ignoreStoring = false;
                const { revX, revY, doW, doH } = this.storage;

                undoStack.setItem({
                    name: 'resize',
                    el: this.elements,
                    data: {
                        dx,
                        dy,
                        revX,
                        revY,
                        doW,
                        doH
                    }
                });
            },
            onMove({ dx, dy }) {
                self.setEditable(true);

                const { tr, tl } = this._getVertices();

                const lx1 = tl.x;
                const ly1 = tl.y;
                const lx2 = tr.x;
                const ly2 = tr.y;

                const lineLength = [lx1 - lx2, ly1 - ly2];

                const [nextX, nextY] = self.calcTooltipPosition(
                    [lx2, ly2],
                    lineLength,
                    -30,
                    45
                );

                const tooltip = this.controls.querySelector('.delete-sjx-item');
                tooltip.setAttributeNS(null, 'transform', `translate(${nextX - 12}, ${nextY - 12})`);

                if (self.ignoreStoring) return self.ignoreStoring = false;
                undoStack.setItem({ name: 'move', el: this.elements, data: [dx, dy] });
            },
            onRotate({ delta }) {
                self.setEditable(true);

                const { tr, tl } = this._getVertices();

                const lx1 = tl.x;
                const ly1 = tl.y;
                const lx2 = tr.x;
                const ly2 = tr.y;

                const lineLength = [lx1 - lx2, ly1 - ly2];

                const [nextX, nextY] = self.calcTooltipPosition(
                    [lx2, ly2],
                    lineLength,
                    -30,
                    45
                );

                const tooltip = this.controls.querySelector('.delete-sjx-item');
                tooltip.setAttributeNS(null, 'transform', `translate(${nextX - 12}, ${nextY - 12})`);

                if (self.ignoreStoring) return self.ignoreStoring = false;
                undoStack.setItem({ name: 'rotate', data: delta, el: this.elements });
            },
            onDrop() {
                self.animated.updateState();
                setTimeout(() => (
                    self.setEditable(false)
                ), 100);

                if (self.ignoreStoring) return self.ignoreStoring = false;
                undoStack.next();
            },
            onDestroy() {
                setTimeout(() => self.setEditable(false), 100);

                this.elements.map(el => el.classList.remove('subjx-selected'));
                // enables selection if active
                if (self.selectable && self.props.selectable) {
                    self.selectable.start();
                }
            }
        });

        this.props.eventBus.emit('settings', null, 'item');
        this.props.$setSelectedItems({ items: [...this.items, nextDraggable] });

        this.animated = new Animated(
            [...this.items, nextDraggable].reduce((res, { elements }) => [...res, ...elements], []),
            {
                container: props.root.current,
                ...(allowTransformOrigin && originX !== null && originY !== null && {
                    transformOrigin: [originX, originY]
                })
            }
        );

        return nextDraggable;
    }

    reloadDraggables() {
        const { items } = this;
        const newItems = items.map((item) => {
            item.disable();
            return [item.elements];
        });

        this.items = [...this.setDraggable(newItems)];
    }

    removeDraggable(draggable) {
        const { items } = this;

        items.splice(items.indexOf(draggable), 1);
        draggable.disable();

        draggable.elements.map(el => el.parentNode.removeChild(el));
        this.props.eventBus.emit('settings', null, 'canvas');
    }

    applyAlignment(direction) {
        this.items.map((item) => {
            item.applyAlignment(direction);
            const { te } = item.storage.handles;

            const lx1 = te.x1.baseVal.value;
            const ly1 = te.y1.baseVal.value;
            const lx2 = te.x2.baseVal.value;
            const ly2 = te.y2.baseVal.value;

            const lineLength = [lx1 - lx2, ly1 - ly2];

            const [nextX, nextY] = this.calcTooltipPosition(
                [lx2, ly2],
                lineLength,
                -30,
                45
            );

            const tooltip = item.controls.querySelector('.delete-sjx-item');
            tooltip.setAttributeNS(null, 'transform', `translate(${nextX - 12}, ${nextY - 12})`);
        });

        this.animated.updateState();
    }

    calcTooltipPosition(startPoint, lineLength, offset, angle) {
        const [x, y] = startPoint;
        const [lengthX, lengthY] = lineLength;

        const theta = Math.atan2(
            lengthY,
            lengthX
        ) - (angle * Math.PI / 180);

        return [
            Number(x) + offset * Math.cos(theta),
            Number(y) + offset * Math.sin(theta)
        ];
    }

    makeSelectables() {
        const selectedItems = new DragSelect({
            selectables: this.currentLayer.children,
            area: this.props.root.current
        });

        selectedItems.subscribe('callback', ({ items: selected }) => {
            const { items } = this;

            while (items.length > 0) items.pop().disable();
            if (!selected.length) return;

            const newItems = this.setDraggable(selected);

            this.items = [newItems];
        });

        return selectedItems;
    }

    handleClick(e) {
        if (this.editable || !this.props.editable) return;

        const {
            currentLayer,
            items
        } = this;

        const target = [...currentLayer.childNodes]
            .find((child) => (
                !(child.classList && child.classList.contains('sjx-drag')) &&
                child.contains(e.target)
            )) || (currentLayer === e.target ? e.target : null);

        if (!target) return;

        e.stopPropagation();

        if (!e.ctrlKey) {
            while (items.length > 0) items.pop().disable();
        }

        const newItems = this.setDraggable(target);

        items.push(newItems);
        this.items = items;
    }

    handleDoubleClick(e) {
        e.preventDefault();
        if (this.editable || !this.props.editable) return;

        const { currentLayer } = this;

        const target = [...currentLayer.childNodes]
            .find((child) => (
                (child.classList && child.classList.contains('sjx-drag')) &&
                child.contains(e.target)
            ));

        if (target && target.tagName === 'g') {
            this.dropItems();
            this.currentLayer = target;
            this.props.onLayerChange(
                this.getLayerPath(target)
            );
            currentLayer.classList.remove('isolated-layer');
            target.classList.add('isolated-layer');
            this.applyCurrentGroupOpacity(target);
        }
    }

    handleDropLayer() {
        const { currentLayer } = this;
        if (currentLayer === this.root) {
            return this.props.onLayerChange(
                this.getLayerPath(currentLayer)
            );
        }

        this.dropItems();
        currentLayer.classList.remove('isolated-layer');
        const nextCurrentGroup = currentLayer.parentNode;
        this.currentLayer = nextCurrentGroup;
        this.props.onLayerChange(
            this.getLayerPath(nextCurrentGroup)
        );

        this.dropCurrentGroupOpacity(currentLayer);
        this.applyCurrentGroupOpacity(nextCurrentGroup);
        nextCurrentGroup.classList.add('isolated-layer');
    }

    getLayerPath(target) {
        let node = target;
        let layerChain = '';

        while (node !== this.root) {
            layerChain = (node.getAttribute('id') || node.nodeName) + ' / ' + layerChain;
            node = node.parentNode;
        }

        return layerChain;
    }

    dropItems(nextItems = []) {
        const { items } = this;
        while (items.length > 0) items.pop().disable();
        this.items = nextItems;
    }

    updateItemControls(item) {
        item.fitControlsToSize();

        const { te } = item.storage.handles;

        const lx1 = te.x1.baseVal.value;
        const ly1 = te.y1.baseVal.value;
        const lx2 = te.x2.baseVal.value;
        const ly2 = te.y2.baseVal.value;

        const lineLength = [lx1 - lx2, ly1 - ly2];

        const [nextX, nextY] = this.calcTooltipPosition(
            [lx2, ly2],
            lineLength,
            -30,
            45
        );

        const tooltip = item.controls.querySelector('.delete-sjx-item');
        tooltip.setAttributeNS(null, 'transform', `translate(${nextX - 12}, ${nextY - 12})`);
    }

    handleKeyDown(e) {
        const { items } = this;
        if (e.keyCode === 46) {
            while (items.length > 0) {
                const item = items.pop();
                item.disable();
                item.elements.map((el) => el.parentNode.removeChild(el));
            }
        } else if (e.keyCode === 65 && e.ctrlKey) {
            while (items.length > 0) items.pop().disable();
            e.preventDefault();
        } else if (e.keyCode === 67) {
            // c
        } else if (e.keyCode === 86) {
            // v
        } else if (e.keyCode > 36 && e.keyCode < 41) {
            e.preventDefault();
            items.forEach((item) => {
                item.exeDrag({
                    dx: e.keyCode === 37 || e.keyCode === 39 ? e.keyCode === 37 ? -10 : 10 : 0,
                    dy: e.keyCode === 38 || e.keyCode === 40 ? e.keyCode === 38 ? -10 : 10 : 0
                });
            });
        }
    }

    applyCurrentGroupOpacity(el) {
        el.setAttributeNS(null, 'opacity', 1);
        if (el === this.root) return;
        [...el.parentNode.childNodes].forEach(child => {
            if (child.tagName === 'g' && child !== el) child.classList.add('sjx-flip-opacity');
        });
        this.applyCurrentGroupOpacity(el.parentNode);
    }

    dropCurrentGroupOpacity(el) {
        [...el.parentNode.childNodes].forEach(child => {
            if (child.tagName === 'g' && child !== el) child.classList.remove('sjx-flip-opacity');
        });
    }

    handleUndo() {
        const { undoStack } = this.props;
        const item = undoStack.undo();

        if (item) {
            this.ignoreStoring = true;
            this.handleAction(item, true);
        }
    }

    handleRedo() {
        const { undoStack } = this.props;
        const item = undoStack.redo();

        if (item) {
            this.ignoreStoring = true;
            this.handleAction(item, false);
        }
    }

    handleAction(action = {}, revert) {
        this.dropItems();

        switch (action.name) {

            case 'rotate': {
                const delta = action.data;
                const sjxEl = this.setDraggable(action.el);

                sjxEl.exeRotate({ delta: delta * (revert ? -1 : 1) });
                sjxEl.disable();

                break;
            }
            case 'move': {
                const [dx, dy] = action.data;
                const sjxEl = this.setDraggable(action.el);

                sjxEl.exeDrag({
                    dx: dx * (revert ? -1 : 1),
                    dy: dy * (revert ? -1 : 1)
                });
                sjxEl.disable();
                break;
            }
            case 'resize': {
                const { dx, dy, ...rest } = action.data;
                const sjxEl = this.setDraggable(action.el);

                sjxEl.exeResize({
                    dx: dx * (revert ? -1 : 1),
                    dy: dy * (revert ? -1 : 1),
                    ...rest
                });
                sjxEl.disable();
            }
            default:
                break;

        }
    }

    render() {
        return (
            <g id='editable-content' ref={el => this.root = el} />
        );
    }

}

export default connect(mapStateToProps, mapDispatchToProps)(EditorContainer);
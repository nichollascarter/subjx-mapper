import React from 'react';
import { connect } from 'react-redux';
import subjx from 'subjx';
import makeSelectable from '../helpers/selectable';

const subjxConfiguration = {
    container: '#editor-container',
    controlsContainer: '#controls-container',
    rotatorAnchor: 'n',
    rotatorOffset: 30
};

const mapStateToProps = (state) => ({
    editorGridSize: state.editorGridSize,
    allowDragging: state.allowDragging,
    allowResizing: state.allowResizing,
    allowRotating: state.allowRotating,
    allowProportions: state.allowProportions,
    allowRestrictions: state.allowRestrictions,
    snapSteps: state.snapSteps,
    eventBus: state.eventBus,
    undoStack: state.undoStack
});

class EditorContainer extends React.Component {

    el = null;
    editable = false;
    selectable = null;
    items = [];
    currentGroup = null;
    ignoreStoring = false;

    shouldComponentUpdate(nextProps) {
        if (this.el) {
            if (nextProps.content !== this.props.content) {
                this.dropItems();
                this.currentGroup = this.el;

                if (nextProps.content && nextProps.content.childNodes) {
                    while (nextProps.content.childNodes.length) {
                        this.el.appendChild(nextProps.content.firstChild);
                    }
                } else {
                    while (this.el.lastElementChild) {
                        this.el.removeChild(this.el.lastElementChild);
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
                this.selectable();
                this.selectable = null;
            }
        }

        return false;
        // (nextProps.content !== this.props.content) ||
        //     nextProps.dropLayer ||
        //     nextProps.dropItems ||
        //     !nextProps.editable;
    }

    componentDidMount() {
        this.currentGroup = this.el;

        this.handleClick = this.handleClick.bind(this);
        this.handleDoubleClick = this.handleDoubleClick.bind(this);
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleUndo = this.handleUndo.bind(this);
        this.handleRedo = this.handleRedo.bind(this);
        this.reloadDraggables = this.reloadDraggables.bind(this);

        this.el.addEventListener('mouseup', this.handleClick);
        this.el.addEventListener('dblclick', this.handleDoubleClick);
        document.addEventListener('keydown', this.handleKeyDown);

        this.el.classList.add('isolated-layer');

        this.subscribeToEvents();

        const tooltip = document.createElement('div');
        tooltip.style.position = 'absolute';
        tooltip.classList.add('drag-tooltip');
        document.body.appendChild(tooltip);
        this.tooltip = tooltip;
    }

    componentWillUnmount() {
        this.el.removeEventListener('mouseup', this.handleClick);
        this.el.removeEventListener('dblclick', this.handleDoubleClick);
        document.removeEventListener('keydown', this.handleKeyDown);
    }

    subscribeToEvents() {
        const { props: { eventBus } } = this;
        eventBus.on('undo', this.handleUndo);
        eventBus.on('redo', this.handleRedo);
        eventBus.on('settingUpdated', this.reloadDraggables);

        eventBus.on('alignLeft', () => this.applyAlignment('l'));
        eventBus.on('alignRight', () => this.applyAlignment('r'));
        eventBus.on('alignCenter', () => this.applyAlignment('h'));
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
            snapSteps
        } = props;

        const calcTooltipPosition = (startPoint, lineLength, offset, angle) => {
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
        };

        return subjx(target).drag({
            ...subjxConfiguration,
            ...(allowRestrictions && { restrict: '#editor-grid' }),
            draggable: allowDragging,
            resizable: allowResizing,
            rotatable: allowRotating,
            proportions: allowProportions,
            snap: {
                x: snapSteps.x,
                y: snapSteps.y,
                angle: snapSteps.y
            },
            onInit() {
                // eslint-disable-next-line no-console
                console.log('Draggable:: ', this.el);
                const { tr, tl } = this.storage.handles;

                const lx1 = tl.cx.baseVal.value;
                const ly1 = tl.cy.baseVal.value;
                const lx2 = tr.cx.baseVal.value;
                const ly2 = tr.cy.baseVal.value;

                const lineLength = [lx1 - lx2, ly1 - ly2];

                const [nextX, nextY] = calcTooltipPosition(
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

                tooltip.addEventListener('click', () => {
                    items.splice(items.indexOf(this), 1);
                    this.disable();
                    this.el.parentNode.removeChild(this.el);
                });
                tooltip.appendChild(actionButton);

                this.controls.appendChild(tooltip);
            },
            onResize({ dx, dy }) {
                self.setEditable(true);

                const { tr, tl } = this.storage.handles;

                const lx1 = tl.cx.baseVal.value;
                const ly1 = tl.cy.baseVal.value;
                const lx2 = tr.cx.baseVal.value;
                const ly2 = tr.cy.baseVal.value;

                const lineLength = [lx1 - lx2, ly1 - ly2];

                const [nextX, nextY] = calcTooltipPosition(
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
                    el: this.el,
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

                if (self.ignoreStoring) return self.ignoreStoring = false;
                undoStack.setItem({ name: 'move', el: this.el, data: [dx, dy] });
            },
            onRotate({ clientX, clientY, transform, delta }) {
                self.setEditable(true);

                if (self.ignoreStoring) return self.ignoreStoring = false;
                undoStack.setItem({
                    name: 'rotate', data: delta, el: this.el
                });
            },
            onDrop() {
                setTimeout(() => (
                    self.setEditable(false)
                ), 100);
                self.tooltip.style.display = 'none';

                if (self.ignoreStoring) return self.ignoreStoring = false;
                undoStack.next();
            },
            onDestroy() {
                setTimeout(() => (
                    self.setEditable(false)
                ), 100);
                this.el.classList.remove('subjx-selected');
            }
        });
    }

    reloadDraggables() {
        const { items } = this;
        const newItems = items.map((item) => {
            item.disable();
            return item.el;
        });

        this.items = [...this.setDraggable(newItems)];
    }

    applyAlignment(direction) {
        this.items.map((item) => item.applyAlignment(direction));
    }

    makeSelectables() {
        const selectableConfig = {
            onSelectionStart(selectionStart) {
                // [...selectionStart.svg.querySelectorAll('[data-selected]')].forEach((element) => (
                //     element.removeAttribute('data-selected')
                // ));
            },
            onSelectionEnd(selectionEnd) {
                // [...selectionEnd.svg.querySelectorAll('[data-selected]')].forEach((element) => (
                //     element.removeAttribute('data-selected')
                // ));
            },
            onSelectionChange(selectionChange) {
                // selectionChange.newlyDeselectedElements.forEach((element) => {
                //     element.removeAttribute('data-selected');
                // });

                // selectionChange.newlySelectedElements.forEach((element) => {
                //     element.setAttribute('data-selected', '');
                // });
            }
        };

        return makeSelectable(
            this.props.root.current,
            this.el.parentNode,
            selectableConfig
        );
    }

    handleClick(e) {
        if (this.editable || !this.props.editable) return;

        const {
            currentGroup,
            items
        } = this;

        const target = [...currentGroup.childNodes]
            .find((child) => (
                !(child.classList && child.classList.contains('sjx-drag')) &&
                child.contains(e.target)
            )) || (currentGroup === e.target ? e.target : null);

        //console.log('Target:: ', target);
        //console.log('Current group:: ', currentGroup);

        if (!target) return;

        e.stopPropagation();

        if (!e.ctrlKey) {
            while (items.length > 0) items.pop().disable();
        }

        const newItems = this.setDraggable(target);

        items.push(...newItems);
        this.items = items;
    }

    handleDoubleClick(e) {
        if (this.editable || !this.props.editable) return;
        const { currentGroup } = this;

        const target = [...currentGroup.childNodes]
            .find((child) => (
                (child.classList && child.classList.contains('sjx-drag')) &&
                child.contains(e.target)
            ));

        if (target && target.tagName === 'g') {
            this.dropItems();
            this.currentGroup = target;
            this.props.onLayerChange(
                this.getLayerPath(target)
            );
            currentGroup.classList.remove('isolated-layer');
            target.classList.add('isolated-layer');
            this.applyCurrentGroupOpacity(target);
        }
    }

    handleDropLayer() {
        const { currentGroup } = this;
        if (currentGroup === this.el) return;

        this.dropItems();
        currentGroup.classList.remove('isolated-layer');
        const nextCurrentGroup = currentGroup.parentNode;
        this.currentGroup = nextCurrentGroup;
        this.props.onLayerChange(
            this.getLayerPath(nextCurrentGroup)
        );

        this.dropCurrentGroupOpacity(currentGroup);
        this.applyCurrentGroupOpacity(nextCurrentGroup);
        nextCurrentGroup.classList.add('isolated-layer');
    }

    getLayerPath(target) {
        let node = target;
        let layerChain = '';

        while (node !== this.el) {
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

    handleKeyDown(e) {
        const { items } = this;
        if (e.keyCode === 46) {
            while (items.length > 0) {
                const item = items.pop();
                item.disable();
                item.el.parentNode.removeChild(item.el);
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
        if (el === this.el) return;
        [...el.parentNode.childNodes].forEach(child => {
            if (child.tagName === 'g' && child !== el) child.setAttributeNS(null, 'opacity', 0.3);
        });
        this.applyCurrentGroupOpacity(el.parentNode);
    }

    dropCurrentGroupOpacity(el) {
        [...el.parentNode.childNodes].forEach(child => {
            if (child.tagName === 'g' && child !== el) child.setAttributeNS(null, 'opacity', 1);
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

                sjxEl.forEach((item) => {
                    item.exeRotate({ delta: delta * (revert ? -1 : 1) });
                    item.disable();
                });

                break;
            }
            case 'move': {
                const [dx, dy] = action.data;
                const sjxEl = this.setDraggable(action.el);

                sjxEl.forEach((item) => {
                    item.exeDrag({
                        dx: dx * (revert ? -1 : 1),
                        dy: dy * (revert ? -1 : 1)
                    });
                    item.disable();
                });
                break;
            }
            case 'resize': {
                const { dx, dy, ...rest } = action.data;
                const sjxEl = this.setDraggable(action.el);

                sjxEl.forEach((item) => {
                    item.exeResize({
                        dx: dx * (revert ? -1 : 1),
                        dy: dy * (revert ? -1 : 1),
                        ...rest
                    });
                    item.disable();
                });
            }
            default:
                break;

        }
    }

    render() {
        return (
            <g id='editable-content' ref={el => this.el = el} />
        );
    }

}

export default connect(mapStateToProps)(EditorContainer);
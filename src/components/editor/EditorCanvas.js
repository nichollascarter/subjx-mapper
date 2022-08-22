import React, { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import ZoomableGroup from '../helpers/ZoomableGroup';
import EditorContent from './EditorContent';

const useStyles = makeStyles((theme) => ({
    root: {
        '-webkit-box-flex': 1,
        '-ms-flex': 1,
        flex: 1,
        visibility: 'visible'
    },
    workArea: {
        overflow: 'auto'
    },
    canvas: {
        position: 'absolute',
        top: 0,
        left: 0
    },
    page: {
        boxShadow: '0px 0px 2px 1px #d1d1d1'
    },
    layerBar: {
        position: 'absolute',
        zIndex: 99999,
        left: 150,
        padding: theme.spacing(1)
    }
}));

const canvasGrid = (paperSize, gridSize) => {
    const grid = gridSize * 10;
    return (
        <g>
            <defs>
                <pattern
                    id='smallGrid'
                    width={gridSize}
                    height={gridSize}
                    fill='white'
                    patternUnits='userSpaceOnUse'
                >
                    <path
                        d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
                        fill='none'
                        stroke='gray'
                        strokeWidth='0.5'
                        vectorEffect='non-scaling-stroke'
                    />
                </pattern>
                <pattern id='grid' width={grid} height={grid} patternUnits='userSpaceOnUse'>
                    <rect width={grid} height={grid} fill='url(#smallGrid)' />
                    <path
                        d={`M ${grid} 0 L 0 0 0 ${grid}`}
                        fill='none'
                        stroke='gray'
                        strokeWidth='1'
                        vectorEffect='non-scaling-stroke'
                    />
                </pattern>
            </defs>
            <rect x='0' y='0' width={paperSize.w} height={paperSize.h} fill='url(#grid)' />
        </g>
    );
};

const mapStateToProps = (state) => (
    {
        editorAction: state.editorAction,
        editorGrid: state.editorGrid,
        editorGridSize: state.editorGridSize,
        editorPaperSize: state.editorPaperSize,
        eventBus: state.eventBus
    }
);

const EditorCanvas = (props) => {
    const classes = useStyles();
    const {
        editorAction,
        editorGrid,
        editorGridSize,
        editorPaperSize,
        // leftOffset,
        // topOffset,
        rightOffset,
        children: content
    } = props;

    const {
        width: initialW,
        height: initialH
    } = editorPaperSize;

    const [paperWidth, paperHeight] = [window.outerWidth, window.outerHeight];

    const [paperSize, setPaperSize] = useState({
        w: initialW,
        h: initialH,
        x: (paperWidth - initialW) / 2,
        y: (paperHeight - initialH) / 2
    });

    let canvasEl = null;
    let controlsRef = null;
    const workAreaRef = useRef(null);
    const containerAreaRef = useRef(null);
    const rootSVG = useRef(null);

    const [localAction, setLocalAction] = useState(null);
    const [layersBar, setLayersBar] = useState(null);
    const [dropLayer, setParentLayer] = useState(false);
    const [startPoint, setStartPoint] = useState({ x: 0, y: 0 });

    const [dropItems, setDropItems] = useState(false);

    const scrollToRef = (ref) => {
        const container = containerAreaRef.current;
        container.scrollTop = (ref.current.clientHeight - container.clientHeight) / 2;
        container.scrollLeft = (ref.current.clientWidth - container.clientWidth) / 2;
    };

    useEffect(() => {
        scrollToRef(workAreaRef);
    }, [paperSize]);

    // TODO: adopt to size of imported SVG
    // useEffect(() => {
    //     setPaperSize({
    //         w: contentWidth > initialW ? contentWidth : initialW,
    //         h: contentHeight > initialH ? contentHeight : initialH,
    //         x: contentWidth > initialW ?  (paperWidth - contentWidth) / 2 : (paperWidth - initialW) / 2,
    //         y: contentHeight > initialH ? (paperHeight - contentHeight) / 2 : (paperHeight - initialH) / 2
    //     });
    // }, [props.children]);

    useEffect(() => {
        setPaperSize({
            w: initialW,
            h: initialH,
            x: (paperWidth - initialW) / 2,
            y: (paperHeight - initialH) / 2
        });
    }, [props.editorPaperSize]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        switch (editorAction) {

            case 'edit':
                if (controlsRef.contains(e.target)) return;

                if (!canvasEl.children[0].contains(e.target)) {
                    setDropItems(true);
                    props.eventBus.emit('settings', null, 'canvas');
                    return setTimeout(() => setDropItems(false), 100);
                }
                break;
            case 'grab':
                const container = containerAreaRef.current;

                setStartPoint({
                    x: e.clientX,
                    y: e.clientY,
                    scrollTop: container.scrollTop,
                    scrollLeft: container.scrollLeft
                });
                break;
            case 'select':
                //onCanvasDown(e);
                break;
            case 'zoom':
                break;
            case 'drawRect':
                drawElement(e);
                break;
            default:
                break;

        }

        setLocalAction(editorAction);
    };

    const handleMouseMove = (e) => {
        e.preventDefault();

        switch (localAction) {

            case 'grab': {
                const dx = (startPoint.x - e.clientX) * 1; // scale
                const dy = (startPoint.y - e.clientY) * 1; // scale

                const container = containerAreaRef.current;
                container.scrollTop = startPoint.scrollTop + dy;
                container.scrollLeft = startPoint.scrollLeft + dx;
                break;
            }
            case 'zoom': {
                break;
            }
            case 'draw':
                //drawSvgElement(e);
                break;
            default:
                break;

        }
    };

    const handleMouseUp = () => {
        setLocalAction(null);
    };

    const dropLayers = (e) => {
        e.stopPropagation();
        setParentLayer(true);
    };

    const svgPoint = (elem, x, y) => {
        let p = elem.createSVGPoint();
        p.x = x;
        p.y = y;
        return p.matrixTransform(elem.getScreenCTM().inverse());
    };

    const drawElement = (event) => {
        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttributeNS(null, 'stroke-width', 2);
        rect.setAttributeNS(null, 'fill', 'none');
        rect.setAttributeNS(null, 'stroke', '#000');

        const drawArea1 = document.getElementById('editor-background');

        const start = svgPoint(drawArea1, event.clientX, event.clientY);
        document.getElementById('editable-content').appendChild(rect);

        const drawRect = (e) => {
            let p = svgPoint(drawArea1, e.clientX, e.clientY);
            let w = Math.abs(p.x - start.x);
            let h = Math.abs(p.y - start.y);
            if (p.x > start.x) {
                p.x = start.x;
            }

            if (p.y > start.y) {
                p.y = start.y;
            }

            rect.setAttributeNS(null, 'x', p.x);
            rect.setAttributeNS(null, 'y', p.y);
            rect.setAttributeNS(null, 'width', w);
            rect.setAttributeNS(null, 'height', h);
        };

        const endDraw = () => {
            drawArea1.removeEventListener('mousemove', drawRect);
            drawArea1.removeEventListener('mouseup', endDraw);
        };

        drawArea1.addEventListener('mousemove', drawRect);
        drawArea1.addEventListener('mouseup', endDraw);
    };

    return (
        <div className={classes.root}>
            {
                layersBar && (
                    <p className={classes.layerBar}>
                        {layersBar}
                        <Button
                            style={{ marginLeft: 2 }}
                            variant='contained'
                            color='primary'
                            size='small'
                            onMouseUp={dropLayers}>
                            Exit
                        </Button>
                    </p>
                )
            }
            <div
                id='work-area'
                ref={containerAreaRef}
                className={classes.workArea}
                style={{
                    top: 0, // topOffset,
                    left: 0, // leftOffset,
                    right: rightOffset,
                    bottom: 0,
                    position: 'absolute',
                    cursor: 'auto'
                }}
                onMouseMove={handleMouseMove}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
            >
                <div
                    ref={workAreaRef}
                    style={{
                        display: 'inline-block',
                        position: 'relative',
                        width: paperWidth,
                        height: paperHeight
                    }}
                >
                    <svg
                        id='editor-container'
                        xmlns='http://www.w3.org/2000/svg'
                        className={classes.canvas}
                        width='100%'
                        height='100%'
                        overflow='visible'
                        ref={rootSVG}
                    >
                        <ZoomableGroup enable={editorAction === 'zoom'}>
                            <g id='content' transform={`translate(${paperSize.x}, ${paperSize.y})`}>
                                <g id='editor-background'>
                                    <rect id='editor-grid' x='0' y='0' width={paperSize.w} height={paperSize.h} fill='white' stroke='grey' />
                                    {
                                        editorGrid
                                            ? canvasGrid(paperSize, editorGridSize)
                                            : null
                                    }
                                </g>
                                <g
                                    id='editor-canvas'
                                    ref={el => canvasEl = el}
                                    className={classes.page}
                                >
                                    <EditorContent
                                        root={rootSVG}
                                        editable={editorAction === 'edit'}
                                        selectable={editorAction === 'select'}
                                        content={content}
                                        onLayerChange={(value) => {
                                            setLayersBar(value);
                                            setParentLayer(false);
                                        }}
                                        dropLayer={dropLayer}
                                        dropItems={dropItems}
                                    />
                                </g>
                            </g>
                        </ZoomableGroup>
                        <g id='controls-container' ref={div => controlsRef = div} />
                    </svg>
                </div>
            </div>
        </div>
    );
};

EditorCanvas.defaultProps = {
    grid: true,
    mouseAction: 'edit',
    initialW: 800,
    initialH: 600
};

export default connect(mapStateToProps)(EditorCanvas);
import React, { useState, useEffect } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import subjx from 'subjx';
import { IconButton } from '@material-ui/core';

import {
    Layers as LayersIcon,
    VerticalAlignCenter as AlignCenter,
    VerticalAlignBottom as AlignIcon,
    GridOn as GridOnIcon,
    GridOff as GridOffIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    Navigation as NavigationIcon,
    PanTool as PanToolIcon,
    PhotoSizeSelectSmall as PhotoSizeSelectSmallIcon,
    Search as SearchIcon,
    FlipToFront as BringForwardIcon,
    FlipToBack as BringBackwardIcon,
    Filter as BringToFrontIcon,
    FilterNone as BringToBackIcon,
    Crop32Outlined as Rectangle,
    RadioButtonUnchecked as Circle,
    GradeOutlined as Shape,
    //CropOriginalOutlined as Image,
    TextFormat as Text
} from '@material-ui/icons';

import { setEditorAction, activateEditorGrid } from '../../actions';

const useStyles = makeStyles(() => ({
    root: {
        display: 'flex',
        height: '100%'
    },
    flex: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        flexDirection: 'column',
        padding: 10
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
        marginBottom: 5
    }
}));

const ExtendedButton = withStyles({
    root: {
        color: 'rgba(0,0,0,0.65)',
        padding: 6
    }
})(IconButton);

const mapStateToProps = (state) => {
    return {
        editorAction: state.editorAction,
        editorGrid: state.editorGrid,
        eventBus: state.eventBus
    };
};

const mapDispatchToProps = (dispatch) => ({
    $setEditorAction: (act) => dispatch(setEditorAction(act)),
    $activateEditorGrid: (act) => dispatch(activateEditorGrid(act))
});

const items = [
    ['rectangle', Rectangle],
    ['circle', Circle],
    ['shape', Shape],
    ['text', Text]
    // ['image', Image]
];

const EditorToolbar = (props) => {
    const classes = useStyles();

    const {
        editorAction,
        editorGrid,
        eventBus
    } = props;

    const [isCloneable, setAsCloneable] = useState(false);

    const setEditorAction = (editorAction) => () => {
        props.$setEditorAction({ editorAction });
    };

    const activateEditorGrid = (editorGrid) => {
        props.$activateEditorGrid({ editorGrid });
    };

    const droppables = [];


    const cloneConfig = {
        appendTo: 'body',
        stack: '#editor-background',
        style: {
            border: 'none',
            background: 'transparent',
            maxWidth: '150px',
            textColor: 'transparent'
        },
        onInit() { },
        onDrop(e) {
            const itemType = this.elements[0].getAttribute('data-type');
            let newItem = null;

            const editorRef = document.querySelector('#editor-background');

            const offset = editorRef.getBoundingClientRect(),
                x = e.clientX - offset.left + editorRef.scrollLeft,
                y = e.clientY - offset.top + editorRef.scrollTop;

            switch (itemType) {

                case 'rectangle':
                    newItem = [
                        'rect',
                        {
                            x,
                            y,
                            width: 150,
                            height: 100,
                            stroke: 'black',
                            fill: 'transparent'
                        }
                    ];
                    break;
                case 'circle':
                    newItem = [
                        'ellipse',
                        {
                            cx: x,
                            cy: y,
                            rx: 45,
                            ry: 45,
                            stroke: 'black',
                            fill: 'transparent'
                        }
                    ];
                    break;
                case 'shape':
                    newItem = [
                        'polygon',
                        {
                            strokeWidth: '1',
                            stroke: 'black',
                            fill: "transparent",
                            strokeDasharray: "0",
                            points: `${x + 80},${y} ${x + 160},${y + 50} ${x + 80},${y + 100} ${x},${y + 50}`
                        },
                        []
                    ];
                    break;
                case 'image':
                    newItem = [
                        'foreignObject',
                        {
                            x,
                            y,
                            width: 150,
                            height: 100,
                            stroke: 'black',
                            fill: 'transparent'
                        },
                        [
                            [
                                'div',
                                {
                                    display: 'block'
                                },
                                ['text']
                            ]
                        ]
                    ];
                    break;
                case 'text':
                    newItem = [
                        'text',
                        {
                            x,
                            y
                        },
                        'text'
                    ];
                    break;
                default:
                    break;

            }

            props.onDrop(
                e,
                newItem
            );
        }
    };

    const buttons = [
        // { type: 'button', selected: editorAction === 'showLayers', component: <LayersIcon />, action: () => 'showLayers' },
        { type: 'button', selected: editorAction === 'edit', component: <NavigationIcon />, action: setEditorAction('edit') },
        { type: 'button', selected: editorAction === 'select', component: <PhotoSizeSelectSmallIcon />, action: setEditorAction('select') },
        { type: 'button', selected: editorAction === 'grab', component: <PanToolIcon />, action: setEditorAction('grab') },
        { type: 'button', selected: editorAction === 'zoom', component: <SearchIcon />, action: setEditorAction('zoom') },
        { type: 'button', selected: editorGrid === true, component: <GridOnIcon />, action: () => activateEditorGrid(true) },
        { type: 'button', selected: editorGrid === false, component: <GridOffIcon />, action: () => activateEditorGrid(false) }
    ];

    const buttons2 = [
        { type: 'button', selected: false, component: <BringForwardIcon />, action: () => eventBus.emit('forward') },
        { type: 'button', selected: false, component: <BringBackwardIcon />, action: () => eventBus.emit('backward') },
        { type: 'button', selected: false, component: <BringToFrontIcon />, action: () => eventBus.emit('toFront') },
        { type: 'button', selected: false, component: <BringToBackIcon />, action: () => eventBus.emit('toBack') },
        { type: 'button', selected: editorAction === 'alignLeft', component: <AlignIcon transform='rotate(90)' />, action: () => eventBus.emit('alignLeft') },
        { type: 'button', selected: editorAction === 'alignHorizontal', component: <AlignCenter transform='rotate(90)' />, action: () => eventBus.emit('alignHorizontal') },
        { type: 'button', selected: editorAction === 'alignRight', component: <AlignIcon transform='rotate(-90)' />, action: () => eventBus.emit('alignRight') },
        { type: 'button', selected: editorAction === 'alignTop', component: <AlignIcon transform='rotate(180)' />, action: () => eventBus.emit('alignTop') },
        { type: 'button', selected: editorAction === 'alignVertical', component: <AlignCenter transform='rotate(180)' />, action: () => eventBus.emit('alignVertical') },
        { type: 'button', selected: editorAction === 'alignBottom', component: <AlignIcon />, action: () => eventBus.emit('alignBottom') },
        { type: 'button', selected: false, component: <UndoIcon />, action: () => eventBus.emit('undo') },
        { type: 'button', selected: false, component: <RedoIcon />, action: () => eventBus.emit('redo') }
    ];

    useEffect(() => {
        if (isCloneable) return;
        droppables.forEach(el => subjx(el).clone(cloneConfig));
        setAsCloneable(true);
    }, [droppables, isCloneable, cloneConfig]);

    return (
        <div className={classes.root}>
            <div className={classes.flex}>
                {buttons.map(({ type, component, action, selected, value }, index) => (
                    <div key={`${index}button`} className={classes.toolbar}>
                        <ExtendedButton disabled={selected} onClick={() => action()}>{component}</ExtendedButton>
                    </div>
                ))}
                {items.map(([text, Icon]) => (
                    <div key={`${text}button`} className={classes.toolbar}>
                        <ExtendedButton ref={(el) => droppables.push(el)} data-type={text}><Icon /></ExtendedButton>
                    </div>
                ))}
            </div>
            <div className={classes.flex}>
                {buttons2.map(({ type, component, action, selected, value }, index) => (
                    <div key={`${index}button`} className={classes.toolbar}>
                        <ExtendedButton disabled={selected} onClick={() => action()}>{component}</ExtendedButton>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(EditorToolbar);
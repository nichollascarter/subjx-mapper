import React from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
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
    Crop32Outlined as Rectangle,
    FormatShapes as ShapeSettingsIcon,
    Tune as CanvasSettingsIcon
} from '@material-ui/icons';

import { setEditorAction, activateEditorGrid } from '../../actions';

const useStyles = makeStyles(() => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        height: '100%'
    },
    flex: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        marginLeft: 10
    },
    verticalDivider: {
        width: '1px',
        backgroundColor: 'white',
        height: '30px'
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        padding: 2,
        marginRight: 5
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

const EditorToolbar = (props) => {
    const classes = useStyles();

    const {
        editorAction,
        editorGrid,
        eventBus
    } = props;

    const setEditorAction = (editorAction) => () => {
        props.$setEditorAction({ editorAction });
    };

    const activateEditorGrid = (editorGrid) => {
        props.$activateEditorGrid({ editorGrid });
    };

    const buttons = [
        { type: 'button', selected: editorAction === 'showLayers', component: <LayersIcon />, action: () => 'showLayers' },
        { type: 'divider' },
        { type: 'button', selected: editorAction === 'edit', component: <NavigationIcon />, action: setEditorAction('edit') },
        { type: 'button', selected: editorAction === 'select', component: <PhotoSizeSelectSmallIcon />, action: setEditorAction('select') },
        { type: 'button', selected: editorAction === 'grab', component: <PanToolIcon />, action: setEditorAction('grab') },
        { type: 'button', selected: editorAction === 'zoom', component: <SearchIcon />, action: setEditorAction('zoom') },
        { type: 'divider' },
        // { type: 'button', selected: editorAction === 'zoom', component: <Rectangle />, action: setEditorAction('drawRect') },
        // { type: 'divider' },
        { type: 'button', selected: editorAction === 'alignLeft', component: <AlignIcon transform='rotate(90)' />, action: () => eventBus.emit('alignLeft') },
        { type: 'button', selected: editorAction === 'alignHorizontal', component: <AlignCenter transform='rotate(90)' />, action: () => eventBus.emit('alignHorizontal') },
        { type: 'button', selected: editorAction === 'alignRight', component: <AlignIcon transform='rotate(-90)' />, action: () => eventBus.emit('alignRight') },
        { type: 'button', selected: editorAction === 'alignTop', component: <AlignIcon transform='rotate(180)' />, action: () => eventBus.emit('alignTop') },
        { type: 'button', selected: editorAction === 'alignVertical', component: <AlignCenter transform='rotate(180)' />, action: () => eventBus.emit('alignVertical') },
        { type: 'button', selected: editorAction === 'alignBottom', component: <AlignIcon />, action: () => eventBus.emit('alignBottom') },
        { type: 'divider' },
        { type: 'button', selected: editorGrid === true, component: <GridOnIcon />, action: () => activateEditorGrid(true) },
        { type: 'button', selected: editorGrid === false, component: <GridOffIcon />, action: () => activateEditorGrid(false) },
        { type: 'divider' },
        { type: 'button', selected: false, component: <UndoIcon />, action: () => eventBus.emit('undo') },
        { type: 'button', selected: false, component: <RedoIcon />, action: () => eventBus.emit('redo') }
    ];

    const options = [
        { type: 'button', selected: false, component: <ShapeSettingsIcon />, action: () => eventBus.emit('settings', null, 'item') },
        { type: 'button', selected: false, component: <CanvasSettingsIcon />, action: () => eventBus.emit('settings', null, 'canvas') }
    ];

    return (
        <div className={classes.root}>
            <div className={classes.flex}>
                {buttons.map(({ type, component, action, selected, value }, index) => (
                    <div key={`${index}button`} className={classes.toolbar}>{
                        type !== 'divider'
                            ? <ExtendedButton disabled={selected} onClick={() => action()}>{component}</ExtendedButton>
                            : <div className={classes.verticalDivider} />
                    }</div>
                ))}
            </div>
            <div className={classes.flex} style={{ width: '100%', justifyContent: 'flex-end' }}>
                {options.map(({ type, component, action, selected, value }, index) => (
                    <div key={`${index}button`} className={classes.toolbar}>{
                        type !== 'divider'
                            ? <ExtendedButton disabled={selected} onClick={() => action()}>{component}</ExtendedButton>
                            : <div className={classes.verticalDivider} />
                    }</div>
                ))}
            </div>
        </div>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(EditorToolbar);
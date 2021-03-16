import React from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { IconButton } from '@material-ui/core';

import {
    Layers as LayersIcon,
    FormatAlignLeft as AlignLeft,
    FormatAlignCenter as AlignCenter,
    FormatAlignRight as AlignRight,
    GridOn as GridOnIcon,
    GridOff as GridOffIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    Navigation as NavigationIcon,
    PanTool as PanToolIcon,
    PhotoSizeSelectSmall as PhotoSizeSelectSmallIcon,
    Search as SearchIcon,
    Crop32Outlined as Rectangle
} from '@material-ui/icons';

import { setEditorAction, activateEditorGrid } from '../../actions';

const useStyles = makeStyles(() => ({
    root: {
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
        { type: 'button', selected: editorAction === 'alignLeft', component: <AlignLeft />, action: () => 'alignLeft' },
        { type: 'button', selected: editorAction === 'alignCenter', component: <AlignCenter />, action: () => 'alignCenter' },
        { type: 'button', selected: editorAction === 'alignRight', component: <AlignRight />, action: () => 'alignRight' },
        { type: 'divider' },
        { type: 'button', selected: editorGrid === true, component: <GridOnIcon />, action: () => activateEditorGrid(true) },
        { type: 'button', selected: editorGrid === false, component: <GridOffIcon />, action: () => activateEditorGrid(false) },
        { type: 'divider' },
        { type: 'button', selected: false, component: <UndoIcon />, action: () => eventBus.emit('undo') },
        { type: 'button', selected: false, component: <RedoIcon />, action: () => eventBus.emit('redo') }
    ];

    return (
        <div className={classes.root}>
            {buttons.map(({ type, component, action, selected, value }, index) => (
                <div key={`${index}button`} className={classes.toolbar}>{
                    type !== 'divider'
                        ? <ExtendedButton disabled={selected} onClick={() => action()}>{component}</ExtendedButton>
                        : <div className={classes.verticalDivider} />
                }</div>
            ))}
        </div>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(EditorToolbar);
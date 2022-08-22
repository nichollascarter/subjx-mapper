import React from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import { IconButton } from '@material-ui/core';

import {
    FormatShapes as ShapeSettingsIcon,
    Tune as CanvasSettingsIcon,
    ControlCamera as AnimationIcon
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        alignItems: 'center',
        height: '100%'
    },
    flex: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        padding: theme.spacing(1)
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column'
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

const EditorSettings = (props) => {
    const classes = useStyles();

    const {
        eventBus
    } = props;

    const options = [
        { type: 'button', selected: false, component: <ShapeSettingsIcon />, action: () => eventBus.emit('settings', null, 'item') },
        { type: 'button', selected: false, component: <CanvasSettingsIcon />, action: () => eventBus.emit('settings', null, 'canvas') },
        { type: 'button', selected: false, component: <AnimationIcon />, action: () => eventBus.emit('settings', null, 'animation') }
    ];

    return (
        <div className={classes.root}>
            <div className={classes.flex}>
                {options.map(({ type, component, action, selected, value }, index) => (
                    <div key={`${index}button`} className={classes.toolbar}>{
                        <ExtendedButton disabled={selected} onClick={() => action()}>{component}</ExtendedButton>
                    }</div>
                ))}
            </div>
        </div>
    );
};

export default connect(mapStateToProps)(EditorSettings);
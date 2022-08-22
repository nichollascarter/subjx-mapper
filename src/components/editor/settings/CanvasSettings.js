import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles, withStyles } from '@material-ui/core/styles';

import {
    TextField,
    Checkbox,
    FormGroup,
    FormControlLabel,
    Divider,
    Typography,
    Grid,
    Slider
} from '@material-ui/core';

import ColorPicker from '../../helpers/ColorPicker';

import {
    setEditorPaperSize,
    setAllowDragging,
    setAllowResizing,
    setAllowRotating,
    setAllowProportions,
    setAllowRestrictions,
    setSnapSteps,
    setEditorGridSize,
    setAllowRotationOrigin
} from '../../../actions';

const useStyles = makeStyles(() => ({
    root: {
        zIndex: 999
    },
    container: {
        display: 'flex',
        flex: 1
    },
    containerColumn: {
        display: 'flex',
        flexDirection: 'column'
    },
    padding: {
        padding: 10
    },
    label: {
        paddingLeft: 10
    }
}));

const TextInput = withStyles({
    root: {
        margin: 10,
        '& .MuiOutlinedInput-input': {
            padding: '10px 10px'
        }
    }
})(TextField);

const CheckboxLabel = withStyles({
    root: {
        margin: '0'
    }
})(FormControlLabel);

const mapStateToProps = (state) => ({
    editorPaperSize: state.editorPaperSize,
    allowDragging: state.allowDragging,
    allowResizing: state.allowResizing,
    allowRotating: state.allowRotating,
    allowProportions: state.allowProportions,
    allowRestrictions: state.allowRestrictions,
    allowTransformOrigin: state.allowTransformOrigin,
    snapSteps: state.snapSteps,
    editorGridSize: state.editorGridSize,
    eventBus: state.eventBus
});

const mapDispatchToProps = (dispatch) => ({
    $setEditorPaperSize: act => dispatch(setEditorPaperSize(act)),
    $setAllowDragging: act => dispatch(setAllowDragging(act)),
    $setAllowResizing: act => dispatch(setAllowResizing(act)),
    $setAllowRotating: act => dispatch(setAllowRotating(act)),
    $setAllowProportions: act => dispatch(setAllowProportions(act)),
    $setAllowRestrictions: act => dispatch(setAllowRestrictions(act)),
    $setSnapSteps: act => dispatch(setSnapSteps(act)),
    $setEditorGridSize: act => dispatch(setEditorGridSize(act)),
    $setAllowRotationOrigin: act => dispatch(setAllowRotationOrigin(act))
});

const CanvasSettings = (props) => {
    const classes = useStyles();

    const {
        editorPaperSize: { width, height },
        allowDragging,
        allowResizing,
        allowRotating,
        allowProportions,
        allowRestrictions,
        allowTransformOrigin,
        editorGridSize,
        snapSteps
    } = props;

    const [paperSize, setPaperSize] = useState({ width, height });
    const [dragging, setDragging] = useState(allowDragging);
    const [resizing, setResizing] = useState(allowResizing);
    const [rotating, setRotating] = useState(allowRotating);
    const [proportions, setProportions] = useState(allowProportions);
    const [restrictions, setRestrictions] = useState(allowRestrictions);
    const [rotatingOrigin, setRotatingOrigin] = useState(allowTransformOrigin);
    const [snap, setSnap] = useState(snapSteps);
    const [fill, setFill] = useState('none');

    const handleChange = ([w, h]) => {
        if (Number(w) < 1 || Number(h) < 1) return;

        const editorPaperSize = { width: w, height: h };
        setPaperSize(editorPaperSize);
        props.$setEditorPaperSize({ editorPaperSize });
    };

    const handleSettings = (name) => (e) => {
        const value = e.target.checked;

        switch (name) {

            case 'drag': {
                setDragging(value);
                props.$setAllowDragging({ allowDragging: value });
                break;
            }

            case 'resize': {
                setResizing(value);
                props.$setAllowResizing({ allowResizing: value });
                break;
            }

            case 'rotate': {
                setRotating(value);
                props.$setAllowRotating({ allowRotating: value });
                break;
            }

            case 'proportions': {
                setProportions(value);
                props.$setAllowProportions({ allowProportions: value });
                break;
            }

            case 'restrictions': {
                setRestrictions(value);
                props.$setAllowRestrictions({ allowRestrictions: value });
                break;
            }

            case 'rotationOrigin': {
                setRotatingOrigin(value);
                props.$setAllowRotationOrigin({ allowTransformOrigin: value });
                break;
            }

            default:
                break;

        }
    };

    const handleSnapChange = (value) => {
        const snapValues = { ...snap, ...value };
        setSnap(snapValues);
        props.$setSnapSteps({ snapSteps: snapValues });
    };

    const handleColorPicker = (value) => {
        setFill(value.hex);
        document.getElementById('editor-grid').setAttributeNS(null, 'fill', value.hex);
    };

    useEffect(() => {
        const background = document.getElementById('editor-grid');
        setFill(background.getAttributeNS(null, 'fill'));
    }, []);

    return (
        <div
            className={classes.root}
            style={{ width: props.width }}
        >
            <form>
                <FormGroup aria-label='position'>
                    <div className={classes.padding}>
                        <Typography className={classes.label} variant='subtitle1' align='left'>Canvas</Typography>
                        <div className={classes.container}>
                            <TextInput label='width' value={paperSize.width} variant='outlined' size='small' onChange={(e) => handleChange([e.target.value, paperSize.height])} />
                            <TextInput label='height' value={paperSize.height} variant='outlined' size='small' onChange={(e) => handleChange([paperSize.width, e.target.value])} />
                        </div>
                        <div className={classes.container}>
                            <ColorPicker value={fill} onChange={handleColorPicker} />
                        </div>
                        <Grid container>
                            <Grid item xs={12}>
                                <Typography className={classes.label} variant='subtitle1' align='left'>Grid size</Typography>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                                    <Slider valueLabelDisplay='auto' value={editorGridSize} onChange={(e, val) => props.$setEditorGridSize({ editorGridSize: val })} step={10} />
                                </div>
                            </Grid>
                        </Grid>
                    </div>
                    <Divider />
                    <div className={classes.padding}>
                        <Typography className={classes.label} variant='subtitle1' align='left'>Effects</Typography>
                        <div className={classes.containerColumn}>
                            <CheckboxLabel
                                value={dragging}
                                control={<Checkbox checked={dragging} color='primary' onChange={handleSettings('drag')} />}
                                label='Allow dragging'
                                labelPlacement='end'
                            />
                            <CheckboxLabel
                                value={resizing}
                                control={<Checkbox checked={resizing} color='primary' onChange={handleSettings('resize')} />}
                                label='Allow resizing'
                                labelPlacement='end'
                            />
                            <CheckboxLabel
                                value={rotating}
                                control={<Checkbox checked={rotating} color='primary' onChange={handleSettings('rotate')} />}
                                label='Allow rotating'
                                labelPlacement='end'
                            />
                            <CheckboxLabel
                                value={proportions}
                                control={<Checkbox checked={proportions} color='primary' onChange={handleSettings('proportions')} />}
                                label='Keep aspect ratio'
                                labelPlacement='end'
                            />
                            <CheckboxLabel
                                value={rotatingOrigin}
                                control={<Checkbox checked={rotatingOrigin} color='primary' onChange={handleSettings('rotationOrigin')} />}
                                label='Use transform origin'
                                labelPlacement='end'
                            />
                            <CheckboxLabel
                                value={restrictions}
                                control={<Checkbox checked={restrictions} color='primary' onChange={handleSettings('restrictions')} />}
                                label='Activate bounding area'
                                labelPlacement='end'
                            />
                        </div>
                    </div>
                    <Divider />
                    <div className={classes.padding}>
                        <Typography className={classes.label} variant='subtitle1' align='left'>Snap</Typography>
                        <Grid container>
                            <Grid item xs={6}>
                                <TextInput label='grid step x' value={snap.x} variant='outlined' size='small' onChange={(e) => handleSnapChange({ x: Number(e.target.value) })} />
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput label='grid step y' value={snap.y} variant='outlined' size='small' onChange={(e) => handleSnapChange({ y: Number(e.target.value) })} />
                            </Grid>
                        </Grid>
                        <Grid container>
                            <Grid item xs={6}>
                                <TextInput label='snap angle' value={snap.angle} variant='outlined' size='small' onChange={(e) => handleSnapChange({ angle: Number(e.target.value) })} />
                            </Grid>
                        </Grid>
                    </div>
                </FormGroup>
            </form>
        </div>
    );
};

export default connect(mapStateToProps, mapDispatchToProps)(CanvasSettings);
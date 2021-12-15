import React, { useEffect, useState, useCallback } from 'react';
import { connect } from 'react-redux';
import subjx from 'subjx';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/Add';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';

import {
    FormGroup,
    FormControl,
    Divider,
    Typography,
    Grid,
    Slider,
    Select,
    InputBase,
    TextField,
    IconButton
} from '@material-ui/core';

const TextInput = withStyles({
    root: {
        margin: 10,
        '& .MuiOutlinedInput-input': {
            padding: '10px 10px'
        }
    }
})(TextField);

const BootstrapInput = withStyles((theme) => ({
    root: {
        'label + &': {
            marginTop: theme.spacing(3)
        }
    },
    input: {
        borderRadius: 4,
        position: 'relative',
        backgroundColor: theme.palette.background.paper,
        border: '1px solid #ced4da',
        fontSize: 16,
        paddingLeft: 10,
        transition: theme.transitions.create(['border-color', 'box-shadow']),
        '&:focus': {
            borderRadius: 4,
            borderColor: '#80bdff',
            boxShadow: '0 0 0 0.2rem rgba(0,123,255,.25)'
        }
    }
}))(InputBase);

const useStyles = makeStyles(() => ({
    root: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        backgroundColor: '#fdfdfd',
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
        paddingLeft: 10,
        width: '50%'
    }
}));

const mapStateToProps = (state) => ({
    globalData: state.globalData,
    selectedItems: state.items
});

const AnimationSettings = (props) => {
    const classes = useStyles();
    const { globalData, selectedItems } = props;

    const [keyframes, setKeyframes] = useState([]);
    const [frameType, setFrameType] = useState('translateX');
    const [frameValue, setFrameValue] = useState('');
    const [duration, setDuration] = useState(5000);

    const frameTypes = [
        'translateX',
        'translateY',
        'translateZ',
        'rotate',
        'rotateX',
        'rotateY',
        'rotateZ',
        'scale',
        'scaleX',
        'scaleY',
        'scaleZ',
        'skew',
        'skewX',
        'skewY',
        'perspective'
    ];

    const setValue = (name, value) => {
        switch (name) {

            case 'frameType': {
                setFrameType(value);
                break;
            }

            case 'frameValue': {
                setFrameValue(value);
                break;
            }

            case 'duration': {
                setDuration(value);
                break;
            }

            default:
                break;

        }
    };

    const addKeyframe = () => {
        setKeyframes([
            ...keyframes,
            {
                frameType,
                frameValue: parseFloat(frameValue),
                duration: parseFloat(duration)
            }
        ]);
    };

    const playAnimation = useCallback(() => {
        if (!selectedItems.length) return;

        const clones = [...selectedItems[0].elements].map((element) => {
            const el = element.cloneNode(true);
            subjx(el).css({ transform: el.getAttributeNS(null, 'transform') });
            element.parentNode.appendChild(el);
            return el;
        });
    }, [selectedItems, keyframes]);

    useEffect(() => {
        if (!selectedItems.length) return;
    }, [selectedItems]);

    return (
        <div
            className={classes.root}
            style={{ width: props.width }}
        >
            <form style={{ width: '100%' }}>
                <FormGroup aria-label='position'>
                    <div className={classes.padding}>
                        <Grid container>
                            <Typography className={classes.label} variant='subtitle1' align='left'>
                                Keyframes
                            </Typography>
                        </Grid>
                        <Grid container>
                            <Grid item xs={6}>
                                <Select
                                    style={{ margin: 10 }}
                                    variant='outlined'
                                    native
                                    value={frameType}
                                    onChange={(e) => setValue('frameType', e.target.value)}
                                    name='age'
                                    input={<BootstrapInput value={1} />}
                                >
                                    {frameTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                                </Select>
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput
                                    label='value'
                                    variant='outlined'
                                    size='small'
                                    value={frameValue}
                                    onChange={(e) => setValue('frameValue', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                        <Grid container>
                            <Grid item xs={6}>
                                <TextInput
                                    label='duration'
                                    variant='outlined'
                                    size='small'
                                    value={duration}
                                    onChange={(e) => setValue('duration', e.target.value)}
                                />
                            </Grid>
                        </Grid>
                        <div style={{ display: 'flex', justifyContent: 'end' }}>
                            <AddIcon onClick={addKeyframe} />
                        </div>
                        <Grid container>
                            {keyframes.map(({ frameType, duration }, index) => (
                                <Grid key={`${index}-${frameType}`} container>
                                    <Grid item xs={6}>{frameType}</Grid>
                                    <Grid item xs={6}>{duration}</Grid>
                                </Grid>
                            ))}
                        </Grid>
                        <IconButton variant='outlined' onClick={playAnimation}>
                            <PlayArrowIcon />
                        </IconButton>
                    </div>
                </FormGroup>
            </form>
        </div>
    );
};

export default connect(mapStateToProps)(AnimationSettings);
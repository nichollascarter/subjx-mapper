import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import ColorPicker from '../../helpers/ColorPicker';

import {
    FormGroup,
    FormControl,
    Divider,
    Typography,
    Grid,
    Slider,
    Select,
    InputBase
} from '@material-ui/core';

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
    eventBus: state.eventBus
});


const ItemSettings = (props) => {
    const classes = useStyles();

    const { eventBus } = props;

    const [fill, setFill] = useState('none');
    const [fillOptions, setFillOptions] = useState('none');
    const [stroke, setStroke] = useState('none');
    const [strokeOptions, setStrokeOptions] = useState('none');
    const [thickness, setThickness] = useState(2);
    const [opacity, setOpacity] = useState(100);

    const setValue = (name, value) => {
        switch (name) {

            case 'fill':
                setFill(value);
                eventBus.emit(name, null, value);
                break;
            case 'stroke':
                setStroke(value);
                eventBus.emit(name, null, value.hex);
                break;
            case 'thickness':
                setThickness(value);
                eventBus.emit(name, null, value);
                break;
            case 'opacity':
                setOpacity(value);
                eventBus.emit(name, null, value / 100);
            default:
                break;

        }
    };

    useEffect(() => {
        setValue('fill', fillOptions === 'color' ? fill : 'none');
    }, [fillOptions]);

    return (
        <div
            className={classes.root}
            style={{ width: props.width }}
        >
            <FormControl component='fieldset' style={{ width: '100%' }}>
                <FormGroup aria-label='position'>
                    <div className={classes.padding}>
                        <div className={classes.container}>
                            <Typography className={classes.label} variant='subtitle1' align='left'>Fill</Typography>
                        </div>
                        <div className={classes.container}>
                            <ColorPicker initValue={fill} onChange={(value) => setValue('fill', value.hex)} />
                            <Select
                                style={{ width: '50%', padding: 10 }}
                                variant='outlined'
                                native
                                value={fillOptions}
                                onChange={(e) => setFillOptions(e.target.value)}
                                name='age'
                                input={<BootstrapInput />}
                            >
                                <option value={'none'}>none</option>
                                <option value={'color'}>color</option>
                            </Select>
                        </div>
                        <div className={classes.container}>
                            <Typography className={classes.label} variant='subtitle1' align='left'>Stroke</Typography>
                        </div>
                        <div className={classes.container}>
                            <ColorPicker initValue={stroke} onChange={(value) => setValue('stroke', value)} />
                            <Select
                                style={{ width: '50%', padding: 10 }}
                                variant='outlined'
                                native
                                value={strokeOptions}
                                onChange={(e) => setStrokeOptions(e.target.value)}
                                name='age'
                                input={<BootstrapInput />}
                            >
                                <option value={'none'}>none</option>
                                <option value={'color'}>color</option>
                            </Select>
                        </div>
                        <div className={classes.container}>
                            <Grid item xs={12}>
                                <Typography className={classes.label} variant='subtitle1' align='left'>Thickness</Typography>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                                    <Slider valueLabelDisplay='auto' max={30} value={thickness} onChange={(e, val) => setValue('thickness', val)} step={1} />
                                </div>
                            </Grid>
                        </div>
                    </div>
                    <Divider />
                    <div className={classes.padding}>
                        <div className={classes.container}>
                            <Grid item xs={12}>
                                <Typography className={classes.label} variant='subtitle1' align='left'>Opacity</Typography>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                                    <Slider valueLabelDisplay='auto' max={100} value={opacity} onChange={(e, val) => setValue('opacity', val)} step={1} />
                                </div>
                            </Grid>
                        </div>
                    </div>
                    <Divider />
                </FormGroup>
            </FormControl>
        </div>
    );
};

export default connect(mapStateToProps)(ItemSettings);
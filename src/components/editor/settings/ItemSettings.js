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
    eventBus: state.eventBus,
    selectedItems: state.items
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

    const setValue = (name, value, isEmit = true) => {
        switch (name) {

            case 'fill': {
                setFill(value);
                if (isEmit) eventBus.emit(name, null, value);
                break;
            }
            case 'fillOptions': {
                const nextVal = fillOptions === 'color' ? fill : 'none';
                setFill(nextVal);
                if (isEmit) eventBus.emit(name, null, nextVal);
                break;
            }
            case 'stroke': {
                setStroke(value);
                if (isEmit) eventBus.emit(name, null, value);
                break;
            }
            case 'thickness': {
                const nextVal = value === null ? 2 : value;
                setThickness(Number(nextVal));
                if (isEmit) eventBus.emit(name, null, Number(nextVal));
                break;
            }
            case 'opacity': {
                const nextVal = value === null ? 1 : value;
                setOpacity(Number(nextVal) * 100);
                if (isEmit) eventBus.emit(name, null, Number(nextVal));
                break;
            }
            default:
                break;

        }
    };

    useEffect(() => {
        if (!props.selectedItems.length) return;

        Object.entries({
            fill: 'fill',
            stroke: 'stroke',
            thickness: 'stroke-width',
            opacity: 'opacity'
        }).map(([event, attribute]) => {
            setValue(
                event,
                props.selectedItems[0].el.getAttributeNS(null, attribute),
                false
            );
        });
    }, [props.selectedItems]);

    return (
        <div
            className={classes.root}
            style={{ width: props.width }}
        >
            <FormControl component='fieldset' style={{ width: '100%' }}>
                <FormGroup aria-label='position'>
                    <div className={classes.padding}>
                        <div className={classes.container}>
                            <Typography className={classes.label} variant='subtitle1' align='left'>
                                Fill
                            </Typography>
                        </div>
                        <div className={classes.container}>
                            <ColorPicker value={fill} onChange={(value) => setValue('fill', value.hex)} />
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
                            <ColorPicker value={stroke} onChange={(value) => setValue('stroke', value.hex)} />
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
                                    <Slider
                                        valueLabelDisplay='auto'
                                        max={30}
                                        value={thickness}
                                        onChange={(e, val) => setValue('thickness', val)} step={1}
                                    />
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
                                    <Slider
                                        valueLabelDisplay='auto'
                                        max={100}
                                        value={opacity}
                                        onChange={(e, val) => setValue('opacity', val / 100)} step={1}
                                    />
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
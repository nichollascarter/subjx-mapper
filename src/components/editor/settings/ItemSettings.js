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

    const { eventBus, selectedItems } = props;

    const [fill, setFill] = useState('none');
    const [fillOptions, setFillOptions] = useState('none');
    const [stroke, setStroke] = useState('none');
    const [strokeOptions, setStrokeOptions] = useState('none');
    const [thickness, setThickness] = useState(2);
    const [opacity, setOpacity] = useState(100);

    const [textContent, setTextContent] = useState(null);
    const [textProperties, setTextProperties] = useState({
        letterSpacing: 5,
        wordSpacing: 1,
        lineHeight: 1
    });

    const setValue = (name, value, isEmit = true) => {
        switch (name) {

            case 'fill': {
                setFill(value);
                if (isEmit) eventBus.emit(name, null, value);
                break;
            }
            case 'fillOptions': {
                const nextVal = value === 'color' ? fill : 'none';
                setFillOptions(value);
                if (isEmit) eventBus.emit('fill', null, nextVal);
                break;
            }
            case 'stroke': {
                setStroke(value);
                if (isEmit) eventBus.emit(name, null, value);
                break;
            }
            case 'strokeOptions': {
                const nextVal = value === 'color' ? stroke : 'none';
                setStrokeOptions(value);
                if (isEmit) eventBus.emit('stroke', null, nextVal);
                break;
            }
            case 'thickness': {
                const nextVal = value === null ? 2 : value;
                setThickness(Number(nextVal));
                if (isEmit) eventBus.emit(name, null, nextVal);
                break;
            }
            case 'opacity': {
                const nextVal = value === null ? 1 : value;
                setOpacity(Number(nextVal) * 100);
                if (isEmit) eventBus.emit(name, null, nextVal);
                break;
            }
            case 'textContent': {
                changeTextContent(value);
                if (isEmit) eventBus.emit(name);
                break;
            }
            case 'letterSpacing':
            case 'wordSpacing':
            case 'lineHeight': {
                setTextProperties((prev) => ({ ...prev, [name]: value === null ? prev[name] : Number(value) }));
                if (isEmit) eventBus.emit(name, null, value);
                break;
            }
            default:
                break;

        }
    };

    const isTextTag = (tag) => tag.tagName.toLowerCase() === 'text';

    useEffect(() => {
        if (!selectedItems.length) return;

        const textTag = isTextTag(selectedItems[0].elements[0]);

        Object.entries({
            fill: 'fill',
            stroke: 'stroke',
            thickness: 'stroke-width',
            opacity: 'opacity',
            ...(textTag && {
                letterSpacing: 'letter-spacing',
                wordSpacing: 'word-spacing',
                lineHeight: 'line-height'
            })
        }).map(([event, attribute]) => {
            setValue(
                event,
                selectedItems[0].elements[0].getAttributeNS(null, attribute),
                false
            );
        });

        if (textTag) {
            setTextContent(selectedItems[0].elements[0].textContent || '');
        } else {
            setTextContent(null);
        };
    }, [selectedItems]);

    const changeTextContent = (textContent) => {
        setTextContent(textContent);
        selectedItems[0].elements[0].textContent = textContent;
    };

    return (
        <div
            className={classes.root}
            style={{ width: props.width }}
        >
            <form style={{ width: '100%' }}>
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
                                onChange={(e) => setValue('fillOptions', e.target.value)}
                                name='age'
                                input={<BootstrapInput value={fillOptions} />}
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
                                onChange={(e) => setValue('strokeOptions', e.target.value)}
                                name='age'
                                input={<BootstrapInput value={strokeOptions} />}
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
                    {(textContent !== null) && <div className={classes.padding}>
                        <div className={classes.container}>
                            <Grid item xs={12}>
                                <Typography className={classes.label} variant='subtitle1' align='left'>Text</Typography>
                                <BootstrapInput
                                    style={{ padding: 10 }}
                                    value={textContent}
                                    onChange={(e) => setValue('textContent', e.target.value)}
                                />
                            </Grid>
                        </div>
                        <div className={classes.container}>
                            <Grid item xs={12}>
                                <Typography className={classes.label} variant='subtitle1' align='left'>Letter space</Typography>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                                    <Slider
                                        valueLabelDisplay='auto'
                                        max={50}
                                        value={textProperties.letterSpacing}
                                        onChange={(e, val) => setValue('letterSpacing', val)} step={1}
                                    />
                                </div>
                            </Grid>
                        </div>
                        <div className={classes.container}>
                            <Grid item xs={12}>
                                <Typography className={classes.label} variant='subtitle1' align='left'>Word space</Typography>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                                    <Slider
                                        valueLabelDisplay='auto'
                                        max={100}
                                        value={textProperties.wordSpacing}
                                        onChange={(e, val) => setValue('wordSpacing', val)} step={1}
                                    />
                                </div>
                            </Grid>
                        </div>
                        <div className={classes.container}>
                            <Grid item xs={12}>
                                <Typography className={classes.label} variant='subtitle1' align='left'>Line height</Typography>
                                <div style={{ display: 'flex', alignItems: 'center', padding: '0 10px' }}>
                                    <Slider
                                        valueLabelDisplay='auto'
                                        max={200}
                                        value={textProperties.lineHeight}
                                        onChange={(e, val) => setValue('lineHeight', val)} step={1}
                                    />
                                </div>
                            </Grid>
                        </div>
                    </div>}
                </FormGroup>
            </form>
        </div>
    );
};

export default connect(mapStateToProps)(ItemSettings);
import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import {
    Add as AddIcon,
    Delete as DeleteIcon
} from '@material-ui/icons';

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

import { generateUUID } from '../../../util';

const TextInput = withStyles({
    root: {
        margin: 10,
        '& .MuiOutlinedInput-input': {
            padding: '10px 10px'
        }
    }
})(TextField);

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
    selectedItems: state.items,
    eventBus: state.eventBus
});

const AnimationSettings = (props) => {
    const classes = useStyles();
    const { selectedItems, eventBus } = props;

    const [variables, setVariables] = useState([]);
    const [variableType, setVariableType] = useState('boolean');
    const [variableName, setVariableName] = useState('');

    const variablesTypes = [
        'boolean',
        'number',
        'string'
    ];

    const setValue = (name, value) => {
        switch (name) {

            case 'variableName': {
                setVariableName(value);
                break;
            }

            case 'variableType': {
                setVariableType(value);
                break;
            }

            default:
                break;

        }
    };

    const addVariable = useCallback(() => {
        setVariables([
            ...variables,
            {
                id: generateUUID(),
                type: variableType,
                name: variableName
            }
        ]);
    }, [variables, variableType, variableName]);

    const openVariableSettings = (id) => {
        eventBus.emit('variable-settings', null, id);
    };

    const removeVariable = useCallback((varId) => {
        const index = variables.findIndex(({ id }) => varId === id);
        variables.splice(index, 1);
        setVariables([
            ...variables
        ]);
    }, [variables]);

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
                                Context
                            </Typography>
                        </Grid>
                        <Grid container>
                            <Grid item xs={6}>
                                <TextInput
                                    label='Name'
                                    variant='outlined'
                                    size='small'
                                    value={variableName}
                                    onChange={(e) => setValue('variableName', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <TextInput
                                    select
                                    style={{ width: '80%' }}
                                    variant='outlined'
                                    native
                                    value={variableType}
                                    onChange={(e) => setValue('variableType', e.target.value)}
                                    name='age'
                                >
                                    {variablesTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                                </TextInput>
                            </Grid>
                        </Grid>
                        <div style={{ display: 'flex', justifyContent: 'end' }}>
                            <AddIcon onClick={addVariable} />
                        </div>
                        <Grid container>
                            {variables.map(({ name, type, id }, index) => (
                                <Grid key={`${index}-${name}-${type}`} container onClick={() => openVariableSettings(id)}>
                                    <Grid item xs={4}>{name}</Grid>
                                    <Grid item xs={4}>{type}</Grid>
                                    <Grid item xs={4}><DeleteIcon onClick={() => removeVariable(id)} /></Grid>
                                </Grid>
                            ))}
                        </Grid>
                    </div>
                </FormGroup>
            </form>
        </div>
    );
};

export default connect(mapStateToProps)(AnimationSettings);
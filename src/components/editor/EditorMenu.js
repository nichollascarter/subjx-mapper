import React, { useState, useEffect } from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { IconButton, Paper } from '@material-ui/core';
import ImportIcon from '@material-ui/icons/GetApp';
import SaveIcon from '@material-ui/icons/Save';
import Delete from '@material-ui/icons/Delete';
import { readText } from '../../util/fileReader';

const useStyles = makeStyles(theme => ({
    root: {
        display: 'flex',
        justifyContent: 'center',
        zIndex: 99999,
        padding: theme.spacing(1)
    }
}));

const ExtendedButton = withStyles({
    root: {
        color: 'rgba(0,0,0,0.65)',
        padding: 6
    }
})(IconButton);

const EditorMenu = (props) => {
    const classes = useStyles();

    const [fileSelector, setFileSelector] = useState(
        document.createElement('input')
    );

    useEffect(() => {
        const fileSelector = document.createElement('input');
        fileSelector.setAttribute('type', 'file');
        fileSelector.setAttribute('accept', 'image/*');
        fileSelector.setAttribute('id', 'file-upload');
        fileSelector.style.display = 'none';

        setFileSelector(fileSelector);

        const loadFiles = async (e) => {
            try {
                const res = await readText(e.target);
                props.onImport(res);
            } catch (err) {
                // eslint-disable-next-line no-console
                console.log(err);
            }
        };

        fileSelector.addEventListener('change', loadFiles, false);
    }, [props]);

    const handleFileSelect = (e) => {
        fileSelector.click();
        e.preventDefault();
        e.target.value = '';
    };

    const handleExportFile = () => {
        props.onExport();
    };

    return (
        <Paper className={classes.root} elevation={1}>
            <ExtendedButton onClick={handleFileSelect}>
                <ImportIcon />
            </ExtendedButton>
            <ExtendedButton onClick={handleExportFile}>
                <SaveIcon />
            </ExtendedButton>
            <ExtendedButton onClick={() => props.onClearArea()}>
                <Delete />
            </ExtendedButton>
        </Paper>
    );
};

export default EditorMenu;
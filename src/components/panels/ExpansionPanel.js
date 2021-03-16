import React, { useState } from 'react';
import { withStyles } from '@material-ui/core/styles';
import MuiExpansionPanel from '@material-ui/core/ExpansionPanel';
import MuiExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import MuiExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import Typography from '@material-ui/core/Typography';

const ExpansionPanel = withStyles({
    root: {
        // border: '1px solid rgba(0, 0, 0, .125)',
        backgroundColor: 'transparent',
        boxShadow: 'none',
        '&:not(:last-child)': {
            borderBottom: 0
        },
        '&:before': {
            display: 'none'
        },
        '&$expanded': {
            margin: 'auto'
        },
        color: 'white'
    },
    expanded: {}
})(MuiExpansionPanel);

const ExpansionPanelSummary = withStyles({
    root: {
        backgroundColor: '#151921',
        // backgroundColor: 'rgba(0, 0, 0, .03)',
        borderBottom: '1px solid rgba(0, 0, 0, .125)',
        marginBottom: -1,
        minHeight: 18,
        '&$expanded': {
            minHeight: 18
        }
    },
    content: {
        '&$expanded': {
            margin: '12px 0'

        }
    },
    expanded: {}
})(MuiExpansionPanelSummary);

const ExpansionPanelDetails = withStyles(theme => ({
    root: {
        padding: theme.spacing(2)
    }
}))(MuiExpansionPanelDetails);

export default function CustomizedExpansionPanels(props) {
    const [isExpanded, setExpanded] = useState('');

    const {
        panels
    } = props;

    const handleChange = panel => () => {
        setExpanded(!isExpanded);
        panel.expanded = !panel.expanded;
    };

    return (
        <div>
            {
                panels.map((item) => {
                    const { name, title, details, expanded } = item;
                    return (
                        <ExpansionPanel
                            key={name}
                            square
                            expanded={expanded || false}
                            onChange={handleChange(item)}
                        >
                            <ExpansionPanelSummary
                                aria-controls={`${name}-content`}
                                id={`${name}-header`}
                            >
                                <Typography>
                                    {title}
                                </Typography>
                            </ExpansionPanelSummary>
                            <ExpansionPanelDetails>
                                {details}
                            </ExpansionPanelDetails>
                        </ExpansionPanel>
                    );
                })
            }
        </div>
    );
}
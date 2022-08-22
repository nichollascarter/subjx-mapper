import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import parse from 'html-react-parser';
import { saveAs } from 'file-saver';
import 'construct-style-sheets-polyfill';

import {
    CssBaseline,
    Paper
} from '@material-ui/core';

import EditorCanvas from './EditorCanvas';
import EditorToolbar from './EditorToolbar';
import EditorSettings from './EditorSettings';
import EditorMenu from './EditorMenu';
import EditorTimeline from './EditorTimeline';
import { CanvasSettings, ItemSettings, AnimationSettings } from './settings';

const allowedSvgs = [
    'g', 'rect', 'path', 'polygon', 'polyline',
    'circle', 'ellipse', 'text', 'line', 'foreighobject'
];

const drawerWidth = 240;

const mapStateToProps = (state) => ({
    eventBus: state.eventBus,
    editorPaperSize: state.editorPaperSize
});

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        marginTop: 0,
        minHeight: '100vh',
        height: '100vh',
        justifyItems: 'center',
        backgroundColor: '#e6e5e5'
    },
    canvasContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(2)
    },
    leftContainer: {
        position: 'absolute',
        paddingLeft: theme.spacing(2),
        padding: theme.spacing(1),
        left: 0,
        zIndex: 100
    },
    rightContainer: {
        position: 'absolute',
        paddingRight: theme.spacing(2),
        padding: theme.spacing(1),
        right: 0,
        zIndex: 100
    }
}));

const Editor = (props) => {
    const {
        editorPaperSize,
        eventBus
    } = props;

    const classes = useStyles();
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [leftOffset, setLeftOffset] = useState(57);
    const [content, setContent] = useState(null);
    const [settingsTab, setSettingsTab] = useState('canvas');

    const parsedStyleSheet = new CSSStyleSheet();

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };

    const getStyleRule = (className) => {
        let cssText = {};
        const classes = parsedStyleSheet.rules || parsedStyleSheet.cssRules;
        for (let x = 0; x < classes.length; x++) {
            if (classes[x].selectorText === className) {
                for (let index = 0; index < classes[x].style.length; index++) {
                    const propertyName = classes[x].style.item(index);
                    cssText = {
                        ...cssText,
                        [propertyName]: classes[x].style[propertyName]
                    };
                }
            }
        }
        return cssText;
    };

    const parserOptions = {
        replace(domNode) {
            if (domNode.name === 'style') {
                const styleSheet = new CSSStyleSheet();
                styleSheet.replace(domNode.children[0].data);

                [...styleSheet.rules].map((rule) => (
                    parsedStyleSheet.insertRule(rule.cssText, parsedStyleSheet.cssRules.length)
                ));

                return <></>;
            }

            if (domNode.name === 'use') {
                const ref = domNode.attribs['xlink:href'] || domNode.attribs.href;

                if (!ref) return domNode;
                const source = domNode.parent.children.find((childNode) => {
                    return childNode.attribs && ('#' + childNode.attribs.id === ref);
                });
            }

            if (domNode.type === 'tag' && allowedSvgs.indexOf(domNode.name) !== -1) {
                domNode.attribs = domNode.attribs || {};

                const { class: className = '' } = domNode.attribs;

                if (domNode.name === 'g') {
                    domNode.attribs = {
                        ...domNode.attribs,
                        ...getStyleRule(`.${domNode.attribs.class}`),
                        class: `layer ${className}`
                    };
                } else {
                    domNode.attribs = {
                        ...domNode.attribs,
                        ...getStyleRule(`.${domNode.attribs.class}`),
                        class: className
                    };
                }
            }
            return domNode;
        }
    };

    const handleImport = (res) => {
        let reactSVGEl = parse(res, parserOptions);

        if (Array.isArray(reactSVGEl)) {
            reactSVGEl = reactSVGEl.find(item => (
                typeof item === 'object' && item.type === 'svg'
            ));
        }

        const element = document.createElement('div');
        // this is a temporary decision to convert html to dom
        // maybe in the future it is need to use react way to import complex html tree
        ReactDOM.render(reactSVGEl, element, () => {
            ReactDOM.unmountComponentAtNode(element);
            setContent(element.childNodes[0]);
        });
    };

    const handleExport = () => {
        const rootHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${editorPaperSize.width}" height="${editorPaperSize.height}">
            ${document.getElementById('editable-content').innerHTML}
        </svg>`;

        const blob = new Blob([rootHTML]);
        saveAs(blob, `export_${(new Date()).toISOString()}.svg`);
    };

    const handleClearArea = () => {
        setContent(!Boolean(content));
    };

    const appendNewItem = (_, nodeProps) => {
        const element = document.createElement('div');

        ReactDOM.render(
            <svg>{React.createElement(...nodeProps)}</svg>,
            element,
            () => {
                ReactDOM.unmountComponentAtNode(element);
                document.querySelector('#editable-content').appendChild(element.childNodes[0].childNodes[0]);
            }
        );
    };

    useEffect(() => {
        setLeftOffset(open ? drawerWidth : 57);
    }, [open]);

    useState(() => {
        eventBus.on('settings', value => setSettingsTab(value));
    }, []);

    const { component: SettingsComponent } = [
        {
            component: _ => <CanvasSettings {..._} />,
            condition: settingsTab === 'canvas'
        },
        {
            component: _ => <ItemSettings {..._} />,
            condition: settingsTab === 'item'
        },
        {
            component: _ => <AnimationSettings {..._} />,
            condition: settingsTab === 'animation'
        }
    ].find(({ condition }) => !!condition);

    return (
        <div className={classes.root}>
            <CssBaseline />
            <div className={classes.canvasContainer}>
                <div className={classes.leftContainer}>
                    <EditorMenu
                        onImport={handleImport}
                        onExport={handleExport}
                        onClearArea={handleClearArea}
                    />
                    <Paper style={{ marginTop: 20 }} elevation={1}>
                        <EditorToolbar onDrop={appendNewItem} />
                    </Paper>
                </div>
                {/* <div className={classes.content}> */}
                <div style={{ position: 'relative', height: '100%' }}>
                    <EditorCanvas
                        leftOffset={0}
                        topOffset={87}
                        rightOffset={0}
                        mouseAction='edit'
                    >
                        {content}
                    </EditorCanvas>
                </div>
            </div>
            <Paper style={{ position: 'absolute', bottom: 0, margin: 10, marginLeft: 300, zIndex: 100 }} elevation={1}>
                <EditorTimeline eventBus={eventBus} />
            </Paper>
            <div className={classes.rightContainer}>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Paper elevation={1}>
                        <EditorSettings />
                    </Paper>
                </div>
                <Paper elevation={1} style={{ marginTop: 20 }}>
                    <SettingsComponent width={drawerWidth} />
                </Paper>
            </div>
        </div>
    );
};

export default connect(mapStateToProps)(Editor);
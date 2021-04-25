import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import clsx from 'clsx';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import parse from 'html-react-parser';
import { saveAs } from 'file-saver';
import 'construct-style-sheets-polyfill';

import {
    Drawer,
    AppBar,
    CssBaseline,
    Divider,
    IconButton
} from '@material-ui/core';

import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

import EditorCanvas from './EditorCanvas';
import EditorToolbar from './EditorToolbar';
import EditorMenu from './EditorMenu';
import EditorItems from './EditorItems';
import { CanvasSettings, ItemSettings } from './settings';

const allowedSvgs = [
    'g', 'rect', 'path', 'polygon', 'polyline',
    'circle', 'ellipse', 'text', 'line', 'foreighobject'
];

const drawerWidth = 240;

const mapStateToProps = (state) => ({
    eventBus: state.eventBus
});

const useStyles = makeStyles((theme) => ({
    root: {
        display: 'flex',
        marginTop: 46,
        minHeight: 'calc(100vh - 46px)',
        height: 'calc(100vh - 46px)',
        justifyItems: 'center',
        backgroundColor: '#e6e5e5'
    },
    menu: {
        display: 'flex',
        position: 'absolute',
        top: 0,
        left: 0,
        height: 46,
        width: '100%',
        zIndex: 999,
        backgroundColor: theme.palette.primary.main
    },
    canvas: {
        flexGrow: 1
        // overflow: 'hidden auto'
    },
    canvasContainer: {
        display: 'flex',
        flex: 1,
        flexDirection: 'column'
    },
    appBar: {
        borderTop: '1px solid #fff',
        color: 'rgba(0,0,0,0.65)',
        backgroundColor: 'rgb(230 229 229)',
        zIndex: theme.zIndex.drawer + 1,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        position: 'relative',
        height: 46
    },
    appBarShift: {
        // marginLeft: drawerWidth,
        // width: `calc(100% - ${drawerWidth}px)`,
        transition: theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    menuButton: {
        marginRight: 36
    },
    hide: {
        display: 'none'
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap'
    },
    drawerPaper: {
        position: 'relative',
        backgroundColor: '#fdfdfd'
    },
    drawerOpen: {
        width: drawerWidth,
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen
        })
    },
    drawerClose: {
        transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen
        }),
        overflowX: 'hidden',
        width: theme.spacing(7) + 1,
        [theme.breakpoints.up('sm')]: {
            width: theme.spacing(7) + 1
        }
    },
    toolbar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: theme.spacing(0, 1)
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(2)
    }
}));

const Editor = (props) => {
    const classes = useStyles();
    const theme = useTheme();
    const [open, setOpen] = useState(false);
    const [leftOffset, setLeftOffset] = useState(57);
    const [content, setContent] = useState(null);
    const [showSettings, setSettingsTab] = useState('canvas');

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
        const rootSVG = document.getElementById('editor-canvas');
        const [width, height] = ['width', 'height'].map((attr) => (
            rootSVG.getAttributeNS(null, attr)
        ));

        const rootHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
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
        props.eventBus.on('settings', (value) => setSettingsTab(value));
    }, []);

    return (
        // <div style={{ paddingTop: '60px' }}></div>
        <div>
            <div className={classes.menu}>
                <EditorMenu
                    onImport={handleImport}
                    onExport={handleExport}
                    onClearArea={handleClearArea}
                />
            </div>
            <div className={classes.root}>
                <CssBaseline />
                <Drawer
                    open={open}
                    variant='permanent'
                    className={clsx(classes.drawer, {
                        [classes.drawerOpen]: open,
                        [classes.drawerClose]: !open
                    })}
                    classes={{
                        paper: clsx(classes.drawerPaper, {
                            [classes.drawerOpen]: open,
                            [classes.drawerClose]: !open
                        })
                    }}
                >
                    <div className={classes.toolbar}>
                        <IconButton onClick={handleDrawerClose}>
                            {
                                theme.direction === 'rtl'
                                    ? <ChevronRightIcon />
                                    : <ChevronLeftIcon />
                            }
                        </IconButton>
                        <IconButton
                            color='inherit'
                            aria-label='open drawer'
                            onClick={handleDrawerOpen}
                            edge='start'
                            className={clsx({
                                [classes.hide]: open
                            })}
                        >
                            <ChevronRightIcon />
                        </IconButton>
                    </div>
                    <Divider />
                    <EditorItems onDrop={appendNewItem} />
                    <Divider />
                </Drawer>
                <div className={classes.canvasContainer}>
                    <AppBar
                        // position='fixed'
                        className={clsx(classes.appBar, {
                            [classes.appBarShift]: open
                        })}
                    >
                        <EditorToolbar />
                    </AppBar>
                    {/* <div className={classes.content}> */}
                    <div style={{ position: 'relative', height: '100%' }}>
                        <EditorCanvas
                            leftOffset={leftOffset}
                            topOffset={87}
                            rightOffset={drawerWidth}
                            mouseAction='edit'
                        >
                            {content}
                        </EditorCanvas>
                        {showSettings === 'canvas'
                            ? <CanvasSettings width={drawerWidth} />
                            : <ItemSettings width={drawerWidth} />
                        }
                    </div>
                </div>
            </div>
        </div>
    );
};

export default connect(mapStateToProps)(Editor);
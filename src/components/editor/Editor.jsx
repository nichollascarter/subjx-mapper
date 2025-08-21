import { useState, useCallback, createElement } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from '@mui/styles';
import parse from 'html-react-parser';
import { saveAs } from 'file-saver';
import 'construct-style-sheets-polyfill';
import {
  CssBaseline,
  Button,
  Box
} from '@mui/material';
import { Stack } from '@mui/material';

import { Section } from '@/components/ui/Section';

import EditorCanvas from './EditorCanvas';
import EditorToolbar from './EditorToolbar';
import EditorSettings from './EditorSettings';
import FileOpenSave from './FileOpenSave';
import UndoRedo from './UndoRedo';
import Layers from './Layers';
import Alignment from './Alignment';
import { CanvasSettings, ItemSettings } from './settings';

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
    zIndex: 100,
    width: 0
  },
  rightContainer: {
    position: 'absolute',
    paddingRight: theme.spacing(2),
    padding: theme.spacing(1),
    right: 0,
    zIndex: 100,
    width: 0
  },
  layerBar: {
    position: 'absolute',
    display: 'flex',
    whiteSpace: 'nowrap',
    alignItems: 'center',
    zIndex: 99999,
    padding: theme.spacing(1)
  }
}));

const Editor = (props) => {
  const {
    editorPaperSize,
    eventBus
  } = props;

  const classes = useStyles();
  const [content, setContent] = useState(null);
  const [settingsTab, setSettingsTab] = useState('canvas');
  const [layersBar, setLayersBar] = useState(null);
  const [dropLayer, setParentLayer] = useState(false);

  const parsedStyleSheet = new CSSStyleSheet();

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

    setContent(reactSVGEl?.props?.children || []);
  };

  const handleExport = () => {
    const rootHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="${editorPaperSize.width}" height="${editorPaperSize.height}">
                ${document.getElementById('editable-content').innerHTML}
            </svg>`;

    const blob = new Blob([rootHTML]);
    saveAs(blob, `export_${(new Date()).toISOString()}.svg`);
  };

  const handleClearArea = () => {
    setContent(!Boolean(content));
  };

  const appendNewItem = useCallback((_, [tagName, nodeProps]) => {
    const newElement = createElement(tagName, nodeProps);

    const wrapper = document.createElementNS("http://www.w3.org/2000/svg", tagName);
    Object.entries(newElement.props).forEach(([key, value]) => {
      wrapper.setAttribute(key, value);
    });

    document.querySelector('#editable-content').appendChild(wrapper);
  }, []);

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
    }
  ].find(({ condition }) => !!condition);

  return (
    <div className={classes.root}>
      <CssBaseline />
      <div className={classes.canvasContainer}>
        <div className={classes.leftContainer}>
          <Stack direction='row' spacing={2}>
            <Section elevation={1}>
              <FileOpenSave
                onImport={handleImport}
                onExport={handleExport}
                onClearArea={handleClearArea}
              />
            </Section>
            <Section elevation={1}>
              <UndoRedo />
              <Layers />
              <Alignment />
            </Section>
                        
          </Stack>
          <Box sx={{ display: 'flex' }}>
            <Section sx={(theme) => ({ width: 'fit-content', marginTop: theme.spacing(2) })} elevation={1}>
              <EditorToolbar onDrop={appendNewItem} />
            </Section>
            <Box sx={(theme) => ({ position: 'relative', width: 0, marginTop: theme.spacing(2) })}>
              {
                layersBar && (
                  <div className={classes.layerBar}>
                    <Box>{layersBar}</Box>
                    <Button
                      style={{ marginLeft: 2 }}
                      variant='contained'
                      color='primary'
                      size='small'
                      onMouseUp={() => setParentLayer(true)}>
                                            Exit
                    </Button>
                  </div>
                )
              }
            </Box>
          </Box>
        </div>
        <div style={{ position: 'relative', height: '100%' }}>
          <EditorCanvas
            leftOffset={0}
            topOffset={87}
            rightOffset={0}
            mouseAction='edit'
            onLayerChange={(v) => {
              setLayersBar(v);
              setParentLayer(false);
            }}
            dropLayer={dropLayer}
          >
            {content}
          </EditorCanvas>
        </div>
      </div>
      <div className={classes.rightContainer}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Section elevation={1}>
            <EditorSettings />
          </Section>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Section elevation={1} sx={(theme) => ({ marginTop: theme.spacing(2) })}>
              <SettingsComponent width={drawerWidth} />
            </Section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(Editor);
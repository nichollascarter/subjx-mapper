import { useMemo } from 'react';
import { makeStyles } from '@mui/styles';
import { connect } from 'react-redux';
import subjx from 'subjx';
import { Box } from '@mui/material';
import {
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Navigation as NavigationIcon,
  PanToolOutlined as PanToolIcon,
  HighlightAlt as PhotoSizeSelectSmallIcon,
  Search as SearchIcon,
  Crop54Outlined as Rectangle,
  RadioButtonUnchecked as Circle,
  GradeOutlined as Shape,
  //CropOriginalOutlined as Image,
  TextFormat as Text
} from '@mui/icons-material';

import { ExtendedButton } from '@/components/ui/ExtendedButton';
import { setEditorAction, activateEditorGrid } from '@/actions';

const useStyles = makeStyles(() => ({
  flex: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    flexDirection: 'column'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column',
    marginBottom: 5
  }
}));

const mapStateToProps = (state) => {
  return {
    editorAction: state.editorAction,
    editorGrid: state.editorGrid,
    eventBus: state.eventBus
  };
};

const mapDispatchToProps = (dispatch) => ({
  $setEditorAction: (act) => dispatch(setEditorAction(act)),
  $activateEditorGrid: (act) => dispatch(activateEditorGrid(act))
});

const items = [
  ['rectangle', Rectangle],
  ['circle', Circle],
  ['shape', Shape],
  ['text', Text]
  // ['image', Image]
];

const EditorToolbar = (props) => {
  const classes = useStyles();

  const {
    editorAction,
    editorGrid,
    eventBus
  } = props;

  const setEditorAction = (editorAction) => () => {
    props.$setEditorAction({ editorAction });
  };

  const activateEditorGrid = (editorGrid) => {
    props.$activateEditorGrid({ editorGrid });
  };

  const cloneConfig = useMemo(() => ({
    appendTo: 'body',
    stack: '#editor-background',
    style: {
      border: 'none',
      background: 'transparent',
      maxWidth: '150px',
      textColor: 'transparent'
    },
    onInit() { },
    onDrop(e) {
      e.preventDefault();
      const itemType = this.elements[0].getAttribute('data-type');
      let newItem = null;

      const editorRef = document.querySelector('#editor-background');

      const offset = editorRef.getBoundingClientRect(),
        x = e.clientX - offset.left + editorRef.scrollLeft,
        y = e.clientY - offset.top + editorRef.scrollTop;

      switch (itemType) {

        case 'rectangle':
          newItem = [
            'rect',
            {
              x,
              y,
              width: 150,
              height: 100,
              stroke: 'black',
              fill: 'transparent'
            }
          ];
          break;
        case 'circle':
          newItem = [
            'ellipse',
            {
              cx: x,
              cy: y,
              rx: 45,
              ry: 45,
              stroke: 'black',
              fill: 'transparent'
            }
          ];
          break;
        case 'shape':
          newItem = [
            'polygon',
            {
              strokeWidth: '1',
              stroke: 'black',
              fill: "transparent",
              strokeDasharray: "0",
              points: `${x + 80},${y} ${x + 160},${y + 50} ${x + 80},${y + 100} ${x},${y + 50}`
            },
            []
          ];
          break;
        case 'image':
          newItem = [
            'foreignObject',
            {
              x,
              y,
              width: 150,
              height: 100,
              stroke: 'black',
              fill: 'transparent'
            },
            [
              [
                'div',
                {
                  display: 'block'
                },
                ['text']
              ]
            ]
          ];
          break;
        case 'text':
          newItem = [
            'text',
            {
              x,
              y
            },
            'text'
          ];
          break;
        default:
          break;

      }

      props.onDrop(
        e,
        newItem
      );
    }
  }), [props.onDrop]);

  const buttons = useMemo(() => ([
    // { type: 'button', selected: editorAction === 'showLayers', component: <LayersIcon />, action: () => 'showLayers' },
    { type: 'button', selected: editorAction === 'edit', component: <NavigationIcon strokeWidth={1} />, action: setEditorAction('edit') },
    { type: 'button', selected: editorAction === 'select', component: <PhotoSizeSelectSmallIcon strokeWidth={0.5} />, action: setEditorAction('select') },
    { type: 'button', selected: editorAction === 'grab', component: <PanToolIcon strokeWidth={1} />, action: setEditorAction('grab') },
    { type: 'button', selected: editorAction === 'zoom', component: <SearchIcon  strokeWidth={1}/>, action: setEditorAction('zoom') }
    // { type: 'button', selected: editorGrid === true, component: <GridOnIcon />, action: () => activateEditorGrid(true) },
    // { type: 'button', selected: editorGrid === false, component: <GridOffIcon />, action: () => activateEditorGrid(false) }
  ]), [editorAction, editorGrid]);

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%'
      }}
    >
      <div className={classes.flex}>
        {buttons.map(({ type, component, action, selected, value }, index) => (
          <div key={`${index}button`} className={classes.toolbar}>
            <ExtendedButton disabled={selected} onClick={() => action()}>
              {component}
            </ExtendedButton>
          </div>
        ))}
        {items.map(([text, Icon]) => (
          <div key={`${text}button`} className={classes.toolbar}>
            <ExtendedButton ref={(el) => el && subjx(el).clone(cloneConfig)} data-type={text}>
              <Icon strokeWidth={0.5} />
            </ExtendedButton>
          </div>
        ))}
      </div> 
    </Box>
  );
};

export default connect(mapStateToProps, mapDispatchToProps)(EditorToolbar);

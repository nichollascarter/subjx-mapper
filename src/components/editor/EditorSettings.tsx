import { makeStyles } from '@mui/styles';
import { connect } from 'react-redux';
import {
  FormatShapes as ShapeSettingsIcon,
  Tune as CanvasSettingsIcon
} from '@mui/icons-material';

import { ExtendedButton } from '@/components/ui/ExtendedButton';
import EventBus from 'js-event-bus';

const useStyles = makeStyles(() => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    height: '100%'
  },
  flex: {
    display: 'flex',
    alignItems: 'center',
    height: '100%'
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'column'
  }
}));

const mapStateToProps = (state: { editorAction: boolean; editorGrid: boolean; eventBus: EventBus; }) => {
  return {
    editorAction: state.editorAction,
    editorGrid: state.editorGrid,
    eventBus: state.eventBus
  };
};

const EditorSettings = (props: { eventBus: EventBus; }) => {
  const classes = useStyles();

  const {
    eventBus
  } = props;

  const options = [
    { type: 'button', selected: false, component: <ShapeSettingsIcon />, action: () => eventBus.emit('settings', null, 'item') },
    { type: 'button', selected: false, component: <CanvasSettingsIcon />, action: () => eventBus.emit('settings', null, 'canvas') }
  ];

  return (
    <div className={classes.root}>
      <div className={classes.flex}>
        {options.map(({ component, action, selected }, index) => (
          <div key={`${index}button`} className={classes.toolbar}>{
            <ExtendedButton disabled={selected} onClick={() => action()}>{component}</ExtendedButton>
          }</div>
        ))}
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(EditorSettings);
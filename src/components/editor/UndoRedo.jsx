import { connect } from 'react-redux';
import {
  Undo as UndoIcon,
  Redo as RedoIcon
} from '@mui/icons-material';

import { ExtendedButton } from '@/components/ui/ExtendedButton';
import EventBus from 'js-event-bus';

const mapStateToProps = (/** @type {{ editorAction: string; editorGrid: boolean; eventBus: EventBus; }} */ state) => {
  return {
    editorAction: state.editorAction,
    editorGrid: state.editorGrid,
    eventBus: state.eventBus
  };
};

const UndoRedo = (/** @type {{ eventBus: EventBus; }} */ props) => {
  const {
    eventBus
  } = props;

  return (
    <>
      <ExtendedButton onClick={() => eventBus.emit('undo')}>
        <UndoIcon />
      </ExtendedButton>
      <ExtendedButton onClick={() => eventBus.emit('redo')}>
        <RedoIcon />
      </ExtendedButton>
    </>
  );
};

export default connect(mapStateToProps)(UndoRedo);
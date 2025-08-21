import { connect } from 'react-redux';
import {
  Undo as UndoIcon,
  Redo as RedoIcon
} from '@mui/icons-material';

import { ExtendedButton } from '@/components/ui/ExtendedButton';

const mapStateToProps = (state) => {
  return {
    editorAction: state.editorAction,
    editorGrid: state.editorGrid,
    eventBus: state.eventBus
  };
};

const UndoRedo = (props) => {
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
import { connect } from 'react-redux';
import {
  VerticalAlignCenter as AlignCenter,
  VerticalAlignBottom as AlignIcon,
  FlipToFront as BringForwardIcon,
  FlipToBack as BringBackwardIcon,
  Filter as BringToFrontIcon,
  FilterNone as BringToBackIcon
} from '@mui/icons-material';

import { ExtendedButton } from '@/components/ui/ExtendedButton';

const mapStateToProps = (state) => {
  return {
    eventBus: state.eventBus
  };
};

const Layers = (props) => {
  const {
    eventBus
  } = props;

  return (
    <>
      <ExtendedButton onClick={() => eventBus.emit('forward')}>
        <BringForwardIcon />
      </ExtendedButton>

      <ExtendedButton onClick={() => eventBus.emit('backward')}>
        <BringBackwardIcon />
      </ExtendedButton>

      <ExtendedButton onClick={() => eventBus.emit('toFront')}>
        <BringToFrontIcon />
      </ExtendedButton>

      <ExtendedButton onClick={() => eventBus.emit('toBack')}>
        <BringToBackIcon />
      </ExtendedButton>

      <ExtendedButton onClick={() => eventBus.emit('alignLeft')}>
        <AlignIcon transform='rotate(90)' />
      </ExtendedButton>

      <ExtendedButton onClick={() => eventBus.emit('alignLeft')}>
        <AlignIcon transform='rotate(90)' />
      </ExtendedButton>

      <ExtendedButton onClick={() => eventBus.emit('alignHorizontal')}>
        <AlignCenter transform='rotate(90)' />
      </ExtendedButton>

      <ExtendedButton onClick={() => eventBus.emit('alignRight')}>
        <AlignIcon transform='rotate(-90)' />
      </ExtendedButton>

      <ExtendedButton onClick={() => eventBus.emit('alignTop')}>
        <AlignIcon transform='rotate(180)' />
      </ExtendedButton>

      <ExtendedButton onClick={() => eventBus.emit('alignVertical')}>
        <AlignCenter transform='rotate(180)' />
      </ExtendedButton>

      <ExtendedButton onClick={() => eventBus.emit('alignBottom')}>
        <AlignIcon />
      </ExtendedButton>
    </>
  );
};

export default connect(mapStateToProps)(Layers);
import { connect } from 'react-redux';
import {
  VerticalAlignCenter as AlignCenter,
  VerticalAlignBottom as AlignIcon
} from '@mui/icons-material';

import { ExtendedButton } from '@/components/ui/ExtendedButton';

const mapStateToProps = (state) => {
  return {
    eventBus: state.eventBus
  };
};

const Alignment = (props) => {
  const {
    eventBus
  } = props;

  return (
    <>
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

export default connect(mapStateToProps)(Alignment);
import { connect } from 'react-redux';
import {
  VerticalAlignCenter as AlignCenter,
  VerticalAlignBottom as AlignIcon
} from '@mui/icons-material';
import EventBus from 'js-event-bus';


import { ExtendedButton } from '@/components/ui/ExtendedButton';

const mapStateToProps = (state: { eventBus: EventBus }) => {
  return {
    eventBus: state.eventBus
  };
};

const Alignment = (props: { eventBus: EventBus }) => {
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
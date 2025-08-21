import { styled } from '@mui/styles';
import { IconButton} from '@mui/material';

export const ExtendedButton = styled(IconButton)({
  color: 'rgba(0, 0, 0, 0.65)',
  padding: 6,
  '& svg': {
    width: 20,
    height: 20
  }
});

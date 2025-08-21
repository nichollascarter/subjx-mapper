import { styled } from '@mui/styles';
import { Paper } from '@mui/material';

export const Section = styled(Paper)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  zIndex: 99999,
  padding: theme.spacing(0.5)
}));

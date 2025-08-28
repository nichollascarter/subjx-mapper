import { useEffect, useState } from 'react';
import * as ReactDOM from 'react-dom';
import { ChromePicker } from 'react-color';
import { withStyles } from '@mui/styles';

const styles = () => ({
  root: {
    width: '100%',
    padding: 0,
    border: 0,
    margin: 0,
    display: 'inline-flex',
    position: 'relative',
    flexDirection: 'column',
    verticalAlign: 'top'
  },
  wrapper: {
    color: 'rgba(0, 0, 0, 0.87)',
    cursor: 'text',
    display: 'inline-flex',
    position: 'relative',
    fontSize: '1rem',
    boxSizing: 'border-box',
    alignItems: 'center',
    lineHeight: '1.0876em'
  },
  colorPicker: {
    flex: '0 1 100%',
    height: '1.0876em',
    margin: 0,
    display: 'block',
    padding: '6px 0 7px',
    minWidth: 0,
    background: 'none',
    boxSizing: 'content-box',
    border: '2px solid #c7c7c7',
    borderRadius: 4
  }
});

const ColorPickerComponent = (
  props: {
    classes: any;
    onChange: any;
    value: any;
    initialValue: any;
  }
) => {
  const {
    classes,
    onChange,
    value,
    initialValue
  } = props;

  const [currentColor, setCurrentColor] = useState({ hex: initialValue || value || 'transparent' });
  const [displayColorPicker, setDisplayColorPicker] = useState(false);
  const [popoverStyles, setPopoverStyles] = useState({
    position: 'absolute',
    zIndex: '9999',
    top: 0,
    left: 0
  } as React.CSSProperties);

    useEffect(() => {
    if (value !== currentColor.hex) {
      setCurrentColor({  hex: value });
    }
  }, [value, currentColor.hex]);

  const handleClick = (e: any) => {
    const { clientX, clientY } = e;
    const { clientWidth, clientHeight } = e.target;
    setDisplayColorPicker(p => !p);

    setPopoverStyles((p) => ({
      ...p,
      left: clientX - clientWidth,
      top: clientY
    }
    ));
  };

  const handleClose = () => {
    setDisplayColorPicker(false);
  };

  const handleChange = (color: { hex: string }) => {
    setCurrentColor({ hex: color.hex });
    onChange(color);
  };

  return (
    <div className={classes.root}>
      <div className={classes.wrapper}>
        <div className={classes.colorPicker} onClick={handleClick} style={{ backgroundColor: currentColor.hex }} />
      </div>
      {displayColorPicker ?
        ReactDOM.createPortal(
          <div style={popoverStyles}>
            <div style={{
              position: 'fixed',
              top: '0px',
              right: '0px',
              bottom: '0px',
              left: '0px'
            }} onClick={handleClose} />
            <ChromePicker color={currentColor.hex} onChange={handleChange} />
          </div>,
          document.body
        ) : null}
    </div>
  );
};

export const ColorPicker = withStyles(styles)(ColorPickerComponent);
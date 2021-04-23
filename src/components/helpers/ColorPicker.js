import React from 'react';
import ReactDOM from 'react-dom';
import { ChromePicker } from 'react-color';
import { withStyles } from '@material-ui/core/styles';

const styles = () => ({
    root: {
        width: '50%',
        padding: 0,
        border: 0,
        margin: 0,
        display: 'inline-flex',
        padding: 0,
        position: 'relative',
        flexDirection: 'column',
        verticalAlign: 'top'
    },
    wrapper: {
        padding: 10,
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
        border: 0,
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


class ColorPicker extends React.Component {

    state = {

        displayColorPicker: false,
        currentColor: {
            hex: this.props.initValue || 'transparent'
        },
        popover: {
            position: 'absolute',
            zIndex: '9999',
            top: 0,
            left: 0
        }
    };

    handleClick = (e) => {
        const { clientX, clientY } = e;
        const { clientWidth, clientHeight } = e.target;
        this.setState({ 
            displayColorPicker: !this.state.displayColorPicker,
            popover: {
                ...this.state.popover,
                left: clientX - clientWidth,
                top: clientY
            }
        });
    };

    handleClose = () => {
        this.setState({ displayColorPicker: false });
    };

    handleChange = (color) => {
        this.setState({ currentColor: color });
        this.props.onChange(color);
    };

    render() {
        const cover = {
            position: 'fixed',
            top: '0px',
            right: '0px',
            bottom: '0px',
            left: '0px'
        };

        return (
            <div className={this.props.classes.root}>
                <div className={this.props.classes.wrapper}>
                    <div className={this.props.classes.colorPicker} onClick={this.handleClick} style={{ backgroundColor: this.state.currentColor.hex }} />
                </div>
                {this.state.displayColorPicker ?
                    ReactDOM.createPortal(
                        <div style={this.state.popover}>
                            <div style={cover} onClick={this.handleClose} />
                            <ChromePicker color={this.state.currentColor} onChange={this.handleChange} />
                        </div>,
                        document.body
                    ) : null}
            </div>
        );
    }

};

export default withStyles(styles)(ColorPicker);
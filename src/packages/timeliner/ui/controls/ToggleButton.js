class ToggleButton {

    dom = document.createElement('div');
    pressed = false;

    constructor(text, pressed) {
        const { dom: button } = this;

        button.textContent = text;

        button.classList.add('button');

        if (pressed) button.classList.add('pressed');

        button.onclick = () => {
            this.pressed = !this.pressed;

            if (button.classList.contains('pressed')) {
                button.classList.remove('pressed');
            } else {
                button.classList.add('pressed');
            }

            if (this.onClick) this.onClick(this);
        };

        this.pressed = pressed;
    }

}

export { ToggleButton };

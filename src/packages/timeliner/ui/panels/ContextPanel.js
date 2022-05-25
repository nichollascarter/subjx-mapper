import { IconButton } from '../controls';

class ContextPanel {

    dom = document.createElement('div');
    name = document.createElement('input');
    variableName = document.createElement('input');
    valueInput = document.createElement('input');

    constructor(state, dispatcher) {
        const {
            dom,
            name,
            variableName,
            valueInput
        } = this;

        this.state = state;
        this.dispatcher = dispatcher;

        const { value: variableType } = state.get('context:type');

        name.disabled = true;
        variableName.disabled = true;

        name.style.margin = '5px';
        variableName.style.margin = '5px';
        valueInput.style.margin = '5px';

        dom.classList.add('tml-timeline-controls');

        const addContextStateButton = new IconButton(12, 'plus', 'New State', dispatcher);
        const removeContextStateButton = new IconButton(12, 'minus', 'Remove State', dispatcher);

        this.addContextStateButton = addContextStateButton;
        this.removeContextStateButton = removeContextStateButton;

        addContextStateButton.onClick(() =>  this.addContextState());
        removeContextStateButton.onClick(() => this.removeContextState());

        const childNodes = [
            name,
            variableName,
            valueInput,
            addContextStateButton.dom,
            removeContextStateButton.dom
        ];

        addContextStateButton.dom.classList.add('tml-hide');
        removeContextStateButton.dom.classList.add('tml-hide');

        childNodes.map(childNode => dom.appendChild(childNode));

        this.repaint();
    }

    addContextState() {
        const { value: currentTime } = this.state.get('ui:currentTime');

        const { value: states } = this.state.get('context:states');
        const { value: currentValue } = this.valueInput;

        if (states.includes(currentValue)) return;

        const currentStatePosition = Math.trunc(currentTime);
        states.splice(currentStatePosition + 1, 0, currentValue);
        this.dispatcher.fire('action:state');
    }

    removeContextState() {
        const { value: currentTime } = this.state.get('ui:currentTime');
        const { value: states } = this.state.get('context:states');

        const currentState = Math.trunc(currentTime);

        const [removedState] = states.splice(currentState, 1);
        this.dispatcher.fire('action:clearKeyframes', removedState);
        this.dispatcher.fire('action:state');
    }

    setState(state) {
        this.state = state;

        const { value: variableType } = state.get('context:type');

        if (variableType === 'boolean') {
            this.addContextStateButton.dom.classList.add('tml-hide');
            this.removeContextStateButton.dom.classList.add('tml-hide');
        } else {
            this.addContextStateButton.dom.classList.remove('tml-hide');
            this.removeContextStateButton.dom.classList.remove('tml-hide');
        }
    }

    repaint() {
        const { value: contextSettings = {} } = this.state.get('context');
        const { value: currentTime } = this.state.get('ui:currentTime');

        const currentState = Math.trunc(currentTime);

        this.name.value = contextSettings.name || '';
        this.variableName.value = contextSettings.variable || '';
        this.valueInput.value = (contextSettings.states || [])[currentState] || '';
    }

}

export { ContextPanel };

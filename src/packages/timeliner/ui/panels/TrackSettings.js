import { Theme } from '../theme';
import { NumberUI, ToggleButton, IconButton } from '../controls';
import easing from '../../core/easing';
import { timeInTrack, keyframeAtState } from '../../core';
import { LAYOUT_CONSTANTS } from '../../consts';
import { setStyles } from '../../utils/common';

const { LINE_HEIGHT } = LAYOUT_CONSTANTS;

class TrackSettings {

    dom = document.createElement('div');
    settings = document.createElement('div');
    label = document.createElement('span');
    dropdown = document.createElement('select');
    keyframeButton = document.createElement('button');

    entryValue;
    duration;
    state;
    track;

    constructor(track, state, dispatcher, states) {
        const {
            dom,
            settings: settingsDom,
            label,
            dropdown,
            keyframeButton
        } = this;

        this.dispatcher = dispatcher;
        this.track = track;
        this.states = states;

        const entryValue = new NumberUI();
        const duration = new NumberUI({ precision: 0, step: 50 });

        this.entryValue = entryValue;
        this.duration = duration;

        for (const k in easing) {
            const option = document.createElement('option');
            option.value = k;
            option.text = option.label = (k.charAt(0).toUpperCase() + k.slice(1)).replace(/([A-Z])/g, ' $1').trim();
            dropdown.appendChild(option);
        }

        dropdown.addEventListener('change', () => dispatcher.fire('ease', this.track, dropdown.value));

        const height = LINE_HEIGHT - 1;

        keyframeButton.classList.add('tml-panel-track-keyframe');
        keyframeButton.innerHTML = '&#9672;'; // '&diams;' &#9671; 9679 9670 9672
        keyframeButton.style.height = height + 'px';

        keyframeButton.addEventListener('click', (e) => {
            dispatcher.fire('timeline:keyframe', this.track, this.state.get('_value').value);
        });

        const trackControls = [
            {
                control: new ToggleButton('S', this.track._solo),
                onClick: ctrl => dispatcher.fire('action:solo', this.track, ctrl.pressed)
            },
            {
                control: new ToggleButton('M', this.track._mute),
                onClick: ctrl => dispatcher.fire('action:mute', this.track, ctrl.pressed)
            }
        ];

        trackControls.map(({ control, onClick }) => {
            control.onClick = onClick;
            dom.appendChild(control.dom);
        });

        entryValue.onChange.do((value, done) => {
            this.state.get('_value').value = value;
            dispatcher.fire('value.change', this.track, value, done);
        });

        duration.onChange.do((value, done) => {
            this.state.get('_duration').value = value;
            dispatcher.fire('duration.change', this.track, value, done);
        });

        label.style.cssText = 'font-size: 12px; padding: 4px; color: black';

        dropdown.classList.add('tml-panel-track-view-dropdown');

        setStyles(dom, {
            display: 'flex',
            'align-items': 'center',
            textAlign: 'left',
            margin: '1px 0 0',
            borderBottom: '1px solid ' + Theme.border,
            top: 0,
            left: 0,
            height: (LINE_HEIGHT - 1) + 'px',
            color: Theme.font
        });

        dom.appendChild(label);
        dom.appendChild(dropdown);
        dom.appendChild(duration.dom);
        dom.appendChild(entryValue.dom);
        dom.appendChild(keyframeButton);

        const trackSettings = [{
            control: new IconButton(12, 'trash', 'Delete save', dispatcher),
            onClick: (ctrl) => {
                const removeIndex = state.value.indexOf(this.track);
                state.value.splice(removeIndex, 1);
                dispatcher.fire('action:state', this.track, ctrl.pressed);
            }
        }];

        trackSettings.map(({ control, onClick }) => {
            control.onClick(onClick);
            settingsDom.appendChild(control.dom);
        });

        setStyles(settingsDom, {
            display: 'flex',
            textAlign: 'left',
            borderBottom: '1px solid ' + Theme.border,
            top: 0,
            left: 0,
            height: LINE_HEIGHT + 'px',
            color: Theme.font
        });
    }

    setState(track, state) {
        this.track = track;
        this.state = state;

        const tmpValue = state.get('_value');
        const { value: duration = 0 } = state.get('_duration');
        if (tmpValue.value === undefined) {
            tmpValue.value = 0;
        }

        this.entryValue.setValue(tmpValue.value);
        this.duration.setValue(duration);
        this.label.textContent = state.get('name').value;
    }

    repaint(time, timelineType) {
        const {
            dropdown,
            state,
            keyframeButton,
            track,
            entryValue,
            duration
        } = this;

        dropdown.style.opacity = 0;
        dropdown.disabled = true;

        keyframeButton.style.color = Theme.b;

        const o = timelineType === 'timeline'
            ? timeInTrack(track, time)
            : keyframeAtState(track, time, this.states);

        if (!o) return;

        const { doEasing, easing, keyframe, entry = {}, value } = o;

        if (doEasing) {
            dropdown.style.opacity = 1;
            dropdown.disabled = false;
            dropdown.value = easing ? easing : 'none';

            duration.dom.disabled = false;
            duration.dom.style.opacity = 1;

            if (dropdown.value === 'none') {
                dropdown.style.opacity = 0.5;
                duration.dom.disabled = true;
                duration.dom.style.opacity = 0.5;
            }
        }

        if (keyframe) {
            keyframeButton.style.color = Theme.cursor;
            keyframeButton.disabled = true;
            //duration.dom.style.opacity = 1;
        }

        state.get('_value').value = value;
        state.get('_duration').value = entry.duration || 0;
        entryValue.setValue(value);
        duration.setValue(entry.duration || 0);

        duration.paint();
        entryValue.paint();
    }

}

export { TrackSettings };

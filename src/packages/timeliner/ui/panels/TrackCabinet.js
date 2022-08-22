
import { TrackSettings } from './TrackSettings';
import { IconButton } from '../controls';
import { setStyles } from '../../utils/common';
import { LAYOUT_CONSTANTS } from '../../consts';
import { Theme } from '../theme';


class TrackCabinet {

    dom = document.createElement('div');
    tracksContext = document.createElement('div');
    trackControls = document.createElement('div');
    titleDom = document.createElement('span');

    tracks;
    trackUis = [];
    unusedTracks = [];
    visibleTracks = 0;

    constructor(data, context, dispatcher) {
        const {
            trackControls,
            tracksContext,
            titleDom,
            transformDropdown
        } = this;

        this.data = data;
        this.dispatcher = dispatcher;
        this.state = context;
        this.name = context.get('name');
        this.tracks = context.get('tracks');
        this.currentTimeStore = data.get('ui:currentTime');
        this.timelineType = data.get('type').value;

        setStyles(trackControls, {
            //width: '50px',
            'margin-top': '32px'
        });

        setStyles(tracksContext, {
            display: 'flex',
            'align-items': 'center',
            textAlign: 'left',
            margin: '1px 0 0',
            borderBottom: '1px solid ' + Theme.border,
            top: 0,
            left: 0,
            height: (LAYOUT_CONSTANTS.LINE_HEIGHT - 1) + 'px',
            color: Theme.font
        });

        const plus = new IconButton(12, 'plus', 'New Track', dispatcher);
        plus.dom.classList.add('tml-button');

        this.addPropertyButton = plus;
 
        titleDom.textContent = this.name.value;

        setStyles(titleDom, {
            textAlign: 'center',
            flex: '1 1 80%'
        });

        tracksContext.appendChild(titleDom);
        tracksContext.appendChild(plus.dom);

        this.setState(context);
        this.repaint();
    }

    repaint() {
        const {
            trackUis,
            tracks,
            tracks: { value: tracksValues },
            currentTimeStore: { value: storedValue }
        } = this;

        const { value: states } = this.data.get('context:states');

        for (let i = trackUis.length; i-- > 0;) {
            // quick hack
            if (i >= tracksValues.length) {
                trackUis[i].dom.style.display = 'none';
                trackUis[i].settings.style.display = 'none';
                this.unusedTracks.push(trackUis.pop());
                continue;
            }

            trackUis[i].setState(tracksValues[i], tracks.get(i), states);
            trackUis[i].repaint(storedValue, this.timelineType);
        }

        this.visibleTracks = trackUis.length;
    }

    setState(state) {
        const {
            dom,
            trackUis,
            unusedTracks,
            trackControls,
            data
        } = this;

        this.state = state;

        const { value: tracks } = state.get('tracks');
        const { value: states } = data.get('context:states');
    
        this.tracks = state.get('tracks');

        for (let i = 0; i < tracks.length; i++) {
            const layer = tracks[i];

            let layerUi;

            if (unusedTracks.length) {
                layerUi = unusedTracks.pop();
                layerUi.dom.style.display = 'flex';
                layerUi.settings.style.display = 'flex';
            } else {
                layerUi = new TrackSettings(layer, this.tracks, this.dispatcher, states);
                dom.appendChild(layerUi.dom);
                trackControls.appendChild(layerUi.settings);
            }

            trackUis.push(layerUi);
        }
    }

}

export { TrackCabinet };

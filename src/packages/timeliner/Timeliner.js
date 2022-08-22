import {
    Timeline,
    timeInTrack,
    findTimeInTrack,
    findStateInTrack,
    keyframeAtState
} from './core';
import { UndoStack, UndoState, Dispatcher } from './classes';

import {
    TrackCabinet,
    TimelineControls,
    TimelineCanvas,
    SelectorCanvas,
    ContextPanel,
    TransformMenu
} from './ui/panels';

import { TimelinerUI } from './ui/controls';
import {
    setStyles,
    saveToFile,
    openAs,
    STORAGE_PREFIX,
    randomHexColor
} from './utils/common';

import { LAYOUT_CONSTANTS as Settings } from './consts';

const { STATE_MARKER_OFFSET } = Settings;

class Timeliner extends Timeline {

    needsResize = true;
    dispatcher = new Dispatcher();
    undoStack = new UndoStack(this.dispatcher);
    contextPanel = new ContextPanel(this.data, this.dispatcher);
    timelinePanel = new TimelineControls(this.data, this.dispatcher);

    TimelinerUI = new TimelinerUI(this.dispatcher);

    constructor(options, cb) {
        super(options, cb);

        const {
            data,
            dispatcher,
            undoStack,
            timelinePanel,
            contextPanel,
            TimelinerUI: timelinerUI
        } = this;

        const { value: timelineType = 'selector' } = data.get('type');

        const timeline = timelineType === 'selector'
            ? new SelectorCanvas(this.data, this.dispatcher)
            : new TimelineCanvas(this.data, this.dispatcher);

        this.timeline = timeline;

        this.transformMenu = new TransformMenu(data, dispatcher, undoStack);

        setTimeout(() => undoStack.save(new UndoState(data, 'Loaded'), true));

        dispatcher.on('timeline:keyframe', (track, value) => {
            const { value: currentTime } = this.data.get('ui:currentTime');
            const time = findTimeInTrack(track, currentTime);

            if (typeof time === 'number') {
                if (!track) return;

                track.values.splice(time, 0, {
                    time: currentTime,
                    value,
                    _color: randomHexColor()
                });
                undoStack.save(new UndoState(this.data, 'Add Keyframe'));
            } else {
                track.values.splice(time.index, 1);
                undoStack.save(new UndoState(this.data, 'Remove Keyframe'));
            }

            this.repaintAll();
        });

        dispatcher.on('selector:keyframe', (track, value, currentState) => {
            const keyframe = findStateInTrack(track, currentState);

            const { values = [] } = track;

            if (!keyframe) {
                if (!track) return;

                track.values.splice(keyframe, 0, {
                    value,
                    _color: randomHexColor(),
                    state: currentState
                });
                undoStack.save(new UndoState(this.data, 'Add Keyframe'));
            } else {
                const index = values.findIndex(element => element.state === keyframe.state && element.value === keyframe.value);
                track.values.splice(index, 1);
                undoStack.save(new UndoState(this.data, 'Remove Keyframe'));
            }

            this.repaintAll();
        });

        dispatcher.on('keyframe.move', () => undoStack.save(new UndoState(data, 'Move Keyframe')));

        dispatcher.on('value.change', (track, value, dontSave) => {
            if (track._mute) return;

            const { value: currentTime } = data.get('ui:currentTime');
            const time = findTimeInTrack(track, currentTime);

            if (typeof time === 'number') {
                track.values.splice(value, 0, {
                    time: currentTime,
                    value,
                    _color: randomHexColor()
                });
                if (!dontSave)
                    undoStack.save(new UndoState(data, 'Add value'));
            } else {
                time.object.value = value;
                if (!dontSave)
                    undoStack.save(new UndoState(data, 'Update value'));
            }

            this.repaintAll();
        });

        dispatcher.on('duration.change', (track, value, dontSave) => {
            const { value: currentTime } = data.get('ui:currentTime');
            const currentState = Math.trunc(currentTime);

            const { value: states } = data.get('context:states');

            const keyframe = findStateInTrack(track, states[currentState]);

            if (keyframe) {
                keyframe.duration = value;
                this.repaintAll();
            }
        });

        dispatcher.on('action:solo', (track, solo) => track._solo = solo);
        dispatcher.on('action:mute', (track, mute) => track._mute = mute);
        dispatcher.on('action:state', () => this.updateState());
        dispatcher.on('action:clearKeyframes', (currentState) => {
            this.data.get('tracks').value
                .reduce((res, { tracks: items }) => ([...res, ...items]), [])
                .map(track => {
                    const index = track.values.findIndex(({ state }) => state === currentState);

                    if (index < 0) return;
                    track.values.splice(index, 1);
                });

            undoStack.save(new UndoState(this.data, 'Remove Keyframe'));
            this.repaintAll();
        });

        dispatcher.on('ease', (track, easing) => {
            const { value: currentTime } = data.get('ui:currentTime');

            const time = data.get('type').value === 'timeline'
                ? timeInTrack(track, currentTime)
                : keyframeAtState(track, currentTime, data.get('context:states').value);

            if (time && time.entry) {
                time.entry.easing = easing;
            }

            undoStack.save(new UndoState(data, 'Add Ease'));
            this.repaintAll();
        });

        dispatcher.on('controls.toggle_play', () => (
            this.startPlay ? this.pausePlaying() : this.startPlaying()
        ));

        dispatcher.on('controls.restartPlay', () => {
            if (!this.startPlay) {
                this.startPlaying();
            }

            this.setCurrentTime(this.playedFrom);
        });

        dispatcher.on('controls.play', this.startPlaying);
        dispatcher.on('controls.pause', this.pausePlaying);
        dispatcher.on('controls.stop', () => this.stopPlaying());
        dispatcher.on('time.update', time => this.setCurrentTime(Math.max(0, time)));

        /* update scroll viewport */
        dispatcher.on('update.scrollTime', (value) => {
            value = Math.max(0, value);
            data.get('ui:scrollTime').value = value;
            this.repaintAll();
        });

        dispatcher.on('update.scale', (value) => {
            data.get('ui:timeScale').value = value;

            timeline.repaint();
        });

        dispatcher.on('controls.undo', () => {
            const history = undoStack.undo();
            data.setJSONString(history.state);

            this.updateState();
        });

        dispatcher.on('controls.redo', () => {
            const history = undoStack.redo();
            data.setJSONString(history.state);

            this.updateState();
        });

        dispatcher.on('import', () => this.promptImport());

        dispatcher.on('new', () => {
            data.blank();
            this.updateState();
        });

        dispatcher.on('openfile', () => {
            openAs((data) => {
                // console.log('loaded ' + data);
                this.loadJSONString(data);
            }, document.createElement('div'));
        });

        dispatcher.on('open', this.open);
        dispatcher.on('export', () => this.exportJSON());

        dispatcher.on('save', () => this.saveSimply());
        dispatcher.on('save_as', () => this.saveAs());

        dispatcher.on('state:save', (description) => {
            dispatcher.fire('status', description);
            this.save('autosave');
        });

        timelinerUI.widget.resizes.do((...args) => this.resize(...args));

        timelinerUI.toolBar.appendChild(contextPanel.dom);
        timelinerUI.toolBar.appendChild(timelinePanel.dom);

        timelinerUI.canvasContainer.appendChild(timeline.dom);

        this.trackPanel = data.get('tracks').value.map(({ tracks }) => {
            const trackCabinet = new TrackCabinet(data, tracks, this.dispatcher, this.undoStack);

            trackCabinet.addPropertyButton.onClick((e) => this.addTrack(e, tracks));

            timelinerUI.trackScroll.appendChild(trackCabinet.dom);
            timelinerUI.trackSettings.appendChild(trackCabinet.trackControls);
            return trackCabinet;
        });

        timelinerUI.scrollbar.onScroll.do((type, scrollTo) => {
            switch (type) {

                case 'scrollto':
                    //timelinePanel.scrollTo(scrollTo);
                    timeline.scrollTo(scrollTo);
                    break;
                case 'pageup':
                    // scrollTop -= pageOffset;
                    // me.draw();
                    // me.updateScrollbar();
                    break;
                case 'pagedown':
                    // scrollTop += pageOffset;
                    // me.draw();
                    // me.updateScrollbar();
                    break;

            }
        });

        if (timelinerUI.root.createShadowRoot)
            timelinerUI.root = timelinerUI.root.createShadowRoot();

        this.paint();
    }

    startPlaying() {
        this.startPlay = performance.now() - this.data.get('ui:currentTime').value * 1000;
        this.timelinePanel.setControlStatus(true);
    }

    pausePlaying() {
        super.pause();
        this.timelinePanel.setControlStatus(false);
        // dispatcher.fire('controls.status', false);
    }

    stopPlaying() {
        if (this.startPlay !== null)
            this.pausePlaying();

        const { value: timelineType = 'selector' } = this.data.get('type');
        const { value: states = [] } = this.data.get('context:states');

        this.setCurrentTime(timelineType === 'selector' && states.length ? STATE_MARKER_OFFSET : 0);
    }

    updateCurrentTime() {
        const time = super.updateCurrentTime();

        if (time > this.data.get('ui:totalTime').value) {
            this.startPlay = performance.now();
        }

        this.repaintAll(time);
    }

    setCurrentTime(value = 0) {
        this.data.get('ui:currentTime').value = value;
        const values = super.setCurrentTime(value);

        this.repaintAll(values);
    }

    repaintAll(values) {
        const height = this.tracks.length * Settings.LINE_HEIGHT;
        this.TimelinerUI.scrollbar.setLength(Settings.TIMELINE_SCROLL_HEIGHT / height);

        this.timelinePanel.repaint(values);
        this.trackPanel.map(panel => panel.repaint(values));
        this.timeline.repaint();
        this.contextPanel.repaint();
    }

    paint() {
        const self = this;

        function animate() {
            self.frameId = requestAnimationFrame(animate);

            if (self.startPlay) {
                self.updateCurrentTime();
            }

            if (self.needsResize) {
                self.timeline.resize(Settings.width, Settings.height);
                self.repaintAll();
                self.needsResize = false;

                self.dispatcher.fire('resize');
            }

            self.timeline._paint();
        }

        animate();
    }

    resize(width, height) {
        width -= 4;
        height -= 44;

        Settings.width = width - Settings.LEFT_PANE_WIDTH;
        Settings.height = height;

        Settings.TIMELINE_SCROLL_HEIGHT = height - Settings.MARKER_TRACK_HEIGHT;
        const scrollableHeight = Settings.TIMELINE_SCROLL_HEIGHT;

        this.TimelinerUI.scrollbar.setHeight(scrollableHeight - 2);

        setStyles(this.TimelinerUI.scrollbar.dom, { top: 0, left: (width - 16) + 'px' });

        this.needsResize = true;
    }

    updateState() {
        super.updateState();
        this.timeline.setState(this.data);
        this.contextPanel.setState(this.data);

        [...this.TimelinerUI.trackScroll.childNodes].map((child) => this.TimelinerUI.trackScroll.removeChild(child));
        [...this.TimelinerUI.trackSettings.childNodes].map((child) => this.TimelinerUI.trackSettings.removeChild(child));

        this.trackPanel = this.data.get('tracks').value.map((context, i) => {
            const tracks = this.data.get('tracks').get(i);
            const trackCabinet = new TrackCabinet(this.data, tracks, this.dispatcher, this.undoStack);
            trackCabinet.addPropertyButton.onClick((e) => this.addTrack(e, tracks));

            this.TimelinerUI.trackScroll.appendChild(trackCabinet.tracksContext);
            this.TimelinerUI.trackScroll.appendChild(trackCabinet.dom);

            trackCabinet.trackControls.style['margin-top'] = '32px';
            this.TimelinerUI.trackSettings.appendChild(trackCabinet.trackControls);

            return trackCabinet;
        });

        this.repaintAll();
    }

    addTrack(e, tracks) {
        const { transformMenu } = this;
        transformMenu.setState(tracks);

        const contextMenu = transformMenu.dom;
        contextMenu.classList.toggle('tml-hide');
        contextMenu.style.left = e.clientX + 'px';
        contextMenu.style.top = e.clientY + 'px';
    }

    load(payload) {
        super.load(payload);

        if (this.data.getValue('ui') === undefined) {
            this.data.setValue('ui', {
                currentTime: 0,
                totalTime: Settings.default_length,
                scrollTime: 0,
                timeScale: Settings.time_scale
            });
        }

        this.undoStack.clear();
        this.undoStack.save(new UndoState(this.data, 'Loaded'), true);

        this.updateState();
        this.setCurrentTime(0);
    }

    save(name) {
        if (!name)
            name = 'autosave';

        const json = this.data.getJSONString();

        try {
            localStorage[STORAGE_PREFIX + name] = json;
            this.dispatcher.fire('save:done');
        } catch (e) {
            // eslint-disable-next-line no-console
            console.log('Cannot save', e, name, json);
        }
    }

    saveAs(name) {
        if (!name)
            name = this.data.get('name').value;

        name = prompt('Pick a name to save to (localStorage)', name);

        if (name) {
            this.data.name = name;
            this.save(name);
        }
    }

    saveSimply() {
        const { value: name } = this.data.get('name');

        if (name) {
            this.save(name);
        } else {
            this.saveAs(name);
        }
    }

    exportJSON() {
        let json = this.data.getJSONString();
        let ret = prompt('Hit OK to download otherwise Copy and Paste JSON', json);

        console.log(JSON.stringify(this.data.data, null, '\t'));
        if (!ret)
            return;

        // make json downloadable
        json = this.data.getJSONString('\t');
        const fileName = 'timeliner-test' + '.json';

        saveToFile(json, fileName);
    }

    loadJSONString(jsonStr) {
        try {
            const jsonData = JSON.parse(jsonStr);
            this.load(jsonData);
        } catch (err) {
            console.log(err);
        }
    }

    promptImport() {
        const jsonStr = prompt('Paste JSON in here to Load');
        if (!jsonStr) return;

        // eslint-disable-next-line no-console
        console.log('Loading...', jsonStr);
        this.loadJSONString(jsonStr);
    }

    open(title = '') {
        if (title) {
            this.loadJSONString(localStorage.getItem(STORAGE_PREFIX + title));
        }
    }

    destroy() { }

}

window.Timeliner = Timeliner;

export default Timeliner;

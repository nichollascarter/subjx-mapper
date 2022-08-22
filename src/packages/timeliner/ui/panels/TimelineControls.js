
import { IconButton, NumberUI } from '../controls';
import { STORAGE_PREFIX, setStyles } from '../../utils/common';
import { Theme } from '../theme';

class TimelineControls {

    dom = document.createElement('div');
    range = document.createElement('input');

    currentTime = new NumberUI();
    totalTime = new NumberUI();
    playing = false;

    constructor(data, dispatcher) {
        const {
            dom,
            currentTime,
            totalTime
        } = this;

        this.trackStore = data.get('tracks');
        this.dispatcher = dispatcher;

        const currentTimeStore = data.get('ui:currentTime');
        const totalTimeStore = data.get('ui:totalTime');

        currentTime.onChange.do((value, done) => dispatcher.fire('time.update', value));
        totalTime.onChange.do((value, done) => {
            totalTimeStore.value = value;
            this.repaint();
        });

        this.currentTimeStore = currentTimeStore;
        this.totalTimeStore = totalTimeStore;

        dom.classList.add('tml-timeline-controls');

        const {
            playButton,
            stopButton,
            undoButton,
            redoButton,
            saveButton,
            saveAsButton,
            downloadButton,
            uploadButton
        } = this.setupControls(dispatcher);

        this.setupRange(dispatcher);

        function populateOpen() {
            while (dropdown.length) {
                dropdown.remove(0);
            }

            let option = document.createElement('option');
            option.text = 'New';
            option.value = '*new*';
            dropdown.add(option);

            option = document.createElement('option');
            option.text = 'Import JSON';
            option.value = '*import*';
            dropdown.add(option);

            // Doesn't work
            // option = document.createElement('option');
            // option.text = 'Select File';
            // option.value = '*select*';
            // dropdown.add(option);
            option = document.createElement('option');
            option.text = '==Open==';
            option.disabled = true;
            option.selected = true;
            dropdown.add(option);

            let regex = new RegExp(STORAGE_PREFIX + '(.*)');
            for (let key in localStorage) {
                // console.log(key);
                let match = regex.exec(key);
                if (match) {
                    option = document.createElement('option');
                    option.text = match[1];

                    dropdown.add(option);
                }
            }
        }

        // listen on other tabs
        window.addEventListener('storage', function (e) {
            let regex = new RegExp(STORAGE_PREFIX + '(.*)');
            if (regex.exec(e.key)) {
                populateOpen();
            }
        });

        dispatcher.on('save:done', populateOpen);

        const dropdown = document.createElement('select');
        dropdown.classList.add('tml-panel-open-dropdown');

        dropdown.addEventListener('change', (e) => {
            // console.log('changed', dropdown.length, dropdown.value);
            switch (dropdown.value) {

                case '*new*':
                    dispatcher.fire('new');
                    break;
                case '*import*':
                    dispatcher.fire('import');
                    break;
                case '*select*':
                    dispatcher.fire('openfile');
                    break;
                default:
                    dispatcher.fire('open', dropdown.value);
                    break;

            }
        });

        populateOpen();

        const stub = document.createElement('span');
        stub.style.width = '20px';
        stub.style.display = 'inline-block';

        const playControlsContainer = document.createElement('div');
        playControlsContainer.classList.add('tml-panel-operation-panel');

        const playControls = [
            playButton.dom,
            stopButton.dom,
            currentTime.dom,
            document.createTextNode('/'),
            totalTime.dom,
            this.range,
            undoButton.dom,
            redoButton.dom
        ];

        playControls.map(ctrl => playControlsContainer.appendChild(ctrl));

        const operationsPanel = document.createElement('div');
        operationsPanel.classList.add('tml-panel-operation-panel');

        const operations = [
            saveButton.dom,
            saveAsButton.dom,
            downloadButton.dom,
            uploadButton.dom,
            stub
        ];

        operations.map(el => operationsPanel.appendChild(el));

        dom.appendChild(operationsPanel);
        dom.appendChild(playControlsContainer);

        this.repaint();
    }

    repaint() {
        const {
            currentTimeStore: { value: storedValue },
            totalTimeStore: { value: totalTime }
        } = this;

        this.currentTime.setValue(storedValue);
        this.totalTime.setValue(totalTime);

        this.currentTime.paint();
        this.totalTime.paint();
    }

    setupControls(dispatcher) {
        this.controls = {};

        const controls = {
            playButton: {
                size: 16,
                icon: 'play',
                tooltip: 'play',
                className: 'tml-panel-control-button',
                onClick: (e) => {
                    e.preventDefault();
                    dispatcher.fire('controls.toggle_play');
                }
            },
            stopButton: {
                size: 16,
                icon: 'stop',
                tooltip: 'stop',
                className: 'tml-panel-control-button',
                onClick: () => dispatcher.fire('controls.stop')
            },
            undoButton: {
                size: 16,
                icon: 'undo',
                tooltip: 'undo',
                className: 'tml-panel-operation-button',
                onClick: () => dispatcher.fire('controls.undo')
            },
            redoButton: {
                size: 16,
                icon: 'repeat',
                tooltip: 'redo',
                className: 'tml-panel-operation-button',
                onClick: () => dispatcher.fire('controls.redo')
            },
            saveButton: {
                size: 16,
                icon: 'save',
                tooltip: 'Save',
                className: 'tml-panel-operation-button',
                onClick: () => dispatcher.fire('save')
            },
            saveAsButton: {
                size: 16,
                icon: 'paste',
                tooltip: 'Save as',
                className: 'tml-panel-operation-button',
                onClick: () => dispatcher.fire('saveAsButton')
            },
            downloadButton: {
                size: 16,
                icon: 'download_alt',
                tooltip: 'Download / Export JSON to file',
                className: 'tml-panel-operation-button',
                onClick: () => dispatcher.fire('export')
            },
            uploadButton: {
                size: 16,
                icon: 'upload_alt',
                tooltip: 'Load from file',
                className: 'tml-panel-operation-button',
                onClick: () => dispatcher.fire('openfile')
            }
        };

        Object.keys(controls).map((fieldName) => {
            const {
                size,
                icon,
                tooltip,
                className,
                onClick
            } = controls[fieldName];

            const control = new IconButton(size, icon, tooltip, dispatcher);

            control.dom.classList.add(className);
            if (onClick) control.onClick(onClick);

            this.controls[fieldName] = control;
        });

        return this.controls;
    }

    setControlStatus(value) {
        const { controls: { playButton } = {} } = this;

        this.playing = value;

        playButton.setIcon(value ? 'pause' : 'play');
        playButton.setTip(value ? 'Pause' : 'Play');
    }

    setupRange(dispatcher) {
        const { range } = this;

        range.classList.add('tml-range');

        range.type = 'range';
        range.value = 0;
        range.min = -1;
        range.max = +1;
        range.step = 0.125;

        setStyles(range, {
            backgroundColor: Theme.cursor
        });

        let draggingRange = 0;

        const changeRange = () => dispatcher.fire('update.scale', 120 * Math.pow(4, -range.value));

        range.addEventListener('mousedown', () => draggingRange = 1);

        range.addEventListener('mouseup', () => {
            draggingRange = 0;
            changeRange();
        });

        range.addEventListener('mousemove', () => {
            if (!draggingRange)
                return;
            changeRange();
        });
    }

}

export { TimelineControls };

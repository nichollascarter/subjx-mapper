import { IconButton } from './IconButton';
import { ScrollBar } from './Scrollbar';
import { DockingWindow } from './DockingWindow';
import { setStyles } from '../../utils/common';
import { Theme } from '../theme';
import { LAYOUT_CONSTANTS } from '../../consts';
import '../../index.css';

const Z_INDEX = 1100;

const {
    LEFT_PANE_WIDTH,
    MARKER_TRACK_HEIGHT,
    height: HEIGHT
} = LAYOUT_CONSTANTS;

class TimelinerUI {

    root = document.createElement('timeliner');
    scrollbarContainer = document.createElement('div');
    panel = document.createElement('div');
    title = document.createElement('div');
    topRightBar = document.createElement('div');
    ghostpanel = document.createElement('div');
    toolBar = document.createElement('div');
    trackScroll = document.createElement('div');
    trackSettings = document.createElement('div');
    canvasContainer = document.createElement('div');
    scrollbar = new ScrollBar(200, 10);

    constructor(dispatcher) {
        const {
            root,
            scrollbar,
            scrollbarContainer,
            panel,
            title,
            ghostpanel,
            topRightBar,
            toolBar,
            trackScroll,
            trackSettings,
            canvasContainer
        } = this;

        setStyles(trackScroll, {
            position: 'relative',
            display: 'block',
            width: LEFT_PANE_WIDTH + 'px',
            top: '25px', // LAYOUT_CONSTANTS.MARKER_TRACK_HEIGHT + 'px',
            height: (HEIGHT - MARKER_TRACK_HEIGHT) + 'px'
        });

        setStyles(trackSettings, {
            position: 'relative',
            height: (LAYOUT_CONSTANTS.height - LAYOUT_CONSTANTS.MARKER_TRACK_HEIGHT) + 'px',
            width: 50,
            top: '25px' // LAYOUT_CONSTANTS.MARKER_TRACK_HEIGHT + 'px',
        });

        toolBar.classList.add('tml-toolbar');

        setStyles(panel, {
            border: '1px solid ' + Theme.border,
            backgroundColor: Theme.a,
            color: Theme.font,
            zIndex: Z_INDEX
        });

        panel.classList.add('tml-panel');
        scrollbarContainer.classList.add('tml-scrollbar-container');

        setStyles(title, {
            borderBottom: '1px solid ' + Theme.border,
            textAlign: 'center',
            backgroundColor: Theme.c
        });

        title.classList.add('tml-header');

        topRightBar.classList.add('tml-header');
        setStyles(topRightBar, {
            textAlign: 'right'
        });

        title.appendChild(topRightBar);

        const resizeFull = new IconButton(10, 'resize_full', 'maximize', dispatcher);
        setStyles(resizeFull.dom, { marginRight: '2px' });
        topRightBar.appendChild(resizeFull.dom);
        resizeFull.dom.classList.add('tml-button');

        panel.appendChild(title);
        panel.appendChild(toolBar);
        panel.appendChild(scrollbarContainer);

        ghostpanel.classList.add('tml-ghost-panel');

        root.appendChild(panel);
        root.appendChild(ghostpanel);

        scrollbarContainer.appendChild(scrollbar.dom);
        scrollbarContainer.appendChild(trackScroll);
        scrollbarContainer.appendChild(canvasContainer);
        scrollbarContainer.appendChild(trackSettings);

        const widget = new DockingWindow(panel, ghostpanel);
        widget.allowMove(false);

        resizeFull.onClick(() => widget.maximize());

        title.addEventListener('mouseover', () => widget.allowMove(true));
        title.addEventListener('mouseout', () => widget.allowMove(false));

        this.widget = widget;
    }

}

export default TimelinerUI;
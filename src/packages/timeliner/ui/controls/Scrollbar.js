import { Do } from '../../classes/Do';
import { setStyles } from '../../utils/common';
import { LAYOUT_CONSTANTS } from '../../consts';

const scrolltrackStyle = {
    position: 'absolute',
    textAlign: 'center',
    cursor: 'pointer',
    top: 0
};

const scrollbarStyle = {
    backgroundColor: '#c1c1c1',
    position: 'relative'
};

const { LINE_HEIGHT } = LAYOUT_CONSTANTS;

class ScrollBar {

    dom = document.createElement('div');
    scrollbar = document.createElement('div');
    onScroll = new Do();
    mouseDownGrip = 0;
    barLength;
    barY = 0;
    
    constructor(h, w) {
        const { scrollbar, dom } = this;

        this.onDown = this.onDown.bind(this);
        this.onMove = this.onMove.bind(this);
        this.onUp = this.onUp.bind(this);

        let scrollbarWidth = w ? w : 12;
        let scrollbarMargin = 3;
        let scrollWidth = scrollbarWidth + scrollbarMargin * 2;

        this.scrolltrackHeight = h - 2;

        setStyles(
            dom,
            { 
                ...scrolltrackStyle,
                height: this.scrolltrackHeight + 'px',
                width: scrollWidth + 'px',
                zIndex: 1200
            }
        );

        setStyles(
            scrollbar, 
            {
                ...scrollbarStyle,
                width: scrollbarWidth + 'px',
                height: h / 2,
                top: 0,
                left: '8px'
            }
        );

        this.setLength(1);
        this.setPosition(0);

        dom.appendChild(scrollbar);
        dom.addEventListener('mousedown', this.onDown, false);
    }

    // Sets lengths of scrollbar by percentage
    setLength(l) {
        // limit 0..1
        l = Math.max(Math.min(1, l), 0);
        l *= this.scrolltrackHeight;
        this.barLength = Math.max(l, LINE_HEIGHT);
        this.scrollbar.style.height = this.barLength + 'px';
    };

    setHeight(height) {
        this.scrolltrackHeight = height - 2;
        this.dom.style.height = this.scrolltrackHeight + 'px';
    };

    // Moves scrollbar to position by Percentage
    setPosition(p) {
        p = Math.max(Math.min(1, p), 0);
        let emptyTrack = this.scrolltrackHeight - this.barLength;
        this.barY = p * emptyTrack;
        this.scrollbar.style.top = this.barY + 'px';
    };

    onDown(event) {
        event.preventDefault();

        if (event.target === this.scrollbar) {
            this.mouseDownGrip = event.clientY;
            document.addEventListener('mousemove', this.onMove, false);
            document.addEventListener('mouseup', this.onUp, false);
        } else {
            if (event.clientY < this.barY) {
                this.onScroll.fire('pageup');
            } else if (event.clientY > (this.barY + this.barLength)) {
                this.onScroll.fire('pagedown');
            }
            // if want to drag scroller to empty track instead
            // this.setPosition(event.clientY / (scrolltrackHeight - 1));
        }
    }

    onMove(event) {
        event.preventDefault();

        // event.target == scrollbar
        let emptyTrack = this.scrolltrackHeight - this.barLength;
        let scrollto = (event.clientY - this.mouseDownGrip) / emptyTrack;

        // clamp limits to 0..1
        if (scrollto > 1)
            scrollto = 1;
        if (scrollto < 0)
            scrollto = 0;

        this.setPosition(scrollto);
        this.onScroll.fire('scrollto', scrollto);
    }

    onUp(event) {
        this.onMove(event);
        document.removeEventListener('mousemove', this.onMove, false);
        document.removeEventListener('mouseup', this.onUp, false);
    }

}

export { ScrollBar };

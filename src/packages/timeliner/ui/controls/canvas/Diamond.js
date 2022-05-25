import { scaledTime } from '../../helpers';
import { LayoutConstants } from '../../../consts';
import { Theme } from '../../theme';

const { LINE_HEIGHT, DIAMOND_SIZE } = LayoutConstants;

const halfSize = DIAMOND_SIZE / 2;

class Diamond {

    constructor(posY, frame, prevFrame, nextFrame, track) {
        this.track = track;

        const posX = scaledTime.timeToX(frame.time);
        const endY = posY + LINE_HEIGHT * 0.5 - halfSize;

        let isOver = false;

        this.path = (ctxWrap) => {
            ctxWrap
                .beginPath()
                .moveTo(posX, endY)
                .lineTo(posX + halfSize, endY + halfSize)
                .lineTo(posX, endY + DIAMOND_SIZE)
                .lineTo(posX - halfSize, endY + halfSize)
                .closePath();
        };

        this.paint = (ctxWrap) => {
            this.path(ctxWrap);
            ctxWrap.fillStyle(!isOver ? Theme.cursor : 'yellow');
            ctxWrap.fill();
        };

        this.mouseover = (trackCanvas, ctxWrap) => {
            isOver = true;
            trackCanvas.style.cursor = 'move'; // pointer move ew-resize
            this.paint(ctxWrap);
        };

        this.mouseout = (trackCanvas, ctxWrap) => {
            isOver = false;
            trackCanvas.style.cursor = 'default';
            this.paint(ctxWrap);
        };

        this.mousedrag = (e, dispatcher) => {
            let time = scaledTime.xToTime(posX + e.dx);
            time = Math.max(0, time);

            if ((!prevFrame || time > prevFrame.time) && (!nextFrame || time < nextFrame.time)) {
                frame.time = time;
                dispatcher.fire('time.update', time);
            }
        };
    }

}

export default Diamond;

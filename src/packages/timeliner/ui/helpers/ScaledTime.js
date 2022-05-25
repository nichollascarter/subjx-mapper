import { LayoutConstants } from '../../consts';

const { LEFT_GUTTER } = LayoutConstants;

export default class ScaledTime {

    tickMark1;
    tickMark2;
    tickMark3;

    frameStart = 0;
    timeScale = 60;

    constructor() {
        this.getValues();
    }

    setTimeScale(value) {
        this.timeScale = value;
    }

    xToTime(x) {
        const units = this.timeScale / this.tickMark3;

        return this.frameStart + ((x - LEFT_GUTTER) / units | 0) / this.tickMark3;
    };

    timeToX(s) {
        let ds = s - this.frameStart;
        ds *= this.timeScale;
        ds += LEFT_GUTTER;

        return ds;
    };

    getTick1Units() {
        return this.timeScale / this.tickMark1;
    }

    getTick2Units() {
        return this.timeScale / this.tickMark2;
    }

    getTick3Units() {
        return this.timeScale / this.tickMark3;
    }

    getOffsetUnits() {
        return (this.frameStart * this.timeScale) % this.getUnits();
    }

    getValues() {
        const div = 60;

        this.tickMark1 = this.timeScale / div;
        this.tickMark2 = 2 * this.tickMark1;
        this.tickMark3 = 10 * this.tickMark1;
    }

}

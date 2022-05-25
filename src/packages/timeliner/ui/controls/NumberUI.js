import { Theme } from '../theme';
import { Do } from '../../classes/Do';
import { DragHandler } from '../helpers/DragHandler';
import { firstDefined, setStyles } from '../../utils/common';

const defConfig = {
    min: 0,
    step: 0.125,
    precision: 2
};

class NumberUI {

    dom = document.createElement('input');
    state;
    value = 0;
    unchangedValue;
    onChange = new Do();

    constructor(config = {}) {
        const { dom } = this;

        config = { ...defConfig, ...config };
        const min = config.min === undefined ? -Infinity : config.min;

        // config.xStep and config.yStep allow configuring adjustment
        // speed across each axis.
        // config.wheelStep and config.wheelStepFine allow configuring
        // adjustment speed for mousewheel, and mousewheel while holding <alt>
        // If only config.step is specified, all other adjustment speeds
        // are set to the same value.
        const xStep = firstDefined(config.xStep, config.step, 0.001);
        const yStep = firstDefined(config.yStep, config.step, 0.1);
        const wheelStep = firstDefined(config.wheelStep, yStep);
        const wheelStepFine = firstDefined(config.wheelStepFine, xStep);

        setStyles(dom, {
            textAlign: 'center',
            padding: '1px',
            cursor: 'ns-resize',
            width: '40px',
            margin: '0 5px 0 5px',
            appearance: 'none',
            outline: 'none',
            border: 0,
            background: 'none',
            borderBottom: '1px solid ' + Theme.border,
            color: Theme.font
        });

        dom.addEventListener('change', () => {
            this.value = parseFloat(dom.value, 10);

            fireChange();
        });

        dom.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });

        dom.addEventListener('focus', () => {
            dom.setSelectionRange(0, dom.value.length);
        });

        dom.addEventListener('wheel', (e) => {
            // Disregard pixel/line/page scrolling and just
            // use event direction.
            let inc = e.deltaY > 0 ? 1 : -1;

            if (e.altKey) {
                inc *= wheelStepFine;
            } else {
                inc *= wheelStep;
            }
            this.value = clamp(this.value + inc);
            fireChange();
        });

        const clamp = (value) => Math.max(min, value);

        const onUp = (e) => {
            if (e.moved)
                fireChange();
            else {
                // single click
                dom.focus();
            }
        };

        const onMove = (e) => {
            const { dx, dy } = e;

            this.value = this.unchangedValue + (dx * xStep) + (dy * -yStep);
            this.value = clamp(this.value);

            // value = +value.toFixed(precision); // or toFixed toPrecision
            this.onChange.fire(this.value, true);
        };

        const onDown = () => {
            this.unchangedValue = this.value;
        };

        const fireChange = () => {
            this.onChange.fire(this.value);
        };

        new DragHandler(dom, onDown, onMove, onUp);

        this.config = config;
    }

    setValue(value) {
        const { config: { precision } } = this;
        this.value = value;
        this.dom.value = value.toFixed(precision);
    }

    paint() {
        const { value, config: { precision } } = this;
        if (value && document.activeElement !== this.dom) {
            this.dom.value = value.toFixed(precision);
        }
    }

}

export { NumberUI };

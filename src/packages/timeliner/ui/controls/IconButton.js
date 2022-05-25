import { font } from '../font';
import { Theme } from '../theme';

const normal = 'none';

class IconButton {

    dom = document.createElement('button');
    canvas = document.createElement('canvas');
    ctx = this.canvas.getContext('2d');
    dpr = 1;

    CMD_MAP = {
        M: 'moveTo',
        L: 'lineTo',
        Q: 'quadraticCurveTo',
        C: 'bezierCurveTo',
        Z: 'closePath'
    };

    constructor(size, icon, tooltip, dispatcher) {
        const { canvas, dom, dpr, ctx } = this;
        this.size = size;

        ctx.fillStyle = Theme.font;

        dom.style.background = normal;
        dom.style.border = 'none';
        dom.appendChild(canvas);

        if (dispatcher)
            dispatcher.on('resize', () => this.resize());

        dom.addEventListener('mouseover', () => {
            ctx.fillStyle = Theme.font;
            ctx.shadowColor = Theme.b;
            ctx.shadowBlur = 0.5 * dpr;
            ctx.shadowOffsetX = 1 * dpr;
            ctx.shadowOffsetY = 1 * dpr;
            this.draw();

            if (tooltip && dispatcher)
                dispatcher.fire('status', 'button: ' + tooltip);
        });

        dom.addEventListener('mousedown', () => {
            dom.style.background = Theme.d;
        });

        dom.addEventListener('mouseup', () => {
            dom.style.background = normal;
        });

        dom.addEventListener('mouseout', () => {
            dom.style.background = normal;

            ctx.fillStyle = Theme.font;
            ctx.shadowColor = null;
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            this.draw();
        });

        if (icon)
            this.setIcon(icon);

        this.draw();
    }

    draw() {
        if (!this.icon) return;

        const { ctx, size: height } = this;

        const glyph = font.fonts[this.icon];

        const dpr = window.devicePixelRatio;
        const scale = height / font.unitsPerEm * dpr;
        const pathCommands = glyph.commands.split(' ');

        ctx.save();
        ctx.clearRect(0, 0, this.canvas.width * dpr, this.canvas.height * dpr);

        ctx.scale(scale, -scale);
        ctx.translate(0, -font.ascender);
        ctx.beginPath();

        for (let i = 0, il = pathCommands.length; i < il; i++) {
            const cmds = pathCommands[i].split(',');
            const params = cmds.slice(1);

            ctx[this.CMD_MAP[cmds[0]]].apply(ctx, params);
        }

        ctx.fill();
        ctx.restore();
    }

    setSize(size) {
        this.size = size;
        this.resize();
    }

    resize() {
        const { ctx, canvas, size } = this;
        const dpr = window.devicePixelRatio;

        const glyph = font.fonts[this.icon];

        let height = size;

        canvas.height = height * dpr;
        canvas.style.height = height + 'px';

        const scale = height / font.unitsPerEm;
        let width = glyph.advanceWidth * scale + 0.5 | 0;

        width += 2;
        height += 2;

        canvas.width = width * dpr;
        canvas.style.width = width + 'px';

        ctx.fillStyle = Theme.font;
        this.draw();

        this.dpr = dpr;
    }

    setIcon(icon) {
        this.icon = icon;

        if (!font.fonts[icon])
            console.warn('Font icon not found!');
        this.resize();
    }

    setTip(tip) {
        this.tooltip = tip;
    }

    onClick(e) {
        this.dom.addEventListener('click', e);
    }

}

export { IconButton };

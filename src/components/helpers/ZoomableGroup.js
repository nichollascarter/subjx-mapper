import React, { useEffect, useState, useRef, useCallback } from 'react';

const ZoomableGroup = (props) => {
    let zoomEl = useRef(null);
    const [transform, setTransform] = useState('matrix(1,0,0,1,0,0)');
    const mouse = { x: 0, y: 0, oldX: 0, oldY: 0, button: false };
    const matrix = [1, 0, 0, 1, 0, 0];
    let scale = 1;
    const pos = { x: 0, y: 0 };

    const view = (() => {
        const m = matrix;

        let dirty = true;
        const API = {
            applyTo() {
                if (dirty) { this.update(); }
                setTransform(`matrix(${m.join(',')})`);
            },
            update() {
                dirty = false;
                m[3] = m[0] = scale.toFixed(5);
                m[2] = m[1] = 0;
                m[4] = pos.x.toFixed(5);
                m[5] = pos.y.toFixed(5);
            },
            pan(amount) {
                if (dirty) { this.update(); }
                pos.x += amount.x;
                pos.y += amount.y;
                dirty = true;
            },
            scaleAt(at, amount) {
                const prescale = scale * amount;
                if (prescale < 0.4 || prescale > 5) return;

                if (dirty) { this.update(); }
                scale *= amount;
                pos.x = at.x - (at.x - pos.x) * amount;
                pos.y = at.y - (at.y - pos.y) * amount;
                dirty = true;
            }
        };
        return API;
    })();

    const mouseEvent = useCallback((event) => {
        if (props.enable === false) return;
        const el = zoomEl.current;
        if (event.type === 'mousedown') { mouse.button = true; }
        if (event.type === 'mouseup' || event.type === 'mouseout') { mouse.button = false; }
        mouse.oldX = mouse.x;
        mouse.oldY = mouse.y;
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        if (mouse.button) {
            view.pan({ x: mouse.x - mouse.oldX, y: mouse.y - mouse.oldY });
            view.applyTo(el);
        }
        event.preventDefault();
    });

    const mouseWheelEvent = useCallback((e) => {
        if (props.enable === false) return;
        const el = zoomEl.current;
        const offset = el.parentNode.getBoundingClientRect();
        const x = e.clientX - offset.left;
        const y = e.clientY - offset.top;

        view.scaleAt({ x, y }, e.deltaY < 0 ? 1.1 : (1 / 1.1));
        view.applyTo(el);
        e.preventDefault();
    }, [props.enable]);

    const resetZoom = useCallback(() => {
        scale = 1;
        pos.x = pos.y = 0;
        matrix[0] = matrix[3] = 1;
        matrix[1] = matrix[2] = matrix[4] = matrix[5] = 0;
        view.pan(pos);
        view.scaleAt({ x: 0, y: 0 }, 1);
        view.applyTo(zoomEl.current);
    });

    const events = [
        ['mousemove', mouseEvent],
        ['mousedown', mouseEvent],
        ['mouseup', mouseEvent],
        ['mouseout', mouseEvent],
        ['wheel', mouseWheelEvent],
        ['dblclick', resetZoom]
    ];

    useEffect(() => {
        const el = zoomEl.current;

        if (props.enable) {
            events.map(([eventName, eventFunc]) => {
                el.parentNode.addEventListener(eventName, eventFunc, { passive: false });
            });
        }

        return () => {
            events.map(([eventName, eventFunc]) => {
                el.parentNode.removeEventListener(eventName, eventFunc, { passive: false });
            });
        };
    }, [props.enable]);

    return (
        <g id='zoom-container' ref={zoomEl} transform={transform}>
            {props.children}
        </g>
    );
};

export default ZoomableGroup;
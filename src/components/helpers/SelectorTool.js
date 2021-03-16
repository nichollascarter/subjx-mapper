import React, { useState, useRef, useEffect } from 'react';

const EditorSelector = (props) => {
    let selectorRef = useRef(null);

    const [selectorActive, setOpenSelector] = useState(props.enable);
    const [selectorStyle, setSelectorStyle] = useState({
        left: 0,
        top: 0,
        width: 0,
        heigth: 0
    });

    useEffect(() => {
        const container = props.containerRef.current;
        if (!container) return;
        container.addEventListener('mousedown', handleOpenSelector);
        return () => {
            container.removeEventListener('mousedown', handleOpenSelector);
        };
    }, [props.containerRef]);

    const handleOpenSelector = (e) => {
        if (!props.enable) return;
        const $container = props.containerRef.current;

        const offset = $container.getBoundingClientRect(),
            x = e.clientX - offset.left + $container.scrollLeft,
            y = e.clientY - offset.top + $container.scrollTop;

        const data = {
            initialW: x,
            initialH: y
        };

        setSelectorStyle((selectorStyle) => ({
            ...selectorStyle,
            left: x,
            top: y
        }));
        setOpenSelector(true);

        const select = () => {
            document.removeEventListener('mousemove', open);
            document.removeEventListener('mouseup', select);

            setSelectorStyle((selectorStyle) => ({
                ...selectorStyle,
                width: 0,
                height: 0
            }));

            [...(document.getElementsByClassName('isolated-layer')[0].childNodes || [])].map((el) => {
                return el.nodeType === 1 && isCollapsed(selectorRef.current, el)
                    ? el.classList.add('subjx-selected')
                    : null;
            });

            setOpenSelector(false);
        };

        const open = (e) => {
            openSelector(e, $container, data);
        };

        document.addEventListener('mouseup', select);
        document.addEventListener('mousemove', open);
    };

    const openSelector = (e, canvas, { initialH, initialW }) => {
        const offset = canvas.getBoundingClientRect();

        const x = e.clientX - offset.left + canvas.scrollLeft;
        const y = e.clientY - offset.top + canvas.scrollTop;
        const w = Math.abs(initialW - x);
        const h = Math.abs(initialH - y);

        let nextSelectorStyle = {
            width: w,
            height: h
        };

        if (x <= initialW && y >= initialH) {
            nextSelectorStyle = {
                ...nextSelectorStyle,
                left: x
            };
        } else if (y <= initialH && x >= initialW) {
            nextSelectorStyle = {
                ...nextSelectorStyle,
                top: y
            };
        } else if (y < initialH && x < initialW) {
            nextSelectorStyle = {
                ...nextSelectorStyle,
                left: x,
                top: y
            };
        }

        setSelectorStyle((selectorStyle) => ({
            ...selectorStyle,
            ...nextSelectorStyle
        }));
    };

    const isCollapsed = (selector, rect) => {
        const source = selector.getBoundingClientRect();
        const dest = rect.getBBox();
        
        return (source.left < dest.left + dest.width && source.left + source.width > dest.left &&
            source.top < dest.top + dest.height && source.top + source.height > dest.top);
    };

    return (
        <div
            ref={(el) => selectorRef.current = el}
            className={`selector${selectorActive ? ' selector-active' : ''}`}
            style={{ ...selectorStyle }}
        >
            <span />
        </div>
    );
};

export default EditorSelector;
import svgDragSelect from 'svg-drag-select';

const makeSelectable = (svg, referenceElement, config) => {
    const strictIntersectionSelector = ({
        svg,                            // the svg element.
        referenceElement,               // please select only descendants of this SVGElement if specified.
        pointerEvent,                   // a `PointerEvent` instance with either a "pointerdown" event or a "pointermove" event.
        // (in case of Safari, a `MouseEvent` or a `TouchEvent` is used instead.)
        dragAreaInClientCoordinate,     // a `SVGRect` that represents the dragging area in client coordinate.
        dragAreaInSvgCoordinate,        // a `SVGRect` that represents the dragging area in svg coordinate.
        dragAreaInInitialSvgCoordinate, // a `SVGRect` that represents the dragging area in initial viewport coordinate of the svg.
        getEnclosures,                  // `getEnclosures()` returns elements enclosed in the dragging area.
        getIntersections               // `getIntersections()` returns elements intersect the dragging area.
        // Chrome, Safari and Firefox checks only bounding box intersection.
    }) => getIntersections().filter(element => {
        if (!referenceElement.contains(element)) return false;

        // the element that the pointer event raised is considered to intersect.
        if (pointerEvent.target === element) {
            return true;
        }
        // strictly check only <path>s.
        if (!(element instanceof SVGPathElement)) {
            return true;
        }
        // check if there is at least one enclosed point in the path.
        for (let i = 0, len = element.getTotalLength(); i <= len; i += 4 /* arbitrary */) {
            const { x, y } = element.getPointAtLength(i);
            if (
                (
                    dragAreaInSvgCoordinate.x <= x && x <= dragAreaInSvgCoordinate.x + dragAreaInSvgCoordinate.width &&
                    dragAreaInSvgCoordinate.y <= y && y <= dragAreaInSvgCoordinate.y + dragAreaInSvgCoordinate.height
                ) ||
                (
                    dragAreaInClientCoordinate.x <= x && x <= dragAreaInClientCoordinate.x + dragAreaInClientCoordinate.width &&
                    dragAreaInClientCoordinate.y <= y && y <= dragAreaInClientCoordinate.y + dragAreaInClientCoordinate.height
                )
            ) {
                return true;
            }
        }
        return false;
    });

    const { cancel } = svgDragSelect({
        svg,
        referenceElement: referenceElement.querySelector('.isolated-layer'),
        selector: strictIntersectionSelector,
        ...config
    });

    return cancel;
};

export default makeSelectable;
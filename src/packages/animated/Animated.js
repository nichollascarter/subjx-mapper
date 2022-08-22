import { RAD, floatToFixed, getMinMaxOfArray, isDef } from './common';
import { movePath, resizePath } from './path';

import {
    checkChildElements,
    createSVGElement,
    createSVGMatrix,
    createTranslateMatrix,
    createRotateMatrix,
    createScaleMatrix,
    isSVGGroup,
    parsePoints,
    getTransformToElement,
    matrixToString,
    pointTo,
    isIdentity,
    createSVGPoint
} from './util';

export default class Animated {

    storage = null

    constructor(elements, options) {
        this.elements = elements;

        this.enable(options);
    }

    enable(options) {
        this._processOptions(options);
        this._init(this.elements);
    }

    _processOptions(options = {}) {
        const { elements } = this;

        const {
            restrict = false,
            draggable = true,
            resizable = true,
            rotatable = true,
            scalable = true,
            applyTranslate = false,
            container = elements[0].parentNode,
            proportions = false,
            transformOrigin = null
        } = options;

        this.options = {
            restrict,
            container,
            proportions,
            draggable,
            resizable,
            rotatable,
            scalable,
            applyTranslate,
            transformOrigin,
            isGrouped: elements.length > 1
        };
    }

    _init(elements) {
        const {
            options: {
                rotationPoint,
                container,
                transformOrigin
            }
        } = this;

        const data = new WeakMap();

        this.storage = {
            data,
            center: {
                isShifted: Array.isArray(rotationPoint)
            },
            transformOrigin: Array.isArray(transformOrigin) ?
                pointTo(
                    createSVGMatrix(),
                    transformOrigin[0],
                    transformOrigin[1]
                ) : undefined,
            ...this._getCommonState()
        };

        elements.map(element => {
            const initData = {
                parent: element.parentNode,
                transform: {
                    ctm: getTransformToElement(element, container)
                },
                bBox: element.getBBox(),
                __data__: new WeakMap(),
                cached: {}
            };

            data.set(element, initData);

            data.set(element, {
                ...initData,
                ...this._getElementState(element, {
                    revX: false,
                    revY: false,
                    doW: false,
                    doH: false
                })
            });
        });
    }

    updateState() {
        const {
            elements,
            storage: {
                data
            }
        } = this;

        const commonState = this._getCommonState();

        elements.map(element => {
            const nextData = this._getElementState(element, {
                revX: false,
                revY: false,
                doW: false,
                doH: false
            });

            data.set(element, {
                ...data.get(element),
                ...nextData
            });
        });

        this.storage = {
            ...this.storage,
            ...commonState
        };
    }

    _getRestrictedBBox(force = false) {
        const {
            storage: {
                transform: {
                    containerMatrix
                } = {}
            } = {},
            options: {
                container,
                restrict
            } = {}
        } = this;

        const restrictEl = restrict || container;

        return getBoundingRect(
            restrictEl,
            force ? getTransformToElement(restrictEl, container) : containerMatrix
        );
    }

    _pointToTransform({ x, y, matrix }) {
        const nextMatrix = matrix.inverse();
        nextMatrix.e = nextMatrix.f = 0;

        return this._applyMatrixToPoint(
            nextMatrix,
            x,
            y
        );
    }

    _applyMatrixToPoint(matrix, x, y) {
        const pt = createSVGElement('svg').createSVGPoint();
        pt.x = x;
        pt.y = y;
        return pt.matrixTransform(matrix);
    }

    _applyTransformToElement(element, actionName) {
        const {
            storage: {
                data,
                bBox
            } = {},
            options: {
                isGrouped,
                scalable,
                applyTranslate: applyDragging
            } = {}
        } = this;

        const {
            cached = {},
            ...nextData
        } = data.get(element);

        const {
            transform: {
                matrix,
                parentMatrix
            },
            __data__
        } = nextData;

        const {
            scaleX,
            scaleY,
            dist: {
                dx,
                dy,
                ox,
                oy
            } = {},
            transformMatrix
        } = cached;

        if (actionName === 'translate') {
            if (!applyDragging || (!dx && !dy)) return;

            const eM = createTranslateMatrix(ox, oy);

            const translateMatrix = eM
                .multiply(matrix)
                .multiply(eM.inverse());

            this._updateElementView(['transform', translateMatrix]);

            if (isSVGGroup(element)) {
                checkChildElements(element)
                    .map(child => {
                        const eM = createTranslateMatrix(dx, dy);

                        const translateMatrix = eM
                            .multiply(getTransformToElement(child, child.parentNode))
                            .multiply(eM.inverse());

                        if (!isIdentity(translateMatrix)) {
                            child.setAttribute(
                                'transform',
                                matrixToString(translateMatrix)
                            );
                        }

                        if (!isSVGGroup(child)) {
                            const ctm = parentMatrix.inverse();
                            ctm.e = ctm.f = 0;

                            const { x, y } = pointTo(ctm, ox, oy);
                            applyTranslate(child, { x, y });
                        }
                    });
            } else {
                applyTranslate(element, { x: ox, y: oy });
            }
        }

        if (actionName === 'resize') {
            if (!transformMatrix) return;
            if (isSVGGroup(element) || isGrouped) {
                const elements = checkChildElements(element);

                elements.forEach(child => {
                    if (!isSVGGroup(child)) {
                        const childCTM = getTransformToElement(
                            child,
                            isGrouped ? element.parentNode : element
                        );
                        const localCTM = childCTM.inverse()
                            .multiply(transformMatrix)
                            .multiply(childCTM);

                        applyResize(
                            child,
                            {
                                dx,
                                dy,
                                scaleX,
                                scaleY,
                                localCTM,
                                transformMatrix,
                                bBox,
                                __data__,
                                isGrouped
                            }
                        );
                    }
                });
            } else {
                applyResize(
                    element,
                    {
                        dx,
                        dy,
                        scaleX,
                        scaleY,
                        localCTM: transformMatrix,
                        transformMatrix,
                        bBox,
                        __data__,
                        isGrouped
                    }
                );
            }
        }

        data.set(element, { ...nextData });
    }

    _processResize(element, { width, height }) {
        const {
            storage: {
                revX,
                revY,
                // doW,
                // doH,
                data,
                bBox: {
                    x: bx,
                    y: by,
                    width: boxWidth,
                    height: boxHeight
                }
            },
            options: {
                isGrouped,
                proportions
            }
        } = this;

        const doW = width > 0;
        const doH = height > 0;

        const elementData = data.get(element);

        const {
            transform: {
                matrix,
                auxiliary: {
                    scale: {
                        translateMatrix
                    }
                }
            },
            cached = {}
        } = elementData;

        const getScale = (distX, distY) => {
            const actualBoxWidth = boxWidth || 1;
            const actualBoxHeight = boxHeight || 1;

            const ratio = doW || (!doW && !doH)
                ? (actualBoxWidth + distX) / actualBoxWidth
                : (actualBoxHeight + distY) / actualBoxHeight;

            const newWidth = proportions ? actualBoxWidth * ratio : actualBoxWidth + distX,
                newHeight = proportions ? actualBoxHeight * ratio : actualBoxHeight + distY;

            const scaleX = newWidth / actualBoxWidth,
                scaleY = newHeight / actualBoxHeight;

            return [scaleX, scaleY, newWidth, newHeight];
        };

        const getScaleMatrix = (scaleX, scaleY) => {
            const scaleMatrix = createScaleMatrix(scaleX, scaleY);

            return translateMatrix
                .multiply(scaleMatrix)
                .multiply(translateMatrix.inverse());
        };

        const [
            scaleX,
            scaleY,
            newWidth,
            newHeight
        ] = getScale(width, height);

        const scaleMatrix = getScaleMatrix(scaleX, scaleY);

        const deltaW = newWidth - boxWidth,
            deltaH = newHeight - boxHeight;

        const newX = bx - deltaW * (doH ? 0.5 : (revX ? 1 : 0)),
            newY = by - deltaH * (doW ? 0.5 : (revY ? 1 : 0));

        const resultMatrix = isGrouped
            ? scaleMatrix.multiply(matrix)
            : matrix.multiply(scaleMatrix);

        data.set(element, {
            ...elementData,
            cached: {
                ...cached,
                scaleX,
                scaleY,
                transformMatrix: scaleMatrix,
                resultMatrix
            }
        });

        this._applyTransformToElement(element, 'resize');

        return createSVGMatrix();
    }

    _processScale(element, { x, y }) {
        const {
            storage: {
                data
            }
        } = this;

        const elementData = data.get(element);

        const {
            transform: {
                auxiliary: {
                    scale: {
                        translateMatrix
                    }
                }
            }
        } = elementData;

        const getScaleMatrix = (scaleX, scaleY) => {
            const scaleMatrix = createScaleMatrix(scaleX, scaleY);

            return translateMatrix
                .multiply(scaleMatrix)
                .multiply(translateMatrix.inverse());
        };

        const scaleMatrix = getScaleMatrix(x, y);

        return scaleMatrix;
    }

    _processTranslate(element, { x, y }) {
        const {
            storage: {
                data
            }
        } = this;

        const elementStorage = data.get(element);

        const {
            transform: {
                auxiliary: {
                    translate: {
                        translateMatrix,
                        parentMatrix
                    }
                }
            },
            cached
        } = elementStorage;

        parentMatrix.e = parentMatrix.f = 0;
        const { x: nx, y: ny } = pointTo(
            parentMatrix,
            x,
            y
        );

        translateMatrix.e = nx;
        translateMatrix.f = ny;

        data.set(element, {
            ...elementStorage,
            cached: {
                ...cached,
                dist: {
                    dx: x,
                    dy: y,
                    ox: nx,
                    oy: ny
                }
            }
        });

        return translateMatrix;
    }

    _processRotate(element, deg) {
        const {
            storage: { data } = {}
        } = this;

        const elementStorage = data.get(element);

        const {
            transform: {
                parentMatrix,
                auxiliary: {
                    rotate: {
                        translateMatrix
                    }
                }
            }
        } = elementStorage;

        const radians = deg * RAD;

        const cos = floatToFixed(Math.cos(radians)),
            sin = floatToFixed(Math.sin(radians));

        const rotateMatrix = createRotateMatrix(sin, cos);

        parentMatrix.e = parentMatrix.f = 0;
        const resRotMatrix = parentMatrix.inverse()
            .multiply(rotateMatrix)
            .multiply(parentMatrix);

        const resRotateMatrix = translateMatrix
            .multiply(resRotMatrix)
            .multiply(translateMatrix.inverse());

        return resRotateMatrix;
    }

    _getElementState(element, { revX, revY, doW, doH }) {
        const {
            options: {
                container,
                isGrouped
            },
            storage: {
                data,
                transformOrigin,
                transformOrigin: {
                    x: originX,
                    y: originY
                } = {}
            }
        } = this;

        const elementData = data.get(element);

        const { __data__ } = elementData;

        storeElementAttributes(element, elementData, container);
        __data__.delete(element);
        checkChildElements(element).forEach(child => {
            __data__.delete(child);
            storeElementAttributes(child, elementData, element, isGrouped);
        });

        const bBox = this._getBBox();

        const {
            x: elX,
            y: elY,
            width: elW,
            height: elH
        } = bBox;

        const elMatrix = getTransformToElement(element, element.parentNode),
            ctm = getTransformToElement(element, container),
            parentMatrix = getTransformToElement(element.parentNode, container);

        const parentMatrixInverted = parentMatrix.inverse();

        const scaleX = elX + elW * (doH ? 0.5 : revX ? 1 : 0),
            scaleY = elY + elH * (doW ? 0.5 : revY ? 1 : 0);

        const elCenterX = elX + elW / 2,
            elCenterY = elY + elH / 2;

        const scaleMatrix = transformOrigin ? ctm.inverse() : createSVGMatrix();
        const rotateMatrix = transformOrigin ? parentMatrixInverted : elMatrix;

        const { x: nextScaleX, y: nextScaleY } = pointTo(
            isGrouped ? parentMatrixInverted : scaleMatrix,
            transformOrigin ? originX : scaleX,
            transformOrigin ? originY : scaleY
        );

        // element's center coordinates
        const { x: elcx, y: elcy } = pointTo(
            isGrouped ? parentMatrixInverted : rotateMatrix,
            transformOrigin ? originX : elCenterX,
            transformOrigin ? originY : elCenterY
        );

        const transform = {
            auxiliary: {
                scale: {
                    scaleMatrix: createSVGMatrix(),
                    translateMatrix: createTranslateMatrix(nextScaleX, nextScaleY)
                },
                translate: {
                    parentMatrix: parentMatrixInverted,
                    translateMatrix: createSVGMatrix()
                },
                rotate: {
                    translateMatrix: createTranslateMatrix(elcx, elcy)
                }
            },
            matrix: elMatrix,
            ctm,
            parentMatrix
        };

        return {
            transform,
            bBox
        };
    }

    _getCommonState() {
        const {
            options: {
                container,
                restrict
            }
        } = this;

        const bBox = this._getBBox();

        const containerMatrix = restrict
            ? getTransformToElement(restrict, restrict.parentNode)
            : getTransformToElement(container, container.parentNode);

        return {
            transform: {
                containerMatrix
            },
            bBox
        };
    }

    _getVertices(transformMatrix = createSVGMatrix()) {
        const {
            elements,
            options: {
                isGrouped,
                rotatable,
                rotatorAnchor,
                rotatorOffset,
                container
            }
        } = this;

        const { x, y, width, height } = this._getBBox();

        const hW = width / 2,
            hH = height / 2;

        const vertices = {
            tl: [x, y],
            tr: [x + width, y],
            mr: [x + width, y + hH],
            ml: [x, y + hH],
            tc: [x + hW, y],
            bc: [x + hW, y + height],
            br: [x + width, y + height],
            bl: [x, y + height],
            center: [x + hW, y + hH]
        };

        const nextTransform = isGrouped
            ? transformMatrix
            : transformMatrix.multiply(getTransformToElement(elements[0], container));

        const nextVertices = Object.entries(vertices)
            .reduce((nextRes, [key, [x, y]]) => {
                nextRes[key] = pointTo(
                    nextTransform,
                    x,
                    y
                );
                return nextRes;
            }, {});

        if (rotatable) {
            const anchor = {};
            let factor = 1;

            switch (rotatorAnchor) {

                case 'n': {
                    const { x, y } = nextVertices.tc;
                    anchor.x = x;
                    anchor.y = y;
                    break;
                }
                case 's': {
                    const { x, y } = nextVertices.bc;
                    anchor.x = x;
                    anchor.y = y;
                    factor = -1;
                    break;
                }
                case 'w': {
                    const { x, y } = nextVertices.ml;
                    anchor.x = x;
                    anchor.y = y;
                    factor = -1;
                    break;
                }
                case 'e':
                default: {
                    const { x, y } = nextVertices.mr;
                    anchor.x = x;
                    anchor.y = y;
                    break;
                }

            }

            const theta = rotatorAnchor === 'n' || rotatorAnchor === 's'
                ? Math.atan2(
                    nextVertices.bl.y - nextVertices.tl.y,
                    nextVertices.bl.x - nextVertices.tl.x
                )
                : Math.atan2(
                    nextVertices.tl.y - nextVertices.tr.y,
                    nextVertices.tl.x - nextVertices.tr.x
                );

            const nextRotatorOffset = rotatorOffset * factor;

            const rotator = {
                x: anchor.x - nextRotatorOffset * Math.cos(theta),
                y: anchor.y - nextRotatorOffset * Math.sin(theta)
            };

            nextVertices.rotator = rotator;
            nextVertices.anchor = anchor;
        }

        return nextVertices;
    }

    _getBBox() {
        const {
            elements,
            options: {
                container,
                isGrouped
            }
        } = this;

        if (isGrouped) {
            const groupBBox = elements.reduce((result, element) => {
                const elCTM = getTransformToElement(element, container);
                return [...result, ...getBoundingRect(element, elCTM)];
            }, []);

            const [
                [minX, maxX],
                [minY, maxY]
            ] = getMinMaxOfArray(groupBBox);

            return {
                x: minX,
                y: minY,
                width: maxX - minX,
                height: maxY - minY
            };
        } else {
            return elements[0].getBBox();
        }
    }

    _processTranslateRestrict(element, { dx, dy }) {
        const {
            storage: {
                data
            }
        } = this;

        const elementStorage = data.get(element);

        const {
            transform: {
                matrix,
                auxiliary: {
                    translate: {
                        parentMatrix
                    }
                }
            }
        } = elementStorage;

        parentMatrix.e = parentMatrix.f = 0;
        const { x, y } = pointTo(
            parentMatrix,
            dx,
            dy
        );

        const preTranslateMatrix = createTranslateMatrix(x, y).multiply(matrix);

        return this._restrictHandler(element, preTranslateMatrix);
    }

    _processRotateRestrict(element, radians) {
        const {
            storage: {
                data
            } = {}
        } = this;

        const {
            transform: {
                matrix,
                parentMatrix,
                auxiliary: {
                    rotate: {
                        translateMatrix
                    }
                }
            }
        } = data.get(element);

        const cos = floatToFixed(Math.cos(radians)),
            sin = floatToFixed(Math.sin(radians));

        const rotateMatrix = createRotateMatrix(sin, cos);

        parentMatrix.e = parentMatrix.f = 0;
        const resRotMatrix = parentMatrix.inverse()
            .multiply(rotateMatrix)
            .multiply(parentMatrix);

        const resRotateMatrix = translateMatrix
            .multiply(resRotMatrix)
            .multiply(translateMatrix.inverse());

        const resultMatrix = resRotateMatrix.multiply(matrix);

        return this._restrictHandler(element, resultMatrix);
    }

    _processResizeRestrict(element, { dx, dy }) {
        const {
            storage: {
                doW,
                doH,
                data,
                bBox: {
                    width: boxWidth,
                    height: boxHeight
                }
            },
            options: {
                proportions
            }
        } = this;

        const elementData = data.get(element);

        const {
            transform: {
                matrix,
                auxiliary: {
                    scale: {
                        translateMatrix
                    }
                }
            }
        } = elementData;

        const getScale = (distX, distY) => {
            const actualBoxWidth = boxWidth || 1;
            const actualBoxHeight = boxHeight || 1;

            const ratio = doW || (!doW && !doH)
                ? (actualBoxWidth + distX) / actualBoxWidth
                : (actualBoxHeight + distY) / actualBoxHeight;

            const newWidth = proportions ? actualBoxWidth * ratio : actualBoxWidth + distX,
                newHeight = proportions ? actualBoxHeight * ratio : actualBoxHeight + distY;

            const scaleX = newWidth / actualBoxWidth,
                scaleY = newHeight / actualBoxHeight;

            return [scaleX, scaleY, newWidth, newHeight];
        };

        const getScaleMatrix = (scaleX, scaleY) => {
            const scaleMatrix = createScaleMatrix(scaleX, scaleY);

            return translateMatrix
                .multiply(scaleMatrix)
                .multiply(translateMatrix.inverse());
        };

        const preScaledMatrix = matrix.multiply(
            getScaleMatrix(...getScale(dx, dy))
        );

        return this._restrictHandler(element, preScaledMatrix);
    }

    _updateElementView(element, [attr, value]) {
        if (attr === 'transform') {
            element.setAttribute(attr, matrixToString(value));
        }
    }

    getBoundingRect(element, transformMatrix = null) {
        const {
            options: {
                restrict,
                container
            } = {}
        } = this;

        const restrictEl = restrict || container;

        const nextTransform = transformMatrix
            ? getTransformToElement(element.parentNode, restrictEl).multiply(transformMatrix)
            : getTransformToElement(element, restrictEl);

        return getBoundingRect(
            element,
            nextTransform,
            element.getBBox()
        );
    }

    translate({ x, y }) {
        const {
            elements,
            options: {
                draggable
            },
            storage: {
                data
            }
        } = this;
        if (!draggable) return;

        elements.map((element) => {
            const resultMatrix = this._processTranslate(element, { x, y });

            const elementStorage = data.get(element);

            const {
                transform: {
                    matrix
                }
            } = elementStorage;

            const nextMatrix = resultMatrix.multiply(matrix);

            this._updateElementView(element, ['transform', nextMatrix]);
            this._applyTransformToElement(element, 'translate');
        });
    }

    scale({
        x,
        y,
        revX = false,
        revY = false,
        doW = false,
        doH = false
    }) {
        const {
            elements,
            options: {
                resizable,
                isGrouped
            },
            storage,
            storage: {
                data
            }
        } = this;
        if (!resizable) return;

        elements.map((element) => {
            const { transformMatrix } = this._processResize(element, { x, y });

            const elementStorage = data.get(element);

            const {
                transform: {
                    matrix
                }
            } = elementStorage;

            const resultMatrix = isGrouped
                ? transformMatrix.multiply(matrix)
                : matrix.multiply(transformMatrix);

            this._updateElementView(element, ['transform', resultMatrix]);
        });
    }

    resize({
        x,
        y,
        revX = false,
        revY = false,
        doW = false,
        doH = false
    }) {
        const {
            elements,
            options: {
                resizable
            },
            storage,
            storage: {
                data
            }
        } = this;
        if (!resizable) return;

        elements.map((element) => {
            const { transform: resultMatrix } = this._processResize(element, { x, y });

            //if (scalable) this._updateElementView(element, ['transform', resultMatrix]);
            this._applyTransformToElement(element, 'resize');
        });
    }

    rotate({ value }) {
        const {
            elements,
            options: {
                rotatable
            },
            storage,
            storage: {
                data
            }
        } = this;
        if (!rotatable) return;

        elements.map(element => {
            const resultMatrix = this._processRotate(element, value);

            const elementStorage = data.get(element);

            const {
                transform: {
                    matrix
                }
            } = elementStorage;

            const nextMatrix = resultMatrix.multiply(matrix);

            this._updateElementView(element, ['transform', nextMatrix]);
            this._applyTransformToElement(element, 'rotate');
        });
    }

    transform(sets) {
        const {
            elements,
            options: {
                draggable,
                scalable,
                rotatable,
                resizable
            },
            storage: {
                data
            }
        } = this;

        if (!sets || !sets.length) return;

        elements.map((element) => {
            let initialMatrix = createSVGMatrix();

            const elementStorage = data.get(element);

            const {
                transform: {
                    matrix
                }
            } = elementStorage;

            let dimensions = {
                width: 0,
                height: 0
            };

            sets.map(({ name, _value: value = 0 }) => {
                const { getTransformMatrix } = [
                    {
                        getTransformMatrix: () => this._processTranslate(element, { x: value, y: value }),
                        condition: name === 'translate' && draggable
                    },
                    {
                        getTransformMatrix: () => this._processTranslate(element, { x: value, y: 0 }),
                        condition: name === 'translateX' && draggable
                    },
                    {
                        getTransformMatrix: () => this._processTranslate(element, { x: 0, y: value }),
                        condition: name === 'translateY' && draggable
                    },
                    {
                        getTransformMatrix: () => this._processRotate(element, value),
                        condition: name === 'rotate' && rotatable
                    },
                    {
                        getTransformMatrix: () => this._processScale(element, { x: value, y: value }),
                        condition: name === 'scale' && scalable
                    },
                    {
                        getTransformMatrix: () => this._processScale(element, { x: value, y: 1 }),
                        condition: name === 'scaleX' && scalable
                    },
                    {
                        getTransformMatrix: () => this._processScale(element, { x: 1, y: value }),
                        condition: name === 'scaleY' && scalable
                    },
                    {
                        getTransformMatrix: () => { dimensions.width = value; return createSVGMatrix(); },
                        condition: name === 'width' && resizable
                    },
                    {
                        getTransformMatrix: () => { dimensions.height = value; return createSVGMatrix(); },
                        condition: name === 'height' && resizable
                    },
                    {
                        getTransformMatrix: () => createSVGMatrix(),
                        condition: true
                    }
                ].find(({ condition }) => condition);

                initialMatrix = initialMatrix.multiply(getTransformMatrix());
            });

            const resultMatrix = initialMatrix.multiply(matrix);

            this._processResize(element, { ...dimensions });
            this._updateElementView(element, ['transform', resultMatrix]);
        });
    }

    setTransformOrigin({ x, y }) {
        if (isNaN(x) && isNaN(y)) return;

        this.storage = {
            ...this.storage,
            transformOrigin: createSVGPoint(x, y)
        };
    }

}

const applyTranslate = (element, { x, y }) => {
    const attrs = [];

    switch (element.tagName.toLowerCase()) {

        case 'text': {
            const resX = isDef(element.x.baseVal[0])
                ? element.x.baseVal[0].value + x
                : (Number(element.getAttribute('x')) || 0) + x;
            const resY = isDef(element.y.baseVal[0])
                ? element.y.baseVal[0].value + y
                : (Number(element.getAttribute('y')) || 0) + y;

            attrs.push(
                ['x', resX],
                ['y', resY]
            );
            break;
        }
        case 'foreignobject':
        case 'use':
        case 'image':
        case 'rect': {
            const resX = isDef(element.x.baseVal.value)
                ? element.x.baseVal.value + x
                : (Number(element.getAttribute('x')) || 0) + x;
            const resY = isDef(element.y.baseVal.value)
                ? element.y.baseVal.value + y
                : (Number(element.getAttribute('y')) || 0) + y;

            attrs.push(
                ['x', resX],
                ['y', resY]
            );
            break;
        }
        case 'circle':
        case 'ellipse': {
            const resX = element.cx.baseVal.value + x,
                resY = element.cy.baseVal.value + y;

            attrs.push(
                ['cx', resX],
                ['cy', resY]
            );
            break;
        }
        case 'line': {
            const resX1 = element.x1.baseVal.value + x,
                resY1 = element.y1.baseVal.value + y,
                resX2 = element.x2.baseVal.value + x,
                resY2 = element.y2.baseVal.value + y;

            attrs.push(
                ['x1', resX1],
                ['y1', resY1],
                ['x2', resX2],
                ['y2', resY2]
            );
            break;
        }
        case 'polygon':
        case 'polyline': {
            const points = parsePoints(element.getAttribute('points'));
            const result = points.map(item => {
                item[0] = Number(item[0]) + x;
                item[1] = Number(item[1]) + y;

                return item.join(' ');
            }).join(' ');

            attrs.push(
                ['points', result]
            );
            break;
        }
        case 'path': {
            const path = element.getAttribute('d');

            attrs.push(['d', movePath(
                {
                    path,
                    dx: x,
                    dy: y
                }
            )]);
            break;
        }
        default:
            break;

    }

    attrs.forEach(item => {
        element.setAttribute(item[0], item[1]);
    });
};

const applyResize = (element, data) => {
    const {
        scaleX,
        scaleY,
        localCTM,
        bBox: {
            width: boxW,
            height: boxH
        },
        __data__,
        transformMatrix,
        isGrouped
    } = data;

    const attrs = [];

    const storedData = __data__.get(element);

    switch (element.tagName.toLowerCase()) {

        case 'text':
        case 'tspan': {
            const { x, y, textLength } = storedData;
            const {
                x: resX,
                y: resY
            } = pointTo(
                localCTM,
                x,
                y
            );

            attrs.push(
                ['x', resX + (scaleX < 0 ? boxW : 0)],
                ['y', resY - (scaleY < 0 ? boxH : 0)],
                ['textLength', Math.abs(scaleX * textLength)]
            );
            break;
        }
        case 'circle': {
            const { r, cx, cy } = storedData,
                newR = r * (Math.abs(scaleX) + Math.abs(scaleY)) / 2;

            const {
                x: resX,
                y: resY
            } = pointTo(
                localCTM,
                cx,
                cy
            );

            attrs.push(
                ['r', newR],
                ['cx', resX],
                ['cy', resY]
            );
            break;
        }
        case 'foreignobject':
        case 'image':
        case 'rect': {
            if (!isGrouped) {
                const { width, height, x, y } = storedData;

                const {
                    x: resX,
                    y: resY
                } = pointTo(
                    localCTM,
                    x,
                    y
                );

                const newWidth = Math.abs(width * scaleX),
                    newHeight = Math.abs(height * scaleY);

                attrs.push(
                    ['x', resX - (scaleX < 0 ? newWidth : 0)],
                    ['y', resY - (scaleY < 0 ? newHeight : 0)],
                    ['width', newWidth],
                    ['height', newHeight]
                );
            } else {
                const { matrix, childCTM } = storedData;
                const local = childCTM.inverse()
                    .multiply(transformMatrix)
                    .multiply(childCTM);

                const nextResult = matrix.multiply(local);
                // TODO: need to find how to resize rect within elements group but not to scale
                attrs.push(
                    ['transform', matrixToString(nextResult)]
                );
            }
            break;
        }
        case 'ellipse': {
            const { rx, ry, cx, cy } = storedData;

            const {
                x: cx1,
                y: cy1
            } = pointTo(
                localCTM,
                cx,
                cy
            );

            const scaleMatrix = createSVGMatrix();

            scaleMatrix.a = scaleX;
            scaleMatrix.d = scaleY;

            const {
                x: nRx,
                y: nRy
            } = pointTo(
                scaleMatrix,
                rx,
                ry
            );

            attrs.push(
                ['rx', Math.abs(nRx)],
                ['ry', Math.abs(nRy)],
                ['cx', cx1],
                ['cy', cy1]
            );
            break;
        }
        case 'line': {
            const { resX1, resY1, resX2, resY2 } = storedData;

            const {
                x: resX1_,
                y: resY1_
            } = pointTo(
                localCTM,
                resX1,
                resY1
            );

            const {
                x: resX2_,
                y: resY2_
            } = pointTo(
                localCTM,
                resX2,
                resY2
            );

            attrs.push(
                ['x1', resX1_],
                ['y1', resY1_],
                ['x2', resX2_],
                ['y2', resY2_]
            );
            break;
        }
        case 'polygon':
        case 'polyline': {
            const { points } = storedData;

            const result = parsePoints(points).map(item => {
                const {
                    x,
                    y
                } = pointTo(
                    localCTM,
                    Number(item[0]),
                    Number(item[1])
                );

                item[0] = floatToFixed(x);
                item[1] = floatToFixed(y);

                return item.join(' ');
            }).join(' ');

            attrs.push(['points', result]);
            break;
        }
        case 'path': {
            const { path } = storedData;

            attrs.push(['d', resizePath({ path, localCTM })]);
            break;
        }
        default:
            break;

    }

    attrs.forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
};

const storeElementAttributes = (element, storage, container, isGrouped) => {
    let data = null;

    switch (element.tagName.toLowerCase()) {

        case 'text': {
            const x = isDef(element.x.baseVal[0])
                ? element.x.baseVal[0].value
                : (Number(element.getAttribute('x')) || 0);
            const y = isDef(element.y.baseVal[0])
                ? element.y.baseVal[0].value
                : (Number(element.getAttribute('y')) || 0);
            const textLength = isDef(element.textLength.baseVal)
                ? element.textLength.baseVal.value
                : (Number(element.getAttribute('textLength')) || null);

            data = { x, y, textLength };
            break;
        }
        case 'circle': {
            const r = element.r.baseVal.value,
                cx = element.cx.baseVal.value,
                cy = element.cy.baseVal.value;

            data = { r, cx, cy };
            break;
        }
        case 'foreignobject':
        case 'image':
        case 'rect': {
            const width = element.width.baseVal.value,
                height = element.height.baseVal.value,
                x = element.x.baseVal.value,
                y = element.y.baseVal.value;

            data = { width, height, x, y };
            break;
        }
        case 'ellipse': {
            const rx = element.rx.baseVal.value,
                ry = element.ry.baseVal.value,
                cx = element.cx.baseVal.value,
                cy = element.cy.baseVal.value;

            data = { rx, ry, cx, cy };
            break;
        }
        case 'line': {
            const resX1 = element.x1.baseVal.value,
                resY1 = element.y1.baseVal.value,
                resX2 = element.x2.baseVal.value,
                resY2 = element.y2.baseVal.value;

            data = { resX1, resY1, resX2, resY2 };
            break;
        }
        case 'polygon':
        case 'polyline': {
            const points = element.getAttribute('points');
            data = { points };
            break;
        }
        case 'path': {
            const path = element.getAttribute('d');

            data = { path };
            break;
        }
        default:
            break;

    }

    storage.__data__.set(element, {
        ...data,
        matrix: getTransformToElement(element, element.parentNode),
        ctm: getTransformToElement(element.parentNode, container),
        childCTM: getTransformToElement(element, isGrouped ? container.parentNode : container)
    });
};

const getBoundingRect = (element, ctm, bBox = element.getBBox()) => {
    const { x, y, width, height } = bBox;

    const vertices = [
        [x, y],
        [x + width, y],
        [x + width, y + height],
        [x, y + height]
    ];

    return vertices.map(([l, t]) => {
        const { x: nx, y: ny } = pointTo(ctm, l, t);
        return [nx, ny];
    });
};
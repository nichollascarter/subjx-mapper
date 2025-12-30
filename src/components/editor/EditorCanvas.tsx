import { useState, useRef, useEffect } from 'react';
import { connect } from 'react-redux';
import { makeStyles } from '@mui/styles';

import { ZoomableGroup } from '@/components/helpers/ZoomableGroup';
import EditorContent from './EditorContent';
import EventBus from 'js-event-bus';

const useStyles = makeStyles(() => ({
  root: {
    '-webkit-box-flex': 1,
    '-ms-flex': 1,
    flex: 1,
    visibility: 'visible'
  },
  workArea: {
    overflow: 'auto'
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0
  },
  page: {
    boxShadow: '0px 0px 2px 1px #d1d1d1'
  }
}));

const canvasGrid = (paperSize: { w: number; h: number }, gridSize: number) => {
  const grid = gridSize * 10;
  return (
    <g>
      <defs>
        <pattern
          id='smallGrid'
          width={gridSize}
          height={gridSize}
          fill='white'
          patternUnits='userSpaceOnUse'
        >
          <path
            d={`M ${gridSize} 0 L 0 0 0 ${gridSize}`}
            fill='none'
            stroke='gray'
            strokeWidth='0.5'
            vectorEffect='non-scaling-stroke'
          />
        </pattern>
        <pattern id='grid' width={grid} height={grid} patternUnits='userSpaceOnUse'>
          <rect width={grid} height={grid} fill='url(#smallGrid)' />
          <path
            d={`M ${grid} 0 L 0 0 0 ${grid}`}
            fill='none'
            stroke='gray'
            strokeWidth='0.5'
            vectorEffect='non-scaling-stroke'
          />
        </pattern>
      </defs>
      <rect x='0' y='0' width={paperSize.w} height={paperSize.h} fill='url(#grid)' />
    </g>
  );
};

const mapStateToProps = (
  state:
  {
    editorAction: any;
    editorGrid: any;
    editorGridSize: any;
    editorPaperSize: any;
    eventBus: EventBus;
  }
) => (
  {
    editorAction: state.editorAction,
    editorGrid: state.editorGrid,
    editorGridSize: state.editorGridSize,
    editorPaperSize: state.editorPaperSize,
    eventBus: state.eventBus
  }
);

const EditorCanvas = (
  props: {
    editorPaperSize: any;
    eventBus: any;
    editorAction: any;
    editorGrid: any;
    editorGridSize: number;
    leftOffset: number;
    rightOffset: number;
    topOffset: number;
    children?: any;
    onLayerChange: (v: string | null) => void;
    dropLayer?: boolean;
    mouseAction: string;
  }) => {
  const classes = useStyles();
  const {
    editorAction,
    editorGrid,
    editorGridSize,
    editorPaperSize,
    rightOffset,
    children: content,
    onLayerChange,
    dropLayer
  } = props;

  const {
    width: initialW,
    height: initialH
  } = editorPaperSize;

  const [paperWidth, paperHeight] = [window.outerWidth, window.outerHeight];

  const [paperSize, setPaperSize] = useState({
    w: initialW,
    h: initialH,
    x: (paperWidth - initialW) / 2,
    y: (paperHeight - initialH) / 2
  });

  const canvasEl = useRef<SVGElement | null>(null);
  const controlsRef = useRef<SVGElement | null>(null);
  const workAreaRef = useRef<HTMLDivElement | null>(null);
  const containerAreaRef = useRef<HTMLDivElement | null>(null);
  const rootSVG = useRef<SVGElement | null>(null);

  const [localAction, setLocalAction] = useState<string | null>(null);
  const [layersBar, setLayersBar] = useState<string | null>(null);
  const [startPoint, setStartPoint] = useState({ x: 0, y: 0, scrollTop: 0, scrollLeft: 0 });

  const [dropItems, setDropItems] = useState(false);

  const scrollToRef = (ref: React.RefObject<HTMLElement | null>) => {
    const container = containerAreaRef.current;
    if (!container || !ref.current) return;

    container.scrollTop = (ref.current.clientHeight - container?.clientHeight) / 2;
    container.scrollLeft = (ref.current.clientWidth - container?.clientWidth) / 2;
  };

  useEffect(() => {
    scrollToRef(workAreaRef);
  }, [paperSize]);

  useEffect(() => {
    setPaperSize({
      w: initialW,
      h: initialH,
      x: (paperWidth - initialW) / 2,
      y: (paperHeight - initialH) / 2
    });
  }, [props.editorPaperSize]);

  useEffect(() => {
    onLayerChange?.(layersBar);
  }, [layersBar, onLayerChange]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    switch (editorAction) {

      case 'edit':
        if (controlsRef.current?.contains(e.target as HTMLDivElement)) return;

        if (!canvasEl.current?.children[0].contains(e.target as HTMLDivElement)) {
          setDropItems(true);
          props.eventBus.emit('settings', null, 'canvas');
          return setTimeout(() => setDropItems(false), 100);
        }
        break;
      case 'grab': {
        const container = containerAreaRef.current;

        setStartPoint({
          x: e.clientX,
          y: e.clientY,
          scrollTop: container?.scrollTop ?? 0,
          scrollLeft: container?.scrollLeft ?? 0
        });
        break;
      }
      case 'select':
        //onCanvasDown(e);
        break;
      case 'zoom':
        break;
      case 'drawRect':
        drawElement(e);
        break;
      default:
        break;

    }

    setLocalAction(editorAction);
  };

  const handleMouseMove = (e: { preventDefault: () => void; clientX: number; clientY: number; }) => {
    e.preventDefault();

    switch (localAction) {

      case 'grab': {
        const dx = (startPoint.x - e.clientX) * 1;
        const dy = (startPoint.y - e.clientY) * 1;

        const container = containerAreaRef.current;
        if (!container) return;
  
        container.scrollTop = startPoint.scrollTop + dy;
        container.scrollLeft = startPoint.scrollLeft + dx;
        break;
      }
      case 'zoom': {
        break;
      }
      case 'draw':
        //drawSvgElement(e);
        break;
      default:
        break;

    }
  };

  const handleMouseUp = () => {
    setLocalAction(null);
  };

  // const dropLayers = (e) => {
  //   e.stopPropagation();
  //   setParentLayer(true);
  // };

  const svgPoint = (elem: SVGSVGElement, x: any, y: any) => {
    const p = elem!.createSVGPoint();
    p.x = x;
    p.y = y;
    return p.matrixTransform(elem!.getScreenCTM()?.inverse());
  };

  const drawElement = (event: { clientX: any; clientY: any; }) => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttributeNS(null, 'stroke-width', '2');
    rect.setAttributeNS(null, 'fill', 'none');
    rect.setAttributeNS(null, 'stroke', '#000');

    const drawArea = document.getElementById('editor-background') as unknown as SVGSVGElement;

    const start = svgPoint(drawArea, event.clientX, event.clientY);
    document.getElementById('editable-content')?.appendChild(rect);

    const drawRect = (e: { clientX: any; clientY: any; }) => {
      const p = svgPoint(drawArea, e.clientX, e.clientY);
      const w = Math.abs(p.x - start.x);
      const h = Math.abs(p.y - start.y);
      if (p.x > start.x) {
        p.x = start.x;
      }

      if (p.y > start.y) {
        p.y = start.y;
      }

      rect.setAttributeNS(null, 'x', `'${p.x}'`);
      rect.setAttributeNS(null, 'y', `'${p.y}'`);
      rect.setAttributeNS(null, 'width',`'${w}'`);
      rect.setAttributeNS(null, 'height', `'${h}'`);
    };

    const endDraw = () => {
      drawArea.removeEventListener('mousemove', drawRect);
      drawArea.removeEventListener('mouseup', endDraw);
    };

    drawArea.addEventListener('mousemove', drawRect);
    drawArea.addEventListener('mouseup', endDraw);
  };

  return (
    <div className={classes.root}>
      <div
        id='work-area'
        ref={containerAreaRef}
        className={classes.workArea}
        style={{
          top: 0, // topOffset,
          left: 0, // leftOffset,
          right: rightOffset,
          bottom: 0,
          position: 'absolute',
          cursor: 'auto'
        }}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
      >
        <div
          ref={workAreaRef}
          style={{
            display: 'inline-block',
            position: 'relative',
            width: paperWidth,
            height: paperHeight
          }}
        >
          <svg
            id='editor-container'
            xmlns='http://www.w3.org/2000/svg'
            className={classes.canvas}
            width='100%'
            height='100%'
            overflow='visible'
            ref={rootSVG}
          >
            <ZoomableGroup enable={editorAction === 'zoom'}>
              <g id='content' transform={`translate(${paperSize.x}, ${paperSize.y})`}>
                <g id='editor-background'>
                  <rect id='editor-grid' x='0' y='0' width={paperSize.w} height={paperSize.h} fill='white' stroke='grey' />
                  {
                    editorGrid
                      ? canvasGrid(paperSize, editorGridSize)
                      : null
                  }
                </g>
                <g
                  id='editor-canvas'
                  ref={e => { canvasEl.current = e; }}
                  className={classes.page}
                >
                  <EditorContent
                    root={rootSVG.current}
                    editable={editorAction === 'edit'}
                    selectable={editorAction === 'select'}
                    content={content}
                    onLayerChange={(value: string) => {
                      setLayersBar(value);
                    }}
                    dropLayer={dropLayer}
                    dropItems={dropItems}
                  />
                </g>
              </g>
            </ZoomableGroup>
            <g id='controls-container' ref={div => { controlsRef.current = div; }} />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default connect(mapStateToProps)(EditorCanvas);

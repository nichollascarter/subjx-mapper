import EventBus from 'js-event-bus';
import UndoStack from '../containers/UndoStack';

const initialState = {
    editorAction: 'edit',
    editorGrid: true,
    editorGridSize: 10,
    editorPaperSize: {
        width: 800,
        height: 600
    },
    allowDragging: true,
    allowResizing: true,
    allowRotating: true,
    allowProportions: true,
    allowRestrictions: false,
    snapSteps: {
        x: 10,
        y: 10,
        angle: 15
    },
    eventBus: new EventBus(),
    undoStack: new UndoStack()
};

function rootReducer(state = { ...initialState }, action) {
    switch (action.type) {

        case 'SET_EDITOR_ACTION':
            return {
                ...state,
                editorAction: action.editorAction
            };
        case 'ACTIVATE_EDITOR_GRID':
            return {
                ...state,
                editorGrid: action.editorGrid
            };
        case 'SET_EDITOR_GRID_SIZE':
            return {
                ...state,
                editorGridSize: action.editorGridSize
            };
        case 'SET_EDITOR_PAPER_SIZE':
            return {
                ...state,
                editorPaperSize: action.editorPaperSize
            };
        case 'SET_ALLOW_DRAGGING':
            return {
                ...state,
                allowDragging: action.allowDragging
            };
        case 'SET_ALLOW_RESIZING':
            return {
                ...state,
                allowResizing: action.allowResizing
            };
        case 'SET_ALLOW_ROTATING':
            return {
                ...state,
                allowRotating: action.allowRotating
            };
        case 'SET_ALLOW_PROPORTIONS':
            return {
                ...state,
                allowProportions: action.allowProportions
            };
        case 'SET_ALLOW_RESTRICTIONS':
            return {
                ...state,
                allowRestrictions: action.allowRestrictions
            };
        case 'SET_SNAP_STEPS':
            return {
                ...state,
                snapSteps: action.snapSteps
            };
        default:
            return state;

    }
};

export default rootReducer;
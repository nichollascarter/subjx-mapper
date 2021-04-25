export function setEditorAction({ editorAction }) {
    return { type: 'SET_EDITOR_ACTION', editorAction };
}

export function activateEditorGrid({ editorGrid }) {
    return { type: 'ACTIVATE_EDITOR_GRID', editorGrid };
}

export function setEditorGridSize({ editorGridSize }) {
    return { type: 'SET_EDITOR_GRID_SIZE', editorGridSize };
}

export function setEditorPaperSize({ editorPaperSize }) {
    return { type: 'SET_EDITOR_PAPER_SIZE', editorPaperSize };
}

export function setAllowDragging({ allowDragging }) {
    return { type: 'SET_ALLOW_DRAGGING', allowDragging };
}

export function setAllowResizing({ allowResizing }) {
    return { type: 'SET_ALLOW_RESIZING', allowResizing };
}

export function setAllowRotating({ allowRotating }) {
    return { type: 'SET_ALLOW_ROTATING', allowRotating };
}

export function setAllowProportions({ allowProportions }) {
    return { type: 'SET_ALLOW_PROPORTIONS', allowProportions };
}

export function setAllowRestrictions({ allowRestrictions }) {
    return { type: 'SET_ALLOW_RESTRICTIONS', allowRestrictions };
}

export function setSnapSteps({ snapSteps }) {
    return { type: 'SET_SNAP_STEPS', snapSteps };
}

export function setSelectedItems({ items }) {
    return { type: 'SET_SELECTED_ITEMS', items };
}
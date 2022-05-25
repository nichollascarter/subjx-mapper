class UndoState {

    constructor(state, description) {
        this.state = state.getJSONString();
        this.description = description;
    }

}

export { UndoState };

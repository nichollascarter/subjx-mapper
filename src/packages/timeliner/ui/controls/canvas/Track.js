class Track {

    constructor({ x, y, w, h }, track) {
        this.track = track;

        this.paint = (ctxWrap) => {
            this.path(ctxWrap);
        };

        this.path = (ctxWrap) => {
            ctxWrap
                .beginPath()
                .rect(x, y, w, h)
                .closePath();
        };
    }

}

export default Track;

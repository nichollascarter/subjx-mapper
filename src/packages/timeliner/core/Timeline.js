import { Storage } from '../classes/Storage';

class Timeline {

    tracks = [];
    data = new Storage();
    startPlay = null;
    playedFrom = 0;
    options = {};
    cb = _ => _;

    constructor(options, cb = _ => _) {
        this.options = { ...(options || {}) };
        this.cb = cb;

        const trackStore = this.data.get('tracks');
        this.tracks = trackStore.value;
        this.trackStore = trackStore;
    }

    start() {
        this.setCurrentTime(0);
        this._animate();
    }

    pause() {
        this.startPlay = null;
    }

    _animate() {
        if (this.startPlay) return;

        const self = this;

        function animate() {
            requestAnimationFrame(animate);
            self.updateCurrentTime();
        }

        animate();
    }

    setCurrentTime(value) {
        const { startPlay, trackStore } = this;

        value = Math.max(0, value);

        if (startPlay)
            this.startPlay = performance.now() - value * 1000;

        this.cb(trackStore.value);
    }

    updateCurrentTime() {
        const time = (performance.now() - this.startPlay) / 1000;
        this.setCurrentTime(time);

        return time;
    }

    load(data) {
        this.data.setJSON(data);
        return this;
    }

    updateState() {
        const trackStore = this.data.get('tracks');
        this.tracks = trackStore.value;
        this.trackStore = trackStore;
    }

}

export { Timeline };
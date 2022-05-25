class TrackProp {

    values = [];
    _value = 0;
    _color = '#' + (Math.random() * 0xffffff | 0).toString(16);

    constructor(name) {
        this.name = name;
    }

}

export { TrackProp };

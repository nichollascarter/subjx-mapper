import { LayoutConstants } from '../consts';
import { StorageProxy } from './StorageProxy';
//import { version as TIMELINER_VERSION } from '../../package.json';

const DELIMITER = ':';
const TIMELINER_VERSION = '0.0.0';

class Storage {

    data = {
        version: TIMELINER_VERSION,
        modified: new Date().toString(),
        title: 'Untitled',
        ui: {
            currentTime: 0,
            totalTime: LayoutConstants.default_length,
            scrollTime: 0,
            timeScale: LayoutConstants.time_scale
        },
        tracks: []
    };

    listeners = [];

    addListener(path, cb) {
        this.listeners.push({
            path: path,
            callback: cb
        });
    }

    update() {
        const data = this.data;

        data.version = TIMELINER_VERSION;
        data.modified = new Date().toString();
    }

    setJSONString(data) {
        this.data = JSON.parse(data);
    }

    setJSON(data) {
        this.data = data;
    }

    getJSONString(format) {
        return JSON.stringify(this.data, null, format);
    }

    getValue(paths) {
        const descend = paths.split(DELIMITER);
        let reference = this.data;

        for (let i = 0, il = descend.length; i < il; i++) {
            const path = descend[i];
            if (reference[path] === undefined) {
                console.warn('Cant find ' + paths);
                return;
            }
            reference = reference[path];
        }

        return reference;
    }

    setValue(paths, value) {
        const descend = paths.split(DELIMITER);
        let reference = this.data;
        let path;

        for (let i = 0, il = descend.length - 1; path = descend[i], i < il; i++) {
            reference = reference[path];
        }

        reference[path] = value;

        this.listeners.forEach(function (l) {
            if (paths.indexOf(l.path) > -1)
                l.callback();
        });
    }

    get(path, suffix) {
        if (suffix)
            path = suffix + DELIMITER + path;
        return new StorageProxy(this, path);
    }

}

export { Storage };

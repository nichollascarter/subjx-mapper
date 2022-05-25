const STORAGE_PREFIX = 'timeliner-';

const firstDefined = (...args) => {
    for (let i = 0; i < args.length; i++) {
        if (typeof args[i] !== 'undefined') {
            return args[i];
        }
    }
    return undefined;
};

const setStyles = (element, ...styles) => {
    for (let i = 0; i < styles.length; ++i) {
        const style = styles[i];
        for (const s in style) {
            element.style[s] = style[s];
        }
    }
};

const saveToFile = (string, filename) => {
    const a = document.createElement('a');
    document.body.appendChild(a);
    a.style = 'display: none';

    const blob = new Blob([string], { type: 'octet/stream' }), // application/json
        url = window.URL.createObjectURL(blob);

    a.href = url;
    a.download = filename;

    fakeClick(a);

    setTimeout(function () {
        // cleanup and revoke
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 500);
};

let input, openCallback;

const handleFileSelect = (evt) => {
    const files = evt.target.files;

    const f = files[0];
    if (!f) return;
    // Can try to do MINE match
    // if (!f.type.match('application/json')) {
    //   return;
    // }
    const reader = new FileReader();

    // Closure to capture the file information.
    reader.onload = function (e) {
        const data = e.target.result;
        openCallback(data);
    };

    reader.readAsText(f);

    input.value = '';
};

const openAs = (callback, target) => {
    openCallback = callback;

    if (!input) {
        input = document.createElement('input');
        input.style.display = 'none';
        input.type = 'file';
        input.addEventListener('change', handleFileSelect);
        target = target || document.body;
        target.appendChild(input);
    }

    fakeClick(input);
};

const fakeClick = (target) => {
    const e = document.createEvent("MouseEvents");
    e.initMouseEvent(
        'click', true, false, window, 0, 0, 0, 0, 0,
        false, false, false, false, 0, null
    );
    target.dispatchEvent(e);
};

const formatFriendlySeconds = (s, type) => {
    // TODO Refactor to 60fps???
    // 20 mins * 60 sec = 1080
    // 1080s * 60fps = 1080 * 60 < Number.MAX_SAFE_INTEGER

    let raw_secs = s | 0;
    let secs_micro = s % 60;
    let secs = raw_secs % 60;
    let raw_mins = raw_secs / 60 | 0;
    let mins = raw_mins % 60;
    let hours = raw_mins / 60 | 0;

    let secs_str = (secs / 100).toFixed(2).substring(2);

    let str = mins + ':' + secs_str;

    if (s % 1 > 0) {
        let t2 = (s % 1) * 60;
        if (type === 'frames') str = secs + '+' + t2.toFixed(0) + 'f';
        else str += ((s % 1).toFixed(2)).substring(1);
        // else str = mins + ':' + secs_micro;
        // else str = secs_micro + 's'; /// .toFixed(2)
    }
    return str;
};

const randomHexColor = () => '#' + (Math.random() * 0xffffff | 0).toString(16);

const proxyCtx = (ctx) => {
    const wrapper = {};

    const proxyFn = (c) => {
        return function () {
            ctx[c].apply(ctx, arguments);
            return wrapper;
        };
    };

    const proxyProp = (c) => {
        return function (v) {
            ctx[c] = v;
            return wrapper;
        };
    };

    wrapper.run = function (args) {
        args(wrapper);
        return wrapper;
    };

    for (const c in ctx) {
        const type = typeof (ctx[c]);
        switch (type) {

            case 'object':
                break;
            case 'function':
                wrapper[c] = proxyFn(c);
                break;
            default:
                wrapper[c] = proxyProp(c);
                break;

        }
    }

    return wrapper;
};

export {
    STORAGE_PREFIX,
    firstDefined,
    setStyles,
    saveToFile,
    openAs,
    formatFriendlySeconds,
    proxyCtx,
    randomHexColor
};

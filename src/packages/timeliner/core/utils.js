import easing from './easing';

const findTimeInTrack = (track = {}, time) => {
    const values = [...(track.values || [])].sort((a, b) => a.time - b.time);

    const len = values.length;

    let start = 0;
    let end = len - 1;

    while (start <= end) {
        const middle = (start + end) >> 1;

        if (values[middle].time < time) {
            start = middle + 1;
        } else if (values[middle].time > time) {
            end = middle - 1;
        } else {
            return {
                index: middle,
                object: values[middle]
            };
        }
    }

    return start || end;
};

const findStateInTrack = (track = {}, state) => {
    const values = [...(track.values || [])].sort().reverse();

    return values.find(item => item.state === state);
};

const timeInTrack = (track, time) => {
    // Find the value of track at t seconds.
    // this expect track to be sorted
    // not the most optimized for now, but would do.

    const { values: trackValues, _mute } = track;

    const trackLength = trackValues.length;

    if (!trackLength || _mute) return;

    let prevEntry;

    // find boundary cases
    let [entry] = trackValues;

    if (time < entry.time) {
        return {
            value: entry.value,
            doEasing: false, // cannot easing
            keyframe: false // not on keyframe
        };
    }

    for (let i = 0; i < trackLength; i++) {
        prevEntry = entry;
        entry = trackValues[i];

        if (time === entry.time) {
            // only exception is on the last KF, where we display easing from prev entry
            if (i === trackLength - 1) {
                return {
                    // index: i,
                    entry: prevEntry,
                    easing: prevEntry.easing,
                    doEasing: trackLength > 1,
                    value: entry.value,
                    keyframe: true
                };
            }
            return {
                // index: i,
                entry: entry,
                easing: entry.easing,
                doEasing: trackLength > 1,
                value: entry.value,
                keyframe: true // trackLength > 1
            };
        }
        if (time < entry.time) {
            // possibly a easing
            if (!prevEntry.easing) { // or if value is none
                return {
                    value: prevEntry.value,
                    easing: false,
                    entry: prevEntry,
                    doEasing: true,
                    keyframe: false
                };
            }

            // calculate easing
            const timeDiff = entry.time - prevEntry.time;
            const valueDiff = entry.value - prevEntry.value;
            const easeName = prevEntry.easing;

            const dt = time - prevEntry.time;
            const k = dt / timeDiff;
            const nextValue = prevEntry.value + easing[easeName](k) * valueDiff;

            return {
                entry: prevEntry,
                value: nextValue,
                easing: prevEntry.easing,
                doEasing: true,
                keyframe: false
            };
        }
    }
    // time is after all entries
    return {
        value: entry.value,
        doEasing: false,
        keyframe: false
    };
};

const keyframeAtState = (track, time, states) => {
    const stateIndex = Math.trunc(time);

    const { values: trackValues } = track;

    const valueOnState = trackValues.find(({ state }) => state === states[stateIndex]);

    if (valueOnState) {
        return {
            entry: valueOnState,
            value: valueOnState.value,
            easing: valueOnState.easing || 'none',
            doEasing: true,
            keyframe: true
        };
    }

    return;
};

export {
    findTimeInTrack,
    timeInTrack,
    findStateInTrack,
    keyframeAtState
};

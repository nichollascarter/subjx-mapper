class Dispatcher {

    eventListeners = [];

    on(type, listener) {
        const { eventListeners } = this;

        if (!(type in eventListeners)) {
            eventListeners[type] = [];
        }

        const listeners = eventListeners[type];
        listeners.push(listener);
    }

    fire(type, ...args) {
        const listeners = this.eventListeners[type];
        if (!listeners)
            return;

        for (let i = 0; i < listeners.length; i++) {
            const listener = listeners[i];
            listener.apply(listener, args);
        }
    }

}

export { Dispatcher };

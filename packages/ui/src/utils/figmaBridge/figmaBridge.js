const pendingRequests = new Map();
const eventListeners = new Map();
const inMemorySessionCache = new Map();

const figmaBridge = {
  send(action, params = {}) {
    return new Promise((resolve, reject) => {
      const requestId = Math.random().toString(36).substring(2, 9);
      pendingRequests.set(requestId, { resolve, reject });
      parent.postMessage({ pluginMessage: { action, params, requestId } }, '*');
    });
  },

  addEventListener(event, callback) {
    if (!eventListeners.has(event)) eventListeners.set(event, new Set());
    eventListeners.get(event).add(callback);
    return () => eventListeners.get(event)?.delete(callback);
  },

  removeEventListeners() {
    eventListeners.clear();
  },

  getSessionStorage(key, state = {}) {
    if (inMemorySessionCache.has(key)) {
      state = inMemorySessionCache.get(key);
    } else {
      inMemorySessionCache.set(key, state);
    }
    return new Proxy({}, {
      get(_, prop) { return state[prop]; },
      set(_, prop, value) {
        state[prop] = value;
        inMemorySessionCache.set(key, state);
        return true;
      },
    });
  },

  getFigmaStorage(storageType, key, state = {}) {
    this.send('manageStorage', {
      operation: 'load',
      storageType,
      storageKey: key,
    }).then((saved) => {
      if (saved) Object.assign(state, saved);
    });
    return new Proxy({}, {
      get(_, prop) { return state[prop]; },
      set(_, prop, value) {
        state[prop] = value;
        figmaBridge.send('manageStorage', {
          operation: 'save',
          storageType,
          storageKey: key,
          data: { ...state },
        });
        return true;
      },
    });
  },

  getClientStorage(key, state = {}) {
    return this.getFigmaStorage('client', key, state);
  },

  getDocumentStorage(key, state = {}) {
    return this.getFigmaStorage('document', key, state);
  },
};

if (typeof window !== 'undefined') {
  window.addEventListener('message', (event) => {
    const message = event.data?.pluginMessage;
    if (!message) return;
    const { action, params, requestId } = message;
    if (requestId && pendingRequests.has(requestId)) {
      pendingRequests.get(requestId).resolve(params);
      pendingRequests.delete(requestId);
      return;
    }
    const listeners = eventListeners.get(action);
    if (listeners) listeners.forEach((cb) => cb(params));
  });
}

export default figmaBridge;

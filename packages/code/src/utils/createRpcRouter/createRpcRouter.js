import sendToUi from '../sendToUi/index.js';

function createRpcRouter(actions) {
  figma.ui.onmessage = async ({ action, params, requestId }) => {
    if (typeof actions[action] === 'function') {
      try {
        const result = await actions[action](params);
        if (requestId && result !== undefined) {
          sendToUi(action, result, requestId);
        }
      } catch (error) {
        console.error(`[Backend] action [${action}]:`, error);
        if (requestId) {
          sendToUi(action, { ok: false, error: error.message }, requestId);
        }
      }
    } else {
      console.warn(`[Backend] action [${action}] not found`);
    }
  };
}
export default createRpcRouter;

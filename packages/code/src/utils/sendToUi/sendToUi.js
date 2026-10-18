/**
 * Posts a low-level message to the plugin UI iframe.
 * @param {string} action
 * @param {Object} [params={}]
 * @param {string} [requestId]
 * @returns {void}
 */
function sendToUi(action, params = {}, requestId = undefined) {
  figma.ui.postMessage({ action, params, requestId });
}

export default sendToUi;

/**
 * Load/save figma.clientStorage or document pluginData.
 * @param {Object} params
 * @param {'load'|'save'} params.operation
 * @param {'client'|'document'} params.storageType
 * @param {string} params.storageKey
 * @param {Object} [params.data]
 * @returns {Promise<Object|null>}
 */
async function manageStorage({ operation, storageType, storageKey, data }) {
  if (operation === 'load') {
    if (storageType === 'document') {
      const raw = figma.root.getPluginData(storageKey);
      return raw ? JSON.parse(raw) : null;
    }
    return (await figma.clientStorage.getAsync(storageKey)) || null;
  }

  if (operation === 'save') {
    if (storageType === 'document') {
      figma.root.setPluginData(storageKey, JSON.stringify(data));
      return { ok: true };
    }
    await figma.clientStorage.setAsync(storageKey, data);
    return { ok: true };
  }

  return { ok: false, error: 'Unknown storage operation' };
}

export default manageStorage;

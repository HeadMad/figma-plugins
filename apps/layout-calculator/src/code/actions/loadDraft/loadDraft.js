/**
 * Load draft and custom presets from clientStorage.
 * @returns {Promise<object>}
 */
async function loadDraft() {
  const data = (await figma.clientStorage.getAsync('layout_calculator_draft')) || null;
  const presets =
    (await figma.clientStorage.getAsync('custom_full_layout_presets')) || {};
  return { ok: true, data, presets };
}
export default loadDraft;

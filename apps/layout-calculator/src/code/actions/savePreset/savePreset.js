/**
 * Save a named full-layout preset.
 * @param {{ name: string, stateData: object }} params
 */
async function savePreset({ name, stateData }) {
  const saved = (await figma.clientStorage.getAsync('custom_full_layout_presets')) || {};
  saved[name] = stateData;
  await figma.clientStorage.setAsync('custom_full_layout_presets', saved);
  figma.notify(`Пресет "${name}" успешно сохранен!`);
  return { ok: true, presets: saved };
}
export default savePreset;

/**
 * Delete a named preset.
 * @param {{ name: string }} params
 */
async function deletePreset({ name }) {
  const saved = (await figma.clientStorage.getAsync('custom_full_layout_presets')) || {};
  delete saved[name];
  await figma.clientStorage.setAsync('custom_full_layout_presets', saved);
  figma.notify(`Пресет "${name}" удален`);
  return { ok: true, presets: saved };
}
export default deletePreset;

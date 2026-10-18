/**
 * Resizes the plugin UI window.
 * @param {{ width?: number, height: number }} params
 * @returns {{ ok: boolean }}
 */
function resize({ width = 200, height }) {
  figma.ui.resize(width, height);
  return { ok: true };
}

export default resize;

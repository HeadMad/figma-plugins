/**
 * Converts a HEX color string to Figma RGB (0–1 channels).
 * @param {string} hex - "#0C8CE9" or "0C8CE9"
 * @returns {{ r: number, g: number, b: number }}
 */
function hexToFigmaRgb(hex) {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.substring(0, 2), 16) / 255,
    g: parseInt(cleanHex.substring(2, 4), 16) / 255,
    b: parseInt(cleanHex.substring(4, 6), 16) / 255,
  };
}

export default hexToFigmaRgb;

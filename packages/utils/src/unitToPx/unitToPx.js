import unitMultiplier from '../unitMultiplier/index.js';

/**
 * Converts a physical unit value to pixels at the given PPI.
 * @param {number} value
 * @param {number} ppi
 * @param {'mm'|'cm'|'in'|string} unit
 * @returns {number}
 */
function unitToPx(value, ppi, unit) {
  return (value / unitMultiplier(unit)) * ppi;
}

export default unitToPx;

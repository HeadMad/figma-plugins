import unitMultiplier from '../unitMultiplier/index.js';

/**
 * Converts pixels to a physical unit at the given PPI.
 * @param {number} px
 * @param {number} ppi
 * @param {'mm'|'cm'|'in'|string} unit
 * @returns {number}
 */
function pxToUnit(px, ppi, unit) {
  return (px / ppi) * unitMultiplier(unit);
}

export default pxToUnit;

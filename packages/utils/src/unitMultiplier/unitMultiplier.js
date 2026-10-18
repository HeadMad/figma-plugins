/**
 * Returns unit multiplier relative to inches (for PPI math).
 * @param {'mm'|'cm'|'in'|string} unit
 * @returns {number}
 */
function unitMultiplier(unit) {
  if (unit === 'cm') return 2.54;
  if (unit === 'in') return 1;
  return 25.4;
}

export default unitMultiplier;

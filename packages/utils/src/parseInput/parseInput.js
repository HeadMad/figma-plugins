/**
 * Parses a UI input string into a non-negative number, 'mixed', or null.
 * @param {string|null|undefined} val - Raw input value
 * @param {boolean} [allowNegative=false] - Allow negative numbers
 * @returns {number|'mixed'|null}
 */
function parseInput(val, allowNegative = false) {
  if (val == null || val === '') return null;
  if (String(val).toLowerCase() === 'mixed') return 'mixed';
  const num = parseFloat(val);
  if (Number.isNaN(num)) return null;
  if (!allowNegative && num < 0) return 0;
  return num;
}

export default parseInput;

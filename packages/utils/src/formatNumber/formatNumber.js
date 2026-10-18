/**
 * Formats a number with the given decimal precision and strips trailing zeros.
 * @param {number|string|null|undefined} num - Value to format; accepts 'mixed'
 * @param {number} [precision=2] - Decimal places
 * @returns {string} Formatted string or 'Mixed' / empty string
 */
function formatNumber(num, precision = 2) {
  if (num === 'mixed' || num === 'Mixed') return 'Mixed';
  if (num == null || Number.isNaN(num)) return '';
  const formatted = Number(num).toFixed(precision);
  return formatted.includes('.') ? String(parseFloat(formatted)) : formatted;
}

export default formatNumber;

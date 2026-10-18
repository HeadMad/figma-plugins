/**
 * Sanitizes a string for use as a download filename.
 * @param {string} [name]
 * @param {string} [fallback='export']
 * @returns {string}
 */
function safeFilename(name, fallback = 'export') {
  const s = String(name || fallback).replace(/[\\/:*?"<>|]/g, '_').trim();
  return s || fallback;
}

export default safeFilename;

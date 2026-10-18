import figmaBridge from '../figmaBridge/index.js';

/**
 * @param {HTMLElement} node
 * @returns {Function|undefined}
 */
function initAutoResize(node) {
  if (!node) return;
  const resizeObserver = new ResizeObserver(() => {
    const rect = node.getBoundingClientRect();
    figmaBridge.send('resize', {
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height) + 6,
    });
  });
  resizeObserver.observe(node);
  return () => resizeObserver.disconnect();
}
export default initAutoResize;

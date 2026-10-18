import orderedSelection from '../orderedSelection/index.js';

/**
 * Exports the current selection to PDF/JPG page payloads for the UI.
 * @param {object} msg - { mode, merge, order }
 * @param {(data: object) => void} post - postMessage callback to UI
 * @returns {Promise<void>}
 */
async function exportSelectionToPdf(msg, post) {
  const ordered = orderedSelection(figma.currentPage.selection, msg.order);

  if (!ordered.length) {
    post({ type: 'pdf-error', message: 'Nothing to export' });
    return;
  }

  const mode = msg.mode || 'vector';
  const merge = msg.merge !== false;
  const pages = [];

  try {
    for (let i = 0; i < ordered.length; i++) {
      const node = ordered[i];
      post({ type: 'pdf-progress', current: i + 1, total: ordered.length });

      const isFlatten = mode === 'flatten';
      const bytes = await node.exportAsync(
        isFlatten
          ? { format: 'JPG', constraint: { type: 'SCALE', value: 1 }, contentsOnly: true }
          : { format: 'PDF', contentsOnly: true }
      );

      pages.push({
        name: node.name || node.type,
        bytes,
        isImage: isFlatten,
        format: isFlatten ? 'JPG' : 'PDF',
        width: node.width,
        height: node.height,
      });
    }

    post({
      type: 'pdf-pages',
      pages,
      merge,
      pageName: figma.currentPage.name || 'Page',
    });
  } catch (err) {
    post({ type: 'pdf-error', message: err.message || 'Export failed' });
  }
}

export default exportSelectionToPdf;

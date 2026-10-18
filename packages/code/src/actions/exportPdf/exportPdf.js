import sendToUi from '../../utils/sendToUi/index.js';

/**
 * Exports selection nodes to PDF/JPG page payloads for the UI.
 * @param {{ mode?: string, merge?: boolean, order?: string[] }} msg
 * @returns {Promise<Object>}
 */
async function exportPdf(msg) {
  const sel = figma.currentPage.selection.filter(
    (n) => typeof n.exportAsync === 'function'
  );
  const byId = Object.fromEntries(sel.map((n) => [n.id, n]));
  let ordered = (msg.order || []).map((id) => byId[id]).filter(Boolean);
  if (!ordered.length) ordered = sel;

  if (!ordered.length) {
    return { ok: false, error: 'Nothing to export' };
  }

  const mode = msg.mode || 'vector';
  const merge = msg.merge !== false;
  const pages = [];

  try {
    for (let i = 0; i < ordered.length; i++) {
      const node = ordered[i];
      sendToUi('pdf-progress', { current: i + 1, total: ordered.length });

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

    return {
      ok: true,
      pages,
      merge,
      pageName: figma.currentPage.name || 'Page',
    };
  } catch (err) {
    return { ok: false, error: err.message || 'Export failed' };
  }
}

export default exportPdf;

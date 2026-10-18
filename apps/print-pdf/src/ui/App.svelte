<script>
  import {
    SelectionList,
    RadioGroup,
    PrimaryButton,
    Toast,
    showToast,
  } from '@ui';
  import { figma } from '@ui/utils/figmaBridge/index.js';
  import { safeFilename, mergeSelectionOrder } from '@utils';
  import { PDFDocument } from 'pdf-lib';

  let items = $state([]);
  let pageName = $state('Page');
  let mergeOn = $state(true);
  let mode = $state('flatten');
  let outlineOn = $state(false);
  let busy = $state(false);
  let label = $state('Export PDF');

  const modeOptions = [
    { value: 'flatten', label: 'Flatten' },
    { value: 'vector', label: 'Vector' },
  ];

  function toBytes(d) {
    return d instanceof Uint8Array ? d : new Uint8Array(d);
  }

  async function embedPage(doc, p) {
    const bytes = toBytes(p.bytes);
    if (p.isImage) {
      const img =
        p.format === 'JPG' ? await doc.embedJpg(bytes) : await doc.embedPng(bytes);
      const page = doc.addPage([p.width, p.height]);
      page.drawImage(img, { x: 0, y: 0, width: p.width, height: p.height });
    } else {
      const src = await PDFDocument.load(bytes);
      (await doc.copyPages(src, src.getPageIndices())).forEach((pg) => doc.addPage(pg));
    }
  }

  function download(bytes, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function startExport() {
    if (!items.length) return;
    busy = true;
    label = '0 / ' + items.length;
    const res = await figma.send('printExport', {
      mode,
      merge: mergeOn,
      outline: outlineOn,
      order: items.map((n) => n.id),
    });
    if (!res?.ok) {
      busy = false;
      label = 'Export PDF';
      showToast(res?.error || 'Export failed', 'error');
      return;
    }
    try {
      const pages = res.pages || [];
      if (res.merge !== false) {
        const doc = await PDFDocument.create();
        for (const p of pages) await embedPage(doc, p);
        download(await doc.save(), safeFilename(res.pageName || pageName) + '.pdf');
      } else {
        for (const p of pages) {
          const doc = await PDFDocument.create();
          await embedPage(doc, p);
          download(await doc.save(), safeFilename(p.name) + '.pdf');
          await new Promise((r) => setTimeout(r, 220));
        }
      }
    } catch (err) {
      showToast('PDF error: ' + (err.message || err), 'error');
    }
    busy = false;
    label = 'Export PDF';
  }

  $effect(() => {
    const offSel = figma.addEventListener('selectionchange', (data) => {
      const incoming = data.nodes || [];
      const prevIds = items.map((n) => n.id);
      items = mergeSelectionOrder(prevIds, incoming);
      pageName = data.pageName || 'Page';
      if (!busy) label = 'Export PDF';
    });
    const offProg = figma.addEventListener('pdf-progress', (data) => {
      label = `${data.current} / ${data.total}`;
    });
    return () => {
      offSel();
      offProg();
    };
  });
</script>

<Toast />
<div class="panel">
  <section class="section">
    <div class="section-title">Selection</div>
    <label class="check-row">
      <input type="checkbox" bind:checked={mergeOn} />
      <span>Merge into one multi-page PDF</span>
    </label>
    <div class="list-wrap">
      <SelectionList bind:items emptyText="Select objects on canvas" />
    </div>
  </section>

  <section class="section">
    <div class="section-title">Settings</div>
    <RadioGroup name="mode" bind:value={mode} options={modeOptions} />
    {#if mode === 'vector'}
      <label class="check-row" style="margin-top: 8px;">
        <input type="checkbox" bind:checked={outlineOn} />
        <span>Convert fonts to outlines</span>
      </label>
      <p class="hint">Clones frame on top, flattens text, then removes clone.</p>
    {/if}
  </section>

  <div class="footer">
    <PrimaryButton disabled={busy || !items.length} onclick={startExport}>
      {label}
    </PrimaryButton>
  </div>
</div>

<style>
  .panel {
    min-height: 100%;
  }
  .section {
    padding: 12px;
    border-bottom: 1px solid var(--figma-color-border);
  }
  .section-title {
    margin-bottom: 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--figma-color-text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }
  .check-row {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 28px;
    cursor: pointer;
    font-size: 11px;
  }
  .list-wrap {
    margin-top: 8px;
  }
  .hint {
    margin-top: 6px;
    font-size: 10px;
    line-height: 14px;
    color: var(--figma-color-text-tertiary);
  }
  .footer {
    padding: 12px;
  }
</style>

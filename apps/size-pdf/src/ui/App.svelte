<script>
  import {
    FieldInput,
    IconButton,
    Popover,
    SelectField,
    RadioGroup,
    SelectionList,
    PrimaryButton,
  } from '@ui';
  import {
    formatNumber,
    parseInput,
    unitMultiplier,
    pxToUnit,
    unitToPx,
    safeFilename,
    mergeSelectionOrder,
  } from '@utils';
  import { figma } from '@ui/utils/figmaBridge/index.js';
  import clickOutside from '@ui/utils/clickOutside/index.js';
  import { Toast, showToast } from '@ui';
  import settings from './settings.svelte.js';
  import session from './session.svelte.js';
  import { PDFDocument } from 'pdf-lib';

  const H_CONV = 155;
  const H_EDIT = 230;
  const H_EDIT_RAD = 290;
  const WINDOW_WIDTH = 200;

  let settingsOpen = $state(false);
  let pdfOpen = $state(false);
  let pdfBusy = $state(false);
  let pdfLabel = $state('Export PDF');
  let convUnit = $state('10');
  let convPx = $state('118.11');
  let ppiBusy = false;

  /** @type {Record<string, number|string>} */
  let cachedPx = $state({ w: 0, h: 0, s: 0, r: 0, tl: 0, tr: 0, br: 0, bl: 0 });

  const unitOptions = [
    { value: 'mm', label: 'mm' },
    { value: 'cm', label: 'cm' },
    { value: 'in', label: 'in' },
  ];
  const modeOptions = [
    { value: 'vector', label: 'Vector' },
    { value: 'flatten', label: 'Flatten' },
  ];
  const outOptions = [
    { value: 'merge', label: 'One file' },
    { value: 'sep', label: 'Separate' },
  ];

  const precision = $derived(Number(settings.round) || 2);
  const decLabel = $derived(
    precision === 0 ? '0' : precision === 1 ? '0.0' : precision === 2 ? '0.00' : '0.000'
  );

  function fmt(n) {
    return formatNumber(n, precision);
  }

  function resizeUI() {
    const height = !session.hasSelection
      ? H_CONV
      : session.radOpen
        ? H_EDIT_RAD
        : H_EDIT;
    figma.send('resize', { width: WINDOW_WIDTH, height });
  }

  function fromUnit() {
    const p = Number(settings.ppi) || 300;
    const m = unitMultiplier(settings.unit);
    convPx = fmt((Math.max(0, parseFloat(convUnit) || 0) / m) * p);
  }

  function fromPx() {
    const p = Number(settings.ppi) || 300;
    const m = unitMultiplier(settings.unit);
    convUnit = fmt(((Math.max(0, parseFloat(convPx) || 0) / p) * m));
  }

  async function sendLayout(isMainRadius = false) {
    if (!session.hasSelection) return;
    const p = Number(settings.ppi) || 300;
    const unit = settings.unit;
    const wv = parseInput(session.width);
    const hv = parseInput(session.height);

    await figma.send('applyLayout', {
      width: typeof wv === 'number' ? unitToPx(wv, p, unit) : wv,
      height: typeof hv === 'number' ? unitToPx(hv, p, unit) : hv,
      radius:
        parseInput(session.radius) !== 'mixed' && session.radius !== ''
          ? unitToPx(parseFloat(session.radius), p, unit)
          : null,
      radiusIndividual: {
        tl:
          parseInput(session.rTL) !== 'mixed' && session.rTL !== ''
            ? unitToPx(parseFloat(session.rTL), p, unit)
            : null,
        tr:
          parseInput(session.rTR) !== 'mixed' && session.rTR !== ''
            ? unitToPx(parseFloat(session.rTR), p, unit)
            : null,
        br:
          parseInput(session.rBR) !== 'mixed' && session.rBR !== ''
            ? unitToPx(parseFloat(session.rBR), p, unit)
            : null,
        bl:
          parseInput(session.rBL) !== 'mixed' && session.rBL !== ''
            ? unitToPx(parseFloat(session.rBL), p, unit)
            : null,
      },
      strokeWeight:
        session.stroke !== 'mixed' && session.stroke !== ''
          ? unitToPx(parseFloat(session.stroke), p, unit)
          : null,
      constrainProportions: session.locked,
      isMainRadiusChanged: isMainRadius,
    });
  }

  function onWidth(v) {
    session.width = v;
    const n = Math.max(0, parseFloat(v) || 0);
    if (session.locked && n && session.ratio) session.height = fmt(n / session.ratio);
    sendLayout();
  }

  function onHeight(v) {
    session.height = v;
    const n = Math.max(0, parseFloat(v) || 0);
    if (session.locked && n && session.ratio) session.width = fmt(n * session.ratio);
    sendLayout();
  }

  async function toggleLock() {
    session.locked = !session.locked;
    await figma.send('setConstrainProportions', {
      constrainProportions: session.locked,
    });
  }

  function swapWH() {
    const t = session.width;
    session.width = session.height;
    session.height = t;
    sendLayout();
  }

  function onRadius(v) {
    session.radius = v;
    if (String(v).toLowerCase() !== 'mixed') {
      const n = Math.max(0, parseFloat(v) || 0);
      session.rTL = session.rTR = session.rBR = session.rBL = String(n);
    }
    sendLayout(true);
  }

  function onCorner(which, v) {
    if (which === 'tl') session.rTL = v;
    if (which === 'tr') session.rTR = v;
    if (which === 'br') session.rBR = v;
    if (which === 'bl') session.rBL = v;
    if (
      session.rTL === session.rTR &&
      session.rTL === session.rBR &&
      session.rTL === session.rBL
    ) {
      session.radius = session.rTL;
    } else {
      session.radius = 'Mixed';
    }
    sendLayout(false);
  }

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
    if (!session.hasSelection || !session.items?.length) return;
    pdfBusy = true;
    pdfLabel = '…';
    const res = await figma.send('exportPdf', {
      mode: settings.pdfMode,
      merge: settings.pdfOut === 'merge',
      order: session.items.map((n) => n.id),
    });

    if (!res?.ok) {
      pdfBusy = false;
      pdfLabel = 'Export PDF';
      pdfOpen = false;
      showToast(res?.error || 'Export failed', 'error');
      return;
    }

    try {
      const pages = res.pages || [];
      if (res.merge !== false) {
        const doc = await PDFDocument.create();
        for (const p of pages) await embedPage(doc, p);
        download(await doc.save(), safeFilename(res.pageName || 'Page') + '.pdf');
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

    pdfBusy = false;
    pdfLabel = 'Export PDF';
    pdfOpen = false;
  }

  function applyMetrics(msg) {
    if (ppiBusy) {
      session.hasSelection = !!msg.hasSelection;
      return;
    }

    if (!msg.hasSelection && session.hasSelection) {
      session.radOpen = false;
    }
    session.hasSelection = !!msg.hasSelection;

    if (!session.hasSelection) {
      session.items = [];
      settingsOpen = false;
      pdfOpen = false;
      resizeUI();
      fromUnit();
      return;
    }

    const incoming = msg.items || [];
    const prevIds = (session.items || []).map((n) => n.id);
    session.items = mergeSelectionOrder(prevIds, incoming);

    resizeUI();

    cachedPx = {
      w: msg.width,
      h: msg.height,
      s: msg.strokeWeight,
      r: msg.radius,
      tl: msg.rIndividual?.tl,
      tr: msg.rIndividual?.tr,
      br: msg.rIndividual?.br,
      bl: msg.rIndividual?.bl,
    };

    const p = Number(settings.ppi) || 300;
    const unit = settings.unit;
    session.width =
      msg.width === 'mixed' ? 'Mixed' : fmt(pxToUnit(msg.width, p, unit));
    session.height =
      msg.height === 'mixed' ? 'Mixed' : fmt(pxToUnit(msg.height, p, unit));
    session.stroke =
      msg.strokeWeight === 'mixed'
        ? 'Mixed'
        : fmt(pxToUnit(msg.strokeWeight, p, unit));
    session.radius =
      msg.radius === 'mixed' ? 'Mixed' : fmt(pxToUnit(msg.radius, p, unit));
    session.rTL =
      msg.rIndividual?.tl === 'mixed'
        ? 'Mixed'
        : fmt(pxToUnit(msg.rIndividual?.tl, p, unit));
    session.rTR =
      msg.rIndividual?.tr === 'mixed'
        ? 'Mixed'
        : fmt(pxToUnit(msg.rIndividual?.tr, p, unit));
    session.rBR =
      msg.rIndividual?.br === 'mixed'
        ? 'Mixed'
        : fmt(pxToUnit(msg.rIndividual?.br, p, unit));
    session.rBL =
      msg.rIndividual?.bl === 'mixed'
        ? 'Mixed'
        : fmt(pxToUnit(msg.rIndividual?.bl, p, unit));

    session.ratio =
      typeof msg.width === 'number' && typeof msg.height === 'number' && msg.height
        ? msg.width / msg.height
        : 1;
    session.locked = !!msg.constrainProportions;
  }

  $effect(() => {
    const offSelection = figma.addEventListener('selectionchange', applyMetrics);
    const offProgress = figma.addEventListener('pdf-progress', (data) => {
      pdfLabel = `${data.current} / ${data.total}`;
    });
    return () => {
      offSelection();
      offProgress();
    };
  });
</script>

<Toast />
<div class="app">
  <div class="panel-section row-3col" style="position: relative; align-items: center;">
    <FieldInput
      value={String(settings.ppi)}
      prefix="PPI"
      step={1}
      min={1}
      padLeft="28px"
      oninput={(v) => {
        settings.ppi = Math.max(1, parseInt(String(v).replace(/\D/g, '')) || 300);
        ppiBusy = true;
        if (session.hasSelection) sendLayout();
        else fromUnit();
        setTimeout(() => {
          ppiBusy = false;
        }, 50);
      }}
    />
    <SelectField
      value={settings.unit}
      options={unitOptions}
      onchange={(v) => {
        settings.unit = v;
        if (!session.hasSelection) {
          fromPx();
          return;
        }
        const p = Number(settings.ppi) || 300;
        if (cachedPx.w !== 'mixed') session.width = fmt(pxToUnit(/** @type {number} */ (cachedPx.w), p, v));
        if (cachedPx.h !== 'mixed') session.height = fmt(pxToUnit(/** @type {number} */ (cachedPx.h), p, v));
        if (cachedPx.s !== 'mixed') session.stroke = fmt(pxToUnit(/** @type {number} */ (cachedPx.s), p, v));
        if (cachedPx.r !== 'mixed') session.radius = fmt(pxToUnit(/** @type {number} */ (cachedPx.r), p, v));
      }}
    />
    <div class="popover-anchor" style="position: relative;" {@attach clickOutside(() => { settingsOpen = false; })}>
      <IconButton
        title="Settings"
        active={settingsOpen}
        onclick={(e) => {
          e.stopPropagation();
          settingsOpen = !settingsOpen;
          pdfOpen = false;
        }}
      >
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path
            fill="var(--color-icon)"
            d="M8.5 18a.5.5 0 0 0 .5-.5v-1.55a2.5 2.5 0 0 0 0-4.9V6.5a.5.5 0 0 0-1 0v4.55a2.501 2.501 0 0 0 0 4.9v1.55a.5.5 0 0 0 .5.5m7 0a.5.5 0 0 0 .5-.5v-4.55a2.501 2.501 0 0 0 0-4.9V6.5a.5.5 0 0 0-1 0v1.55a2.5 2.5 0 0 0 0 4.9v4.55a.5.5 0 0 0 .5.5m0-6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3m-7 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3"
          />
        </svg>
      </IconButton>
      <Popover bind:open={settingsOpen} width="124px">
        <div class="ph">
          <span>Decimals</span>
          <span class="pv">{decLabel}</span>
        </div>
        <input
          type="range"
          min="0"
          max="3"
          step="1"
          value={settings.round}
          oninput={(e) => {
            settings.round = +e.currentTarget.value;
            if (session.hasSelection) sendLayout();
            else fromUnit();
          }}
        />
      </Popover>
    </div>
  </div>

  {#if session.hasSelection}
    <div class="panel-section" style="padding-top: 0; padding-bottom: 0; position: relative;">
      <div class="row-3col" style="align-items: start; margin-bottom: 8px;">
        <div style="grid-column: 1 / 3;">
          <SelectionList bind:items={session.items} />
        </div>
        <div class="popover-anchor" style="position: relative;" {@attach clickOutside(() => { pdfOpen = false; })}>
          <IconButton
            title="Export PDF"
            active={pdfOpen}
            loading={pdfBusy}
            onclick={(e) => {
              e.stopPropagation();
              pdfOpen = !pdfOpen;
              settingsOpen = false;
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                fill="var(--color-icon)"
                d="M12 4.5a.5.5 0 0 1 .5.5v8.3l2.15-2.15a.5.5 0 0 1 .7.7l-3 3a.5.5 0 0 1-.7 0l-3-3a.5.5 0 1 1 .7-.7L11.5 13.3V5a.5.5 0 0 1 .5-.5M6.5 16a.5.5 0 0 0-.5.5v1c0 .83.67 1.5 1.5 1.5h9c.83 0 1.5-.67 1.5-1.5v-1a.5.5 0 0 0-1 0v1a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 0-.5-.5"
              />
            </svg>
          </IconButton>
          <Popover bind:open={pdfOpen} width="160px" top="28px">
            <div class="pdf-opts">
              <RadioGroup name="mode" bind:value={settings.pdfMode} options={modeOptions} />
              <RadioGroup name="out" bind:value={settings.pdfOut} options={outOptions} />
            </div>
            <PrimaryButton disabled={pdfBusy} onclick={startExport}>
              {pdfLabel}
            </PrimaryButton>
          </Popover>
        </div>
      </div>
    </div>

    <div class="panel-section" style="padding-top: 0;">
      <div class="section-title">Layout</div>
      <div class="row-3col ratio-row" style="position: relative;">
        <div class="ratio-bridge" class:on={session.locked}></div>
        <FieldInput value={session.width} prefix="W" step={0.1} min={0} oninput={onWidth} />
        <FieldInput value={session.height} prefix="H" step={0.1} min={0} oninput={onHeight} />
        <IconButton
          title={session.locked ? 'Unlock ratio' : 'Lock ratio'}
          active={session.locked}
          onclick={toggleLock}
        >
          <svg viewBox="0 0 24 24" fill="#ccc">
            <path
              fill="var(--color-icon)"
              fill-rule="evenodd"
              d="M7.5 7h9a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5M6 7.5A1.5 1.5 0 0 1 7.5 6h9A1.5 1.5 0 0 1 18 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 16.5z"
              clip-rule="evenodd"
            />
          </svg>
        </IconButton>
        <div class="swap">
          <IconButton title="Swap" onclick={swapWH}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M8.5 9.5H15.5M15.5 9.5L13.5 7.5M15.5 9.5L13.5 11.5M15.5 14.5H8.5M8.5 14.5L10.5 12.5M8.5 14.5L10.5 16.5"
                stroke="var(--color-icon)"
                stroke-width="1.2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </IconButton>
        </div>
      </div>

      <div class="row-3col" style="margin-top: 10px;">
        <div class="field-group">
          <span class="field-label">Stroke weight</span>
          <FieldInput
            value={session.stroke}
            prefix="—"
            step={1}
            min={0}
            oninput={(v) => {
              session.stroke = v;
              sendLayout();
            }}
          />
        </div>
        <div class="field-group">
          <span class="field-label">Corner Radius</span>
          <FieldInput value={session.radius} prefix="R" step={1} min={0} oninput={onRadius} />
        </div>
        <IconButton
          title="Individual radii"
          active={session.radOpen}
          onclick={() => {
            session.radOpen = !session.radOpen;
            resizeUI();
          }}
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path fill="var(--color-icon)" d="M6.5 14a.5.5 0 0 1 .5.5v.6c0 .428 0 .72.019.945.017.219.05.331.09.41.096.187.249.34.437.436.078.04.19.073.41.09.224.019.516.019.944.019h.6a.5.5 0 0 1 0 1h-.621c-.402 0-.734 0-1.005-.023-.281-.022-.54-.071-.782-.195a2 2 0 0 1-.874-.874c-.124-.242-.173-.501-.196-.782A13 13 0 0 1 6 15.121V14.5a.5.5 0 0 1 .5-.5" />
          </svg>
        </IconButton>
      </div>

      {#if session.radOpen}
        <div class="row-3col" style="margin-top: 4px;">
          <FieldInput value={session.rTL} prefix="TL" step={1} min={0} oninput={(v) => onCorner('tl', v)} />
          <FieldInput value={session.rTR} prefix="TR" step={1} min={0} oninput={(v) => onCorner('tr', v)} />
          <div></div>
        </div>
        <div class="row-3col">
          <FieldInput value={session.rBL} prefix="BL" step={1} min={0} oninput={(v) => onCorner('bl', v)} />
          <FieldInput value={session.rBR} prefix="BR" step={1} min={0} oninput={(v) => onCorner('br', v)} />
          <div></div>
        </div>
      {/if}
    </div>
  {:else}
    <div class="panel-section" style="padding-top: 0;">
      <div class="section-title">Quick Converter</div>
      <div class="row-3col">
        <FieldInput
          value={convUnit}
          prefix={settings.unit}
          step={1}
          min={0}
          padLeft="36px"
          oninput={(v) => {
            convUnit = v;
            fromUnit();
          }}
        />
        <FieldInput
          value={convPx}
          prefix="px"
          step={1}
          min={0}
          oninput={(v) => {
            convPx = v;
            fromPx();
          }}
        />
        <div></div>
      </div>
    </div>
    <div class="hint-text">
      Select an object on the canvas<br />to edit its properties.
    </div>
  {/if}
</div>

<style>
  .app {
    min-height: 100%;
  }

  .field-group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    width: 100%;
  }

  .field-label {
    padding-left: 2px;
    font-size: 10px;
    font-weight: 500;
    color: var(--color-muted);
    white-space: nowrap;
  }

  .ph {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 9px;
    font-weight: 600;
    color: var(--color-muted);
    text-transform: uppercase;
  }

  .pv {
    font-size: 10px;
    font-weight: 600;
    color: var(--color-primary);
  }

  input[type='range'] {
    width: 100%;
    margin: 8px 0 0;
    background: transparent;
    -webkit-appearance: none;
  }

  input[type='range']::-webkit-slider-runnable-track {
    height: 1px;
    background: var(--color-primary-light);
  }

  input[type='range']::-webkit-slider-thumb {
    width: 9px;
    height: 9px;
    margin-top: -4px;
    border: 2px solid var(--color-primary);
    border-radius: 50%;
    background: var(--bg-main);
    cursor: pointer;
    -webkit-appearance: none;
  }

  .pdf-opts {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 8px;
  }

  .ratio-bridge {
    position: absolute;
    left: var(--width-field);
    display: none;
    width: var(--row-gap);
    height: 24px;
    background: var(--bg-field);

    &.on {
      display: block;
    }

    &::before,
    &::after {
      content: '';
      position: absolute;
      width: 100%;
      height: 6px;
      background: var(--bg-main);
    }

    &::before {
      top: 0;
      border-radius: 0 0 2px 2px;
    }

    &::after {
      bottom: 0;
      border-radius: 2px 2px 0 0;
    }
  }

  .swap {
    position: absolute;
    left: calc(var(--width-field) - 12px + var(--row-gap) / 2);
    width: 24px;
    height: 24px;
  }
</style>

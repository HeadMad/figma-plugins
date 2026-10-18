<script>
  import { figma } from '@pkg/ui/utils/figmaBridge/index.js';
  import { FieldInput, PrimaryButton, SelectField, Toast, showToast } from '@pkg/ui';
  import { unitMultiplier } from '@pkg/utils';

  let unit = $state('px');
  let ppi = $state(300);
  let frameW = $state('1200');
  let frameH = $state('800');
  let padding = $state('40');
  let cardW = $state('200');
  let cardH = $state('200');
  let gap = $state('20');
  let countX = $state('3');
  let countY = $state('2');
  let createCards = $state(true);
  let addGrid = $state(true);
  let cardColor = $state('#e0e0e0');
  let alignH = $state('CENTER');
  let alignV = $state('CENTER');
  let activeInputMode = $state('size');
  let currentPresetName = $state('Custom');
  let presetName = $state('Custom');
  /** @type {Record<string, object>} */
  let presets = $state({});
  let presetsOpen = $state(false);

  const unitOptions = [
    { value: 'px', label: 'px' },
    { value: 'mm', label: 'mm' },
  ];
  const alignHOptions = [
    { value: 'START', label: 'Start' },
    { value: 'CENTER', label: 'Center' },
    { value: 'END', label: 'End' },
    { value: 'SPACE_BETWEEN', label: 'Space' },
  ];
  const alignVOptions = [
    { value: 'START', label: 'Start' },
    { value: 'CENTER', label: 'Center' },
    { value: 'END', label: 'End' },
    { value: 'SPACE_BETWEEN', label: 'Space' },
  ];

  function toPx(val) {
    const n = parseFloat(val) || 0;
    if (unit === 'mm') return (n / 25.4) * (Number(ppi) || 300);
    return n;
  }

  function fromPx(px) {
    if (unit === 'mm') return ((px / (Number(ppi) || 300)) * 25.4).toFixed(2);
    return String(Math.round(px));
  }

  function snapshot() {
    return {
      frameW: toPx(frameW),
      frameH: toPx(frameH),
      padding: toPx(padding),
      cardW: toPx(cardW),
      cardH: toPx(cardH),
      gap: toPx(gap),
      countX,
      countY,
      createCards,
      addGrid,
      cardColor,
      alignH,
      alignV,
      activeInputMode,
      currentPresetName: presetName,
      ppi: Number(ppi) || 300,
      unit,
    };
  }

  function applyState(data) {
    if (!data) return;
    unit = data.unit || 'px';
    ppi = String(data.ppi || 300);
    frameW = fromPx(data.frameW);
    frameH = fromPx(data.frameH);
    padding = fromPx(data.padding);
    cardW = fromPx(data.cardW);
    cardH = fromPx(data.cardH);
    gap = fromPx(data.gap);
    countX = String(data.countX ?? 3);
    countY = String(data.countY ?? 2);
    createCards = data.createCards !== false;
    addGrid = !!data.addGrid;
    cardColor = data.cardColor || '#e0e0e0';
    alignH = data.alignH || 'CENTER';
    alignV = data.alignV || 'CENTER';
    activeInputMode = data.activeInputMode || 'size';
    presetName = data.currentPresetName || 'Custom';
    currentPresetName = presetName;
  }

  function names() {
    const u = unit === 'mm' ? 'мм' : 'px';
    return {
      frameStr: `${frameW}×${frameH}${u}`,
      cardStr: `${cardW}×${cardH}${u}`,
    };
  }

  async function persistDraft() {
    await figma.send('saveDraft', { data: snapshot() });
  }

  async function onCreate() {
    await persistDraft();
    const res = await figma.send('createLayout', { data: snapshot(), names: names() });
    if (!res?.ok) showToast(res?.error || 'Ошибка создания', 'error');
  }

  async function onSavePreset() {
    const name = (presetName || 'Custom').trim();
    if (!name) return;
    const res = await figma.send('savePreset', { name, stateData: snapshot() });
    if (res?.presets) presets = res.presets;
    currentPresetName = name;
  }

  async function onDeletePreset(name) {
    const res = await figma.send('deletePreset', { name });
    if (res?.presets) presets = res.presets;
    if (presetName === name) presetName = 'Custom';
  }

  function loadPreset(name) {
    const data = presets[name];
    if (data) {
      applyState(data);
      presetName = name;
      currentPresetName = name;
    }
    presetsOpen = false;
  }

  function swapFrame() {
    const t = frameW;
    frameW = frameH;
    frameH = t;
  }
  function swapCard() {
    const t = cardW;
    cardW = cardH;
    cardH = t;
  }

  $effect(() => {
    figma.send('loadDraft').then((res) => {
      if (res?.data) applyState(res.data);
      if (res?.presets) presets = res.presets;
    });
  });
</script>

<Toast />
<div class="panel">
  <header class="header">
    <div class="preset">
      <input class="preset-input" bind:value={presetName} onfocus={() => (presetsOpen = true)} />
      <button type="button" class="icon" title="Presets" onclick={() => (presetsOpen = !presetsOpen)}>▾</button>
      {#if presetsOpen}
        <div class="menu">
          {#each Object.keys(presets) as name}
            <div class="menu-item">
              <button type="button" onclick={() => loadPreset(name)}>{name}</button>
              <button type="button" class="del" onclick={() => onDeletePreset(name)}>×</button>
            </div>
          {:else}
            <div class="menu-empty">Нет пресетов</div>
          {/each}
        </div>
      {/if}
    </div>
    <button type="button" class="icon" title="Save preset" onclick={onSavePreset}>💾</button>
    <SelectField bind:value={unit} options={unitOptions} onchange={() => persistDraft()} />
  </header>

  {#if unit === 'mm'}
    <div class="row">
      <FieldInput bind:value={ppi} prefix="PPI" step={1} min={1} oninput={() => persistDraft()} />
    </div>
  {/if}

  <div class="section-title">Frame</div>
  <div class="row">
    <FieldInput bind:value={frameW} prefix="W" step={1} min={1} oninput={() => persistDraft()} />
    <button type="button" class="swap" onclick={swapFrame} title="Swap">⇄</button>
    <FieldInput bind:value={frameH} prefix="H" step={1} min={1} oninput={() => persistDraft()} />
  </div>
  <div class="row">
    <FieldInput bind:value={padding} prefix="Pad" step={1} min={0} oninput={() => persistDraft()} />
  </div>

  <div class="section-title">Grid</div>
  <div class="row">
    <FieldInput bind:value={countX} prefix="Cols" step={1} min={1} oninput={() => persistDraft()} />
    <FieldInput bind:value={countY} prefix="Rows" step={1} min={1} oninput={() => persistDraft()} />
    <FieldInput bind:value={gap} prefix="Gap" step={1} min={0} oninput={() => persistDraft()} />
  </div>

  <div class="section-title">Card</div>
  <div class="row">
    <FieldInput bind:value={cardW} prefix="W" step={1} min={1} oninput={() => persistDraft()} />
    <button type="button" class="swap" onclick={swapCard} title="Swap">⇄</button>
    <FieldInput bind:value={cardH} prefix="H" step={1} min={1} oninput={() => persistDraft()} />
  </div>

  <div class="row checks">
    <label><input type="checkbox" bind:checked={createCards} onchange={() => persistDraft()} /> Cards</label>
    <label><input type="checkbox" bind:checked={addGrid} onchange={() => persistDraft()} /> Grid</label>
    <label class="color">
      Color
      <input type="color" bind:value={cardColor} onchange={() => persistDraft()} />
    </label>
  </div>

  <div class="section-title">Align</div>
  <div class="row">
    <SelectField bind:value={alignH} options={alignHOptions} onchange={() => persistDraft()} />
    <SelectField bind:value={alignV} options={alignVOptions} onchange={() => persistDraft()} />
  </div>

  <PrimaryButton onclick={onCreate}>Создать макет</PrimaryButton>
</div>

<style>
  .panel {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    width: 280px;
    font-size: 11px;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 4px;
    margin: -10px -10px 4px;
    padding: 6px 10px;
    background: #fafafa;
    border-bottom: 1px solid #eaeaea;
  }
  .preset {
    position: relative;
    display: flex;
    align-items: center;
    width: 140px;
  }
  .preset-input {
    width: 115px;
    height: 20px;
    padding: 2px 4px;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    font-size: 11px;
    color: #888;
  }
  .preset-input:focus {
    border-color: var(--color-primary);
    background: #fff;
    color: #111;
    outline: none;
  }
  .icon {
    padding: 4px;
    border: none;
    border-radius: 3px;
    background: none;
    color: #b3b3b3;
    cursor: pointer;
  }
  .icon:hover {
    background: #eee;
    color: #333;
  }
  .menu {
    position: absolute;
    top: 28px;
    left: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    width: 160px;
    max-height: 180px;
    overflow-y: auto;
    padding: 4px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: #fff;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  .menu-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .menu-item button {
    flex: 1;
    padding: 5px 10px;
    border: none;
    background: none;
    font-size: 11px;
    text-align: left;
    cursor: pointer;
  }
  .menu-item button:hover {
    background: #f0f0f0;
  }
  .del {
    flex: 0 !important;
    color: #f24822 !important;
  }
  .menu-empty {
    padding: 8px 10px;
    color: #999;
    font-size: 11px;
  }
  .section-title {
    margin-top: 4px;
    font-size: 10px;
    font-weight: 600;
    color: #111;
  }
  .row {
    display: flex;
    gap: 6px;
    align-items: flex-end;
  }
  .swap {
    height: 24px;
    padding: 0 4px;
    border: none;
    background: none;
    color: #999;
    cursor: pointer;
  }
  .swap:hover {
    color: var(--color-primary);
  }
  .checks {
    align-items: center;
    gap: 12px;
  }
  .checks label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-weight: 500;
    cursor: pointer;
  }
  .color input[type='color'] {
    width: 20px;
    height: 16px;
    padding: 0;
    border: 1px solid #ccc;
    border-radius: 3px;
    cursor: pointer;
  }
</style>

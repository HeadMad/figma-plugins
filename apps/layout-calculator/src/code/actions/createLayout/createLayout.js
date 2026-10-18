import hexToFigmaRgb from '@code/utils/hexToFigmaRgb';

/**
 * Create a parent frame with optional card grid / component / layout grids.
 * @param {object} params
 * @returns {{ ok: boolean, error?: string }}
 */
function createLayout(params) {
  const data = params.data || params;
  const names = params.names || {};

  let frameW = Math.max(10, parseFloat(data.frameW) || 1200);
  let frameH = Math.max(10, parseFloat(data.frameH) || 800);
  let padding = Math.max(0, parseFloat(data.padding) || 0);
  let cardW = Math.max(5, parseFloat(data.cardW) || 100);
  let cardH = Math.max(5, parseFloat(data.cardH) || 100);
  let gap = Math.max(0, parseFloat(data.gap) || 0);
  const countX = Math.max(1, parseInt(data.countX, 10) || 1);
  const countY = Math.max(1, parseInt(data.countY, 10) || 1);

  if (padding > frameW / 2 - 5) padding = Math.max(0, frameW / 2 - 5);
  if (padding > frameH / 2 - 5) padding = Math.max(0, frameH / 2 - 5);
  if (cardW > frameW - padding * 2) cardW = frameW - padding * 2;
  if (cardH > frameH - padding * 2) cardH = frameH - padding * 2;

  let {
    createCards,
    cardColor,
    alignH,
    alignV,
    addGrid,
    activeInputMode,
    currentPresetName,
    ppi,
    unit,
  } = data;

  const frameStr = names.frameStr || `${Math.round(frameW)}×${Math.round(frameH)}`;
  const cardStr = names.cardStr || `${Math.round(cardW)}×${Math.round(cardH)}`;

  let nextX = figma.viewport.center.x - frameW / 2;
  let nextY = figma.viewport.center.y - frameH / 2;

  const existingFrames = figma.currentPage.children.filter(
    (node) =>
      node.type === 'FRAME' &&
      (node.name.includes('—') || node.name.includes('px') || node.name.includes('мм'))
  );

  if (existingFrames.length > 0) {
    let maxRightEdge = -Infinity;
    let referenceY = nextY;
    for (const f of existingFrames) {
      const currentRightEdge = f.x + f.width;
      if (currentRightEdge > maxRightEdge) {
        maxRightEdge = currentRightEdge;
        referenceY = f.y;
      }
    }
    const masterReserveSpace = createCards ? cardW + 120 : 60;
    nextX = maxRightEdge + masterReserveSpace;
    nextY = referenceY;
  }

  if (Number.isNaN(nextX)) nextX = 0;
  if (Number.isNaN(nextY)) nextY = 0;

  const ppiLabel = unit === 'mm' ? ` ${ppi}ppi` : '';
  const parentFrame = figma.createFrame();
  parentFrame.name = `${currentPresetName || 'Layout'} — ${frameStr}${ppiLabel}`;
  parentFrame.resize(frameW, frameH);
  parentFrame.x = nextX;
  parentFrame.y = nextY;

  let masterComponent = null;
  if (createCards) {
    masterComponent = figma.createComponent();
    masterComponent.name = `${cardStr}${ppiLabel}`;
    masterComponent.resize(cardW, cardH);
    masterComponent.x = parentFrame.x - cardW - 60;
    masterComponent.y = parentFrame.y;

    const bgShape = figma.createRectangle();
    bgShape.name = 'Background';
    bgShape.resize(cardW, cardH);
    bgShape.fills = [{ type: 'SOLID', color: hexToFigmaRgb(cardColor || '#e0e0e0') }];
    bgShape.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' };
    masterComponent.appendChild(bgShape);
  }

  const maxAvailW = frameW - padding * 2;
  const maxAvailH = frameH - padding * 2;
  let startX = padding;
  let startY = padding;
  let actualGapX = gap;
  let actualGapY = gap;

  if (alignH === 'SPACE_BETWEEN' && countX === 1) alignH = 'CENTER';
  if (alignV === 'SPACE_BETWEEN' && countY === 1) alignV = 'CENTER';

  if (activeInputMode === 'size') {
    const totalGridW = countX * cardW + (countX - 1) * gap;
    const totalGridH = countY * cardH + (countY - 1) * gap;
    if (alignH === 'CENTER') startX = padding + (maxAvailW - totalGridW) / 2;
    else if (alignH === 'END') startX = frameW - padding - totalGridW;
    else if (alignH === 'SPACE_BETWEEN' && countX > 1) {
      actualGapX = (maxAvailW - countX * cardW) / (countX - 1);
    }

    if (alignV === 'CENTER') startY = padding + (maxAvailH - totalGridH) / 2;
    else if (alignV === 'END') startY = frameH - padding - totalGridH;
    else if (alignV === 'SPACE_BETWEEN' && countY > 1) {
      actualGapY = (maxAvailH - countY * cardH) / (countY - 1);
    }
  }

  if (Number.isNaN(actualGapX) || actualGapX < 0) actualGapX = 0;
  if (Number.isNaN(actualGapY) || actualGapY < 0) actualGapY = 0;
  if (Number.isNaN(startX)) startX = padding;
  if (Number.isNaN(startY)) startY = padding;

  if (masterComponent) {
    for (let y = 0; y < countY; y++) {
      for (let x = 0; x < countX; x++) {
        const instance = masterComponent.createInstance();
        instance.name = `Карточка ${x + 1},${y + 1}`;
        instance.x = startX + x * (cardW + actualGapX);
        instance.y = startY + y * (cardH + actualGapY);
        parentFrame.appendChild(instance);
      }
    }
  }

  if (addGrid) {
    const grids = [];
    const gridX = {
      pattern: 'COLUMNS',
      gutterSize: actualGapX || 1,
      count: countX,
      visible: true,
      color: { r: 1, g: 0, b: 0, a: 0.06 },
    };
    if (activeInputMode === 'size' && alignH !== 'SPACE_BETWEEN') {
      gridX.sectionSize = cardW;
      if (alignH === 'START') {
        gridX.alignment = 'MIN';
        gridX.offset = startX;
      } else if (alignH === 'CENTER') {
        gridX.alignment = 'CENTER';
      } else if (alignH === 'END') {
        gridX.alignment = 'MAX';
        gridX.offset =
          frameW - startX - (countX * cardW + (countX - 1) * actualGapX);
      }
    } else {
      gridX.alignment = 'STRETCH';
      gridX.offset = startX;
    }
    grids.push(gridX);

    const gridY = {
      pattern: 'ROWS',
      gutterSize: actualGapY || 1,
      count: countY,
      visible: true,
      color: { r: 1, g: 0, b: 0, a: 0.06 },
    };
    if (activeInputMode === 'size' && alignV !== 'SPACE_BETWEEN') {
      gridY.sectionSize = cardH;
      if (alignV === 'START') {
        gridY.alignment = 'MIN';
        gridY.offset = startY;
      } else if (alignV === 'CENTER') {
        gridY.alignment = 'CENTER';
      } else if (alignV === 'END') {
        gridY.alignment = 'MAX';
        gridY.offset =
          frameH - startY - (countY * cardH + (countY - 1) * actualGapY);
      }
    } else {
      gridY.alignment = 'STRETCH';
      gridY.offset = startY;
    }
    grids.push(gridY);
    parentFrame.layoutGrids = grids;
  }

  const selectNodes = masterComponent ? [parentFrame, masterComponent] : [parentFrame];
  figma.currentPage.selection = selectNodes;
  figma.viewport.scrollAndZoomIntoView(selectNodes);
  figma.notify('Успешно создано!');
  return { ok: true };
}

export default createLayout;

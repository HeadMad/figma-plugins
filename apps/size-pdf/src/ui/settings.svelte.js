import { figma } from '@ui/utils/figmaBridge/index.js';

const data = $state({
  ppi: 300,
  unit: 'mm',
  round: 2,
  pdfMode: 'vector',
  pdfOut: 'merge',
});

const settings = figma.getClientStorage('size-pdf-settings', data);

export default settings;

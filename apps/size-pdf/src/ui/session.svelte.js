import { figma } from '@ui/utils/figmaBridge/index.js';

const data = $state({
  items: [],
  hasSelection: false,
  width: '',
  height: '',
  stroke: '',
  radius: '',
  rTL: '',
  rTR: '',
  rBR: '',
  rBL: '',
  locked: false,
  ratio: 1,
  radOpen: false,
});

const session = figma.getSessionStorage('size-pdf-session', data);

export default session;

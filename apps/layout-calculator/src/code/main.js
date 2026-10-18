import { createRpcRouter } from '@code';
import * as sharedActions from '@code/actions';
import * as localActions from './actions/index.js';

const actions = { ...sharedActions, ...localActions };

figma.showUI(__html__, { width: 280, height: 620, themeColors: true });
createRpcRouter(actions);

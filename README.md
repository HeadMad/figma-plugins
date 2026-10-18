# Figma Plugins Monorepo

Монорепозиторий для разработки Figma-плагинов на **Svelte 5 + Vite + JS**.

Архитектурные ориентиры:

- [atomic-architecture](https://github.com/HeadMad/atomic-architecture) — атомарные папки, схемы, barrel-экспорты
- [figma-plugin-template](https://github.com/HeadMad/figma-plugin-template) — RPC UI↔code, storage Proxy, Tabs

---

## Структура монорепозитория

```
figma-plugins/
├── scripts/                      # общие инструменты
│   ├── barrel.js                 # генерация index.js для atomic-папок
│   ├── build-plugin.js           # сборка code.js + ui.html одного плагина
│   ├── run-apps.js               # npm run build|dev [app]
│   └── schema-tree.js            # дерево *.schema.json → JSON/MD
│
├── packages/
│   ├── code/                     # только sandbox (code.js)
│   │   ├── actions/              # универсальные RPC-экшены
│   │   └── utils/                # утилиты sandbox (sendToUi, helpers…)
│   ├── ui/                       # только iframe UI
│   │   ├── components/           # Svelte-компоненты
│   │   └── utils/                # утилиты UI (figmaBridge, clickOutside…)
│   ├── utils/                    # изоморфные хелперы (и UI, и code)
│   ├── styles/                   # CSS tokens / reset / layout
│   └── icons/                    # SVG-иконки
│
└── apps/
    ├── size-pdf/
    ├── print-pdf/
    ├── local-place-image/
    └── layout-calculator/
```

### Разделение ответственности

| Пакет | Где выполняется | Что внутри |
|-------|-----------------|------------|
| **`@code`** | Figma sandbox (`code.js`) | RPC-actions + code-only utils |
| **`@ui`** | Plugin iframe | Svelte components + UI utils |
| **`@utils`** | И UI, и code | Чистые функции без DOM и без `figma.*` |
| **`@styles`** | UI | CSS-токены и базовые стили |
| **`@icons`** | UI | SVG-ассеты |

**Почему так, а не один общий js-utils:**

- `figmaBridge` / `clickOutside` / `initAutoResize` имеют смысл **только в UI**
- `sendToUi` / `createRpcRouter` / `hexToFigmaRgb` — **только в code**
- `formatNumber` / `moveItem` / unit-конверсии — **везде**

Смешивать их в одном пакете запутывает импорты и границы бандлов.

### Импорты

```js
// code.js (sandbox)
import { createRpcRouter, sendToUi } from '@code';
import * as sharedActions from '@code/actions';
import hexToFigmaRgb from '@code/utils/hexToFigmaRgb';
import { formatNumber } from '@utils';

// UI (Svelte)
import { FieldInput, Toast, showToast } from '@ui';
import { figma } from '@ui/utils/figmaBridge';
import clickOutside from '@ui/utils/clickOutside';
import { parseInput, moveItem } from '@utils';
import '@styles';
```

Имена пакетов = имена директорий с префиксом `@` (`@code`, `@ui`, `@utils`) — **без** `@figma-plugins/`.

---

## Структура приложения

```
apps/my-plugin/
├── manifest.json
├── package.json                  # name: "@my-plugin"
├── vite.config.code.js
├── vite.config.ui.js
└── src/
    ├── code/
    │   ├── main.js               # showUI + createRpcRouter + listeners
    │   └── actions/              # только УНИКАЛЬНЫЕ экшены этого плагина
    │       └── doSomething/
    │           ├── doSomething.js
    │           ├── index.js
    │           └── doSomething.schema.json
    └── ui/
        ├── ui.html
        ├── main.js               # mount(App)
        ├── App.svelte
        ├── pages/                # вкладки/экраны — только здесь
        └── components/           # составные компоненты только этого плагина
```

### Что куда класть

| Сущность | Общий пакет | Папка плагина |
|----------|-------------|---------------|
| Универсальный action | `packages/code/actions` | — |
| Уникальный action | — | `apps/<p>/src/code/actions` |
| Базовый UI-компонент | `packages/ui/components` | — |
| Составной UI только для плагина | — | `apps/<p>/src/ui/components` |
| Страницы / вкладки | — | `apps/<p>/src/ui/pages` |
| Чистая функция (без figma/DOM) | `packages/utils` | — |
| UI-утилита (DOM / bridge) | `packages/ui/utils` | — |
| Code-утилита (`figma.*`) | `packages/code/utils` | — |

`main.js` мержит общие и локальные экшены:

```js
import { createRpcRouter, sendToUi } from '@code';
import * as sharedActions from '@code/actions';
import * as localActions from './actions/index.js';

const actions = { ...sharedActions, ...localActions };
figma.showUI(__html__, { width: 280, height: 400, themeColors: true });
createRpcRouter(actions);
```

---

## Принципы написания

1. **Atomic folder** — одна сущность = одна папка: `Name/Name.js|svelte` + `index.js` + `Name.schema.json`.
2. **Схемы с описаниями** — у файла, параметров, props и return value всегда есть `description`.
3. **RPC, не «сырые» postMessage** — UI вызывает `figma.send('actionName', params)`; code отвечает через `createRpcRouter`.
4. **Поток событий** — code пушит в UI через `sendToUi('event', data)`; UI слушает `figma.addEventListener('event', …)`.
5. **Storage** — `figma.getClientStorage` / `getSessionStorage` / `getDocumentStorage` (Proxy).
6. **Компоненты без лишних обёрток** — control-only (Toggle/NumberInput не оборачивают себя в `<label>`).
7. **Стили** — component-scoped CSS в `.svelte`; общие токены в `@styles`.
8. **Barrel** — `index.js` контейнеров генерируется `scripts/barrel.js`.

---

## Команды

```bash
npm install

# сборка всех приложений
npm run build

# сборка / dev одного приложения (имя папки в apps/)
npm run build -- size-pdf
npm run dev -- print-pdf

# дерево схем от корня → ./schema-tree.json
# (по умолчанию только файлы со схемой; в tree.file — исходник, не *.schema.json)
npm run schema-tree

# конкретная папка
npm run schema-tree -- --scan packages/ui/components

# полное дерево каталога (все файлы)
npm run schema-tree -- --scan apps --include *

# полное дерево с исключениями
npm run schema-tree -- --scan packages --include * --exclude node_modules schema-tree.json -empty-path -empty-file

# только определённые маски
npm run schema-tree -- --scan packages/ui --include *.svelte *.js --exclude index.js

# markdown / flat / свой путь
npm run schema-tree -- --scan packages/code --md
npm run schema-tree -- --scan packages --include * --flat --out=docs/packages.json
npm run schema-tree -- --scan . --just-flat --out=docs/all-flat.json
```

После сборки в Figma: **Import plugin from manifest** → `apps/<name>/manifest.json` (нужен `dist/`).

## Приложения

| Папка | Описание |
|-------|----------|
| `size-pdf` | Физические размеры (mm/cm/in) + панель PDF |
| `print-pdf` | Экспорт selection в PDF (flatten / vector / outlines) |
| `local-place-image` | Стек IMAGE-fills → размещение на шейпах |
| `layout-calculator` | Генератор frame + card grid + пресеты |

---

## Пакеты

### `@code/actions` — RPC-обработчики sandbox

| Entity | Описание |
|--------|----------|
| `manageStorage` | load/save в `clientStorage` или `pluginData` документа |
| `resize` | `figma.ui.resize` по запросу UI |
| `getSelectionMetrics` | агрегаты selection (размеры, stroke, radii, список items) |
| `applyLayout` | применить width/height/stroke/radius к selection |
| `setConstrainProportions` | включить/выключить lock aspect ratio |
| `exportPdf` | export selection → page payloads (PDF/JPG) для сборки в UI |

### `@code/utils` — утилиты sandbox

| Entity | Описание |
|--------|----------|
| `sendToUi` | отправить событие/ответ RPC в iframe |
| `createRpcRouter` | связать `figma.ui.onmessage` с картой actions |
| `hexToFigmaRgb` | `#RRGGBB` → `{ r, g, b }` 0…1 |
| `strokeOf` | числовой strokeWeight ноды |
| `radiiOf` | углы скругления ноды |
| `canExport` | можно ли вызвать `exportAsync` |
| `orderedSelection` | selection в заданном порядке id |
| `selectionMetrics` | сырые метрики selection |
| `applyLayoutChanges` | низкоуровневое применение layout-полей |
| `exportSelectionToPdf` | низкоуровневый export в байты страниц |
| `postToUI` | упрощённый postMessage в UI |

### `@ui/components` — Svelte-компоненты

| Entity | Описание |
|--------|----------|
| `FieldInput` | числовой/текстовый инпут с префиксом и scrub |
| `ScrubHandle` | ручка drag-to-change для числовых полей |
| `IconButton` | кнопка-иконка |
| `Popover` | позиционируемая панель |
| `MenuPopover` | триггер + выпадающее меню |
| `SelectField` | select в стиле Figma |
| `Dropdown` | компактный dropdown на MenuPopover |
| `NumberInput` | степпер − / значение / + |
| `RadioGroup` | группа radio |
| `SelectionList` | список selection с drag-reorder |
| `PrimaryButton` | основная CTA-кнопка |
| `Toggle` | переключатель on/off |
| `Toast` / `showToast` | тосты уведомлений |
| `Modal` / `showModal` | модальные диалоги |
| `Tabs` / `Tab` | вкладки на svelte-super |

### `@ui/utils` — утилиты iframe

| Entity | Описание |
|--------|----------|
| `figmaBridge` | RPC-клиент: `send`, events, storage Proxy |
| `clickOutside` | Svelte 5 attachment для клика снаружи |
| `initAutoResize` | ResizeObserver → `resize` окна плагина |

### `@utils` — изоморфные хелперы

| Entity | Описание |
|--------|----------|
| `formatNumber` | форматирование числа + единица |
| `parseInput` | разбор строки инпута в число |
| `unitMultiplier` | коэффициент px ↔ mm/cm/in при PPI |
| `pxToUnit` | пиксели → выбранные единицы |
| `unitToPx` | единицы → пиксели |
| `escapeHtml` | экранирование HTML |
| `safeFilename` | безопасное имя файла |
| `moveItem` | переместить элемент массива (reorder) |
| `mergeSelectionOrder` | слить новый selection с сохранённым порядком |

### `@styles` / `@icons`

| Пакет | Описание |
|-------|----------|
| `@styles` | CSS-токены Figma, reset, базовые layout-классы |
| `@icons` | набор SVG-иконок (импорт по имени или пути) |


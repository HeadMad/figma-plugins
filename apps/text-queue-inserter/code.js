// code.js

// Инициализация окна плагина с компактными размерами (оптимально для 2 элементов)
figma.showUI(__html__, { width: 260, height: 164 });

let currentInsertionText = "";
let isListeningToSelection = false;

// Обработка сообщений из UI
figma.ui.onmessage = async (msg) => {
  
  // Сохранение текста в постоянную память Figma
  if (msg.type === 'save-text') {
    await figma.clientStorage.setAsync('savedQueueText', msg.text);
  }

  // Загрузка сохраненного текста при старте
  if (msg.type === 'load-text') {
    const savedText = await figma.clientStorage.getAsync('savedQueueText');
    figma.ui.postMessage({ type: 'restore-text', text: savedText });
  }

  // Вход в активный режим
  if (msg.type === 'start-active-mode') {
    currentInsertionText = msg.currentText;
    isListeningToSelection = true;
    
    // Сбрасываем текущее выделение, чтобы пользователь мог кликнуть на нужный слой с нуля
    figma.currentPage.selection = [];
  }

  // Обновление текущего значения для вставки при сдвиге очереди
  if (msg.type === 'update-current-text') {
    currentInsertionText = msg.currentText;
  }

  // Выход из активного режима (по Escape или при окончании списка)
  if (msg.type === 'stop-active-mode') {
    isListeningToSelection = false;
    currentInsertionText = "";
  }
};

// Отслеживание кликов / смены выделения на канвасе Figma
figma.on("selectionchange", async () => {
  // Реагируем только если плагин находится в активном режиме выполнения очереди
  if (!isListeningToSelection) return;

  const selection = figma.currentPage.selection;

  // Проверяем, что выбран ровно один элемент и это текстовый слой
  if (selection.length === 1 && selection[0].type === "TEXT") {
    const textNode = selection[0];

    try {
      // Для изменения текста в Figma необходимо сначала загрузить используемые в слое шрифты
      if (textNode.hasMissingFont) {
        figma.notify("Ошибка: В выбранном слое отсутствует шрифт.", { error: true });
        return;
      }
      
      // Загружаем все шрифты, примененные в текстовом блоке
      const fonts = textNode.getRangeAllFontNames(0, textNode.characters.length);
      for (const font of fonts) {
        await figma.loadFontAsync(font);
      }

      // Заменяем текст слоя на текущую фразу из очереди
      textNode.characters = currentInsertionText;

      // Сбрасываем выделение обратно в пустоту. 
      // Это критически важно: если пользователь захочет кликнуть на этот же слой повторно 
      // или сбросить фокус, событие selectionchange сработает корректно на следующем элементе.
      figma.currentPage.selection = [];

      // Отправляем сигнал в UI, что вставка прошла успешно и можно сдвигать очередь
      figma.ui.postMessage({ type: 'text-inserted-success' });

    } catch (error) {
      console.error("Ошибка при обновлении текстового слоя:", error);
      figma.notify("Не удалось обновить текст", { error: true });
    }
  }
});

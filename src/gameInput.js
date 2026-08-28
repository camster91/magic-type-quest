function isTextEntry(element) {
  return element?.id !== 'mobile-input' &&
    (element?.tagName === 'INPUT' || element?.tagName === 'TEXTAREA');
}

export function trapDialogFocus(event, root = document) {
  if (event.key !== 'Tab') return;
  const dialogs = [...root.querySelectorAll('[role="dialog"][aria-hidden="false"]')];
  const dialog = dialogs.at(-1);
  if (!dialog) return;
  const focusable = [...dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])')]
    .filter((element) => element.getClientRects().length > 0);
  if (focusable.length === 0) return;

  const first = focusable[0];
  const last = focusable.at(-1);
  if (!dialog.contains(root.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  } else if (event.shiftKey && root.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && root.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

export function createGameInputController({
  state,
  getLesson,
  measureTypedWidth,
  onCorrectKeystroke,
  onWrongKeystroke,
  completeWord,
  skipWord,
  togglePause,
  showShiftHint,
  updateTargetDisplay,
  updateKeyboardHighlight,
  getActiveElement = () => document.activeElement,
  getOpenDialog = () => document.querySelector('[role="dialog"][aria-hidden="false"]'),
}) {
  function processKeystroke(rawKey, isShift = false) {
    if (typeof rawKey !== 'string') return;
    const requiresShift = getLesson()?.requiresShift === true;
    let pressedKey = rawKey;

    if (requiresShift) {
      if (rawKey.length !== 1 || !/[a-zA-Z]/.test(rawKey)) return;
      if (!isShift) {
        onWrongKeystroke(rawKey.toLowerCase());
        showShiftHint();
        return;
      }
      pressedKey = rawKey.toUpperCase();
    } else {
      if (rawKey.length !== 1 || !/[a-z0-9]/.test(rawKey)) return;
      pressedKey = rawKey.toLowerCase();
    }

    state.totalKeystrokes++;

    if (!state.targetWord) {
      const caught = state.activeWords.find((word) => {
        const firstChar = requiresShift ? word.text[0] : word.text[0].toLowerCase();
        return firstChar === pressedKey && !word.isTarget;
      });
      if (!caught) {
        onWrongKeystroke(pressedKey);
        return;
      }

      caught.isTarget = true;
      caught.matched = 1;
      caught.typedWidth = measureTypedWidth(caught.text.slice(0, 1));
      caught.glow = 1;
      state.targetWord = caught;
      state.targetIndex = 1;
      state.correctKeystrokes++;
      onCorrectKeystroke(pressedKey);
      if (state.targetIndex >= caught.text.length) completeWord();
      return;
    }

    const expected = state.targetWord.text[state.targetIndex];
    if (pressedKey !== expected) {
      onWrongKeystroke(pressedKey);
      return;
    }

    state.targetIndex++;
    state.targetWord.matched = state.targetIndex;
    state.targetWord.typedWidth = measureTypedWidth(state.targetWord.text.slice(0, state.targetIndex));
    state.targetWord.glow = 1;
    state.correctKeystrokes++;
    onCorrectKeystroke(pressedKey);

    if (state.targetIndex >= state.targetWord.text.length) {
      completeWord();
    } else {
      updateTargetDisplay();
      updateKeyboardHighlight();
    }
  }

  function handleKey(event) {
    if (state.screen !== 'game' || state.gameOver || event.repeat) return;

    if (event.key === 'Escape') {
      const openDialog = getOpenDialog();
      if (openDialog && openDialog.id !== 'pause-overlay') return;
      event.preventDefault();
      togglePause();
      return;
    }

    if (state.paused || isTextEntry(getActiveElement())) return;
    if (event.key === ' ') {
      event.preventDefault();
      skipWord();
      return;
    }
    processKeystroke(event.key, event.shiftKey);
  }

  function handleMobileInput(event) {
    const input = event.target;
    if (state.screen !== 'game' || state.paused || state.gameOver) {
      input.value = '';
      return;
    }
    if (event.inputType === 'deleteContentBackward') {
      skipWord();
      input.value = '';
      return;
    }
    if (!event.data || event.data.length !== 1) {
      input.value = '';
      return;
    }

    const isUppercaseLetter = /[A-Z]/.test(event.data);
    processKeystroke(event.data, isUppercaseLetter);
    input.value = '';
  }

  return { handleKey, handleMobileInput, processKeystroke };
}

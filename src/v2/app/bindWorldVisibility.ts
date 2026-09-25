export interface WorldVisibilityTarget { emit(event: 'hidden' | 'visible' | 'blur' | 'focus'): unknown; }
export interface WorldVisibilityEnvironment {
  readonly document: Pick<Document, 'hidden' | 'addEventListener' | 'removeEventListener'>;
  readonly window: Pick<Window, 'addEventListener' | 'removeEventListener'>;
}

/** Browser listeners belong to one world, never to a global onblur/onfocus slot. */
export function bindWorldVisibility(target: WorldVisibilityTarget,
  environment: WorldVisibilityEnvironment = { document, window }): () => void {
  const { document: documentRef, window: windowRef } = environment;
  const removals: (() => void)[] = [];
  let released = false;
  const release = (): void => {
    if (released) return;
    released = true;
    for (const remove of removals.splice(0).reverse()) remove();
  };
  const onVisibility = (): void => { if (!released) target.emit(documentRef.hidden ? 'hidden' : 'visible'); };
  const onBlur = (): void => { if (!released) target.emit('blur'); };
  const onFocus = (): void => { if (!released) target.emit('focus'); };
  try {
    documentRef.addEventListener('visibilitychange', onVisibility, false);
    removals.push(() => documentRef.removeEventListener('visibilitychange', onVisibility, false));
    windowRef.addEventListener('blur', onBlur, false);
    removals.push(() => windowRef.removeEventListener('blur', onBlur, false));
    windowRef.addEventListener('focus', onFocus, false);
    removals.push(() => windowRef.removeEventListener('focus', onFocus, false));
  } catch (cause) { release(); throw cause; }
  return release;
}

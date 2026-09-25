/**
 * A persisted pagehide retains this document for a possible history return.
 * Keep its one existing shell rather than blanking the root or re-importing a
 * learner. Browser cache eviction owns document reclamation; a final pagehide
 * or explicit disposal still releases this shell exactly once.
 */
export function bindPageDisposal(disposeShell: () => void,
  windowRef: Pick<Window, 'addEventListener' | 'removeEventListener'> = window): () => void {
  let disposed = false;
  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    windowRef.removeEventListener('pagehide', onPageHide);
    disposeShell();
  };
  const onPageHide = (event: Event): void => {
    if ((event as PageTransitionEvent).persisted !== true) dispose();
  };
  // Not once: a cached departure must not consume the final-exit listener.
  windowRef.addEventListener('pagehide', onPageHide);
  return dispose;
}

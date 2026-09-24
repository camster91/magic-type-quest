import type Phaser from 'phaser';
import { getFingerGuidance, TypingInputService, type TypingEvent } from '../input/TypingInputService';

type WorldLoader = () => Promise<{ Phaser: typeof Phaser; BootScene: typeof import('../game/scenes/BootScene').BootScene }>;
export type RecoveryKind = 'corruptProgress' | 'storageUnavailable' | 'unsupportedGraphics' | 'offlineAsset';
export type DialogRequest =
  | { readonly type: 'completion'; readonly description: string }
  | { readonly type: 'confirmation'; readonly description: string; readonly onConfirm: () => void };
const defaultLoader: WorldLoader = async () => {
  const [engine, scene] = await Promise.all([import('phaser'), import('../game/scenes/BootScene')]);
  return { Phaser: engine.default, BootScene: scene.BootScene };
};

function node<K extends keyof HTMLElementTagNameMap>(tag: K, className: string, content = ''): HTMLElementTagNameMap[K] {
  const result = document.createElement(tag);
  result.className = className;
  result.textContent = content;
  return result;
}

/** The DOM owns navigation, dialogs and announcements; Phaser owns only the world host. */
export function mountV2Shell(root: HTMLElement, loadWorld: WorldLoader = defaultLoader): () => void {
  root.replaceChildren();
  const skip = node('a', 'v2-skip', 'Skip to main content'); skip.href = '#v2-main';
  const shell = node('div', 'v2-shell');
  const header = node('header', 'v2-header');
  const brand = node('span', 'v2-brand', 'Nature Quest');
  const nav = node('nav', 'v2-nav'); nav.setAttribute('aria-label', 'Explore');
  const map = node('button', 'v2-text-button', 'World Map');
  const guide = node('button', 'v2-text-button', 'Field Guide');
  const settings = node('button', 'v2-text-button', 'Settings');
  nav.append(map, guide, settings); header.append(brand, nav);

  const main = node('main', 'v2-main'); main.id = 'v2-main'; main.tabIndex = -1;
  const home = node('section', 'v2-home'); home.setAttribute('aria-labelledby', 'v2-title');
  const title = node('h1', 'v2-title', 'Help the meadow grow.'); title.id = 'v2-title';
  const start = node('button', 'v2-primary', 'Start Meadow');
  const habitat = node('section', 'v2-summary'); habitat.setAttribute('aria-labelledby', 'v2-habitat-title');
  const habitatTitle = node('h2', '', 'Your habitat'); habitatTitle.id = 'v2-habitat-title';
  habitat.append(habitatTitle, node('p', '', 'Meadow Base · Ready for the first planting spots.'));
  const goal = node('section', 'v2-summary'); goal.setAttribute('aria-labelledby', 'v2-goal-title');
  const goalTitle = node('h2', '', 'Next typing goal'); goalTitle.id = 'v2-goal-title';
  goal.append(goalTitle, node('p', '', 'Find F and J, the home-position keys.'));
  const summaries = node('div', 'v2-summaries'); summaries.append(habitat, goal);
  home.append(node('p', 'v2-eyebrow', 'MEADOW BASE · FIRST HABITAT'), title,
    node('p', 'v2-intro', 'Practice a few keys, care for the habitat, and observe the wildlife that returns.'), start, summaries);

  const world = node('section', 'v2-world'); world.hidden = true; world.setAttribute('aria-labelledby', 'v2-world-title');
  const worldTop = node('div', 'v2-world-top');
  const worldTitle = node('h1', '', 'Meadow Base'); worldTitle.id = 'v2-world-title';
  const pause = node('button', 'v2-text-button', 'Pause'); worldTop.append(worldTitle, pause);
  const stage = node('div', 'v2-stage'); stage.setAttribute('aria-label', 'Meadow environment');
  const practice = node('section', 'v2-practice'); practice.setAttribute('aria-label', 'Home-position key practice');
  const targetLabel = node('p', 'v2-target', 'Target: F, then J');
  const fingerLabel = node('p', 'v2-finger', 'F: left index finger');
  const progress = node('p', 'v2-practice-progress', '0 of 2 keys');
  const feedback = node('p', 'v2-feedback', 'Focus the practice area and press F.');
  const typingSurface = node('div', 'v2-typing-surface', 'Type here: F then J');
  typingSurface.tabIndex = 0; typingSurface.setAttribute('role', 'group');
  typingSurface.setAttribute('aria-label', 'Typing practice. Press F, then J.');
  typingSurface.setAttribute('aria-describedby', 'v2-target v2-finger v2-practice-progress v2-feedback');
  targetLabel.id = 'v2-target'; fingerLabel.id = 'v2-finger'; progress.id = 'v2-practice-progress'; feedback.id = 'v2-feedback';
  const touch = node('button', 'v2-text-button', 'Use touch keyboard');
  touch.disabled = true;
  const touchInput = node('input', 'v2-touch-input'); touchInput.type = 'text';
  touchInput.setAttribute('aria-label', 'Touch typing practice'); touchInput.inputMode = 'text';
  const resumeTyping = node('button', 'v2-secondary', 'Resume typing'); resumeTyping.hidden = true;
  const retryPractice = node('button', 'v2-text-button', 'Try the keys again');
  retryPractice.disabled = true;
  practice.append(targetLabel, fingerLabel, progress, feedback, typingSurface, touch, touchInput, resumeTyping, retryPractice);
  const worldSummary = node('p', 'v2-world-summary', 'The meadow has open patches ready for care.'); worldSummary.id = 'v2-world-summary';
  const finish = node('button', 'v2-secondary', 'Finish for now');
  const worldNote = node('p', 'v2-world-note', 'A physical keyboard is best for finger-placement lessons. Touch controls are a practice fallback.');
  world.append(worldTop, node('p', 'v2-objective', 'Objective: find F and J to prepare planting spots.'), stage, practice, worldSummary, worldNote, finish);

  const auxiliary = node('section', 'v2-auxiliary'); auxiliary.hidden = true;
  const auxiliaryTitle = node('h1', ''); auxiliaryTitle.tabIndex = -1;
  const auxiliaryText = node('p', '');
  const auxiliaryBack = node('button', 'v2-secondary', 'Back to home');
  auxiliary.append(auxiliaryTitle, auxiliaryText, auxiliaryBack);
  const loading = node('p', 'v2-loading', 'Loading Meadow environment…'); loading.hidden = true; loading.setAttribute('role', 'status');
  const error = node('section', 'v2-error'); error.hidden = true; error.setAttribute('role', 'alert');
  const errorTitle = node('h2', '', 'The meadow could not open.');
  const errorText = node('p', '', 'Check your connection, then try again. Your progress is safe.');
  const retry = node('button', 'v2-secondary', 'Try again');
  error.append(errorTitle, errorText, retry);
  const live = node('p', 'v2-live', 'Ready to explore Meadow Base.');
  live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite'); live.setAttribute('aria-atomic', 'true');
  main.append(home, world, auxiliary, loading, error, live);
  const footer = node('footer', 'v2-footer');
  const parents = node('a', '', 'Parent view'); parents.href = '../parents.html';
  const teacher = node('a', '', 'Teacher view'); teacher.href = '../teacher.html';
  footer.append(node('span', '', 'For grown-ups: '), parents, teacher);
  const dialogRoot = node('div', 'v2-dialog-root');
  shell.append(header, main, footer, dialogRoot); root.append(skip, shell);

  let disposed = false;
  let game: Phaser.Game | null = null;
  let resizeObserver: ResizeObserver | null = null;
  let activeDialog: HTMLDialogElement | null = null;
  let returnFocus: HTMLElement | null = null;
  let loadCounter = 0;
  let retryAction: 'world' | 'dismiss' = 'world';
  const announce = (message: string): void => { live.textContent = message; };
  const fingerText = (key: string): string => {
    const guidance = getFingerGuidance(key);
    if (!guidance) return `Find ${key} on the keyboard.`;
    return `${key.toUpperCase()}: ${guidance.hand} ${guidance.finger.replace(/^left|^right/, '').toLowerCase()} finger${guidance.shiftHand ? `; hold ${guidance.shiftHand} Shift` : ''}`;
  };
  const onTypingEvent = (event: TypingEvent): void => {
    if (event.type === 'inputCapabilityChanged') {
      worldNote.textContent = event.capability === 'touch'
        ? 'Touch practice only. Physical-key mastery is not recorded.'
        : 'A physical keyboard is best for finger-placement lessons. Touch controls are a practice fallback.';
    }
    if (event.type === 'correctKey') feedback.textContent = 'Correct key. Keep going.';
    if (event.type === 'incorrectKey') feedback.textContent = `Try ${event.expectedKey} again. Take your time.`;
    if (event.type === 'sequenceProgress') {
      progress.textContent = `${event.position} of ${event.total} keys`;
      const next = inputService.getVisualState().target;
      if (next) { targetLabel.textContent = `Next key: ${next.toUpperCase()}`; fingerLabel.textContent = fingerText(next); }
    }
    if (event.type === 'sequenceComplete') {
      targetLabel.textContent = 'F and J complete'; feedback.textContent = 'You found both home-position keys.';
      resumeTyping.hidden = true;
    }
    if (event.type === 'pauseRequested') {
      inputService.suspend(); resumeTyping.hidden = false;
      openDialog('Paused', 'Take your time. The meadow will wait.', [
        { label: 'Resume', action: () => { inputService.resume(); resumeTyping.hidden = true; } },
        { label: 'Finish for now', action: showHome },
      ], typingSurface);
    }
  };
  const inputService = new TypingInputService(typingSurface, touchInput, onTypingEvent, announce);
  const reportRecovery = (kind: RecoveryKind): void => {
    const messages: Record<RecoveryKind, [string, string]> = {
      corruptProgress: ['Progress needs attention.', 'We could not read saved progress. Your original data has not been erased.'],
      storageUnavailable: ['Saving is unavailable.', 'You can explore, but this browser may not keep your progress.'],
      unsupportedGraphics: ['The meadow could not open.', 'This browser could not draw the habitat. Please try again.'],
      offlineAsset: ['The meadow could not open.', 'This meadow is not available offline yet. Reconnect and try again.'],
    };
    const [heading, message] = messages[kind];
    errorTitle.textContent = heading; errorText.textContent = message;
    retryAction = kind === 'corruptProgress' || kind === 'storageUnavailable' ? 'dismiss' : 'world';
    retry.textContent = retryAction === 'dismiss' ? 'Continue' : 'Try again';
    error.hidden = false; announce(`${heading} ${message}`); retry.focus();
  };
  const onRecoverableError = (event: Event): void => {
    const kind = (event as CustomEvent<{ kind: RecoveryKind }>).detail?.kind;
    if (kind && ['corruptProgress', 'storageUnavailable', 'unsupportedGraphics', 'offlineAsset'].includes(kind)) reportRecovery(kind);
  };
  root.addEventListener('naturequest:v2:recoverable-error', onRecoverableError);
  const releaseWorld = (): void => {
    loadCounter++;
    inputService.suspend();
    touch.disabled = true;
    retryPractice.disabled = true;
    resizeObserver?.disconnect(); resizeObserver = null;
    game?.destroy(true); game = null;
    stage.replaceChildren();
  };
  const showHome = (): void => {
    releaseWorld(); world.hidden = true; auxiliary.hidden = true; loading.hidden = true; error.hidden = true; home.hidden = false;
    announce('Meadow Base is ready when you are.'); start.focus();
  };
  const closeDialog = (): void => {
    if (!activeDialog) return;
    const dialog = activeDialog; activeDialog = null;
    dialog.close(); dialog.remove(); game?.scene.resume('BootScene');
    returnFocus?.focus(); returnFocus = null;
  };
  const openDialog = (heading: string, description: string, actions: readonly { label: string; action?: () => void }[], invoker: HTMLElement, settingsControls = false): void => {
    closeDialog(); returnFocus = invoker;
    const dialog = node('dialog', 'v2-dialog'); dialog.setAttribute('aria-label', heading);
    dialog.append(node('h2', '', heading), node('p', '', description));
    if (settingsControls) {
      const label = node('label', 'v2-setting', 'Reduce motion');
      const checkbox = node('input', ''); checkbox.type = 'checkbox';
      checkbox.checked = shell.classList.contains('v2-reduced-motion') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      checkbox.addEventListener('change', () => shell.classList.toggle('v2-reduced-motion', checkbox.checked));
      label.prepend(checkbox); dialog.append(label);
    }
    const buttons = node('div', 'v2-dialog-actions');
    for (const item of actions) {
      const button = node('button', 'v2-secondary', item.label);
      button.addEventListener('click', () => { closeDialog(); item.action?.(); }); buttons.append(button);
    }
    dialog.append(buttons);
    dialog.addEventListener('cancel', (event) => { event.preventDefault(); closeDialog(); });
    dialogRoot.append(dialog); activeDialog = dialog;
    game?.scene.pause('BootScene'); dialog.showModal();
    (settingsControls ? dialog.querySelector('input') : buttons.firstElementChild as HTMLElement | null)?.focus();
  };
  const onDialogRequest = (event: Event): void => {
    const request = (event as CustomEvent<DialogRequest>).detail;
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : pause;
    if (request?.type === 'completion') openDialog('Habitat task complete', request.description,
      [{ label: 'Continue' }, { label: 'Finish for now', action: showHome }], invoker);
    if (request?.type === 'confirmation') openDialog('Please confirm', request.description,
      [{ label: 'Cancel' }, { label: 'Confirm', action: request.onConfirm }], invoker);
  };
  root.addEventListener('naturequest:v2:dialog-request', onDialogRequest);

  const openWorld = async (): Promise<void> => {
    const request = ++loadCounter;
    home.hidden = true; auxiliary.hidden = true; world.hidden = false; error.hidden = true; loading.hidden = false;
    announce('Loading Meadow environment.');
    try {
      const { Phaser: Engine, BootScene } = await loadWorld();
      if (disposed || request !== loadCounter) return;
      const bounds = stage.getBoundingClientRect();
      const width = Math.max(320, Math.round(bounds.width));
      const height = Math.max(180, Math.round(bounds.height));
      game = new Engine.Game({ type: Engine.AUTO, parent: stage, width, height, backgroundColor: '#e5f3ec',
        scale: { mode: Engine.Scale.NONE, width, height }, audio: { noAudio: true },
        scene: [new BootScene(() => {
          if (disposed || request !== loadCounter || !game) return;
          game.canvas.setAttribute('role', 'img'); game.canvas.setAttribute('aria-label', 'Meadow environment');
          game.canvas.setAttribute('aria-describedby', 'v2-world-summary'); game.canvas.setAttribute('tabindex', '-1');
          loading.hidden = true; announce('Meadow environment ready. The meadow has open patches ready for care.'); pause.focus();
          targetLabel.textContent = 'Target: F, then J'; fingerLabel.textContent = fingerText('f');
          progress.textContent = '0 of 2 keys'; feedback.textContent = 'Press F to begin.'; resumeTyping.hidden = true;
          inputService.start({ lessonId: 'meadow-fj', missionId: 'meadow-a', sequence: 'fj' });
          touch.disabled = false;
          retryPractice.disabled = false;
        })],
      });
      resizeObserver = new ResizeObserver(() => {
        if (!game) return;
        const rect = stage.getBoundingClientRect();
        game.scale.resize(Math.max(320, Math.round(rect.width)), Math.max(180, Math.round(rect.height)));
      });
      resizeObserver.observe(stage);
    } catch (cause) {
      if (disposed || request !== loadCounter) return;
      game?.destroy(true); game = null;
      if (import.meta.env.DEV) console.error('Meadow load failed', cause);
      loading.hidden = true;
      reportRecovery(navigator.onLine ? 'unsupportedGraphics' : 'offlineAsset');
    }
  };

  start.addEventListener('click', () => { void openWorld(); });
  retry.addEventListener('click', () => {
    if (retryAction === 'dismiss') { error.hidden = true; announce('You can continue exploring.'); start.focus(); return; }
    if (!navigator.onLine) { announce('Reconnect before trying again.'); return; }
    // A failed dynamic import is cached by the browser module map. Reload the
    // shell to get a fresh attempt, then resume the requested Meadow view.
    try { sessionStorage.setItem('naturequest:v2:retry-meadow', '1'); } catch { /* storage may be unavailable */ }
    window.location.reload();
  });
  finish.addEventListener('click', showHome);
  pause.addEventListener('click', () => {
    inputService.suspend(); resumeTyping.hidden = false;
    openDialog('Paused', 'Take your time. The meadow will wait.', [
      { label: 'Resume', action: () => { inputService.resume(); resumeTyping.hidden = true; } },
      { label: 'Finish for now', action: showHome },
    ], pause);
  });
  settings.addEventListener('click', () => {
    if (!world.hidden) { inputService.suspend(); resumeTyping.hidden = false; }
    openDialog('Settings', 'Choose how the Meadow environment moves.', [{ label: 'Done' }], settings, true);
  });
  touch.addEventListener('click', () => inputService.enableTouchFallback());
  resumeTyping.addEventListener('click', () => { inputService.resume(); resumeTyping.hidden = true; });
  retryPractice.addEventListener('click', () => {
    if (world.hidden) return;
    inputService.start({ lessonId: 'meadow-fj', missionId: 'meadow-a', sequence: 'fj' });
    inputService.retry(); progress.textContent = '0 of 2 keys'; targetLabel.textContent = 'Target: F, then J';
    fingerLabel.textContent = fingerText('f'); feedback.textContent = 'Press F to begin.';
  });
  const openAuxiliary = (heading: string, description: string): void => {
    releaseWorld(); home.hidden = true; world.hidden = true; loading.hidden = true; error.hidden = true; auxiliary.hidden = false;
    auxiliaryTitle.textContent = heading; auxiliaryText.textContent = description;
    auxiliaryTitle.focus(); announce(`${heading}. ${description}`);
  };
  map.addEventListener('click', () => openAuxiliary('World Map', 'Meadow Base · Forest Trail · Wetlands · River & Coast · Mountain Research Station · Wildlife Reserve'));
  guide.addEventListener('click', () => openAuxiliary('Field Guide', 'Discoveries will appear here after you care for the meadow.'));
  auxiliaryBack.addEventListener('click', showHome);

  try {
    if (sessionStorage.getItem('naturequest:v2:retry-meadow') === '1') {
      sessionStorage.removeItem('naturequest:v2:retry-meadow');
      queueMicrotask(() => { if (!disposed) void openWorld(); });
    }
  } catch { /* storage may be unavailable; home remains usable */ }

  return (): void => {
    if (disposed) return;
    disposed = true; root.removeEventListener('naturequest:v2:recoverable-error', onRecoverableError);
    root.removeEventListener('naturequest:v2:dialog-request', onDialogRequest);
    closeDialog(); releaseWorld(); inputService.dispose(); root.replaceChildren();
  };
}

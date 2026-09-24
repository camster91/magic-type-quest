import { getAllowedKeys, type FingerId, type HandId, type KeyId, type LessonId } from '../curriculum/domain';

export type InputCapability = 'unknown' | 'physical' | 'touch';
export type InputSource = 'physical' | 'touch';
export interface EncounterTarget { readonly lessonId: LessonId; readonly missionId: string; readonly sequence: string; }
export interface ScoredKeyEvent {
  readonly expectedKey: string;
  readonly receivedKey: string;
  readonly timestamp: number;
  readonly lessonId: LessonId;
  readonly missionId: string;
  readonly shiftExpected: boolean;
  readonly shiftUsed: boolean;
  readonly scorable: boolean;
  readonly source: InputSource;
  readonly position: number;
}
export type TypingEvent =
  | ({ readonly type: 'keyAttempt' | 'correctKey' | 'incorrectKey'; } & ScoredKeyEvent)
  | { readonly type: 'sequenceProgress' | 'sequenceComplete'; readonly lessonId: LessonId; readonly missionId: string; readonly position: number; readonly total: number }
  | { readonly type: 'retryRequested' | 'pauseRequested'; readonly lessonId: LessonId; readonly missionId: string }
  | { readonly type: 'inputCapabilityChanged'; readonly capability: InputCapability };

export interface KeyVisualState { readonly target: string | null; readonly pressedCorrect: string | null; readonly pressedIncorrect: string | null; }
export interface FingerGuidance { readonly key: string; readonly finger: FingerId; readonly hand: HandId; readonly shiftHand: HandId | null; }

const ROW_FINGERS: Readonly<Record<string, readonly [FingerId, HandId]>> = {
  q: ['leftPinky', 'left'], a: ['leftPinky', 'left'], z: ['leftPinky', 'left'],
  w: ['leftRing', 'left'], s: ['leftRing', 'left'], x: ['leftRing', 'left'],
  e: ['leftMiddle', 'left'], d: ['leftMiddle', 'left'], c: ['leftMiddle', 'left'],
  r: ['leftIndex', 'left'], t: ['leftIndex', 'left'], f: ['leftIndex', 'left'], g: ['leftIndex', 'left'], v: ['leftIndex', 'left'], b: ['leftIndex', 'left'],
  y: ['rightIndex', 'right'], u: ['rightIndex', 'right'], h: ['rightIndex', 'right'], j: ['rightIndex', 'right'], n: ['rightIndex', 'right'], m: ['rightIndex', 'right'],
  i: ['rightMiddle', 'right'], k: ['rightMiddle', 'right'], ',': ['rightMiddle', 'right'],
  o: ['rightRing', 'right'], l: ['rightRing', 'right'], '.': ['rightRing', 'right'],
  p: ['rightPinky', 'right'], ';': ['rightPinky', 'right'], '?': ['rightPinky', 'right'], '!': ['leftPinky', 'left'],
  '1': ['leftPinky', 'left'], '2': ['leftRing', 'left'], '3': ['leftMiddle', 'left'], '4': ['leftIndex', 'left'], '5': ['leftIndex', 'left'],
  '6': ['rightIndex', 'right'], '7': ['rightIndex', 'right'], '8': ['rightMiddle', 'right'], '9': ['rightRing', 'right'], '0': ['rightPinky', 'right'],
  ' ': ['leftThumb', 'left'],
};

export function getFingerGuidance(character: string): FingerGuidance | null {
  const [finger, hand] = ROW_FINGERS[character.toLowerCase()] ?? [];
  if (!finger || !hand) return null;
  const needsShift = /[A-Z?!]/u.test(character);
  return { key: character, finger, hand, shiftHand: needsShift ? (hand === 'left' ? 'right' : 'left') : null };
}

/** One DOM-bound adapter for every v2 typing encounter. No scene owns a key listener. */
export class TypingInputService {
  private target: EncounterTarget | null = null;
  private position = 0;
  private enabled = false;
  private composing = false;
  private capability: InputCapability = 'unknown';
  private visual: KeyVisualState = { target: null, pressedCorrect: null, pressedIncorrect: null };
  private lastAnnouncement = -Infinity;
  private consecutiveErrors = 0;
  private disposed = false;

  constructor(private readonly surface: HTMLElement, private readonly touchInput: HTMLInputElement,
    private readonly emit: (event: TypingEvent) => void, private readonly announce: (message: string) => void,
    private readonly now: () => number = () => performance.now()) {
    surface.addEventListener('keydown', this.onKeyDown);
    touchInput.addEventListener('input', this.onTouchInput);
    touchInput.addEventListener('compositionstart', this.onCompositionStart);
    touchInput.addEventListener('compositionend', this.onCompositionEnd);
    touchInput.tabIndex = -1;
    touchInput.hidden = true;
    touchInput.autocapitalize = 'off'; touchInput.autocomplete = 'off'; touchInput.spellcheck = false;
    touchInput.setAttribute('autocorrect', 'off');
  }

  start(target: EncounterTarget): void {
    if (this.disposed || !target.sequence || !target.missionId) throw new Error('Typing encounter requires a mission and sequence');
    const allowed = new Set(getAllowedKeys(target.lessonId));
    for (const char of target.sequence) {
      const key = char === ' ' ? 'Space' : char.toLowerCase();
      if (!allowed.has(key as KeyId) || (/[A-Z?!]/u.test(char) && !allowed.has('Shift'))) throw new Error(`Unintroduced key ${char} in ${target.lessonId}`);
    }
    this.target = target; this.position = 0; this.enabled = true; this.consecutiveErrors = 0;
    this.visual = { target: target.sequence[0] ?? null, pressedCorrect: null, pressedIncorrect: null };
    this.touchInput.tabIndex = -1; this.touchInput.hidden = true;
    this.surface.focus();
  }

  suspend(): void { this.enabled = false; this.touchInput.tabIndex = -1; this.touchInput.hidden = true; }
  resume(): void { if (this.target && !this.disposed) { this.enabled = true; this.surface.focus(); } }
  enableTouchFallback(): void {
    if (!this.target || !this.enabled) return;
    this.touchInput.hidden = false; this.touchInput.tabIndex = 0; this.touchInput.focus();
  }
  retry(): void {
    if (!this.target || !this.enabled) return;
    this.position = 0; this.consecutiveErrors = 0;
    this.visual = { target: this.target.sequence[0] ?? null, pressedCorrect: null, pressedIncorrect: null };
    this.emit({ type: 'retryRequested', lessonId: this.target.lessonId, missionId: this.target.missionId });
    this.announce('Try the sequence again.');
  }
  getPosition(): number { return this.position; }
  getCapability(): InputCapability { return this.capability; }
  getVisualState(): KeyVisualState { return this.visual; }

  /** Test injection follows the same normalisation and scoring path as DOM input. */
  injectKey(key: string, shiftUsed = false, source: InputSource = 'physical', timestamp = this.now()): boolean {
    if (!this.enabled || !this.target || this.disposed || [...key].length !== 1) return false;
    const expected = this.target.sequence[this.position];
    if (!expected) return false;
    const shiftExpected = /[A-Z?!]/u.test(expected);
    const correct = key === expected && shiftUsed === shiftExpected;
    if (this.capability !== source) { this.capability = source; this.emit({ type: 'inputCapabilityChanged', capability: source }); }
    const attempt: ScoredKeyEvent = { expectedKey: expected, receivedKey: key, timestamp, lessonId: this.target.lessonId,
      missionId: this.target.missionId, shiftExpected, shiftUsed, scorable: source === 'physical', source, position: this.position };
    this.emit({ type: 'keyAttempt', ...attempt });
    this.emit({ type: correct ? 'correctKey' : 'incorrectKey', ...attempt });
    if (correct) {
      this.position++; this.consecutiveErrors = 0;
      this.visual = { target: this.target.sequence[this.position] ?? null, pressedCorrect: key, pressedIncorrect: null };
      this.emit({ type: 'sequenceProgress', lessonId: this.target.lessonId, missionId: this.target.missionId, position: this.position, total: this.target.sequence.length });
      if (this.position < this.target.sequence.length && timestamp - this.lastAnnouncement >= 1200) {
        this.announce(`Next key: ${this.target.sequence[this.position]}.`);
        this.lastAnnouncement = timestamp;
      }
      if (this.position === this.target.sequence.length) {
        this.emit({ type: 'sequenceComplete', lessonId: this.target.lessonId, missionId: this.target.missionId, position: this.position, total: this.target.sequence.length });
        this.announce('Sequence complete. The habitat task can continue.');
        this.enabled = false; this.touchInput.tabIndex = -1; this.touchInput.hidden = true;
      }
    } else {
      this.consecutiveErrors++;
      this.visual = { target: expected, pressedCorrect: null, pressedIncorrect: key };
      if (timestamp - this.lastAnnouncement >= 1800 || this.consecutiveErrors === 3) {
        this.announce(this.consecutiveErrors >= 3 ? `Try ${expected} with the suggested finger. Take your time.` : `Try ${expected} again.`);
        this.lastAnnouncement = timestamp;
      }
    }
    return true;
  }

  private readonly onKeyDown = (event: KeyboardEvent): void => {
    if (!this.enabled || this.composing || event.isComposing || event.key === 'Process' || event.key === 'Dead') return;
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === 'Escape' && document.activeElement === this.surface && this.target) {
      event.preventDefault(); this.emit({ type: 'pauseRequested', lessonId: this.target.lessonId, missionId: this.target.missionId }); return;
    }
    if (document.activeElement !== this.surface || [...event.key].length !== 1) return;
    event.preventDefault(); this.injectKey(event.key, event.shiftKey, 'physical', this.now());
  };
  private readonly onTouchInput = (event: Event): void => {
    if (!this.enabled || this.composing || document.activeElement !== this.touchInput) return;
    const value = this.touchInput.value;
    this.touchInput.value = '';
    if ((event as InputEvent).inputType === 'insertFromPaste' || [...value].length !== 1) return;
    const key = value;
    this.injectKey(key, /[A-Z?!]/u.test(key), 'touch', this.now());
  };
  private readonly onCompositionStart = (): void => { this.composing = true; };
  private readonly onCompositionEnd = (): void => { this.composing = false; this.touchInput.value = ''; };

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; this.enabled = false;
    this.surface.removeEventListener('keydown', this.onKeyDown);
    this.touchInput.removeEventListener('input', this.onTouchInput);
    this.touchInput.removeEventListener('compositionstart', this.onCompositionStart);
    this.touchInput.removeEventListener('compositionend', this.onCompositionEnd);
  }
}

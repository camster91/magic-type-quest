import { getFingerHint } from './lessonLevels.js';
import { localizeFingerLabel } from './i18n.js';

function showFingerHint(text, color) {
  const hintElement = document.getElementById('finger-hint');
  if (!hintElement) return;
  hintElement.textContent = text;
  hintElement.style.color = color;
  hintElement.style.display = 'block';
}

/** Highlight the requested key on every rendered keyboard. */
export function highlightTargetKey(char) {
  document.querySelectorAll('.key').forEach((key) => key.classList.remove('target'));
  if (!char) return;

  const lower = char.toLowerCase();
  document.querySelectorAll(`.key[data-key="${lower}"]`).forEach((keyElement) => {
    keyElement.classList.add('target');
    if (keyElement.closest('#virtual-keyboard-game')) {
      keyElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  const hint = getFingerHint(char);
  if (hint) showFingerHint(localizeFingerLabel(hint.label), hint.color);
}

/** Briefly color the pressed key to acknowledge correct or incorrect input. */
export function showKeyFeedback(key, correct) {
  document.querySelectorAll(`.key[data-key="${key.toLowerCase()}"]`).forEach((keyElement) => {
    keyElement.classList.add(correct ? 'correct' : 'wrong');
    setTimeout(() => keyElement.classList.remove('correct', 'wrong'), 300);
  });
}

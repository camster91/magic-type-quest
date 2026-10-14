/**
 * The fox's spoken encouragement: the words of each pre-recorded clip.
 *
 * Every line was recorded once with a text-to-speech service and shipped as a
 * static file in public/audio/fox/{locale}/{id}.ogg. Nothing calls an AI while
 * a child plays. If you change a line here, record its clip again.
 *
 * The text is also the caption, so the lines are registered as i18n keys
 * (`fox.voice.<id>`) when the voice module loads during play. They live here
 * rather than in i18n.js so the home page does not download them.
 */
export const FOX_VOICE_LINES = {
  en: {
    'start.1': 'Let’s grow a meadow together!',
    'start.2': 'Ready? Let’s type!',
    'streak.1': 'Wow, you’re on a roll!',
    'streak.2': 'Look at the flowers grow!',
    'complete.1': 'You did it! The meadow is blooming!',
    'complete.2': 'Hooray! What a pretty meadow!',
    'miss.1': 'That’s okay. Keep going!',
    'miss.2': 'Take your time. You can do it!',
  },
  fr: {
    'start.1': 'Faisons pousser la prairie !',
    'start.2': 'C’est parti, on tape !',
    'streak.1': 'Wow, quelle belle série !',
    'streak.2': 'Regarde les fleurs pousser !',
    'complete.1': 'Tu as réussi ! La prairie fleurit !',
    'complete.2': 'Youpi ! Quelle belle prairie !',
    'miss.1': 'Pas grave. Continue !',
    'miss.2': 'Prends ton temps. Tu peux le faire !',
  },
  es: {
    'start.1': '¡Vamos a hacer crecer la pradera!',
    'start.2': '¡Empecemos a escribir!',
    'streak.1': '¡Guau, qué buena racha!',
    'streak.2': '¡Mira cómo crecen las flores!',
    'complete.1': '¡Lo lograste! ¡La pradera florece!',
    'complete.2': '¡Hurra! ¡Qué pradera tan bonita!',
    'miss.1': 'No pasa nada. ¡Sigue adelante!',
    'miss.2': 'Tómate tu tiempo. ¡Tú puedes!',
  },
};

/** Add the lines to the i18n dictionaries as `fox.voice.<id>` keys. */
export function registerFoxVoiceText(dictionaries) {
  for (const [locale, lines] of Object.entries(FOX_VOICE_LINES)) {
    if (!dictionaries[locale]) continue;
    for (const [id, text] of Object.entries(lines)) {
      dictionaries[locale][`fox.voice.${id}`] = text;
    }
  }
}

const dictionaries = {
  en: {
    'nav.lessons': 'Lessons', 'nav.practice': 'Practice', 'nav.garden': 'Garden', 'nav.profile': 'Profile',
    'nav.parents': 'Parents', 'nav.progress': 'Progress', 'nav.schools': 'For Schools', 'nav.back': 'Back', 'nav.allLessons': 'All Lessons',
    'menu.cta': 'Type to plant', 'menu.daily': '60-second Daily Moment', 'menu.lowStress': '60s · low stress',
    'menu.keepStreak': 'Tap to keep your 🔥!', 'menu.atRisk': '🔥 {count} — at risk!',
    'profile.title': 'My Profile', 'profile.name': 'Your Name', 'profile.language': 'Language',
    'profile.stars': 'Stars', 'profile.best': 'Best Score', 'profile.words': 'Words', 'profile.achievements': 'Achievements',
    'profile.classCode': 'Class Code', 'profile.classPlaceholder': 'Enter code (e.g. ABC123)',
    'profile.classHint': 'Ask your teacher for a class code to share your progress.',
    'profile.voice': 'Voice Narration', 'profile.save': 'Save Profile',
    'metric.score': 'Score', 'metric.finalScore': 'Final Score', 'metric.accuracy': 'Accuracy', 'metric.words': 'Words', 'metric.wordsTyped': 'Words Typed',
    'garden.title': 'My Garden', 'garden.empty': 'Your garden is empty!', 'garden.emptyHint': 'Complete levels to plant flowers here.',
    'game.level': 'Level {level}', 'game.combo': '🔥 {count} Combo!', 'game.typeWord': 'Type the word!',
    'game.levelName': 'Level {level} · {name}', 'game.levelCleared': 'Level {level} cleared — try the next!',
    'game.levelUnlock': 'Master the {name} to unlock Lv {level}', 'game.mastery': 'Keep going to become a Typing Master!',
    'game.shift': 'Hold SHIFT for capital letters!', 'game.useFinger': 'Use your {finger}',
    'game.paused': 'Paused', 'game.resume': 'Resume', 'game.quit': 'Quit to Menu', 'game.over': 'Game Over...',
    'game.levelComplete': 'Level Complete! 🌟', 'game.complete': 'Game Complete!', 'game.next': 'Next Level',
    'daily.title': 'Daily Moment', 'daily.subtitle': '60 seconds of focused typing',
    'daily.intro': 'No pressure. Type what you can. We will cheer you on!',
    'daily.complete': 'Daily Moment complete!', 'practice.type': 'Type: {word}',
    'practice.wordProgress': 'Word {current} of {total}',
  },
  fr: {
    'nav.lessons': 'Leçons', 'nav.practice': 'Pratique', 'nav.garden': 'Jardin', 'nav.profile': 'Profil',
    'nav.parents': 'Parents', 'nav.progress': 'Progrès', 'nav.schools': 'Pour les écoles', 'nav.back': 'Retour', 'nav.allLessons': 'Toutes les leçons',
    'menu.cta': 'Tape pour planter', 'menu.daily': 'Moment quotidien de 60 secondes', 'menu.lowStress': '60 s · sans stress',
    'profile.title': 'Mon profil', 'profile.name': 'Ton nom', 'profile.language': 'Langue',
    'profile.stars': 'Étoiles', 'profile.best': 'Meilleur score', 'profile.words': 'Mots', 'profile.achievements': 'Réussites',
    'profile.classCode': 'Code de classe', 'profile.voice': 'Narration vocale', 'profile.save': 'Enregistrer le profil',
    'metric.score': 'Score', 'metric.finalScore': 'Score final', 'metric.accuracy': 'Précision', 'metric.words': 'Mots', 'metric.wordsTyped': 'Mots tapés',
    'garden.title': 'Mon jardin', 'garden.empty': 'Ton jardin est vide !',
    'game.level': 'Niveau {level}', 'game.typeWord': 'Tape le mot !', 'game.paused': 'Pause', 'game.resume': 'Continuer',
    'game.levelName': 'Niveau {level} · {name}', 'game.levelCleared': 'Niveau {level} terminé — essaie le suivant !',
    'game.levelUnlock': 'Maîtrise {name} pour débloquer le niveau {level}', 'game.mastery': 'Continue pour devenir maître du clavier !',
    'game.quit': 'Quitter vers le menu', 'game.over': 'Partie terminée…', 'game.next': 'Niveau suivant',
    'daily.title': 'Moment quotidien', 'daily.complete': 'Moment quotidien terminé !',
  },
  es: {
    'nav.lessons': 'Lecciones', 'nav.practice': 'Práctica', 'nav.garden': 'Jardín', 'nav.profile': 'Perfil',
    'nav.parents': 'Familias', 'nav.progress': 'Progreso', 'nav.schools': 'Para escuelas', 'nav.back': 'Volver', 'nav.allLessons': 'Todas las lecciones',
    'menu.cta': 'Escribe para plantar', 'menu.daily': 'Momento diario de 60 segundos', 'menu.lowStress': '60 s · sin presión',
    'profile.title': 'Mi perfil', 'profile.name': 'Tu nombre', 'profile.language': 'Idioma',
    'profile.stars': 'Estrellas', 'profile.best': 'Mejor puntuación', 'profile.words': 'Palabras', 'profile.achievements': 'Logros',
    'profile.classCode': 'Código de clase', 'profile.voice': 'Narración de voz', 'profile.save': 'Guardar perfil',
    'metric.score': 'Puntuación', 'metric.finalScore': 'Puntuación final', 'metric.accuracy': 'Precisión', 'metric.words': 'Palabras', 'metric.wordsTyped': 'Palabras escritas',
    'garden.title': 'Mi jardín', 'garden.empty': '¡Tu jardín está vacío!',
    'game.level': 'Nivel {level}', 'game.typeWord': '¡Escribe la palabra!', 'game.paused': 'Pausa', 'game.resume': 'Continuar',
    'game.levelName': 'Nivel {level} · {name}', 'game.levelCleared': 'Nivel {level} superado — ¡prueba el siguiente!',
    'game.levelUnlock': 'Domina {name} para desbloquear el nivel {level}', 'game.mastery': '¡Sigue para convertirte en maestro del teclado!',
    'game.quit': 'Salir al menú', 'game.over': 'Fin del juego…', 'game.next': 'Siguiente nivel',
    'daily.title': 'Momento diario', 'daily.complete': '¡Momento diario completado!',
  },
};

export const supportedLocales = ['en', 'fr', 'es'];
let activeLocale = 'en';

export function setLocale(locale) {
  activeLocale = supportedLocales.includes(locale) ? locale : 'en';
  document.documentElement.lang = activeLocale;
  return activeLocale;
}

export function getLocale() { return activeLocale; }

export function t(key, values = {}) {
  const template = dictionaries[activeLocale]?.[key] ?? dictionaries.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

export function formatNumber(value, options) {
  return new Intl.NumberFormat(activeLocale, options).format(value);
}

export function formatDate(value, options = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat(activeLocale, options).format(new Date(value));
}

export function applyTranslations(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = t(element.dataset.i18nPlaceholder);
  });
  root.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });
}

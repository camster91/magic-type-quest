import { getLocale } from './i18n.js';

const content = {
  fr: {
    lessons: {
      1: { name: 'Jardin de la rangée de repos 🌸', subtitle: 'Mots du jardin', teaches: 'Apprends les touches de repos : a, s, d, f, j, k, l' },
      2: { name: 'Ciel de la rangée supérieure ⬆️', subtitle: 'Mots du ciel', teaches: 'Monte pour taper : q, w, e, r, t, y, u, i, o, p' },
      3: { name: 'Océan de la rangée inférieure ⬇️', subtitle: 'Mots de l’océan', teaches: 'Descends pour taper : z, x, c, v, b, n, m' },
      4: { name: 'Forêt de toutes les lettres 🌲', subtitle: 'Aventure en forêt', teaches: 'Mélange les 26 lettres dans de vrais mots' },
      5: { name: 'Ville des majuscules 🏙️', subtitle: 'Mots de la ville', teaches: 'Tape des majuscules : A, B, C, D…' },
      6: { name: 'Galaxie des nombres 🚀', subtitle: 'Nombres de l’espace', teaches: 'Tape les nombres : 1, 2, 3, 4, 5, 6, 7, 8, 9, 0' },
      7: { name: 'Prairie de vitesse ⚡', subtitle: 'Course rapide', teaches: 'Tape plus vite et augmente tes MPM' },
      8: { name: 'Sommet de précision 🎯', subtitle: 'Grimpe haut', teaches: 'Tape avec précision : chaque touche compte' },
      9: { name: 'Vallée de maîtrise ✨', subtitle: 'Traverse la vallée', teaches: 'Combine toutes tes compétences' },
      10: { name: 'Royaume des légendes 🏆', subtitle: 'Quête finale', teaches: 'Maîtrise la frappe sans regarder les touches' },
    },
    chapters: {
      1: { title: 'Le jardin s’éveille', subtitle: 'Jardin de la rangée de repos', intro: 'Bloom a dormi tout l’hiver. Réveille-le en tapant les lettres de la rangée de repos : A, S, D, F, J, K, L. Chaque mot plante une graine !', petLine: 'Les premières lettres de la saison ! Réveillons ce jardin !' },
      2: { title: 'Vers le ciel', subtitle: 'Ciel de la rangée supérieure', intro: 'Le soleil se lève ! Monte vers Q, W, E, R, T, Y, U, I, O, P. Plus tu tapes haut, plus le jardin brille !', petLine: 'Vise le ciel ! Ces touches sont tout là-haut !' },
      3: { title: 'Plonge en profondeur', subtitle: 'Océan de la rangée inférieure', intro: 'Les nuages arrivent ! Descends vers Z, X, C, V, B, N, M. Tape pour arroser les plantes assoiffées !', petLine: 'On descend ! Ces touches se cachent sous terre !' },
      4: { title: 'Le clavier complet', subtitle: 'Aventure en forêt', intro: 'La forêt t’appelle ! Tu connais maintenant les trois rangées. Utilise toutes les lettres pour avancer entre les arbres.', petLine: 'Toutes les rangées ensemble ! Explorons cette immense forêt !' },
      5: { title: 'Construis la ville', subtitle: 'Ville des majuscules', intro: 'Construisons en grand ! Maintiens Maj pour créer des lettres MAJUSCULES. Une ville a besoin de grands bâtiments !', petLine: 'Pouvoir Maj ! Construisons la plus haute tour !' },
      6: { title: 'Décollage !', subtitle: 'Galaxie des nombres', intro: '3… 2… 1… DÉCOLLAGE ! Les nombres de 0 à 9 alimentent la fusée. Tape-les pour envoyer Bloom dans l’espace !', petLine: 'Le carburant de la fusée, ce sont les nombres ! Comptons jusqu’aux étoiles !' },
      7: { title: 'Prairie de vitesse', subtitle: 'Course rapide', intro: 'Les fleurs font la course ! Peux-tu suivre ? Tape vite pour gagner le sprint de la prairie !', petLine: 'Plus vite ! Les fleurs s’enfuient vraiment !' },
      8: { title: 'Sommet de précision', subtitle: 'Grimpe haut', intro: 'Un faux pas et tu glisses ! Chaque lettre compte sur cette montagne. Tape avec précision pour atteindre le sommet !', petLine: 'Lentement mais sûrement ! Chaque lettre compte !' },
      9: { title: 'Vallée de maîtrise', subtitle: 'Traverse la vallée', intro: 'Le dernier test avant la légende. Toutes les touches, la vitesse et la précision : utilise tout ce que tu as appris !', petLine: 'C’est le moment. Tout notre entraînement nous a préparés !' },
      10: { title: 'Royaume des légendes', subtitle: 'Quête finale', intro: 'Le défi ultime. Le Royaume des légendes ne s’ouvre qu’aux vrais maîtres du clavier. Montre ce que tu sais faire !', petLine: 'Les portes du royaume s’ouvrent… pour TOI !' },
    },
    quests: {
      type_words: { title: 'Collection de mots', desc: 'Tape {target} mots aujourd’hui' },
      complete_level: { title: 'Champion de niveau', desc: 'Termine un niveau' },
      reach_wpm: { title: 'Démon de vitesse', desc: 'Atteins {target} MPM dans un niveau' },
      combo: { title: 'Roi du combo', desc: 'Réalise un combo de {target}' },
      accuracy: { title: 'Tireur précis', desc: 'Termine un niveau avec {target} % de précision' },
      practice: { title: 'La pratique rend parfait', desc: 'Joue une fois au mode Pratique' },
      no_skip: { title: 'Aucun saut !', desc: 'Termine un niveau sans appuyer sur Espace' },
    },
    achievementCategories: { speed: 'Vitesse', accuracy: 'Précision', combo: 'Combo', volume: 'Volume', mastery: 'Maîtrise' },
    achievements: {
      speed_10: ['Premiers pas', 'Atteins 10 MPM dans un niveau'], speed_20: ['Marche rapide', 'Atteins 20 MPM'],
      speed_30: ['À toute vitesse', 'Atteins 30 MPM'], speed_40: ['Doigts éclair', 'Atteins 40 MPM'],
      accuracy_80: ['Dactylo attentif', 'Termine un niveau avec au moins 80 % de précision'],
      accuracy_95: ['Perfectionniste', 'Termine un niveau avec au moins 95 % de précision'],
      accuracy_100: ['Sans faute', 'Termine un niveau avec 100 % de précision'],
      no_miss_5: ['Main sûre', 'Tape 5 mots de suite sans erreur'], combo_5: ['En feu', 'Réalise un combo de 5'],
      combo_10: ['Brasier', 'Réalise un combo de 10'], combo_15: ['Légendaire', 'Réalise un combo de 15'],
      words_50: ['Collection de mots', 'Tape 50 mots au total'], words_200: ['Bibliothécaire', 'Tape 200 mots au total'],
      words_500: ['Romancier', 'Tape 500 mots au total'], level_1: ['Première floraison', 'Termine le niveau 1'],
      level_5: ['Héros à mi-chemin', 'Termine le niveau 5'], level_10: ['Légende', 'Termine les 10 niveaux'],
      evolution_2: ['En pleine croissance', 'Aide Bloom à évoluer une fois'],
      evolution_3: ['Pleine floraison', 'Aide Bloom à atteindre sa forme finale'],
      all_levels_3star: ['Maître du jardin', 'Termine tous les niveaux'],
    },
  },
  es: {
    lessons: {
      1: { name: 'Jardín de la fila guía 🌸', subtitle: 'Palabras del jardín', teaches: 'Aprende las teclas guía: a, s, d, f, j, k, l' },
      2: { name: 'Cielo de la fila superior ⬆️', subtitle: 'Palabras del cielo', teaches: 'Sube para escribir: q, w, e, r, t, y, u, i, o, p' },
      3: { name: 'Océano de la fila inferior ⬇️', subtitle: 'Palabras del océano', teaches: 'Baja para escribir: z, x, c, v, b, n, m' },
      4: { name: 'Bosque de todas las letras 🌲', subtitle: 'Aventura en el bosque', teaches: 'Mezcla las 26 letras en palabras reales' },
      5: { name: 'Ciudad de mayúsculas 🏙️', subtitle: 'Palabras de la ciudad', teaches: 'Escribe mayúsculas: A, B, C, D…' },
      6: { name: 'Galaxia de números 🚀', subtitle: 'Números espaciales', teaches: 'Escribe los números: 1, 2, 3, 4, 5, 6, 7, 8, 9, 0' },
      7: { name: 'Pradera de velocidad ⚡', subtitle: 'Carrera rápida', teaches: 'Escribe más rápido y aumenta tus PPM' },
      8: { name: 'Pico de precisión 🎯', subtitle: 'Sube alto', teaches: 'Escribe con precisión: cada tecla cuenta' },
      9: { name: 'Valle de maestría ✨', subtitle: 'Cruza el valle', teaches: 'Combina todas tus habilidades' },
      10: { name: 'Reino de leyendas 🏆', subtitle: 'Misión final', teaches: 'Domina la mecanografía sin mirar las teclas' },
    },
    chapters: {
      1: { title: 'El jardín despierta', subtitle: 'Jardín de la fila guía', intro: 'Bloom ha dormido todo el invierno. Despiértalo escribiendo A, S, D, F, J, K y L. ¡Cada palabra planta una semilla!', petLine: '¡Las primeras letras de la temporada! ¡Despertemos el jardín!' },
      2: { title: 'Alcanza el cielo', subtitle: 'Cielo de la fila superior', intro: '¡Sale el sol! Sube hasta Q, W, E, R, T, Y, U, I, O y P. Cuanto más alto escribas, más brillará el jardín.', petLine: '¡Alcanza el cielo! ¡Estas teclas están muy arriba!' },
      3: { title: 'Bucea profundo', subtitle: 'Océano de la fila inferior', intro: '¡Llegan nubes de lluvia! Baja hasta Z, X, C, V, B, N y M. Escribe para regar las plantas sedientas.', petLine: '¡Vamos abajo! ¡Estas teclas se esconden bajo tierra!' },
      4: { title: 'El teclado completo', subtitle: 'Aventura en el bosque', intro: '¡El bosque te llama! Ya conoces las tres filas. Usa todas las letras para adentrarte entre los árboles.', petLine: '¡Todas las filas juntas! ¡Exploremos este bosque enorme!' },
      5: { title: 'Construye la ciudad', subtitle: 'Ciudad de mayúsculas', intro: '¡Construyamos a lo grande! Mantén Mayús para crear letras MAYÚSCULAS. ¡Una ciudad necesita edificios altos!', petLine: '¡Poder Mayús! ¡Construyamos la torre más alta!' },
      6: { title: '¡Despegue!', subtitle: 'Galaxia de números', intro: '3… 2… 1… ¡DESPEGUE! Los números del 0 al 9 impulsan el cohete. Escríbelos para llevar a Bloom al espacio.', petLine: '¡El combustible son los números! ¡Contemos hasta las estrellas!' },
      7: { title: 'Pradera de velocidad', subtitle: 'Carrera rápida', intro: '¡Las flores compiten! ¿Puedes seguirlas? Escribe rápido para ganar la carrera de la pradera.', petLine: '¡Más rápido! ¡Las flores se escapan de verdad!' },
      8: { title: 'Pico de precisión', subtitle: 'Sube alto', intro: '¡Un paso en falso y resbalas! Cada letra importa en esta montaña. Escribe con precisión para alcanzar la cima.', petLine: '¡Despacio y con firmeza! ¡Cada letra cuenta!' },
      9: { title: 'Valle de maestría', subtitle: 'Cruza el valle', intro: 'La última prueba antes de ser leyenda. Todas las teclas, velocidad y precisión: usa todo lo aprendido.', petLine: 'Este es el momento. ¡Todo nuestro entrenamiento nos preparó!' },
      10: { title: 'Reino de leyendas', subtitle: 'Misión final', intro: 'El desafío definitivo. El Reino de leyendas solo se abre para maestros de la mecanografía. ¡Demuestra lo que sabes!', petLine: 'Las puertas del reino se abren… ¡para TI!' },
    },
    quests: {
      type_words: { title: 'Coleccionista de palabras', desc: 'Escribe {target} palabras hoy' },
      complete_level: { title: 'Campeón de nivel', desc: 'Completa cualquier nivel' },
      reach_wpm: { title: 'Demonio de velocidad', desc: 'Alcanza {target} PPM en un nivel' },
      combo: { title: 'Rey del combo', desc: 'Consigue un combo de {target}' },
      accuracy: { title: 'Tirador preciso', desc: 'Completa un nivel con {target} % de precisión' },
      practice: { title: 'La práctica hace al maestro', desc: 'Juega una vez al modo Práctica' },
      no_skip: { title: '¡Sin saltos!', desc: 'Completa un nivel sin pulsar Espacio' },
    },
    achievementCategories: { speed: 'Velocidad', accuracy: 'Precisión', combo: 'Combo', volume: 'Volumen', mastery: 'Maestría' },
    achievements: {
      speed_10: ['Primeros pasos', 'Alcanza 10 PPM en cualquier nivel'], speed_20: ['Paso veloz', 'Alcanza 20 PPM'],
      speed_30: ['A toda velocidad', 'Alcanza 30 PPM'], speed_40: ['Dedos relámpago', 'Alcanza 40 PPM'],
      accuracy_80: ['Mecanógrafo cuidadoso', 'Completa un nivel con al menos 80 % de precisión'],
      accuracy_95: ['Perfeccionista', 'Completa un nivel con al menos 95 % de precisión'],
      accuracy_100: ['Impecable', 'Completa un nivel con 100 % de precisión'],
      no_miss_5: ['Mano firme', 'Escribe 5 palabras seguidas sin fallar'], combo_5: ['En llamas', 'Consigue un combo de 5'],
      combo_10: ['Infierno', 'Consigue un combo de 10'], combo_15: ['Legendario', 'Consigue un combo de 15'],
      words_50: ['Coleccionista de palabras', 'Escribe 50 palabras en total'], words_200: ['Bibliotecario', 'Escribe 200 palabras en total'],
      words_500: ['Novelista', 'Escribe 500 palabras en total'], level_1: ['Primera flor', 'Completa el nivel 1'],
      level_5: ['Héroe a mitad de camino', 'Completa el nivel 5'], level_10: ['Leyenda', 'Completa los 10 niveles'],
      evolution_2: ['Creciendo', 'Ayuda a Bloom a evolucionar una vez'],
      evolution_3: ['Floración completa', 'Ayuda a Bloom a alcanzar su forma final'],
      all_levels_3star: ['Maestro del jardín', 'Completa todos los niveles'],
    },
  },
};

function localeContent(section) {
  return content[getLocale()]?.[section];
}

export function localizeLesson(lesson) {
  return lesson ? { ...lesson, ...(localeContent('lessons')?.[lesson.id] || {}) } : lesson;
}

export function localizeQuest(quest) {
  const translated = localeContent('quests')?.[quest.templateId];
  if (!translated) return quest;
  return {
    ...quest,
    title: translated.title,
    desc: translated.desc.replace('{target}', String(quest.target)),
  };
}

export function localizeChapter(chapter, level) {
  return chapter ? { ...chapter, ...(localeContent('chapters')?.[level] || {}) } : chapter;
}

export function localizeAchievement(achievement) {
  const translated = localeContent('achievements')?.[achievement.id];
  if (!translated) return achievement;
  return { ...achievement, title: translated[0], desc: translated[1] };
}

export function localizeAchievementCategory(key, category) {
  return { ...category, label: localeContent('achievementCategories')?.[key] || category.label };
}

export const translatedContent = content;

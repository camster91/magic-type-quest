import { setLocale, supportedLocales } from './i18n.js';

export const pageDictionaries = {
  en: {
    'parent.title': 'BloomType — Help Your Child Learn to Type at Home',
    'parent.hero': '<div class="free-badge">✨ Completely Free — No Credit Card Required</div><h1>Help Your Child Learn to Type with <span>BloomType</span></h1><p>A magical garden typing adventure for kids ages 6–11. No boring drills — just flowers, pets, and fun word games that build real keyboard skills.</p><a href="./index.html" class="cta-btn">🌸 Start Playing Now — It\'s Free!</a>',
    'parent.problemTitle': 'Why Typing Matters Now',
    'parent.problems': '<div class="problem-card"><div class="emoji">📚</div><h4>Schools Assume They Know</h4><p>Teachers assign online essays and tests, but kids never get formal typing instruction. They hunt-and-peck for years.</p></div><div class="problem-card"><div class="emoji">⏱️</div><h4>Homework Takes Forever</h4><p>A 10-minute assignment takes 45 minutes because they cannot find the keys. Frustration builds.</p></div><div class="problem-card"><div class="emoji">😫</div><h4>“Practice Websites” Are Boring</h4><p>Adult typing tutors are dry, timed, and stressful. Kids quit after 2 minutes.</p></div>',
    'parent.howTitle': 'How BloomType Works',
    'parent.features': '<div class="feature"><h4>🌸 Words Fall From the Sky</h4><p>Your child types words before they reach the ground. Miss a word? A flower wilts. Type it right? A new flower blooms in their garden.</p></div><div class="feature"><h4>🐱 A Pet Cheers Them On</h4><p>A friendly flower-pet reacts to every keystroke. “Nice!” for correct letters. Gentle encouragement for mistakes.</p></div><div class="feature"><h4>🎹 10 Built-In Lessons</h4><p>Starts with home row (ASDF). Gradually adds top row, bottom row, capitals, and numbers. Each level takes 5–10 minutes.</p></div><div class="feature"><h4>🏆 Progress They Can See</h4><p>The garden grows as they play. Stars collect. Levels unlock. Kids feel proud of visible progress.</p></div>',
    'parent.curriculumTitle': 'What They Will Learn (10 Levels)',
    'parent.curriculum': '<div class="level-preview"><div class="level-icon">🌸</div><h5>Home Row Garden</h5><p>ASDF JKL; — finger placement</p></div><div class="level-preview"><div class="level-icon">⬆️</div><h5>Top Row Sky</h5><p>QWERTYUIOP — reaching up</p></div><div class="level-preview"><div class="level-icon">⬇️</div><h5>Bottom Row Ocean</h5><p>ZXCVBNM — reaching down</p></div><div class="level-preview"><div class="level-icon">🌲</div><h5>All Letters Forest</h5><p>A–Z mixed practice</p></div><div class="level-preview"><div class="level-icon">🏙️</div><h5>Capital City</h5><p>SHIFT + key technique</p></div><div class="level-preview"><div class="level-icon">🚀</div><h5>Number Galaxy</h5><p>0123456789</p></div><div class="level-preview"><div class="level-icon">⚡</div><h5>Speed Meadow</h5><p>Faster pace, combo chains</p></div><div class="level-preview"><div class="level-icon">🎯</div><h5>Accuracy Peak</h5><p>Precision focus</p></div><div class="level-preview"><div class="level-icon">✨</div><h5>Master Valley</h5><p>Challenge words</p></div><div class="level-preview"><div class="level-icon">🏆</div><h5>Legend Kingdom</h5><p>Final quest with everything</p></div>',
    'parent.preview': '<h3>📊 Parents Can Track Progress</h3><p>When your child plays on this device, you will see their WPM (words per minute), accuracy, and completed levels. No account is needed — progress saves automatically.</p><div class="stat-row"><div class="stat-pill">⚡ 12 WPM</div><div class="stat-pill">🎯 94% Accuracy</div><div class="stat-pill">🌸 Level 4 Reached</div><div class="stat-pill">⏱️ 45 Minutes Played</div></div><p style="margin-top:16px;font-size:0.85rem"><a href="./teacher.html" style="color:var(--primary-light)">Open Progress Dashboard →</a></p>',
    'parent.privacyTitle': 'What BloomType Stores',
    'parent.privacy': '<h3>Default local play</h3><p>BloomType stores the student’s chosen display name and avatar, scores, lesson progress, achievements, garden, practice history, class code, and accessibility preferences in this browser. It does not send that progress to BloomType or Ashbi while cloud sync is disabled.</p><h3>What we do not collect</h3><p>The game has no advertising, analytics, behavioral profiling, or third-party tracking SDKs. It does not ask students for an email address, birth date, home address, precise location, or free-form messages.</p><h3>Delete local progress</h3><p>Open <strong>Profile</strong> in the game and choose <strong>Delete local progress</strong>. This removes that student’s profile, progress, and local class membership from this browser. Clearing site data in the browser provides a second deletion path.</p><h3>School cloud deployments</h3><p>Cloud sync remains disabled in the public deployment. A future school deployment must complete its consent, retention, access, deletion, security, and account-isolation review before storing real student data. Local deletion does not delete school cloud records; the participating school must provide that process.</p><h3>Questions</h3><p>Email <a href="mailto:cameron@ashbi.ca?subject=BloomType%20privacy">cameron@ashbi.ca</a>. These product controls reduce risk but are not a claim of legal compliance for every school or region.</p>',
    'parent.trustTitle': 'Built for Peace of Mind',
    'parent.trust': '<div class="trust-badge"><span class="emoji">🔒</span><span>No Personal Info Required</span></div><div class="trust-badge"><span class="emoji">🚫</span><span>No Ads, No Tracking</span></div><div class="trust-badge"><span class="emoji">💾</span><span>Saves Locally On Device</span></div><div class="trust-badge"><span class="emoji">🆓</span><span>Student Play Is Free</span></div><div class="trust-badge"><span class="emoji">🌐</span><span>Works in Any Browser</span></div>',
    'parent.cta': '<h2 style="margin-bottom:12px">Ready to Start?</h2><p style="color:var(--text-dim);margin-bottom:24px">Takes 2 minutes. No setup. Works on laptops, Chromebooks, and tablets with keyboards.</p><a href="./index.html" class="cta-btn" style="font-size:1.4rem;padding:18px 48px">🌸 Play BloomType Now</a><p style="margin-top:16px;font-size:0.8rem;color:var(--text-dim)">Recommended: 10–15 minutes/day for 2 weeks</p>',
    'parent.footer': '<p>BloomType — made for kids who deserve better than boring typing drills.</p><p>Teachers: assign levels by having students visit this page from your classroom computers. Data stays on your school’s devices.</p>',
    'teacher.title': 'BloomType — Teacher Dashboard', 'teacher.heading': '🌸 BloomType Teacher Dashboard',
    'teacher.subtitle': 'Track typing progress for your classroom.', 'teacher.local': '💾 Local', 'teacher.cloud': '☁️ Cloud',
    'teacher.classCode': 'Class Code', 'teacher.classPlaceholder': 'Class code (e.g. ABC123)',
    'teacher.load': '🔍 Load Class', 'teacher.all': '🔄 All Students', 'teacher.exportCsv': '📊 Export CSV',
    'teacher.exportJson': '📋 Export JSON', 'teacher.clear': '🗑 Clear All', 'teacher.allLocal': 'All Students (Local)',
    'teacher.tableLabel': 'Student progress table',
    'teacher.student': 'Student', 'teacher.level': 'Level', 'teacher.words': 'Words', 'teacher.score': 'Score',
    'teacher.stars': 'Stars', 'teacher.status': 'Status', 'teacher.source': 'Source', 'teacher.noData': 'No data yet',
    'teacher.emptyHint': 'Students will appear here after they play BloomType. 🌸', 'teacher.students': 'Students',
    'teacher.totalStars': 'Total Stars', 'teacher.wordsTyped': 'Words Typed', 'teacher.avgLevel': 'Avg Level',
    'teacher.activeToday': 'Active Today', 'teacher.inactiveOne': '1 student has not played in 7+ days.',
    'teacher.inactiveMany': '{count} students have not played in 7+ days.',
    'teacher.completed': 'Completed!', 'teacher.onTrack': 'On Track', 'teacher.gettingStarted': 'Getting Started',
    'teacher.notStarted': 'Not Started', 'teacher.anonymous': 'Anonymous', 'teacher.noExport': 'No data to export',
    'teacher.clearConfirm': '⚠️ Delete ALL local student data? Cannot be undone!',
    'teacher.noCloud': 'No cloud data for this class. Students may not have synced yet.',
    'teacher.noClass': 'No students have joined class {code} on this device yet.',
    'teacher.noLocal': 'No student data on this device yet.',
  },
  fr: {
    'parent.title': 'BloomType — Aidez votre enfant à apprendre à taper à la maison',
    'parent.hero': '<div class="free-badge">✨ Entièrement gratuit — aucune carte de crédit requise</div><h1>Aidez votre enfant à apprendre à taper avec <span>BloomType</span></h1><p>Une aventure de frappe dans un jardin magique pour les enfants de 6 à 11 ans. Pas d’exercices ennuyeux : des fleurs, des compagnons et des jeux de mots amusants qui développent de vraies compétences au clavier.</p><a href="./index.html" class="cta-btn">🌸 Commencer à jouer gratuitement !</a>',
    'parent.problemTitle': 'Pourquoi la frappe compte aujourd’hui',
    'parent.problems': '<div class="problem-card"><div class="emoji">📚</div><h4>Les écoles supposent qu’ils savent déjà</h4><p>Les enseignants donnent des rédactions et des tests en ligne, mais les enfants reçoivent rarement un enseignement formel de la frappe. Ils cherchent les touches pendant des années.</p></div><div class="problem-card"><div class="emoji">⏱️</div><h4>Les devoirs prennent une éternité</h4><p>Un travail de 10 minutes en prend 45 parce qu’ils ne trouvent pas les touches. La frustration augmente.</p></div><div class="problem-card"><div class="emoji">😫</div><h4>Les sites d’entraînement sont ennuyeux</h4><p>Les outils de frappe pour adultes sont secs, chronométrés et stressants. Les enfants abandonnent après 2 minutes.</p></div>',
    'parent.howTitle': 'Comment fonctionne BloomType',
    'parent.features': '<div class="feature"><h4>🌸 Les mots tombent du ciel</h4><p>Votre enfant tape les mots avant qu’ils touchent le sol. Un mot manqué fait faner une fleur; un mot réussi en fait éclore une dans son jardin.</p></div><div class="feature"><h4>🐱 Un compagnon l’encourage</h4><p>Un gentil compagnon floral réagit à chaque frappe. Il félicite les bonnes lettres et encourage doucement après les erreurs.</p></div><div class="feature"><h4>🎹 10 leçons intégrées</h4><p>Le parcours commence par la rangée de repos, puis ajoute progressivement les rangées supérieure et inférieure, les majuscules et les chiffres. Chaque niveau dure de 5 à 10 minutes.</p></div><div class="feature"><h4>🏆 Des progrès visibles</h4><p>Le jardin grandit, les étoiles s’accumulent et les niveaux se débloquent. Les enfants peuvent être fiers de leurs progrès.</p></div>',
    'parent.curriculumTitle': 'Ce qu’ils apprendront (10 niveaux)',
    'parent.curriculum': '<div class="level-preview"><div class="level-icon">🌸</div><h5>Jardin de la rangée de repos</h5><p>ASDF JKL; — placement des doigts</p></div><div class="level-preview"><div class="level-icon">⬆️</div><h5>Ciel de la rangée supérieure</h5><p>QWERTYUIOP — tendre les doigts vers le haut</p></div><div class="level-preview"><div class="level-icon">⬇️</div><h5>Océan de la rangée inférieure</h5><p>ZXCVBNM — tendre les doigts vers le bas</p></div><div class="level-preview"><div class="level-icon">🌲</div><h5>Forêt de toutes les lettres</h5><p>Pratique mixte de A à Z</p></div><div class="level-preview"><div class="level-icon">🏙️</div><h5>Ville des majuscules</h5><p>Technique MAJ + touche</p></div><div class="level-preview"><div class="level-icon">🚀</div><h5>Galaxie des nombres</h5><p>0123456789</p></div><div class="level-preview"><div class="level-icon">⚡</div><h5>Prairie de vitesse</h5><p>Rythme accéléré et combos</p></div><div class="level-preview"><div class="level-icon">🎯</div><h5>Sommet de précision</h5><p>Priorité à la précision</p></div><div class="level-preview"><div class="level-icon">✨</div><h5>Vallée de maîtrise</h5><p>Mots difficiles</p></div><div class="level-preview"><div class="level-icon">🏆</div><h5>Royaume des légendes</h5><p>Quête finale complète</p></div>',
    'parent.preview': '<h3>📊 Les parents peuvent suivre les progrès</h3><p>Quand votre enfant joue sur cet appareil, vous voyez sa vitesse, sa précision et les niveaux terminés. Aucun compte n’est requis : les progrès sont enregistrés automatiquement.</p><div class="stat-row"><div class="stat-pill">⚡ 12 MPM</div><div class="stat-pill">🎯 Précision de 94 %</div><div class="stat-pill">🌸 Niveau 4 atteint</div><div class="stat-pill">⏱️ 45 minutes de jeu</div></div><p style="margin-top:16px;font-size:0.85rem"><a href="./teacher.html" style="color:var(--primary-light)">Ouvrir le tableau de progression →</a></p>',
    'parent.privacyTitle': 'Ce que BloomType conserve',
    'parent.privacy': '<h3>Jeu local par défaut</h3><p>BloomType conserve dans ce navigateur le nom d’affichage et l’avatar choisis par l’élève, ses scores, sa progression, ses réussites, son jardin, son historique de pratique, son code de classe et ses préférences d’accessibilité. Aucune progression n’est envoyée à BloomType ou à Ashbi lorsque la synchronisation infonuagique est désactivée.</p><h3>Ce que nous ne recueillons pas</h3><p>Le jeu ne contient ni publicité, ni analyse, ni profilage comportemental, ni outil de suivi tiers. Il ne demande pas l’adresse courriel, la date de naissance, l’adresse du domicile, la position précise ou des messages libres de l’élève.</p><h3>Supprimer les progrès locaux</h3><p>Ouvrez <strong>Profil</strong> dans le jeu et choisissez <strong>Supprimer les progrès locaux</strong>. Cela supprime de ce navigateur le profil, les progrès et l’appartenance locale à la classe. Effacer les données du site dans le navigateur offre une deuxième méthode.</p><h3>Déploiements infonuagiques scolaires</h3><p>La synchronisation infonuagique reste désactivée dans le déploiement public. Avant de conserver de vraies données d’élèves, tout futur déploiement scolaire doit examiner le consentement, la conservation, l’accès, la suppression, la sécurité et l’isolation des comptes. La suppression locale n’efface pas les dossiers infonuagiques de l’école; l’école participante doit fournir ce processus.</p><h3>Questions</h3><p>Écrivez à <a href="mailto:cameron@ashbi.ca?subject=BloomType%20privacy">cameron@ashbi.ca</a>. Ces contrôles réduisent les risques, sans constituer une déclaration de conformité juridique pour chaque école ou région.</p>',
    'parent.trustTitle': 'Conçu pour votre tranquillité d’esprit',
    'parent.trust': '<div class="trust-badge"><span class="emoji">🔒</span><span>Aucun renseignement personnel requis</span></div><div class="trust-badge"><span class="emoji">🚫</span><span>Aucune publicité ni suivi</span></div><div class="trust-badge"><span class="emoji">💾</span><span>Enregistrement local sur l’appareil</span></div><div class="trust-badge"><span class="emoji">🆓</span><span>Jeu gratuit pour les élèves</span></div><div class="trust-badge"><span class="emoji">🌐</span><span>Fonctionne dans tout navigateur</span></div>',
    'parent.cta': '<h2 style="margin-bottom:12px">Prêt à commencer ?</h2><p style="color:var(--text-dim);margin-bottom:24px">Deux minutes suffisent. Aucune configuration. Fonctionne sur les portables, Chromebooks et tablettes avec clavier.</p><a href="./index.html" class="cta-btn" style="font-size:1.4rem;padding:18px 48px">🌸 Jouer à BloomType</a><p style="margin-top:16px;font-size:0.8rem;color:var(--text-dim)">Recommandation : 10 à 15 minutes par jour pendant 2 semaines</p>',
    'parent.footer': '<p>BloomType — pour les enfants qui méritent mieux que des exercices de frappe ennuyeux.</p><p>Enseignants : attribuez les niveaux en faisant ouvrir cette page sur les ordinateurs de la classe. Les données restent sur les appareils de votre école.</p>',
    'teacher.title': 'BloomType — Tableau de bord enseignant', 'teacher.heading': '🌸 Tableau de bord enseignant BloomType',
    'teacher.subtitle': 'Suivez les progrès de frappe de votre classe.', 'teacher.local': '💾 Local', 'teacher.cloud': '☁️ Infonuagique',
    'teacher.classCode': 'Code de classe', 'teacher.classPlaceholder': 'Code de classe (ex. ABC123)',
    'teacher.load': '🔍 Charger la classe', 'teacher.all': '🔄 Tous les élèves', 'teacher.exportCsv': '📊 Exporter CSV',
    'teacher.exportJson': '📋 Exporter JSON', 'teacher.clear': '🗑 Tout effacer', 'teacher.allLocal': 'Tous les élèves (local)',
    'teacher.tableLabel': 'Tableau de progression des élèves',
    'teacher.student': 'Élève', 'teacher.level': 'Niveau', 'teacher.words': 'Mots', 'teacher.score': 'Score',
    'teacher.stars': 'Étoiles', 'teacher.status': 'État', 'teacher.source': 'Source', 'teacher.noData': 'Aucune donnée',
    'teacher.emptyHint': 'Les élèves apparaîtront ici après avoir joué à BloomType. 🌸', 'teacher.students': 'Élèves',
    'teacher.totalStars': 'Total des étoiles', 'teacher.wordsTyped': 'Mots tapés', 'teacher.avgLevel': 'Niveau moyen',
    'teacher.activeToday': 'Actifs aujourd’hui', 'teacher.inactiveOne': '1 élève n’a pas joué depuis au moins 7 jours.',
    'teacher.inactiveMany': '{count} élèves n’ont pas joué depuis au moins 7 jours.',
    'teacher.completed': 'Terminé !', 'teacher.onTrack': 'En bonne voie', 'teacher.gettingStarted': 'Débutant',
    'teacher.notStarted': 'Non commencé', 'teacher.anonymous': 'Anonyme', 'teacher.noExport': 'Aucune donnée à exporter',
    'teacher.clearConfirm': '⚠️ Supprimer TOUTES les données locales des élèves ? Action irréversible !',
    'teacher.noCloud': 'Aucune donnée infonuagique pour cette classe. Les élèves ne sont peut-être pas encore synchronisés.',
    'teacher.noClass': 'Aucun élève n’a encore rejoint la classe {code} sur cet appareil.',
    'teacher.noLocal': 'Aucune donnée d’élève sur cet appareil.',
  },
  es: {
    'parent.title': 'BloomType — Ayuda a tu hijo a aprender mecanografía en casa',
    'parent.hero': '<div class="free-badge">✨ Totalmente gratis — no se requiere tarjeta de crédito</div><h1>Ayuda a tu hijo a aprender mecanografía con <span>BloomType</span></h1><p>Una aventura de mecanografía en un jardín mágico para niños de 6 a 11 años. Sin ejercicios aburridos: flores, compañeros y juegos de palabras divertidos que desarrollan habilidades reales.</p><a href="./index.html" class="cta-btn">🌸 ¡Empieza a jugar gratis!</a>',
    'parent.problemTitle': 'Por qué la mecanografía importa hoy',
    'parent.problems': '<div class="problem-card"><div class="emoji">📚</div><h4>Las escuelas suponen que ya saben</h4><p>El profesorado asigna redacciones y pruebas en línea, pero los niños rara vez reciben clases formales de mecanografía. Buscan las teclas durante años.</p></div><div class="problem-card"><div class="emoji">⏱️</div><h4>Los deberes tardan una eternidad</h4><p>Una tarea de 10 minutos tarda 45 porque no encuentran las teclas. La frustración aumenta.</p></div><div class="problem-card"><div class="emoji">😫</div><h4>Los sitios de práctica son aburridos</h4><p>Los tutores de mecanografía para adultos son secos, cronometrados y estresantes. Los niños abandonan a los 2 minutos.</p></div>',
    'parent.howTitle': 'Cómo funciona BloomType',
    'parent.features': '<div class="feature"><h4>🌸 Las palabras caen del cielo</h4><p>Tu hijo escribe las palabras antes de que lleguen al suelo. Si falla, una flor se marchita; si acierta, nace una flor nueva en su jardín.</p></div><div class="feature"><h4>🐱 Un compañero le anima</h4><p>Un simpático compañero floral reacciona a cada pulsación. Celebra las letras correctas y anima con suavidad tras los errores.</p></div><div class="feature"><h4>🎹 10 lecciones incluidas</h4><p>Empieza con la fila guía y añade poco a poco la fila superior, la inferior, las mayúsculas y los números. Cada nivel dura entre 5 y 10 minutos.</p></div><div class="feature"><h4>🏆 Progreso visible</h4><p>El jardín crece, se acumulan estrellas y se desbloquean niveles. Los niños se sienten orgullosos de su progreso.</p></div>',
    'parent.curriculumTitle': 'Lo que aprenderán (10 niveles)',
    'parent.curriculum': '<div class="level-preview"><div class="level-icon">🌸</div><h5>Jardín de la fila guía</h5><p>ASDF JKL; — posición de los dedos</p></div><div class="level-preview"><div class="level-icon">⬆️</div><h5>Cielo de la fila superior</h5><p>QWERTYUIOP — alcanzar arriba</p></div><div class="level-preview"><div class="level-icon">⬇️</div><h5>Océano de la fila inferior</h5><p>ZXCVBNM — alcanzar abajo</p></div><div class="level-preview"><div class="level-icon">🌲</div><h5>Bosque de todas las letras</h5><p>Práctica mixta de A a Z</p></div><div class="level-preview"><div class="level-icon">🏙️</div><h5>Ciudad de mayúsculas</h5><p>Técnica MAYÚS + tecla</p></div><div class="level-preview"><div class="level-icon">🚀</div><h5>Galaxia de números</h5><p>0123456789</p></div><div class="level-preview"><div class="level-icon">⚡</div><h5>Pradera de velocidad</h5><p>Más ritmo y combos</p></div><div class="level-preview"><div class="level-icon">🎯</div><h5>Cumbre de precisión</h5><p>Prioridad a la precisión</p></div><div class="level-preview"><div class="level-icon">✨</div><h5>Valle de maestría</h5><p>Palabras difíciles</p></div><div class="level-preview"><div class="level-icon">🏆</div><h5>Reino de leyendas</h5><p>Misión final completa</p></div>',
    'parent.preview': '<h3>📊 Las familias pueden seguir el progreso</h3><p>Cuando tu hijo juega en este dispositivo, puedes ver su velocidad, precisión y niveles completados. No necesita cuenta: el progreso se guarda automáticamente.</p><div class="stat-row"><div class="stat-pill">⚡ 12 PPM</div><div class="stat-pill">🎯 94 % de precisión</div><div class="stat-pill">🌸 Nivel 4 alcanzado</div><div class="stat-pill">⏱️ 45 minutos de juego</div></div><p style="margin-top:16px;font-size:0.85rem"><a href="./teacher.html" style="color:var(--primary-light)">Abrir el panel de progreso →</a></p>',
    'parent.privacyTitle': 'Qué guarda BloomType',
    'parent.privacy': '<h3>Juego local predeterminado</h3><p>BloomType guarda en este navegador el nombre visible y el avatar elegidos por el estudiante, las puntuaciones, el progreso, los logros, el jardín, el historial de práctica, el código de clase y las preferencias de accesibilidad. No envía ese progreso a BloomType ni a Ashbi mientras la sincronización en la nube está desactivada.</p><h3>Qué no recopilamos</h3><p>El juego no contiene publicidad, analítica, perfiles de comportamiento ni herramientas de seguimiento de terceros. No pide correo electrónico, fecha de nacimiento, domicilio, ubicación precisa ni mensajes libres del estudiante.</p><h3>Eliminar el progreso local</h3><p>Abre <strong>Perfil</strong> en el juego y elige <strong>Eliminar progreso local</strong>. Esto elimina de este navegador el perfil, el progreso y la pertenencia local a la clase. Borrar los datos del sitio en el navegador ofrece una segunda opción.</p><h3>Despliegues escolares en la nube</h3><p>La sincronización en la nube sigue desactivada en el despliegue público. Antes de guardar datos reales de estudiantes, cualquier futuro despliegue escolar debe revisar el consentimiento, la conservación, el acceso, la eliminación, la seguridad y el aislamiento de cuentas. La eliminación local no borra los registros escolares en la nube; la escuela participante debe ofrecer ese proceso.</p><h3>Preguntas</h3><p>Escribe a <a href="mailto:cameron@ashbi.ca?subject=BloomType%20privacy">cameron@ashbi.ca</a>. Estos controles reducen el riesgo, pero no constituyen una declaración de cumplimiento legal para todas las escuelas o regiones.</p>',
    'parent.trustTitle': 'Diseñado para tu tranquilidad',
    'parent.trust': '<div class="trust-badge"><span class="emoji">🔒</span><span>Sin datos personales obligatorios</span></div><div class="trust-badge"><span class="emoji">🚫</span><span>Sin anuncios ni seguimiento</span></div><div class="trust-badge"><span class="emoji">💾</span><span>Guardado local en el dispositivo</span></div><div class="trust-badge"><span class="emoji">🆓</span><span>Juego gratuito para estudiantes</span></div><div class="trust-badge"><span class="emoji">🌐</span><span>Funciona en cualquier navegador</span></div>',
    'parent.cta': '<h2 style="margin-bottom:12px">¿Todo listo para empezar?</h2><p style="color:var(--text-dim);margin-bottom:24px">Solo se necesitan 2 minutos. Sin configuración. Funciona en portátiles, Chromebooks y tabletas con teclado.</p><a href="./index.html" class="cta-btn" style="font-size:1.4rem;padding:18px 48px">🌸 Jugar a BloomType</a><p style="margin-top:16px;font-size:0.8rem;color:var(--text-dim)">Recomendación: 10–15 minutos al día durante 2 semanas</p>',
    'parent.footer': '<p>BloomType — para niños que merecen algo mejor que ejercicios aburridos.</p><p>Docentes: asignen niveles haciendo que el alumnado visite esta página desde los ordenadores del aula. Los datos permanecen en los dispositivos de la escuela.</p>',
    'teacher.title': 'BloomType — Panel docente', 'teacher.heading': '🌸 Panel docente de BloomType',
    'teacher.subtitle': 'Sigue el progreso de mecanografía de tu clase.', 'teacher.local': '💾 Local', 'teacher.cloud': '☁️ Nube',
    'teacher.classCode': 'Código de clase', 'teacher.classPlaceholder': 'Código de clase (p. ej., ABC123)',
    'teacher.load': '🔍 Cargar clase', 'teacher.all': '🔄 Todo el alumnado', 'teacher.exportCsv': '📊 Exportar CSV',
    'teacher.exportJson': '📋 Exportar JSON', 'teacher.clear': '🗑 Borrar todo', 'teacher.allLocal': 'Todo el alumnado (local)',
    'teacher.tableLabel': 'Tabla de progreso del alumnado',
    'teacher.student': 'Estudiante', 'teacher.level': 'Nivel', 'teacher.words': 'Palabras', 'teacher.score': 'Puntuación',
    'teacher.stars': 'Estrellas', 'teacher.status': 'Estado', 'teacher.source': 'Origen', 'teacher.noData': 'Aún no hay datos',
    'teacher.emptyHint': 'El alumnado aparecerá aquí después de jugar a BloomType. 🌸', 'teacher.students': 'Estudiantes',
    'teacher.totalStars': 'Estrellas totales', 'teacher.wordsTyped': 'Palabras escritas', 'teacher.avgLevel': 'Nivel medio',
    'teacher.activeToday': 'Actividad de hoy', 'teacher.inactiveOne': '1 estudiante no juega desde hace 7 días o más.',
    'teacher.inactiveMany': '{count} estudiantes no juegan desde hace 7 días o más.',
    'teacher.completed': '¡Completado!', 'teacher.onTrack': 'Al día', 'teacher.gettingStarted': 'Primeros pasos',
    'teacher.notStarted': 'Sin empezar', 'teacher.anonymous': 'Anónimo', 'teacher.noExport': 'No hay datos que exportar',
    'teacher.clearConfirm': '⚠️ ¿Eliminar TODOS los datos locales del alumnado? No se puede deshacer.',
    'teacher.noCloud': 'No hay datos en la nube para esta clase. Es posible que el alumnado aún no se haya sincronizado.',
    'teacher.noClass': 'Ningún estudiante se ha unido todavía a la clase {code} en este dispositivo.',
    'teacher.noLocal': 'Aún no hay datos de estudiantes en este dispositivo.',
  },
};

let pageLocale = 'en';

export function setPageLocale(locale) {
  pageLocale = supportedLocales.includes(locale) ? locale : 'en';
  setLocale(pageLocale);
  return pageLocale;
}

export function getPreferredLocale(storage = globalThis.localStorage, browserLanguage = globalThis.navigator?.language) {
  try {
    const saved = JSON.parse(storage?.getItem('bloomtype-profile') || 'null');
    if (supportedLocales.includes(saved?.locale)) return saved.locale;
  } catch {
    // Ignore corrupt legacy profiles and use the browser preference.
  }
  const browserLocale = browserLanguage?.split('-')[0];
  return supportedLocales.includes(browserLocale) ? browserLocale : 'en';
}

export function pageT(key, values = {}) {
  const template = pageDictionaries[pageLocale]?.[key] ?? pageDictionaries.en[key] ?? key;
  return template.replace(/\{(\w+)\}/g, (_, name) => String(values[name] ?? `{${name}}`));
}

export function applyPageTranslations(root = document) {
  root.querySelectorAll('[data-page-i18n]').forEach((element) => {
    element.textContent = pageT(element.dataset.pageI18n);
  });
  root.querySelectorAll('[data-page-i18n-html]').forEach((element) => {
    element.innerHTML = pageT(element.dataset.pageI18nHtml);
  });
  root.querySelectorAll('[data-page-i18n-placeholder]').forEach((element) => {
    element.placeholder = pageT(element.dataset.pageI18nPlaceholder);
  });
  root.querySelectorAll('[data-page-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', pageT(element.dataset.pageI18nAriaLabel));
  });
  const titleKey = document.documentElement.dataset.pageTitle;
  if (titleKey) document.title = pageT(titleKey);
}

export function initializePageTranslations(root = document) {
  setPageLocale(getPreferredLocale());
  applyPageTranslations(root);
  return pageLocale;
}

// scripts/reset-and-seed.js
//
// EPSI Connect — Réinitialisation de la base + génération d'un jeu de
// données (JDD) de démonstration complet, cohérent et rejouable.
//
// Ce script :
//   1. PURGE la base SQLite existante (DROP de toutes les tables).
//   2. Recrée le schéma (recopié de lib/db.js — à garder synchronisé si
//      le schéma applicatif évolue).
//   3. Réinsère un jeu de données réaliste dans toutes les tables :
//      utilisateurs, événements + inscriptions, témoignages, forum,
//      ressources, carte du campus, sondages, notifications, messages
//      de contact.
//
// Usage :
//   node scripts/reset-and-seed.js
//   npm run db:seed
//
// ⚠️ DESTRUCTIF : toutes les données existantes sont supprimées.
// Ne jamais exécuter contre une base de production.
// Le serveur Next.js (npm run dev) doit être arrêté pendant l'exécution.
//
// Le jeu de données est déterministe (RNG à graine fixe) : deux
// exécutions successives produisent exactement le même résultat, ce qui
// permet de rejouer une démo à l'identique à volonté.

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.sqlite');
const DEMO_PASSWORD = 'Demo1234!';
const SEED = 20260705; // graine fixe -> JDD reproductible à l'identique

// -----------------------------------------------------------------------
// Utilitaires
// -----------------------------------------------------------------------

// RNG déterministe (mulberry32). On évite Math.random() pour que le JDD
// soit rejouable à l'identique d'une exécution à l'autre.
function createRng(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = createRng(SEED);

const randInt = (min, max) => Math.floor(rng() * (max - min + 1)) + min;

function pickMany(list, n) {
  const pool = [...list];
  const out = [];
  n = Math.max(0, Math.min(n, pool.length));
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(rng() * pool.length);
    out.push(pool.splice(idx, 1)[0]);
  }
  return out;
}
const pickOne = (list) => list[Math.floor(rng() * list.length)];

function slug(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function isoAt(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Décale "maintenant" de `days` jours (positif = futur, négatif = passé)
// à une heure donnée. Utilisé pour étaler les dates de façon réaliste.
function offsetDays(days, hour = 12, minute = 0) {
  const d = new Date();
  d.setUTCHours(hour, minute, 0, 0);
  d.setUTCDate(d.getUTCDate() + days);
  return isoAt(d);
}

const now = () => isoAt(new Date());

console.log('🚀 EPSI Connect — purge et génération du jeu de données de démo\n');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
// Permet de DROP les tables sans se soucier de l'ordre des FK.
db.pragma('foreign_keys = OFF');

// Insertion générique, dans le même esprit que le helper `insert()` de
// lib/db.js, pour éviter de réécrire du SQL à la main partout.
function insert(table, data) {
  const keys = Object.keys(data);
  const placeholders = keys.map(() => '?').join(', ');
  const stmt = db.prepare(
    `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
  );
  return stmt.run(...keys.map((k) => data[k]));
}

// =========================================================================
// 1. PURGE
// =========================================================================
const ALL_TABLES = [
  'poll_votes',
  'poll_options',
  'polls',
  'notifications',
  'forum_post_likes',
  'forum_comments',
  'forum_posts',
  'testimonial_likes',
  'testimonials',
  'registrations',
  'events',
  'contact_messages',
  'resources',
  'campus_locations',
  'users',
];

console.log('🗑️  Purge de la base existante...');
db.transaction(() => {
  for (const table of ALL_TABLES) {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
  }
})();
console.log(`✅ ${ALL_TABLES.length} tables supprimées\n`);

// =========================================================================
// 2. SCHÉMA — recopié de lib/db.js (à garder synchronisé avec ce fichier)
// =========================================================================
console.log('🏗️  Recréation du schéma...');
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    user_type TEXT CHECK(user_type IN ('student', 'alumni', 'bde')) NOT NULL,
    avatar TEXT,
    bio TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date DATETIME NOT NULL,
    end_date DATETIME,
    location TEXT,
    category TEXT CHECK(category IN ('soiree', 'conference', 'sport', 'culture', 'integration', 'autre')),
    image TEXT,
    max_participants INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE registrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES events(id),
    UNIQUE(user_id, event_id)
  );

  CREATE TABLE testimonials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    graduation_year INTEGER,
    current_position TEXT,
    company TEXT,
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE testimonial_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    testimonial_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (testimonial_id) REFERENCES testimonials(id),
    UNIQUE(user_id, testimonial_id)
  );

  CREATE TABLE forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT CHECK(category IN ('general', 'aide', 'emploi', 'logement', 'loisirs')),
    likes INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE forum_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE forum_post_likes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (post_id) REFERENCES forum_posts(id),
    UNIQUE(user_id, post_id)
  );

  CREATE TABLE resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT CHECK(type IN ('library', 'admin', 'digital_tool', 'restaurant', 'sport', 'sante')),
    description TEXT,
    location TEXT,
    link TEXT,
    icon TEXT,
    hours TEXT
  );

  CREATE TABLE campus_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('classroom', 'office', 'cafeteria', 'library', 'lab', 'meeting', 'other')),
    floor INTEGER,
    x_position REAL,
    y_position REAL,
    contact_name TEXT,
    contact_email TEXT
  );

  CREATE TABLE polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE poll_options (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    option_text TEXT NOT NULL,
    votes INTEGER DEFAULT 0,
    FOREIGN KEY (poll_id) REFERENCES polls(id)
  );

  CREATE TABLE poll_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER NOT NULL,
    option_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (poll_id) REFERENCES polls(id),
    FOREIGN KEY (option_id) REFERENCES poll_options(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(poll_id, user_id)
  );

  CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('event', 'forum', 'poll', 'system')),
    title TEXT NOT NULL,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE contact_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    category TEXT CHECK(category IN ('question', 'suggestion', 'problem', 'partnership', 'other')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    is_resolved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);
console.log('✅ Schéma recréé\n');

// Notification, avec la même sémantique que POST /api/notifications.
function notify({ userId, type, title, message, link, createdAt, isRead }) {
  insert('notifications', {
    user_id: userId,
    type,
    title,
    message: message || null,
    link: link || null,
    is_read: isRead ? 1 : 0,
    created_at: createdAt,
  });
}

// =========================================================================
// 3. SEED — tout est inséré dans une seule transaction (rapide + atomique)
// =========================================================================
const seed = db.transaction(() => {
  // -----------------------------------------------------------------------
  // 3.1 UTILISATEURS
  // -----------------------------------------------------------------------
  console.log('👥 Création des utilisateurs...');

  const DEMO_PASSWORD_HASH = bcrypt.hashSync(DEMO_PASSWORD, 10);
  const users = []; // { id, email, first_name, last_name, user_type }

  function addUser({ first_name, last_name, user_type, bio, email, createdAt }) {
    const finalEmail = email || `${slug(first_name)}.${slug(last_name)}@epsi.fr`;
    const result = insert('users', {
      email: finalEmail,
      password: DEMO_PASSWORD_HASH,
      first_name,
      last_name,
      user_type,
      avatar: null,
      bio: bio || null,
      created_at: createdAt,
    });
    const record = {
      id: result.lastInsertRowid,
      email: finalEmail,
      first_name,
      last_name,
      user_type,
    };
    users.push(record);
    return record;
  }

  // Comptes de démonstration : identifiants stables pour présenter les 3
  // profils de l'application (mot de passe unique ci-dessous).
  const demoStudent = addUser({
    first_name: 'Demo',
    last_name: 'Étudiant',
    user_type: 'student',
    email: 'demo.etudiant@epsi.fr',
    bio: 'Compte de démonstration (profil étudiant).',
    createdAt: offsetDays(-3, 9),
  });
  const demoAlumni = addUser({
    first_name: 'Demo',
    last_name: 'Alumni',
    user_type: 'alumni',
    email: 'demo.alumni@epsi.fr',
    bio: 'Compte de démonstration (profil ancien élève).',
    createdAt: offsetDays(-3, 9, 5),
  });
  const demoBde = addUser({
    first_name: 'Demo',
    last_name: 'BDE',
    user_type: 'bde',
    email: 'demo.bde@epsi.fr',
    bio: 'Compte de démonstration (profil BDE).',
    createdAt: offsetDays(-3, 9, 10),
  });

  const STUDENT_PROFILES = [
    ['Lina', 'Bernard', '2ème année Bachelor Développement Web.'],
    ['Nathan', 'Petit', '1ère année Bachelor Réseaux & Cybersécurité.'],
    ['Chloé', 'Moreau', '3ème année Bachelor Développement Web.'],
    ['Enzo', 'Girard', '1ère année Bachelor Data & IA.'],
    ['Manon', 'Fontaine', '2ème année Bachelor Réseaux & Cybersécurité.'],
    ['Hugo', 'Lambert', '1ère année Mastère DevOps & Cloud.'],
    ['Léa', 'Rousseau', '3ème année Bachelor Data & IA.'],
    ['Tom', 'Mercier', '1ère année Bachelor Développement Web.'],
    ['Camille', 'Faure', '2ème année Mastère Développement Web & Mobile.'],
    ['Maxime', 'Blanchard', '1ère année Bachelor Réseaux & Cybersécurité.'],
    ['Sarah', 'Dubois', '2ème année Bachelor Développement Web.'],
    ['Rayan', 'Morel', '1ère année Bachelor Data & IA.'],
    ['Emma', 'Simon', '3ème année Bachelor Réseaux & Cybersécurité.'],
    ['Louis', 'Michel', '1ère année Mastère Cybersécurité.'],
    ['Inès', 'Leroy', '2ème année Bachelor Data & IA.'],
  ];
  const students = STUDENT_PROFILES.map(([first_name, last_name, bio]) =>
    addUser({ first_name, last_name, bio, user_type: 'student', createdAt: offsetDays(-randInt(5, 200), randInt(8, 22), randInt(0, 59)) })
  );

  // [prénom, nom, année de diplôme, poste, entreprise, titre témoignage, contenu témoignage]
  const ALUMNI_PROFILES = [
    ['Julie', 'Roux', 2020, 'Développeuse Full-Stack', 'OVHcloud',
      "De l'EPSI à OVHcloud : mon parcours de développeuse",
      "J'ai intégré l'EPSI sans grande expérience en code, et j'en suis sortie prête à travailler sur des projets de grande envergure. Les projets de groupe et les stages m'ont vraiment préparée au monde professionnel. Aujourd'hui chez OVHcloud, j'utilise au quotidien ce que j'ai appris pendant mon Bachelor."],
    ['Antoine', 'Garnier', 2019, 'Lead Developer', 'Capgemini',
      'Devenir Lead Dev, ça se prépare dès l\u2019école',
      "L'EPSI m'a donné les bases techniques mais surtout la capacité à travailler en équipe sur des projets complexes. Ce sont ces compétences qui m'ont permis d'évoluer rapidement vers un poste de lead technique chez Capgemini."],
    ['Sophie', 'Bertrand', 2021, 'Data Analyst', 'Decathlon',
      'La data, une vocation découverte à l\u2019EPSI',
      "C'est pendant mon Mastère à l'EPSI que j'ai découvert la data et l'IA. Aujourd'hui Data Analyst chez Decathlon, j'accompagne les équipes métier dans leurs décisions grâce aux données. Je conseille à tous les étudiants de tester plusieurs spécialités avant de choisir leur voie."],
    ['Kevin', 'Muller', 2018, 'Ingénieur DevOps', 'Orange',
      'Du réseau au DevOps : une évolution naturelle',
      "Passionné de réseaux dès l'EPSI, je me suis naturellement orienté vers le DevOps en début de carrière. Chez Orange, je gère aujourd'hui des infrastructures critiques. Les compétences en administration système acquises à l'école sont toujours d'actualité."],
    ['Pauline', 'Vincent', 2022, 'Développeuse Mobile', 'BlaBlaCar',
      'Créer des applications utilisées par des millions de personnes',
      "Mon stage de fin d'études s'est transformé en CDI chez BlaBlaCar. Je développe aujourd'hui des fonctionnalités de l'application mobile utilisée par des millions de voyageurs. Un rêve d'étudiante devenu réalité !"],
    ['Alexandre', 'Fournier', 2017, 'CTO & Co-fondateur', 'Wattflow',
      'Entreprendre après l\u2019EPSI : le déclic du hackathon',
      "C'est en participant aux hackathons organisés par le BDE que j'ai eu envie d'entreprendre. Quelques années plus tard, j'ai co-fondé Wattflow, une startup spécialisée dans l'optimisation énergétique. L'EPSI m'a donné l'audace de me lancer."],
    ['Marion', 'Chevalier', 2023, 'Développeuse Junior', 'Doctolib',
      'Mon premier poste, un an après le diplôme',
      "Un an après ma sortie de l'EPSI, je travaille chez Doctolib sur des fonctionnalités utilisées par des milliers de professionnels de santé. Mon conseil aux étudiants : profitez de chaque projet pour construire un portfolio solide."],
  ];
  const alumni = ALUMNI_PROFILES.map(([first_name, last_name, gradYear, position, company]) =>
    addUser({
      first_name,
      last_name,
      user_type: 'alumni',
      bio: `Diplômé(e) EPSI ${gradYear} — ${position} chez ${company}.`,
      createdAt: offsetDays(-randInt(10, 250), randInt(8, 22), randInt(0, 59)),
    })
  );

  const BDE_PROFILES = [
    ['Yanis', 'Robin', 'Président du BDE — coordination générale et relations école.'],
    ['Zoé', 'Lefebvre', 'Trésorière du BDE — gestion du budget et des partenariats.'],
    ['Mathis', 'Caron', 'Responsable communication & événementiel du BDE.'],
  ];
  const bdeExtra = BDE_PROFILES.map(([first_name, last_name, bio]) =>
    addUser({ first_name, last_name, bio, user_type: 'bde', createdAt: offsetDays(-randInt(30, 260), randInt(8, 22)) })
  );

  const bdeMembers = [demoBde, ...bdeExtra];
  const allStudents = [demoStudent, ...students];
  const allAlumni = [demoAlumni, ...alumni];

  // Notification de bienvenue pour tout le monde (identique à /api/auth/register)
  for (const u of users) {
    const ageDays = Math.round((Date.now() - new Date(u.email === demoStudent.email ? offsetDays(-3) : now()).getTime()) / 86400000);
    notify({
      userId: u.id,
      type: 'system',
      title: 'Bienvenue à l\u2019EPSI !',
      message: 'Découvrez toutes les fonctionnalités de l\u2019application.',
      link: '/campus',
      createdAt: (() => {
        // On retrouve la date de création réelle de l'utilisateur.
        const match = db.prepare('SELECT created_at FROM users WHERE id = ?').get(u.id);
        return match.created_at;
      })(),
      isRead: rng() < 0.75,
    });
  }
  console.log(`✅ ${users.length} utilisateurs créés (${allStudents.length} étudiants, ${allAlumni.length} alumni, ${bdeMembers.length} BDE)`);
  console.log(`   → Mot de passe commun (comptes démo compris) : ${DEMO_PASSWORD}`);
  console.log(`   → Comptes démo : ${demoStudent.email} / ${demoAlumni.email} / ${demoBde.email}\n`);

  // -----------------------------------------------------------------------
  // 3.2 ÉVÉNEMENTS + INSCRIPTIONS
  // -----------------------------------------------------------------------
  console.log('📅 Création des événements...');

  const EVENT_DEFS = [
    { title: "Soirée d'intégration des nouveaux arrivants", category: 'integration', offset: -70, hour: 19, location: 'Hall principal — Campus EPSI', description: "Une soirée conviviale pour accueillir les nouveaux étudiants et leur faire découvrir la vie associative de l'école.", max_participants: 120, pool: 'students+' },
    { title: 'Conférence : les métiers de la Cybersécurité', category: 'conference', offset: -55, hour: 14, location: 'Amphithéâtre EPSI', description: 'Des professionnels du secteur présentent les différents métiers de la cybersécurité et répondent aux questions des étudiants.', max_participants: 80, pool: 'mixed' },
    { title: 'Tournoi de foot inter-promos', category: 'sport', offset: -40, hour: 15, location: 'Gymnase municipal partenaire', description: 'Tournoi amical de foot à 5 entre les différentes promotions, organisé par le BDE.', max_participants: 60, pool: 'students' },
    { title: 'Hackathon Open Innov — 48h pour innover', category: 'autre', offset: -21, hour: 9, endHour: 18, endOffsetExtraDays: 2, location: 'Salle projets — Campus EPSI', description: "48h pour concevoir un prototype autour de l'innovation ouverte, en équipe et encadrés par des mentors.", max_participants: 50, pool: 'mixed' },
    { title: 'Afterwork Alumni × Étudiants', category: 'soiree', offset: -9, hour: 18, endHour: 22, endOffsetExtraDays: 0, location: 'Espace commun — Campus EPSI', description: "Un moment d'échange informel entre anciens élèves et étudiants actuels autour d'un verre.", max_participants: 70, pool: 'mixed' },
    { title: 'Petit-déjeuner de rentrée BDE', category: 'integration', offset: 4, hour: 9, location: 'Espace commun — Campus EPSI', description: 'Le BDE vous accueille autour d\u2019un petit-déjeuner pour bien démarrer la période.', max_participants: 100, pool: 'students+' },
    { title: 'Conférence : IA & Emploi, quelles opportunités ?', category: 'conference', offset: 11, hour: 14, location: 'Amphithéâtre EPSI', description: "Un échange avec des professionnels de l'IA sur les compétences recherchées et les métiers de demain.", max_participants: 90, pool: 'mixed' },
    { title: 'EPSI Cup — Tournoi de basket', category: 'sport', offset: 17, hour: 15, location: 'Gymnase municipal partenaire', description: 'Le grand tournoi de basket inter-promos organisé par le BDE, ouvert à toutes les équipes.', max_participants: 64, pool: 'students' },
    { title: 'Soirée Jeux de société & Gaming', category: 'culture', offset: 23, hour: 18, endHour: 23, endOffsetExtraDays: 0, location: 'Espace commun — Campus EPSI', description: 'Jeux de société, tournoi de jeux vidéo et ambiance détendue pour finir la semaine.', max_participants: 50, pool: 'students' },
    { title: 'Atelier CV & LinkedIn avec les alumni', category: 'conference', offset: 30, hour: 13, location: 'Salle B12 — Campus EPSI', description: 'Des alumni bénévoles relisent vos CV et profils LinkedIn et partagent leurs conseils de recherche d\u2019emploi.', max_participants: 40, pool: 'mixed' },
    { title: 'Sortie Escape Game', category: 'culture', offset: 38, hour: 19, location: 'Escape game partenaire — centre-ville', description: "Une sortie conviviale en petits groupes dans une salle d'escape game partenaire.", max_participants: 30, pool: 'students' },
    { title: 'Gala de fin d\u2019année', category: 'soiree', offset: 55, hour: 20, endHour: 23, endOffsetExtraDays: 0, location: 'Salle des fêtes partenaire', description: "L'événement phare de l'année organisé par le BDE pour clôturer l'année en beauté.", max_participants: 150, pool: 'mixed' },
  ];

  const events = [];
  EVENT_DEFS.forEach((def, i) => {
    const creator = bdeMembers[i % bdeMembers.length];
    const eventDate = offsetDays(def.offset, def.hour);
    const endDate = def.endHour
      ? offsetDays(def.offset + (def.endOffsetExtraDays || 0), def.endHour)
      : null;
    const result = insert('events', {
      title: def.title,
      description: def.description,
      date: eventDate,
      end_date: endDate,
      location: def.location,
      category: def.category,
      image: null,
      max_participants: def.max_participants,
      created_by: creator.id,
      created_at: offsetDays(Math.min(def.offset, 0) - randInt(5, 25), 10),
    });
    events.push({ id: result.lastInsertRowid, ...def, date: eventDate });
  });
  console.log(`✅ ${events.length} événements créés`);

  console.log('📝 Inscriptions aux événements...');
  let registrationCount = 0;
  for (const event of events) {
    let pool;
    if (event.pool === 'students') pool = allStudents;
    else if (event.pool === 'students+') pool = [...allStudents, ...pickMany(allAlumni, 3)];
    else pool = [...allStudents, ...allAlumni]; // mixed

    const isPast = event.offset < 0;
    const fillPct = isPast ? 0.55 + rng() * 0.35 : 0.15 + rng() * 0.4;
    const cap = event.max_participants || pool.length;
    const count = Math.max(1, Math.min(cap, Math.round(pool.length * fillPct)));
    const attendees = pickMany(pool, count);

    for (const attendee of attendees) {
      const regOffset = isPast ? event.offset - randInt(1, 15) : -randInt(0, 10);
      const registeredAt = offsetDays(regOffset, randInt(8, 22), randInt(0, 59));
      insert('registrations', { user_id: attendee.id, event_id: event.id, registered_at: registeredAt });
      notify({
        userId: attendee.id,
        type: 'event',
        title: 'Inscription confirmée',
        message: `Vous êtes inscrit à "${event.title}"`,
        link: `/events/${event.id}`,
        createdAt: registeredAt,
        isRead: isPast || rng() < 0.6,
      });
      registrationCount += 1;
    }
  }
  console.log(`✅ ${registrationCount} inscriptions créées\n`);

  // -----------------------------------------------------------------------
  // 3.3 TÉMOIGNAGES
  // -----------------------------------------------------------------------
  console.log('🎓 Création des témoignages...');
  const likerPool = [...allStudents, ...allAlumni];
  let testimonialLikeCount = 0;

  function createTestimonial(author, { gradYear, position, company, title, content, createdAt, likeCount }) {
    const result = insert('testimonials', {
      user_id: author.id,
      title,
      content,
      graduation_year: gradYear,
      current_position: position,
      company,
      likes: 0,
      created_at: createdAt,
    });
    const testimonialId = result.lastInsertRowid;
    const likers = pickMany(likerPool.filter((u) => u.id !== author.id), likeCount);
    for (const liker of likers) {
      insert('testimonial_likes', { user_id: liker.id, testimonial_id: testimonialId, created_at: createdAt });
    }
    db.prepare('UPDATE testimonials SET likes = ? WHERE id = ?').run(likers.length, testimonialId);
    testimonialLikeCount += likers.length;
    return testimonialId;
  }

  alumni.forEach((author, i) => {
    const [, , gradYear, position, company, title, content] = ALUMNI_PROFILES[i];
    createTestimonial(author, {
      gradYear,
      position,
      company,
      title,
      content,
      createdAt: offsetDays(-randInt(15, 220), randInt(9, 21)),
      likeCount: randInt(2, 12),
    });
  });

  createTestimonial(demoAlumni, {
    gradYear: 2021,
    position: 'Poste de démonstration',
    company: 'Entreprise Démo',
    title: 'Témoignage de démonstration',
    content: 'Ceci est un témoignage de démonstration permettant de présenter la fonctionnalité « Témoignages » de l\u2019application. Un ancien élève peut partager ici son parcours, son poste actuel et des conseils pour les étudiants.',
    createdAt: offsetDays(-2, 11),
    likeCount: 4,
  });
  console.log(`✅ ${alumni.length + 1} témoignages créés (${testimonialLikeCount} likes)\n`);

  // -----------------------------------------------------------------------
  // 3.4 FORUM (posts + commentaires + likes)
  // -----------------------------------------------------------------------
  console.log('💬 Création des publications du forum...');

  const FORUM_POSTS_DEFS = [
    { category: 'general', title: 'Bienvenue aux nouveaux arrivants !', content: "N'hésitez pas à vous présenter ici : promo, filière, centres d'intérêt. C'est toujours plus sympa de mettre un nom sur les visages du campus !", comments: ["Bienvenue à tous, hâte de vous rencontrer en vrai !", 'Étudiant en Data & IA, ravi de rejoindre la communauté.', "On se voit à la soirée d'intégration ?"] },
    { category: 'general', title: "Retour sur la soirée d'intégration", content: "Merci au BDE pour l'organisation, super ambiance hier soir ! Des photos quelque part ?", comments: ["C'était top, merci à l'équipe organisatrice !", 'Les photos arrivent sur le groupe cette semaine.'] },
    { category: 'general', title: "Idées pour améliorer la vie de l'école", content: "Petit sondage informel : qu'est-ce qui vous manque le plus sur le campus au quotidien ?", comments: ['Plus de prises électriques dans les salles de travail !', "Un micro-ondes supplémentaire à la cafétéria serait bienvenu.", 'Une salle calme pour réviser en silence.'] },
    { category: 'general', title: 'Retours sur le Hackathon Open Innov', content: 'Deux jours intenses mais hyper formateurs. Bravo à toutes les équipes, le niveau était vraiment élevé cette année !', comments: ['Merci, on a adoré participer !', "L'équipe gagnante a présenté un super projet."] },

    { category: 'aide', title: 'Problème de connexion au VPN de l\u2019école', content: "Depuis ce matin impossible de me connecter au VPN pour accéder aux ressources pédagogiques. Vous avez le même souci ?", comments: ["Même problème ici, j'ai contacté le support info.", 'Ça remarche pour moi depuis 14h.', "Merci de l'info, je retente alors."] },
    { category: 'aide', title: 'Bonne configuration pour développer en local ?', content: 'Je debute et je cherche des conseils pour configurer un environnement de dev propre (VS Code, Docker...). Des recommandations ?', comments: ['VS Code + extension Docker + WSL2 si tu es sur Windows, ça change la vie.', "N'oublie pas Git et un bon .gitignore dès le départ !"] },
    { category: 'aide', title: 'Comment obtenir une attestation de scolarité rapidement ?', content: "J'en ai besoin pour mon dossier de logement, quelqu'un sait comment faire la demande ?", comments: ['Un mail au service scolarité suffit, réponse sous 48h en général.', "Tu peux aussi passer directement à l'administration au 2ème étage."] },
    { category: 'aide', title: 'Ressources pour réviser les algorithmes', content: 'Vous auriez des exercices ou plateformes à recommander pour progresser en algo avant les partiels ?', comments: ['Exercism et Codewars sont pas mal pour s\u2019entraîner régulièrement.', "Les annales des années précédentes aident beaucoup aussi."] },

    { category: 'emploi', title: 'Retour sur mon alternance chez un éditeur logiciel', content: "Je termine ma première année d'alternance, je peux répondre aux questions de ceux qui hésitent encore entre stage et alternance.", comments: ['Merci pour le partage, ça aide à y voir plus clair !', "Le rythme alterné est difficile au début ou ça va ?"] },
    { category: 'emploi', title: 'Recherche stage de fin d\u2019études - Dev Web', content: "Je suis en dernière année et je cherche un stage de fin d'études en développement web (React/Node de préférence). Des pistes ?", comments: ["Regarde du côté des ESN locales, elles recrutent souvent des stagiaires.", 'Le service stages a une liste d\u2019offres à jour, passe les voir.'] },
    { category: 'emploi', title: "Comment s'est passé votre premier entretien technique ?", content: "Je passe mon premier entretien technique la semaine prochaine, des conseils pour bien me préparer ?", comments: ['Révise les bases algo et sois honnête si tu ne sais pas quelque chose.', "N'oublie pas de préparer aussi des questions à poser au recruteur."] },
    { category: 'emploi', title: 'Salon de l\u2019alternance : qui y va ?', content: 'Le salon a lieu la semaine prochaine en centre-ville, quelqu\u2019un compte y aller en groupe ?', comments: ["Je suis partant, on peut se donner rendez-vous sur place.", "Pensez à emporter plusieurs exemplaires de votre CV."] },

    { category: 'logement', title: 'Recherche colocataire pour la rentrée', content: "J'ai une chambre libre dans mon appart proche du campus, idéal pour un étudiant EPSI. Message moi si intéressé !", comments: ["Je suis intéressé, tu peux m'envoyer plus de détails ?", "C'est à quelle distance du campus à pied ?"] },
    { category: 'logement', title: 'Bons plans pour trouver un logement étudiant', content: "Des sites ou astuces à partager pour trouver un logement pas trop cher près de l'école ?", comments: ['Le CROUS propose aussi des résidences étudiantes, à vérifier tôt dans l\u2019année.', 'Les groupes Facebook locaux sont pleins de bons plans.'] },
    { category: 'logement', title: 'Colocation sympa avec 2 chambres disponibles', content: "On cherche deux nouveaux colocataires pour une maison sympa à 15 minutes du campus en bus.", comments: ['Ça a l\u2019air top, vous avez des photos ?'] },

    { category: 'loisirs', title: 'Qui est motivé pour un tournoi FIFA/eFoot ?', content: 'On pourrait organiser un petit tournoi entre étudiants un soir de semaine, ça vous tente ?', comments: ['Carrément partant !', "On peut demander une salle avec écran au BDE."] },
    { category: 'loisirs', title: 'Groupe de running le matin', content: "Je cherche des motivés pour courir 2-3 fois par semaine avant les cours, qui est chaud ?", comments: ["Je suis partante, quel horaire vise-t-on ?", '7h le matin ça me va, on peut se retrouver devant le campus.'] },
    { category: 'loisirs', title: 'Soirée jeux de société ce week-end', content: 'Petite soirée jeux de société samedi chez moi, il reste de la place si ça vous dit !', comments: ['Je ramène un jeu de société sympa si vous voulez.'] },
  ];

  const forumPosts = [];
  let commentCount = 0;
  let forumLikeCount = 0;

  FORUM_POSTS_DEFS.forEach((def, i) => {
    const author = pickOne([...allStudents, ...allAlumni]);
    const createdAt = offsetDays(-randInt(1, 90), randInt(8, 22), randInt(0, 59));
    const result = insert('forum_posts', {
      user_id: author.id,
      title: def.title,
      content: def.content,
      category: def.category,
      likes: 0,
      created_at: createdAt,
    });
    const postId = result.lastInsertRowid;

    // Commentaires
    let lastCommentAt = createdAt;
    for (const commentContent of def.comments) {
      const commenter = pickOne([...allStudents, ...allAlumni, ...bdeMembers].filter((u) => u.id !== author.id));
      const commentAt = offsetDays(-randInt(0, 60), randInt(8, 22), randInt(0, 59));
      insert('forum_comments', { post_id: postId, user_id: commenter.id, content: commentContent, created_at: commentAt });
      commentCount += 1;
      lastCommentAt = commentAt;
      if (commenter.id !== author.id) {
        notify({
          userId: author.id,
          type: 'forum',
          title: 'Nouveau commentaire',
          message: `${commenter.first_name} ${commenter.last_name} a commenté votre publication "${def.title}"`,
          link: `/forum/${postId}`,
          createdAt: commentAt,
          isRead: rng() < 0.5,
        });
      }
    }

    // Likes
    const likeCount = randInt(0, 14);
    const likers = pickMany([...allStudents, ...allAlumni].filter((u) => u.id !== author.id), likeCount);
    for (const liker of likers) {
      insert('forum_post_likes', { user_id: liker.id, post_id: postId, created_at: createdAt });
    }
    db.prepare('UPDATE forum_posts SET likes = ? WHERE id = ?').run(likers.length, postId);
    forumLikeCount += likers.length;

    forumPosts.push({ id: postId, title: def.title, category: def.category });
  });
  console.log(`✅ ${forumPosts.length} publications, ${commentCount} commentaires, ${forumLikeCount} likes\n`);

  // -----------------------------------------------------------------------
  // 3.5 RESSOURCES
  // -----------------------------------------------------------------------
  console.log('🔧 Création des ressources...');
  const RESOURCES = [
    { name: 'Microsoft 365', type: 'digital_tool', description: 'Suite complète Microsoft (Word, Excel, Teams, OneDrive) gratuite pour tous les étudiants.', link: 'https://office.com', hours: 'Accessible 24h/24' },
    { name: 'GitHub Student Pack', type: 'digital_tool', description: 'Accès gratuit à GitHub Pro et de nombreux outils de développement.', link: 'https://education.github.com/pack', hours: 'Accessible 24h/24' },
    { name: 'WiFi Campus', type: 'digital_tool', description: 'Connexion WiFi haut débit. Réseau "EPSI-Student".', location: 'Tout le campus', hours: '7h00 - 22h00' },
    { name: 'LinkedIn Learning', type: 'digital_tool', description: 'Accès gratuit aux formations en ligne LinkedIn Learning pour développer de nouvelles compétences.', link: 'https://www.linkedin.com/learning', hours: 'Accessible 24h/24' },
    { name: 'Service scolarité', type: 'admin', description: 'Inscriptions, certificats, relevés de notes.', location: '2ème étage - Administration', hours: '9h00 - 17h00' },
    { name: 'Service stages & alternance', type: 'admin', description: 'Accompagnement dans la recherche de stages et de contrats en alternance.', location: '2ème étage - Pédagogie', hours: '9h00 - 17h00' },
    { name: 'Service Relations Entreprises', type: 'admin', description: 'Mise en relation avec les entreprises partenaires pour les stages, l\u2019alternance et l\u2019emploi.', location: '2ème étage - Administration', hours: '9h00 - 17h00' },
    { name: 'Bibliothèque universitaire partenaire', type: 'library', description: 'Accès aux ouvrages techniques et ressources documentaires en informatique.', location: 'Centre-ville', hours: '9h00 - 19h00' },
    { name: 'Restaurant universitaire', type: 'restaurant', description: 'Repas complets à tarif étudiant à proximité du campus.', location: '5 minutes à pied du campus', hours: '11h30 - 14h00' },
    { name: 'Salle de sport partenaire', type: 'sport', description: 'Tarif préférentiel pour les étudiants EPSI sur présentation de la carte étudiante.', location: 'Proche campus', hours: '7h00 - 22h00' },
    { name: 'Association sportive EPSI (BDS)', type: 'sport', description: 'Entraînements et compétitions inter-écoles organisés par le Bureau Des Sports.', hours: 'Selon planning affiché' },
    { name: 'Service de médecine préventive', type: 'sante', description: 'Consultations et suivi santé gratuits pour les étudiants.', location: 'Proche campus', hours: 'Sur rendez-vous' },
  ];
  RESOURCES.forEach((r) => insert('resources', {
    name: r.name,
    type: r.type,
    description: r.description || null,
    location: r.location || null,
    link: r.link || null,
    icon: null,
    hours: r.hours || null,
  }));
  console.log(`✅ ${RESOURCES.length} ressources créées\n`);

  // -----------------------------------------------------------------------
  // 3.6 CARTE DU CAMPUS
  // -----------------------------------------------------------------------
  console.log('📍 Création des emplacements du campus...');
  // Coordonnées conservées à l'identique de scripts/seed-campus.js (calées
  // sur le plan réel du 2ème étage) pour ne pas décaler les pastilles sur
  // la carte.
  const CAMPUS_LOCATIONS = [
    { name: 'Mydil', description: 'Espace Mydil - Innovation et projets étudiants', type: 'lab', floor: 2, x_position: 0.12, y_position: 0.38, contact_name: 'Référent Innovation', contact_email: 'mydil@epsi.fr' },
    { name: 'Espace commun', description: 'Espace de travail collaboratif et détente', type: 'cafeteria', floor: 2, x_position: 0.42, y_position: 0.28, contact_name: null, contact_email: null },
    { name: 'Administration', description: 'Services administratifs - Inscriptions, certificats', type: 'office', floor: 2, x_position: 0.82, y_position: 0.18, contact_name: 'Nadège', contact_email: 'nadege@epsi.fr' },
    { name: 'Direction', description: "Bureau de la direction de l'école", type: 'office', floor: 2, x_position: 0.82, y_position: 0.35, contact_name: 'Direction', contact_email: 'direction@epsi.fr' },
    { name: 'Pédagogie', description: 'Bureau pédagogique - Suivi des étudiants, stages', type: 'office', floor: 2, x_position: 0.82, y_position: 0.52, contact_name: 'Service pédagogie', contact_email: 'pedagogie@epsi.fr' },
    { name: 'Espace commun', description: 'Espace de travail et détente', type: 'cafeteria', floor: 2, x_position: 0.42, y_position: 0.78, contact_name: null, contact_email: null },
  ];
  CAMPUS_LOCATIONS.forEach((loc) => insert('campus_locations', loc));
  console.log(`✅ ${CAMPUS_LOCATIONS.length} emplacements créés\n`);

  // -----------------------------------------------------------------------
  // 3.7 SONDAGES
  // -----------------------------------------------------------------------
  console.log('📊 Création des sondages...');
  const POLL_DEFS = [
    { question: 'Quel thème pour la prochaine soirée BDE ?', options: ['Hawaïen', 'Casino', 'Années 80', 'Néon'], offsetCreated: -30, expiresOffset: 15, active: true },
    { question: 'Quel créneau préférez-vous pour l\u2019atelier CV & LinkedIn ?', options: ['Lundi midi', 'Mercredi après-midi', 'Vendredi matin'], offsetCreated: -5, expiresOffset: 25, active: true },
    { question: 'La cafétéria vous convient-elle ?', options: ['Oui totalement', 'Plutôt oui', 'Plutôt non', 'Pas du tout'], offsetCreated: -60, expiresOffset: -20, active: true },
    { question: 'Quel sport souhaitez-vous voir proposé à l\u2019EPSI Cup ?', options: ['Basket', 'Volley', 'Badminton', 'Futsal'], offsetCreated: -8, expiresOffset: 20, active: true },
    { question: 'Faut-il organiser plus d\u2019événements avec les alumni ?', options: ['Oui', 'Non', 'Sans avis'], offsetCreated: -90, expiresOffset: -60, active: true },
  ];

  let pollVoteCount = 0;
  POLL_DEFS.forEach((def, i) => {
    const creator = bdeMembers[i % bdeMembers.length];
    const createdAt = offsetDays(def.offsetCreated, 10);
    const pollResult = insert('polls', {
      question: def.question,
      created_by: creator.id,
      created_at: createdAt,
      expires_at: offsetDays(def.expiresOffset, 23, 59),
      is_active: def.active ? 1 : 0,
    });
    const pollId = pollResult.lastInsertRowid;

    const optionIds = def.options.map((text) => insert('poll_options', { poll_id: pollId, option_text: text, votes: 0 }).lastInsertRowid);

    const isClosed = def.expiresOffset < 0;
    const voterPool = [...allStudents, ...allAlumni];
    const voterCount = randInt(Math.round(voterPool.length * 0.2), Math.round(voterPool.length * 0.7));
    const voters = pickMany(voterPool, voterCount);
    const voteTally = new Array(optionIds.length).fill(0);

    for (const voter of voters) {
      const optionIndex = randInt(0, optionIds.length - 1);
      const voteAt = isClosed
        ? offsetDays(randInt(def.offsetCreated, def.expiresOffset), randInt(8, 22))
        : offsetDays(-randInt(0, Math.max(1, -def.offsetCreated)), randInt(8, 22));
      insert('poll_votes', { poll_id: pollId, option_id: optionIds[optionIndex], user_id: voter.id, created_at: voteAt });
      voteTally[optionIndex] += 1;
      pollVoteCount += 1;
    }
    optionIds.forEach((optionId, idx) => {
      db.prepare('UPDATE poll_options SET votes = ? WHERE id = ?').run(voteTally[idx], optionId);
    });

    // Notification "nouveau sondage" envoyée à un échantillon d'étudiants
    if (def.active && !isClosed) {
      const notified = pickMany(allStudents, randInt(4, 8));
      for (const u of notified) {
        notify({
          userId: u.id,
          type: 'poll',
          title: 'Nouveau sondage disponible',
          message: `Donnez votre avis : "${def.question}"`,
          link: '/polls',
          createdAt,
          isRead: rng() < 0.4,
        });
      }
    }
  });
  console.log(`✅ ${POLL_DEFS.length} sondages créés (${pollVoteCount} votes)\n`);

  // -----------------------------------------------------------------------
  // 3.8 NOTIFICATIONS SYSTÈME (annonces générales du BDE)
  // -----------------------------------------------------------------------
  console.log('🔔 Création des notifications système complémentaires...');
  const SYSTEM_ANNOUNCEMENTS = [
    { title: 'Nouveau règlement intérieur disponible', message: 'Le règlement intérieur mis à jour est consultable depuis votre espace.', offset: -18 },
    { title: 'Nouvelles ressources ajoutées', message: 'De nouvelles ressources et services viennent d\u2019être ajoutés sur la plateforme.', offset: -6 },
    { title: 'Pensez à mettre à jour votre profil', message: 'Complétez votre bio pour que la communauté vous connaisse mieux.', offset: -2 },
  ];
  let systemNotifCount = 0;
  for (const announcement of SYSTEM_ANNOUNCEMENTS) {
    const recipients = pickMany([...allStudents, ...allAlumni], randInt(10, 16));
    for (const u of recipients) {
      notify({
        userId: u.id,
        type: 'system',
        title: announcement.title,
        message: announcement.message,
        link: '/campus',
        createdAt: offsetDays(announcement.offset, randInt(8, 20)),
        isRead: announcement.offset < -5 || rng() < 0.5,
      });
      systemNotifCount += 1;
    }
  }
  console.log(`✅ ${systemNotifCount} notifications système créées\n`);

  // -----------------------------------------------------------------------
  // 3.9 MESSAGES DE CONTACT
  // -----------------------------------------------------------------------
  console.log('📧 Création des messages de contact...');
  const CONTACT_MESSAGES = [
    { user: students[0], category: 'question', subject: 'Question sur la validation des crédits ECTS', message: "Bonjour, je voudrais savoir comment sont calculés les crédits ECTS pour les projets de groupe. Merci d'avance.", resolved: 1 },
    { user: students[3], category: 'suggestion', subject: "Ajouter un mode sombre à l'application", message: "L'application est top, ce serait encore mieux avec un mode sombre pour les révisions tardives !", resolved: 0 },
    { user: null, name: 'Étudiant anonyme', email: 'anonyme@epsi.fr', category: 'problem', subject: 'La carte du campus ne s\u2019affichait pas', message: 'La carte du campus restait vide, aucun bâtiment ne s\u2019affichait sur la page. Est-ce corrigé ?', resolved: 1 },
    { user: null, name: 'Julien Simonet', email: 'j.simonet@mutuelle-partenaire.fr', category: 'partnership', subject: 'Proposition de partenariat — mutuelle étudiante', message: 'Bonjour, nous souhaiterions proposer une offre de mutuelle santé dédiée aux étudiants EPSI. Qui contacter pour en discuter ?', resolved: 0 },
    { user: null, name: 'Camille Petit', email: 'camille.petit.lycee@example.com', category: 'other', subject: "Demande de stage d'observation", message: "Bonjour, je suis lycéenne et je m'intéresse à une carrière dans l'informatique. Puis-je faire un stage d'observation d'une semaine ?", resolved: 0 },
    { user: alumni[2], category: 'question', subject: 'Comment mettre à jour mon témoignage ?', message: "Mon poste a changé depuis la publication de mon témoignage, comment puis-je le mettre à jour ?", resolved: 1 },
    { user: students[9], category: 'suggestion', subject: 'Plus de créneaux sportifs en soirée', message: "Serait-il possible d'ouvrir le gymnase partenaire un soir de plus par semaine ? Beaucoup d'entre nous ont cours tard.", resolved: 0 },
  ];
  CONTACT_MESSAGES.forEach((m, i) => {
    insert('contact_messages', {
      user_id: m.user ? m.user.id : null,
      name: m.user ? `${m.user.first_name} ${m.user.last_name}` : m.name,
      email: m.user ? m.user.email : m.email,
      category: m.category,
      subject: m.subject,
      message: m.message,
      is_resolved: m.resolved,
      created_at: offsetDays(-randInt(2, 45), randInt(8, 20)),
    });
  });
  console.log(`✅ ${CONTACT_MESSAGES.length} messages de contact créés\n`);

  return {
    users: users.length,
    events: events.length,
    registrations: registrationCount,
    testimonials: alumni.length + 1,
    forumPosts: forumPosts.length,
    forumComments: commentCount,
    resources: RESOURCES.length,
    campusLocations: CAMPUS_LOCATIONS.length,
    polls: POLL_DEFS.length,
    pollVotes: pollVoteCount,
    contactMessages: CONTACT_MESSAGES.length,
  };
});

const summary = seed();

// Compteur global de notifications (toutes origines confondues)
const notifTotal = db.prepare('SELECT COUNT(*) as n FROM notifications').get().n;

console.log('🎉 Jeu de données généré avec succès !\n');
console.log('📊 Résumé :');
console.log(`   - Utilisateurs           : ${summary.users}`);
console.log(`   - Événements             : ${summary.events}`);
console.log(`   - Inscriptions           : ${summary.registrations}`);
console.log(`   - Témoignages            : ${summary.testimonials}`);
console.log(`   - Publications du forum  : ${summary.forumPosts}`);
console.log(`   - Commentaires du forum  : ${summary.forumComments}`);
console.log(`   - Ressources             : ${summary.resources}`);
console.log(`   - Emplacements du campus : ${summary.campusLocations}`);
console.log(`   - Sondages               : ${summary.polls} (${summary.pollVotes} votes)`);
console.log(`   - Notifications          : ${notifTotal}`);
console.log(`   - Messages de contact    : ${summary.contactMessages}`);
console.log('\n🔑 Connexion démo (mot de passe unique pour tous les comptes générés) :');
console.log(`   - Étudiant : demo.etudiant@epsi.fr / ${DEMO_PASSWORD}`);
console.log(`   - Alumni   : demo.alumni@epsi.fr / ${DEMO_PASSWORD}`);
console.log(`   - BDE      : demo.bde@epsi.fr / ${DEMO_PASSWORD}`);

db.close();
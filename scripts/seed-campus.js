// Script pour initialiser les données du campus EPSI
// Exécuter avec: node scripts/seed-campus.js

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database.sqlite');
const db = new Database(dbPath);

const campusColumns = db.prepare('PRAGMA table_info(campus_locations)').all();
const campusColumnNames = new Set(campusColumns.map(column => column.name));

if (!campusColumnNames.has('contact_name')) {
  db.exec('ALTER TABLE campus_locations ADD COLUMN contact_name TEXT');
}

if (!campusColumnNames.has('contact_email')) {
  db.exec('ALTER TABLE campus_locations ADD COLUMN contact_email TEXT');
}

console.log('🏫 Initialisation des données du campus EPSI...\n');

// Vider les anciennes données
console.log('🗑️  Suppression des anciennes données...');
db.prepare('DELETE FROM campus_locations').run();
db.prepare('DELETE FROM resources').run();
console.log('✅ Anciennes données supprimées\n');

// Données des emplacements du campus - uniquement 2ème étage basé sur le plan réel
const campusLocations = [
  // 2ème étage (floor 2) - basé sur le plan fourni
  { name: 'Mydil', description: 'Espace Mydil - Innovation et projets étudiants', type: 'lab', floor: 2, x_position: 0.12, y_position: 0.38, contact_name: 'Référent Innovation', contact_email: 'mydil@epsi.fr' },
  { name: 'Espace commun', description: 'Espace de travail collaboratif et détente', type: 'cafeteria', floor: 2, x_position: 0.42, y_position: 0.28 },
  { name: 'Administration', description: 'Services administratifs - Inscriptions, certificats', type: 'office', floor: 2, x_position: 0.82, y_position: 0.18, contact_name: 'Nadège', contact_email: 'nadege@epsi.fr' },
  { name: 'Direction', description: 'Bureau de la direction de l\'école', type: 'office', floor: 2, x_position: 0.82, y_position: 0.35, contact_name: 'Direction', contact_email: 'direction@epsi.fr' },
  { name: 'Pédagogie', description: 'Bureau pédagogique - Suivi des étudiants, stages', type: 'office', floor: 2, x_position: 0.82, y_position: 0.52, contact_name: 'Service pédagogie', contact_email: 'pedagogie@epsi.fr' },
  { name: 'Espace commun', description: 'Espace de travail et détente', type: 'cafeteria', floor: 2, x_position: 0.42, y_position: 0.78 },
];

// Données des ressources et services
const resources = [
  { 
    name: 'Microsoft 365', 
    type: 'digital_tool', 
    description: 'Suite complète Microsoft (Word, Excel, Teams, OneDrive) gratuite pour tous les étudiants.', 
    link: 'https://office.com',
    hours: 'Accessible 24h/24'
  },
  { 
    name: 'GitHub Student Pack', 
    type: 'digital_tool', 
    description: 'Accès gratuit à GitHub Pro et nombreux outils de développement.', 
    link: 'https://education.github.com/pack',
    hours: 'Accessible 24h/24'
  },
  { 
    name: 'WiFi Campus', 
    type: 'digital_tool', 
    description: 'Connexion WiFi haut débit. Réseau "EPSI-Student".', 
    location: 'Tout le campus',
    hours: '7h00 - 22h00'
  },
  { 
    name: 'Service scolarité', 
    type: 'admin', 
    description: 'Inscriptions, certificats, relevés de notes.', 
    location: '2ème étage - Administration',
    hours: '9h00 - 17h00'
  },
  { 
    name: 'Service stages', 
    type: 'admin', 
    description: 'Accompagnement stages et alternances.', 
    location: '2ème étage - Pédagogie',
    hours: '9h00 - 17h00'
  },
];

// Insertion des données
console.log('📍 Insertion des emplacements du campus...');

const insertLocation = db.prepare(`
  INSERT INTO campus_locations (name, description, type, floor, x_position, y_position, contact_name, contact_email)
  VALUES (@name, @description, @type, @floor, @x_position, @y_position, @contact_name, @contact_email)
`);

const insertManyLocations = db.transaction((locations) => {
  for (const location of locations) {
    insertLocation.run({
      name: location.name,
      description: location.description,
      type: location.type,
      floor: location.floor,
      x_position: location.x_position,
      y_position: location.y_position,
      contact_name: location.contact_name || null,
      contact_email: location.contact_email || null,
    });
  }
});

insertManyLocations(campusLocations);
console.log(`✅ ${campusLocations.length} emplacements ajoutés\n`);

console.log('🔧 Insertion des ressources et services...');

const insertResource = db.prepare(`
  INSERT INTO resources (name, type, description, location, link, hours)
  VALUES (@name, @type, @description, @location, @link, @hours)
`);

const insertManyResources = db.transaction((resources) => {
  for (const resource of resources) {
    insertResource.run({
      name: resource.name,
      type: resource.type,
      description: resource.description,
      location: resource.location || null,
      link: resource.link || null,
      hours: resource.hours || null
    });
  }
});

insertManyResources(resources);
console.log(`✅ ${resources.length} ressources ajoutées\n`);

// Vérification
const locationCount = db.prepare('SELECT COUNT(*) as count FROM campus_locations').get();
const resourceCount = db.prepare('SELECT COUNT(*) as count FROM resources').get();

console.log('📊 Résumé:');
console.log(`   - Emplacements campus: ${locationCount.count}`);
console.log(`   - Ressources/Services: ${resourceCount.count}`);
console.log('\n🎉 Données du campus initialisées avec succès!');

db.close();

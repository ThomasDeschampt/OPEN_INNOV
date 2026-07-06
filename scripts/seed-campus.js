// scripts/seed-campus.js — DÉPRÉCIÉ
//
// Ce script ne faisait que réinitialiser les tables `campus_locations` et
// `resources`. Il est désormais entièrement couvert (avec un jeu de données
// plus riche et cohérent) par le script de seed principal.
//
// ⚠️  Ne plus l'utiliser : lancé après le seed principal, il écraserait une
//     partie des données (ressources, emplacements) par un sous-ensemble plus
//     ancien.
//
// 👉  Utiliser à la place :
//        npm run db:reset      (purge complète + jeu de données de démo)
//
// Ce fichier est conservé volontairement inoffensif : il n'écrit rien en base.

console.log('\n⚠️  scripts/seed-campus.js est déprécié — il ne modifie plus la base.');
console.log('👉  Utilise plutôt :  npm run db:reset');
console.log('    (purge complète de la base + génération du jeu de données de démo,');
console.log('     campus et ressources compris)\n');

process.exit(0);

# EPSI Connect

Application d'intégration et de vie étudiante pour l'EPSI : découverte de l'école,
communication du BDE, événements, forum, témoignages d'anciens, sondages, plan du
campus et jeu du jour.

**Stack** : Next.js 16 (App Router, Turbopack) · React 19 · Tailwind CSS v4 ·
SQLite via `better-sqlite3` · authentification `bcryptjs`.

## Prérequis

- Node.js 20+ (testé jusqu'à Node 25).
- La base est un simple fichier SQLite (`database.sqlite`) versionné avec le projet —
  aucun serveur de base de données à installer.

## Installation

```bash
npm install --legacy-peer-deps
```

> `--legacy-peer-deps` est nécessaire : `lucide-react` déclare un peer-dependency
> React ≤ 18 alors que le projet tourne sous React 19.

## Lancer l'application

```bash
npm run dev
```

Ouvrir http://localhost:3000.

## Base de données & jeu de données de démo

Le projet est livré avec un script unique qui **purge la base puis la remplit** avec un
jeu de données réaliste, cohérent et **déterministe** (même résultat à chaque exécution,
donc démo rejouable à l'identique).

```bash
# Arrêter le serveur dev avant (verrou SQLite), puis :
npm run db:reset
```

`npm run db:seed` est un alias équivalent.

Le script alimente **toutes** les tables : utilisateurs, événements + inscriptions,
témoignages (+ likes), forum (publications, commentaires, likes), ressources, plan du
campus, sondages (+ votes), notifications et messages de contact.

Contenu généré (ordre de grandeur) : 28 utilisateurs, 12 événements, 8 témoignages,
18 publications de forum, 5 sondages, etc.

### Comptes de démonstration

Tous les comptes générés partagent le même mot de passe : **`Demo1234!`**

| Rôle     | Email                    |
| -------- | ------------------------ |
| Étudiant | `demo.etudiant@epsi.fr`  |
| Alumni   | `demo.alumni@epsi.fr`    |
| BDE      | `demo.bde@epsi.fr`       |

Le compte **BDE** permet de créer des événements et des sondages.

## Build de production

```bash
npm run build
npm start
```

## Structure

```
app/            Pages (App Router) + routes API sous app/api/
  components/   Navigation, contexte d'auth, toasts
lib/db.js       Connexion SQLite + schéma (source de vérité du schéma)
scripts/
  reset-and-seed.js   Purge + jeu de données de démo (npm run db:reset)
public/, app/icon/    Assets (badges, illustrations)
```

> Le schéma est défini dans `lib/db.js` **et** recopié dans `scripts/reset-and-seed.js` —
> garder les deux synchronisés en cas d'évolution du schéma.

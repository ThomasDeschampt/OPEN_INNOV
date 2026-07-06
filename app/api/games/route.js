import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const GAME_KEYS = ['logicode', 'sequence'];

function localDateKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function previousDateKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

const EMPTY_PROGRESS = { streak: 0, best_streak: 0, points: 0, games_played: 0, last_played_date: null };

function readProgress(db, userId) {
  return db.prepare('SELECT streak, best_streak, points, games_played, last_played_date FROM game_progress WHERE user_id = ?').get(userId) || { ...EMPTY_PROGRESS };
}

function todayGameKeys(db, userId, today) {
  return db
    .prepare('SELECT game_key FROM game_results WHERE user_id = ? AND play_date = ?')
    .all(userId, today)
    .map((row) => row.game_key);
}

function computeRank(db, progress) {
  if (!progress.games_played) return null;
  const better = db
    .prepare(
      `SELECT COUNT(*) AS n FROM game_progress
       WHERE games_played > 0
         AND (streak > ? OR (streak = ? AND points > ?))`
    )
    .get(progress.streak, progress.streak, progress.points).n;
  return better + 1;
}

// GET /api/games?userId=16 — état du joueur pour aujourd'hui
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    const db = getDb();
    const today = localDateKey();
    const progress = readProgress(db, userId);

    return NextResponse.json({
      progress,
      todayGames: todayGameKeys(db, userId, today),
      rank: computeRank(db, progress),
      date: today,
    });
  } catch (error) {
    console.error('Games state error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/games — enregistre une partie gagnée du jour
// body: { userId, gameKey, score }
export async function POST(request) {
  try {
    const { userId, gameKey, score } = await request.json();

    if (!userId || !GAME_KEYS.includes(gameKey)) {
      return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
    }

    const db = getDb();
    const today = localDateKey();
    const yesterday = previousDateKey(today);
    const reward = Math.max(5, Math.min(40, Math.round(Number(score) || 0)));

    const result = db.transaction(() => {
      // Déjà joué ce jeu aujourd'hui ? -> aucun gain, on renvoie l'état courant.
      const already = db
        .prepare('SELECT 1 FROM game_results WHERE user_id = ? AND game_key = ? AND play_date = ?')
        .get(userId, gameKey, today);

      if (already) {
        const progress = readProgress(db, userId);
        return { rewarded: false, reward: 0, streakIncreased: false, progress, todayGames: todayGameKeys(db, userId, today) };
      }

      // Premier jeu du jour ? (le streak n'augmente qu'une fois par jour)
      const playedTodayBefore = todayGameKeys(db, userId, today).length;
      const firstOfDay = playedTodayBefore === 0;

      db.prepare(
        'INSERT INTO game_results (user_id, game_key, play_date, won, score) VALUES (?, ?, ?, 1, ?)'
      ).run(userId, gameKey, today, reward);

      const prev = readProgress(db, userId);
      let streak = prev.streak;
      let lastPlayed = prev.last_played_date;

      if (firstOfDay) {
        if (prev.last_played_date === today) {
          streak = prev.streak; // sécurité
        } else if (prev.last_played_date === yesterday) {
          streak = prev.streak + 1;
        } else {
          streak = 1;
        }
        lastPlayed = today;
      }

      const bestStreak = Math.max(prev.best_streak, streak);
      const points = prev.points + reward;
      const gamesPlayed = prev.games_played + 1;

      db.prepare(
        `INSERT INTO game_progress (user_id, streak, best_streak, points, games_played, last_played_date, updated_at)
         VALUES (@user_id, @streak, @best_streak, @points, @games_played, @last_played_date, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           streak = @streak,
           best_streak = @best_streak,
           points = @points,
           games_played = @games_played,
           last_played_date = @last_played_date,
           updated_at = CURRENT_TIMESTAMP`
      ).run({
        user_id: userId,
        streak,
        best_streak: bestStreak,
        points,
        games_played: gamesPlayed,
        last_played_date: lastPlayed,
      });

      const progress = readProgress(db, userId);
      return {
        rewarded: true,
        reward,
        streakIncreased: firstOfDay && streak > prev.streak,
        progress,
        todayGames: todayGameKeys(db, userId, today),
      };
    })();

    return NextResponse.json({ ...result, rank: computeRank(db, result.progress), date: today });
  } catch (error) {
    console.error('Games complete error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

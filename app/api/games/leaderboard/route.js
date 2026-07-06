import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/games/leaderboard?limit=10&userId=16
// Classement par jours de suite (streak), puis points.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);
    const userId = searchParams.get('userId');

    const db = getDb();

    const leaderboard = db
      .prepare(
        `SELECT
           u.id,
           u.first_name,
           u.last_name,
           u.user_type,
           g.streak,
           g.best_streak,
           g.points,
           g.games_played
         FROM game_progress g
         JOIN users u ON u.id = g.user_id
         WHERE g.games_played > 0
         ORDER BY g.streak DESC, g.points DESC, u.first_name ASC
         LIMIT ?`
      )
      .all(limit);

    let userRank = null;
    if (userId) {
      const me = db
        .prepare('SELECT streak, points FROM game_progress WHERE user_id = ?')
        .get(userId);
      if (me) {
        const better = db
          .prepare(
            `SELECT COUNT(*) AS n FROM game_progress
             WHERE games_played > 0
               AND (streak > ? OR (streak = ? AND points > ?))`
          )
          .get(me.streak, me.streak, me.points).n;
        userRank = better + 1;
      }
    }

    return NextResponse.json({ leaderboard, userRank });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

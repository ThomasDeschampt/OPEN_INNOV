import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const { id } = (await params);
    const { userId, optionId } = await request.json();

    if (!userId || !optionId) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if poll exists and is active
    const poll = db.prepare(`
      SELECT * FROM polls 
      WHERE id = ? AND is_active = 1 
      AND (expires_at IS NULL OR expires_at > datetime('now'))
    `).get(id);

    if (!poll) {
      return NextResponse.json(
        { error: 'Sondage non trouvé ou expiré' },
        { status: 404 }
      );
    }

    // Check if user already voted
    const existingVote = db.prepare(
      'SELECT id FROM poll_votes WHERE poll_id = ? AND user_id = ?'
    ).get(id, userId);

    if (existingVote) {
      return NextResponse.json(
        { error: 'Vous avez déjà voté' },
        { status: 409 }
      );
    }

    // Verify option belongs to poll
    const option = db.prepare(
      'SELECT id FROM poll_options WHERE id = ? AND poll_id = ?'
    ).get(optionId, id);

    if (!option) {
      return NextResponse.json(
        { error: 'Option invalide' },
        { status: 400 }
      );
    }

    // Record vote
    db.prepare(
      "INSERT INTO poll_votes (poll_id, option_id, user_id, created_at) VALUES (?, ?, ?, datetime('now'))"
    ).run(id, optionId, userId);

    // Increment vote count
    db.prepare(
      'UPDATE poll_options SET votes = votes + 1 WHERE id = ?'
    ).run(optionId);

    // Get updated options
    const options = db.prepare(
      'SELECT * FROM poll_options WHERE poll_id = ? ORDER BY id'
    ).all(id);

    const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

    return NextResponse.json({
      message: 'Vote enregistré',
      options: options.map(opt => ({
        ...opt,
        percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
      })),
      total_votes: totalVotes
    });
  } catch (error) {
    console.error('Vote error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = (await params);
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const db = getDb();

    const poll = db.prepare(`
      SELECT 
        p.*,
        u.first_name || ' ' || u.last_name as creator_name
      FROM polls p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(id);

    if (!poll) {
      return NextResponse.json(
        { error: 'Sondage non trouvé' },
        { status: 404 }
      );
    }

    const options = db.prepare(
      'SELECT * FROM poll_options WHERE poll_id = ? ORDER BY id'
    ).all(id);

    const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);

    // Check if user has voted
    let userVote = null;
    if (userId) {
      const vote = db.prepare(
        'SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?'
      ).get(id, userId);
      userVote = vote?.option_id || null;
    }

    return NextResponse.json({
      poll: {
        ...poll,
        options: options.map(opt => ({
          ...opt,
          percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
        })),
        total_votes: totalVotes,
        user_vote: userVote
      }
    });
  } catch (error) {
    console.error('Poll detail error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
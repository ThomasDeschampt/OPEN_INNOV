import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const active = searchParams.get('active') === 'true';
    const limit = parseInt(searchParams.get('limit')) || 50;

    const db = getDb();
    
    let query = `
      SELECT 
        p.*,
        u.first_name || ' ' || u.last_name as creator_name
      FROM polls p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE 1=1
    `;
    
    if (active) {
      query += ` AND p.is_active = 1 AND (p.expires_at IS NULL OR p.expires_at > datetime('now'))`;
    }

    query += ' ORDER BY p.created_at DESC LIMIT ?';

    const polls = db.prepare(query).all(limit);

    // Get options for each poll
    const pollsWithOptions = polls.map(poll => {
      const options = db.prepare(
        'SELECT * FROM poll_options WHERE poll_id = ? ORDER BY id'
      ).all(poll.id);
      
      const totalVotes = options.reduce((sum, opt) => sum + opt.votes, 0);
      
      return {
        ...poll,
        options: options.map(opt => ({
          ...opt,
          percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
        })),
        total_votes: totalVotes
      };
    });

    return NextResponse.json({ polls: pollsWithOptions });
  } catch (error) {
    console.error('Polls API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { question, options, expiresAt, userId } = await request.json();
    const normalizedExpiresAt = expiresAt
      ? `${expiresAt.replace('T', ' ')}:00`
      : null;

    if (!userId) {
      return NextResponse.json(
        { error: 'Utilisateur non connecté' },
        { status: 401 }
      );
    }

    if (!question || !Array.isArray(options)) {
      return NextResponse.json(
        { error: 'Question et options requises' },
        { status: 400 }
      );
    }

    const normalizedQuestion = question.trim();
    const normalizedOptions = options
      .map(option => option?.trim())
      .filter(Boolean);

    if (!normalizedQuestion) {
      return NextResponse.json(
        { error: 'La question ne peut pas être vide' },
        { status: 400 }
      );
    }

    if (normalizedOptions.length < 2) {
      return NextResponse.json(
        { error: 'Au moins deux options sont requises' },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db.prepare('SELECT id, user_type FROM users WHERE id = ?').get(userId);

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 404 }
      );
    }

    if (user.user_type !== 'bde') {
      return NextResponse.json(
        { error: 'Accès réservé aux membres du BDE' },
        { status: 403 }
      );
    }

    const createPoll = db.transaction(() => {
      const pollResult = db.prepare(`
        INSERT INTO polls (question, created_by, expires_at, is_active)
        VALUES (?, ?, ?, 1)
      `).run(normalizedQuestion, user.id, normalizedExpiresAt);

      const optionStatement = db.prepare(`
        INSERT INTO poll_options (poll_id, option_text, votes)
        VALUES (?, ?, 0)
      `);

      for (const optionText of normalizedOptions) {
        optionStatement.run(pollResult.lastInsertRowid, optionText);
      }

      return pollResult.lastInsertRowid;
    });

    const pollId = createPoll();

    const poll = db.prepare(`
      SELECT
        p.*, 
        u.first_name || ' ' || u.last_name as creator_name
      FROM polls p
      LEFT JOIN users u ON p.created_by = u.id
      WHERE p.id = ?
    `).get(pollId);

    const pollOptions = db.prepare(
      'SELECT * FROM poll_options WHERE poll_id = ? ORDER BY id'
    ).all(pollId);

    return NextResponse.json(
      {
        message: 'Sondage créé avec succès',
        poll: {
          ...poll,
          options: pollOptions,
          total_votes: 0,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Poll creation error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
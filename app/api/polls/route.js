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
      query += ' AND p.is_active = 1 AND (p.expires_at IS NULL OR p.expires_at > datetime("now"))';
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
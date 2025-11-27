import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const db = getDb();
    
    const post = db.prepare(`
      SELECT 
        p.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.user_type as author_type
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(id);

    if (!post) {
      return NextResponse.json(
        { error: 'Post non trouvé' },
        { status: 404 }
      );
    }

    const comments = db.prepare(`
      SELECT 
        c.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.user_type as author_type
      FROM forum_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
    `).all(id);

    return NextResponse.json({ post, comments });
  } catch (error) {
    console.error('Post detail error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request, { params }) {
  // Add comment
  try {
    const { id } = params;
    const { user_id, content } = await request.json();

    if (!user_id || !content) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if post exists
    const post = db.prepare('SELECT id FROM forum_posts WHERE id = ?').get(id);
    if (!post) {
      return NextResponse.json(
        { error: 'Post non trouvé' },
        { status: 404 }
      );
    }

    const result = db.prepare(`
      INSERT INTO forum_comments (post_id, user_id, content)
      VALUES (?, ?, ?)
    `).run(id, user_id, content);

    const comment = db.prepare(`
      SELECT 
        c.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.user_type as author_type
      FROM forum_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error('Add comment error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  // Like post
  try {
    const { id } = params;
    const db = getDb();
    
    db.prepare('UPDATE forum_posts SET likes = likes + 1 WHERE id = ?').run(id);
    const post = db.prepare('SELECT likes FROM forum_posts WHERE id = ?').get(id);

    return NextResponse.json({ likes: post.likes });
  } catch (error) {
    console.error('Like post error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
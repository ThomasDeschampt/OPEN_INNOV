import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const db = getDb();
    
    let query = `
      SELECT 
        p.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.user_type as author_type,
        (SELECT COUNT(*) FROM forum_comments WHERE post_id = p.id) as comments_count
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];

    if (category) {
      query += ' AND p.category = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (p.title LIKE ? OR p.content LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ?';
    params.push(limit);

    const posts = db.prepare(query).all(...params);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Forum API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, title, content, category } = body;

    if (!user_id || !title || !content) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    const result = db.prepare(`
      INSERT INTO forum_posts (user_id, title, content, category)
      VALUES (?, ?, ?, ?)
    `).run(user_id, title, content, category || 'general');

    const newPost = db.prepare(`
      SELECT 
        p.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.user_type as author_type
      FROM forum_posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ post: newPost }, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
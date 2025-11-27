import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const search = searchParams.get('search');

    const db = getDb();
    
    let query = `
      SELECT 
        t.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.user_type as author_type
      FROM testimonials t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];

    if (search) {
      query += ' AND (t.title LIKE ? OR t.content LIKE ? OR t.company LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY t.created_at DESC LIMIT ?';
    params.push(limit);

    const testimonials = db.prepare(query).all(...params);

    return NextResponse.json({ testimonials });
  } catch (error) {
    console.error('Testimonials API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, title, content, graduation_year, current_position, company } = body;

    if (!user_id || !title || !content) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    const result = db.prepare(`
      INSERT INTO testimonials (user_id, title, content, graduation_year, current_position, company)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user_id, title, content, graduation_year, current_position, company);

    const newTestimonial = db.prepare(`
      SELECT 
        t.*,
        u.first_name || ' ' || u.last_name as author_name,
        u.user_type as author_type
      FROM testimonials t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `).get(result.lastInsertRowid);

    return NextResponse.json({ testimonial: newTestimonial }, { status: 201 });
  } catch (error) {
    console.error('Create testimonial error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
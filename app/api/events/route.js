import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET - Liste des événements
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const upcoming = searchParams.get('upcoming');

    const db = getDb();
    
    let sql = `
      SELECT 
        e.*,
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as participants_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (category) {
      sql += ' AND e.category = ?';
      params.push(category);
    }
    
    if (upcoming === 'true') {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      sql += ' AND e.date >= ?';
      params.push(now);
    }
    
    sql += ' ORDER BY e.date ASC';

    const events = db.prepare(sql).all(...params);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Events list error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// POST - Créer un événement
export async function POST(request) {
  try {
    const data = await request.json();
    const { title, description, date, end_date, location, category, max_participants, userId } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'Utilisateur non connecté' },
        { status: 401 }
      );
    }

    if (!title || !date) {
      return NextResponse.json(
        { error: 'Titre et date requis' },
        { status: 400 }
      );
    }

    const db = getDb();

    const result = db.prepare(`
      INSERT INTO events (title, description, date, end_date, location, category, max_participants, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(title, description, date, end_date, location, category, max_participants, userId);

    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(result.lastInsertRowid);

    return NextResponse.json({ event, message: 'Événement créé avec succès' }, { status: 201 });
  } catch (error) {
    console.error('Event creation error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id, name, email, category, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Tous les champs requis doivent être remplis' },
        { status: 400 }
      );
    }

    const db = getDb();
    
    const result = db.prepare(`
      INSERT INTO contact_messages (user_id, name, email, category, subject, message)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user_id || null, name, email, category || 'other', subject, message);

    return NextResponse.json({ 
      message: 'Message envoyé avec succès',
      id: result.lastInsertRowid 
    }, { status: 201 });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved');

    const db = getDb();
    
    let query = 'SELECT * FROM contact_messages';
    if (resolved !== null) {
      query += ` WHERE is_resolved = ${resolved === 'true' ? 1 : 0}`;
    }
    query += ' ORDER BY created_at DESC';

    const messages = db.prepare(query).all();

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Get contacts error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
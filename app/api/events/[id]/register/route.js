import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'Utilisateur non connecté' },
        { status: 401 }
      );
    }

    const db = getDb();

    // Check if event exists
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Check if already registered
    const existing = db.prepare(
      'SELECT id FROM registrations WHERE user_id = ? AND event_id = ?'
    ).get(userId, id);

    if (existing) {
      return NextResponse.json(
        { error: 'Déjà inscrit à cet événement' },
        { status: 409 }
      );
    }

    // Check max participants
    const count = db.prepare(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?'
    ).get(id);

    if (event.max_participants && count.count >= event.max_participants) {
      return NextResponse.json(
        { error: 'Événement complet' },
        { status: 400 }
      );
    }

    // Create registration
    db.prepare(
      'INSERT INTO registrations (user_id, event_id) VALUES (?, ?)'
    ).run(userId, id);

    // Create notification
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'event', 'Inscription confirmée', ?, ?)
    `).run(userId, `Vous êtes inscrit à "${event.title}"`, `/events/${id}`);

    return NextResponse.json({ 
      message: 'Inscription réussie',
      participants_count: count.count + 1
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Utilisateur non connecté' },
        { status: 401 }
      );
    }

    const db = getDb();

    const result = db.prepare(
      'DELETE FROM registrations WHERE user_id = ? AND event_id = ?'
    ).run(userId, id);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: 'Inscription non trouvée' },
        { status: 404 }
      );
    }

    const count = db.prepare(
      'SELECT COUNT(*) as count FROM registrations WHERE event_id = ?'
    ).get(id);

    return NextResponse.json({ 
      message: 'Désinscription réussie',
      participants_count: count.count
    });
  } catch (error) {
    console.error('Unregistration error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
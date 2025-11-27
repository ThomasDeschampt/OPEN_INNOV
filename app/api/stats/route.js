import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const db = getDb();
    
    const event = db.prepare(`
      SELECT 
        e.*,
        u.first_name || ' ' || u.last_name as creator_name,
        (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as participants_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = ?
    `).get(id);

    if (!event) {
      return NextResponse.json(
        { error: 'Événement non trouvé' },
        { status: 404 }
      );
    }

    // Check if user is registered
    let isRegistered = false;
    if (userId) {
      const registration = db.prepare(
        'SELECT id FROM registrations WHERE user_id = ? AND event_id = ?'
      ).get(userId, id);
      isRegistered = !!registration;
    }

    // Get participants
    const participants = db.prepare(`
      SELECT u.id, u.first_name, u.last_name, u.user_type
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      WHERE r.event_id = ?
      ORDER BY r.registered_at DESC
    `).all(id);

    return NextResponse.json({ event, isRegistered, participants });
  } catch (error) {
    console.error('Event detail error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
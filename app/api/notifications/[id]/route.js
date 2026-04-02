import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { userId } = await request.json();

    const db = getDb();

    const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification non trouvée' },
        { status: 404 }
      );
    }

    if (userId && String(notification.user_id) !== String(userId)) {
      return NextResponse.json(
        { error: 'Accès refusé' },
        { status: 403 }
      );
    }

    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);

    const updatedNotification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);

    return NextResponse.json({ notification: updatedNotification });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
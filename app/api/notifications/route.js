import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('userId');
		const unreadOnly = searchParams.get('unreadOnly') === 'true';
		const limit = parseInt(searchParams.get('limit'), 10) || 50;

		if (!userId) {
			return NextResponse.json(
				{ error: 'Utilisateur requis' },
				{ status: 400 }
			);
		}

		const db = getDb();

		let query = 'SELECT * FROM notifications WHERE user_id = ?';
		const params = [userId];

		if (unreadOnly) {
			query += ' AND is_read = 0';
		}

		query += ' ORDER BY created_at DESC LIMIT ?';
		params.push(limit);

		const notifications = db.prepare(query).all(...params);

		return NextResponse.json({ notifications });
	} catch (error) {
		console.error('Notifications API error:', error);
		return NextResponse.json(
			{ error: 'Erreur serveur' },
			{ status: 500 }
		);
	}
}

export async function POST(request) {
	try {
		const body = await request.json();
		const { userId, type, title, message, link } = body;

		if (!userId || !type || !title) {
			return NextResponse.json(
				{ error: 'Champs requis manquants' },
				{ status: 400 }
			);
		}

		const db = getDb();

		const result = db.prepare(`
			INSERT INTO notifications (user_id, type, title, message, link)
			VALUES (?, ?, ?, ?, ?)
		`).run(userId, type, title, message || null, link || null);

		const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(result.lastInsertRowid);

		return NextResponse.json({ notification }, { status: 201 });
	} catch (error) {
		console.error('Create notification error:', error);
		return NextResponse.json(
			{ error: 'Erreur serveur' },
			{ status: 500 }
		);
	}
}

export async function PATCH(request) {
	try {
		const { searchParams } = new URL(request.url);
		const userId = searchParams.get('userId');

		if (!userId) {
			return NextResponse.json(
				{ error: 'Utilisateur requis' },
				{ status: 400 }
			);
		}

		const db = getDb();

		db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(userId);

		return NextResponse.json({ message: 'Notifications marquées comme lues' });
	} catch (error) {
		console.error('Mark all notifications error:', error);
		return NextResponse.json(
			{ error: 'Erreur serveur' },
			{ status: 500 }
		);
	}
}

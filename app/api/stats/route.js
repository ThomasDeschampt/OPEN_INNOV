import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();

    const count = (sql) => db.prepare(sql).get().n;

    const stats = {
      users: count('SELECT COUNT(*) AS n FROM users'),
      events: count('SELECT COUNT(*) AS n FROM events'),
      testimonials: count('SELECT COUNT(*) AS n FROM testimonials'),
      posts: count('SELECT COUNT(*) AS n FROM forum_posts'),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

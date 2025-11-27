import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const floor = searchParams.get('floor');

    const db = getDb();
    
    let query = 'SELECT * FROM campus_locations';
    const params = [];

    if (floor !== null && floor !== undefined) {
      query += ' WHERE floor = ?';
      params.push(parseInt(floor));
    }

    query += ' ORDER BY floor, name';

    const locations = db.prepare(query).all(...params);

    return NextResponse.json({ locations });
  } catch (error) {
    console.error('Campus locations API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
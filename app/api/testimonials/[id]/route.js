import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const { user_id } = await request.json();

    if (!user_id) {
      return NextResponse.json(
        { error: 'Utilisateur requis' },
        { status: 400 }
      );
    }

    const db = getDb();

    const testimonial = db.prepare('SELECT id FROM testimonials WHERE id = ?').get(id);
    if (!testimonial) {
      return NextResponse.json(
        { error: 'Témoignage non trouvé' },
        { status: 404 }
      );
    }

    const existingLike = db.prepare(
      'SELECT id FROM testimonial_likes WHERE user_id = ? AND testimonial_id = ?'
    ).get(user_id, id);

    let liked;
    if (existingLike) {
      db.prepare('DELETE FROM testimonial_likes WHERE user_id = ? AND testimonial_id = ?').run(user_id, id);
      db.prepare('UPDATE testimonials SET likes = MAX(likes - 1, 0) WHERE id = ?').run(id);
      liked = false;
    } else {
      db.prepare('INSERT INTO testimonial_likes (user_id, testimonial_id) VALUES (?, ?)').run(user_id, id);
      db.prepare('UPDATE testimonials SET likes = likes + 1 WHERE id = ?').run(id);
      liked = true;
    }

    const updatedTestimonial = db.prepare('SELECT likes FROM testimonials WHERE id = ?').get(id);

    return NextResponse.json({ likes: updatedTestimonial.likes, liked });
  } catch (error) {
    console.error('Testimonial like error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
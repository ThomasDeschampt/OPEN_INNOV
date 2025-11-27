import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const { email, password, first_name, last_name, user_type, bio } = await request.json();

    if (!email || !password || !first_name || !last_name || !user_type) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    if (!['student', 'alumni', 'bde'].includes(user_type)) {
      return NextResponse.json(
        { error: 'Type d\'utilisateur invalide' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert new user
    const result = db.prepare(`
      INSERT INTO users (email, password, first_name, last_name, user_type, bio)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(email, hashedPassword, first_name, last_name, user_type, bio || null);

    // Get the created user
    const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const { password: _, ...userWithoutPassword } = newUser;

    // Create welcome notification
    db.prepare(`
      INSERT INTO notifications (user_id, type, title, message, link)
      VALUES (?, 'system', 'Bienvenue à l''EPSI !', 'Découvrez toutes les fonctionnalités de l''application.', '/campus')
    `).run(newUser.id);

    return NextResponse.json({
      message: 'Compte créé avec succès',
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
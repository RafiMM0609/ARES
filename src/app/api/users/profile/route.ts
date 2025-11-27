// src/app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, getCurrentTimestamp, UserRow } from '@/lib/sqlite';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDatabase();

    const profile = db.prepare(`
      SELECT id, email, full_name, user_type, avatar_url, bio, country, timezone, wallet_address, is_active, email_verified, created_at, updated_at
      FROM users WHERE id = ?
    `).get(payload.userId) as Omit<UserRow, 'password_hash'> | undefined;

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, bio, country, timezone, wallet_address, avatar_url, user_type } = body;

    const db = getDatabase();
    const now = getCurrentTimestamp();

    db.prepare(`
      UPDATE users SET
        full_name = COALESCE(?, full_name),
        bio = COALESCE(?, bio),
        country = COALESCE(?, country),
        timezone = COALESCE(?, timezone),
        wallet_address = COALESCE(?, wallet_address),
        avatar_url = COALESCE(?, avatar_url),
        user_type = COALESCE(?, user_type),
        updated_at = ?
      WHERE id = ?
    `).run(full_name, bio, country, timezone, wallet_address, avatar_url, user_type, now, payload.userId);

    const profile = db.prepare(`
      SELECT id, email, full_name, user_type, avatar_url, bio, country, timezone, wallet_address, is_active, email_verified, created_at, updated_at
      FROM users WHERE id = ?
    `).get(payload.userId) as Omit<UserRow, 'password_hash'> | undefined;

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Profile updated successfully',
      profile 
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

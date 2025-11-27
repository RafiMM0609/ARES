// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, UserRow, UserSessionRow } from '@/lib/sqlite';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ session: null });
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
      // Token is invalid or expired
      return NextResponse.json({ session: null });
    }

    const db = getDatabase();

    // Check if session exists and is not expired
    const session = db.prepare(`
      SELECT * FROM user_sessions 
      WHERE user_id = ? AND expires_at > datetime('now')
      LIMIT 1
    `).get(payload.userId) as UserSessionRow | undefined;

    if (!session) {
      return NextResponse.json({ session: null });
    }

    // Get user data
    const user = db.prepare(`
      SELECT id, email, full_name, user_type, avatar_url, bio, country, timezone, wallet_address, is_active
      FROM users WHERE id = ?
    `).get(payload.userId) as Pick<UserRow, 'id' | 'email' | 'full_name' | 'user_type' | 'avatar_url' | 'bio' | 'country' | 'timezone' | 'wallet_address' | 'is_active'> | undefined;

    if (!user) {
      return NextResponse.json({ session: null });
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          user_type: user.user_type,
          avatar_url: user.avatar_url,
          bio: user.bio,
          country: user.country,
          timezone: user.timezone,
          wallet_address: user.wallet_address,
        },
      },
    });
  } catch (error) {
    console.error('Session error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

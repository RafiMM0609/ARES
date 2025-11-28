// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, generateUUID, getCurrentTimestamp, UserRow } from '@/lib/sqlite';
import { verifyPassword, generateToken, hashSessionToken, getTokenExpiration } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Find user by email
    const user = db.prepare(`
      SELECT id, email, password_hash, full_name, user_type, avatar_url, is_active
      FROM users WHERE email = ?
    `).get(email) as Pick<UserRow, 'id' | 'email' | 'password_hash' | 'full_name' | 'user_type' | 'avatar_url' | 'is_active'> | undefined;

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login time
    const now = getCurrentTimestamp();
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, user.id);

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.user_type,
    });

    // Store session in database
    const tokenHash = await hashSessionToken(token);
    const expiresAt = getTokenExpiration();
    const sessionId = generateUUID();

    try {
      db.prepare(`
        INSERT INTO user_sessions (id, user_id, token_hash, expires_at, created_at, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        sessionId,
        user.id,
        tokenHash,
        expiresAt.toISOString(),
        now,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        request.headers.get('user-agent') || null
      );
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
    }

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        avatar_url: user.avatar_url,
      },
    });

    // Set secure HTTP-only cookie with the JWT token
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

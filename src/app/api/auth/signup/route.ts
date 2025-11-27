// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDatabase, generateUUID, getCurrentTimestamp } from '@/lib/sqlite';
import { hashPassword, generateToken, hashSessionToken, getTokenExpiration } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, full_name, user_type } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const db = getDatabase();

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Hash the password
    const password_hash = await hashPassword(password);

    // Create new user
    const userId = generateUUID();
    const now = getCurrentTimestamp();
    const userTypeValue = user_type || 'freelancer';
    
    try {
      db.prepare(`
        INSERT INTO users (id, email, password_hash, full_name, user_type, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(userId, email, password_hash, full_name || null, userTypeValue, now, now);
    } catch (createError) {
      console.error('User creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: userId,
      email: email,
      userType: userTypeValue,
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
        userId,
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
    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: userId,
          email: email,
          full_name: full_name || null,
          user_type: userTypeValue,
        },
      },
      { status: 201 }
    );

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
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

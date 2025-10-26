// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyPassword, generateToken, hashSessionToken, getTokenExpiration } from '@/lib/auth';
import type { Database } from '@/lib/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];

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

    const supabase = getServiceSupabase();

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash, full_name, user_type, avatar_url, is_active')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Type assertion for the user object
    const typedUser = user as Pick<UserRow, 'id' | 'email' | 'password_hash' | 'full_name' | 'user_type' | 'avatar_url' | 'is_active'>;

    // Check if user is active
    if (!typedUser.is_active) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, typedUser.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login time
    await supabase
      .from('users')
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', typedUser.id);

    // Generate JWT token
    const token = generateToken({
      userId: typedUser.id,
      email: typedUser.email,
      userType: typedUser.user_type,
    });

    // Store session in database
    const tokenHash = await hashSessionToken(token);
    const expiresAt = getTokenExpiration();

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: typedUser.id,
        token_hash: tokenHash,
        expires_at: expiresAt.toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        user_agent: request.headers.get('user-agent') || null,
      });

    if (sessionError) {
      console.error('Session creation error:', sessionError);
    }

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: typedUser.id,
        email: typedUser.email,
        full_name: typedUser.full_name,
        user_type: typedUser.user_type,
        avatar_url: typedUser.avatar_url,
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

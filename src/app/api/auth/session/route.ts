// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';
import type { Database } from '@/lib/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];

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

    const supabase = getServiceSupabase();

    // Check if session exists and is not expired
    const { data: session, error: sessionError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', payload.userId)
      .gt('expires_at', new Date().toISOString())
      .limit(1)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ session: null });
    }

    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, full_name, user_type, avatar_url, bio, country, timezone, wallet_address, is_active')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ session: null });
    }

    // Type assertion for the user object
    const typedUser = user as Pick<UserRow, 'id' | 'email' | 'full_name' | 'user_type' | 'avatar_url' | 'bio' | 'country' | 'timezone' | 'wallet_address' | 'is_active'>;

    // Check if user is active
    if (!typedUser.is_active) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        access_token: token,
        user: {
          id: typedUser.id,
          email: typedUser.email,
          full_name: typedUser.full_name,
          user_type: typedUser.user_type,
          avatar_url: typedUser.avatar_url,
          bio: typedUser.bio,
          country: typedUser.country,
          timezone: typedUser.timezone,
          wallet_address: typedUser.wallet_address,
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

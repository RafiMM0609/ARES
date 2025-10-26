// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
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
      .select('id, email, full_name, user_type, avatar_url, bio, country, timezone, wallet_address')
      .eq('id', payload.userId)
      .single();

    if (userError || !user) {
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

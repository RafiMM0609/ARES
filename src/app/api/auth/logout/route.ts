// src/app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Get token from cookie
    const token = request.cookies.get('auth_token')?.value;

    if (token) {
      // Verify token and get user ID
      const payload = verifyToken(token);
      
      if (payload) {
        const supabase = getServiceSupabase();

        // Delete all sessions for this user (or just the current one)
        // For now, we'll delete all sessions for simplicity
        await supabase
          .from('user_sessions')
          .delete()
          .eq('user_id', payload.userId);
      }
    }

    // Clear the auth cookie
    const response = NextResponse.json({ message: 'Logout successful' });
    
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

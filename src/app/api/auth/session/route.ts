// src/app/api/auth/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Check if session exists and is not expired
    const session = await prisma.userSession.findFirst({
      where: {
        userId: payload.userId,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      return NextResponse.json({ session: null });
    }

    // Get user data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        userType: true,
        avatarUrl: true,
        bio: true,
        country: true,
        timezone: true,
        walletAddress: true,
        isActive: true,
      },
    });

    if (!user) {
      return NextResponse.json({ session: null });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json({ session: null });
    }

    return NextResponse.json({
      session: {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          user_type: user.userType,
          avatar_url: user.avatarUrl,
          bio: user.bio,
          country: user.country,
          timezone: user.timezone,
          wallet_address: user.walletAddress,
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

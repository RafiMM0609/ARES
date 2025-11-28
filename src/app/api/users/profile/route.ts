// src/app/api/users/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const profile = await prisma.user.findUnique({
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
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      profile: {
        id: profile.id,
        email: profile.email,
        full_name: profile.fullName,
        user_type: profile.userType,
        avatar_url: profile.avatarUrl,
        bio: profile.bio,
        country: profile.country,
        timezone: profile.timezone,
        wallet_address: profile.walletAddress,
        is_active: profile.isActive,
        email_verified: profile.emailVerified,
        created_at: profile.createdAt.toISOString(),
        updated_at: profile.updatedAt.toISOString(),
      },
    });
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

    const updatedProfile = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        fullName: full_name !== undefined ? full_name : undefined,
        bio: bio !== undefined ? bio : undefined,
        country: country !== undefined ? country : undefined,
        timezone: timezone !== undefined ? timezone : undefined,
        walletAddress: wallet_address !== undefined ? wallet_address : undefined,
        avatarUrl: avatar_url !== undefined ? avatar_url : undefined,
        userType: user_type !== undefined ? user_type : undefined,
      },
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
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform to snake_case for API compatibility
    return NextResponse.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedProfile.id,
        email: updatedProfile.email,
        full_name: updatedProfile.fullName,
        user_type: updatedProfile.userType,
        avatar_url: updatedProfile.avatarUrl,
        bio: updatedProfile.bio,
        country: updatedProfile.country,
        timezone: updatedProfile.timezone,
        wallet_address: updatedProfile.walletAddress,
        is_active: updatedProfile.isActive,
        email_verified: updatedProfile.emailVerified,
        created_at: updatedProfile.createdAt.toISOString(),
        updated_at: updatedProfile.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

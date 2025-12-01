// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateUUID } from '@/lib/prisma';
import { verifyPassword, generateToken, hashSessionToken, getTokenExpiration } from '@/lib/auth';

// Marker for wallet-only accounts (must match the one in wallet/route.ts)
const WALLET_ONLY_MARKER = 'WALLET_SSO_ACCOUNT';

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

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        fullName: true,
        userType: true,
        avatarUrl: true,
        isActive: true,
        walletAddress: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact support.' },
        { status: 403 }
      );
    }

    // Check if this is a wallet-only account
    if (user.passwordHash === WALLET_ONLY_MARKER) {
      return NextResponse.json(
        { error: 'This account uses wallet login. Please use the Wallet SSO option.' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      userType: user.userType,
    });

    // Store session in database
    const tokenHash = await hashSessionToken(token);
    const expiresAt = getTokenExpiration();
    const sessionId = generateUUID();

    try {
      await prisma.userSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          tokenHash,
          expiresAt,
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
          userAgent: request.headers.get('user-agent') || null,
        },
      });
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
    }

    // Set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        user_type: user.userType,
        avatar_url: user.avatarUrl,
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

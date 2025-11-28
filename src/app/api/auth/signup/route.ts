// src/app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateUUID, seedInitialSkills } from '@/lib/prisma';
import { hashPassword, generateToken, hashSessionToken, getTokenExpiration } from '@/lib/auth';
import { isValidUserType } from '@/lib/validation';

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

    // Validate user type if provided
    const userTypeValue = user_type || 'freelancer';
    if (!isValidUserType(userTypeValue)) {
      return NextResponse.json(
        { error: 'Invalid user type. Must be one of: client, freelancer, both' },
        { status: 400 }
      );
    }

    // Seed initial skills if needed
    await seedInitialSkills();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

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
    
    let user;
    try {
      user = await prisma.user.create({
        data: {
          id: userId,
          email,
          passwordHash: password_hash,
          fullName: full_name || null,
          userType: userTypeValue,
        },
      });
    } catch (createError) {
      console.error('User creation error:', createError);
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

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
    const response = NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.fullName,
          user_type: user.userType,
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

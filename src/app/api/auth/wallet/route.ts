// src/app/api/auth/wallet/route.ts
// Wallet-based SSO authentication endpoint for QI Network
import { NextRequest, NextResponse } from 'next/server';
import { prisma, generateUUID } from '@/lib/prisma';
import { generateToken, hashSessionToken, getTokenExpiration } from '@/lib/auth';
import { 
  generateNonce, 
  createSignMessage, 
  verifyWalletSignature, 
  isValidWalletAddress,
  normalizeAddress 
} from '@/lib/wallet-auth';

// Nonce storage using database for production-ready persistence
// Nonces are stored in memory for simplicity but cleared on verification
// For high-traffic production deployments, consider Redis or a dedicated nonce table
const nonceStore = new Map<string, { nonce: string; timestamp: number }>();
const NONCE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

// Cleanup expired nonces periodically
function cleanupExpiredNonces() {
  const now = Date.now();
  for (const [key, value] of nonceStore.entries()) {
    if (now - value.timestamp > NONCE_EXPIRY_MS) {
      nonceStore.delete(key);
    }
  }
}

// Marker for wallet-only accounts (no password authentication possible)
const WALLET_ONLY_MARKER = 'WALLET_SSO_ACCOUNT';

/**
 * GET /api/auth/wallet - Generate a nonce for wallet authentication
 * Query params: address - The wallet address requesting authentication
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!isValidWalletAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const normalizedAddress = normalizeAddress(address);
    
    // Generate a new nonce
    const nonce = generateNonce();
    const message = createSignMessage(nonce);

    // Store the nonce with timestamp (cleanup old ones first)
    cleanupExpiredNonces();
    nonceStore.set(normalizedAddress, { nonce, timestamp: Date.now() });

    return NextResponse.json({
      message,
      nonce,
    });
  } catch (error) {
    console.error('Wallet nonce generation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/wallet - Authenticate with wallet signature
 * Body: { address, signature, message, user_type? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { address, signature, message, user_type } = body;

    // Validate required fields
    if (!address || !signature || !message) {
      return NextResponse.json(
        { error: 'Address, signature, and message are required' },
        { status: 400 }
      );
    }

    if (!isValidWalletAddress(address)) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      );
    }

    const normalizedAddress = normalizeAddress(address);

    // Verify the nonce is valid and not expired
    const storedNonceData = nonceStore.get(normalizedAddress);
    if (!storedNonceData) {
      return NextResponse.json(
        { error: 'No authentication request found. Please request a new nonce.' },
        { status: 400 }
      );
    }

    const { timestamp } = storedNonceData;
    if (Date.now() - timestamp > NONCE_EXPIRY_MS) {
      nonceStore.delete(normalizedAddress);
      return NextResponse.json(
        { error: 'Authentication request expired. Please request a new nonce.' },
        { status: 400 }
      );
    }

    // Verify the signature
    const recoveredAddress = verifyWalletSignature(message, signature);
    if (!recoveredAddress) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Verify the recovered address matches the claimed address
    if (recoveredAddress !== normalizedAddress) {
      return NextResponse.json(
        { error: 'Signature does not match the provided address' },
        { status: 401 }
      );
    }

    // Clear the used nonce to prevent replay attacks
    nonceStore.delete(normalizedAddress);

    // Find or create user by wallet address
    let user = await prisma.user.findFirst({
      where: { 
        walletAddress: normalizedAddress 
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        userType: true,
        avatarUrl: true,
        isActive: true,
        walletAddress: true,
      },
    });

    let isNewUser = false;

    if (!user) {
      // Create a new user with the wallet address
      isNewUser = true;
      const userId = generateUUID();
      const userTypeValue = user_type || 'freelancer';
      
      // Generate a unique placeholder email using wallet address
      // Format: wallet_<first8chars>_<last4chars>@wallet.local
      const addressShort = `${normalizedAddress.slice(2, 10)}_${normalizedAddress.slice(-4)}`;
      const placeholderEmail = `wallet_${addressShort}@wallet.local`;

      user = await prisma.user.create({
        data: {
          id: userId,
          email: placeholderEmail,
          passwordHash: WALLET_ONLY_MARKER, // Marker for wallet-only accounts
          walletAddress: normalizedAddress,
          userType: userTypeValue,
          fullName: null,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          userType: true,
          avatarUrl: true,
          isActive: true,
          walletAddress: true,
        },
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { error: 'Account is disabled. Please contact support.' },
        { status: 403 }
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
      message: isNewUser ? 'Account created successfully' : 'Login successful',
      isNewUser,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        user_type: user.userType,
        avatar_url: user.avatarUrl,
        wallet_address: user.walletAddress,
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
    console.error('Wallet login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

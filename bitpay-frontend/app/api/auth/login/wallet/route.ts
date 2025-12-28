import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import { User } from '@/models';
import { generateToken } from '@/lib/auth/auth';
import { verifyWalletSignature } from '@/lib/auth/wallet-auth';
import { validateChallenge } from '@/lib/auth/challenge-store';

const walletLoginSchema = z.object({
  address: z.string().min(1, 'Wallet address is required'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
  publicKey: z.string().min(1, 'Public key is required'),
  walletType: z.literal('stacks'),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    
    // Validate input
    const result = walletLoginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error.issues[0].message 
        },
        { status: 400 }
      );
    }

    const { address, signature, message, publicKey, walletType } = result.data;

    // Validate challenge
    const isChallengeValid = await validateChallenge(address, message);
    if (!isChallengeValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired challenge' },
        { status: 401 }
      );
    }

    // Verify wallet signature and get correct network address
    const verificationResult = verifyWalletSignature({
      address,
      signature,
      message,
      publicKey,
      walletType,
    });

    if (!verificationResult.isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid wallet signature' },
        { status: 401 }
      );
    }

    // Use the network-specific address (testnet address if on testnet)
    const networkAddress = verificationResult.networkAddress;

    // Find user by wallet address (check both original and network address)
    let user = await User.findOne({ walletAddress: networkAddress });
    if (!user) {
      // Try the original address as fallback
      user = await User.findOne({ walletAddress: address });
    }
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Wallet not registered. Please sign up first.' },
        { status: 404 }
      );
    }

    // Update last login and public key (in case it changed)
    user.lastLoginAt = new Date();
    user.walletPublicKey = publicKey;
    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user._id!.toString(),
      email: user.email,
      name: user.name,
    });

    // Don't send sensitive data in response
    // Use networkAddress so the frontend has the correct testnet/mainnet address
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      walletAddress: networkAddress, // Use network-specific address
      walletType: user.walletType,
      profileComplete: user.profileComplete,
      lastLoginAt: user.lastLoginAt,
    };

    console.log('✅ Wallet user logged in successfully:', networkAddress);

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: 'Wallet login successful',
      user: userResponse,
      token, // Still include token for wallet auth compatibility
    });

    // Set auth cookie like reference design
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('❌ Wallet login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
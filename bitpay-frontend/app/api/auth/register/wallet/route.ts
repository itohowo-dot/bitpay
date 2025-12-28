import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectToDatabase from '@/lib/db';
import { User } from '@/models';
import { generateToken } from '@/lib/auth/auth';
import { verifyWalletSignature, generateDefaultUserData } from '@/lib/auth/wallet-auth';
import { validateChallenge } from '@/lib/auth/challenge-store';

const walletRegisterSchema = z.object({
  address: z.string().min(1, 'Wallet address is required'),
  signature: z.string().min(1, 'Signature is required'),
  message: z.string().min(1, 'Message is required'),
  publicKey: z.string().min(1, 'Public key is required'),
  walletType: z.literal('stacks'),
  businessName: z.string().optional(),
  businessType: z.string().optional(),
  email: z.string().email().optional(),
});

export async function POST(request: NextRequest) {
  try {
    await connectToDatabase();

    const body = await request.json();
    
    // Validate input
    const result = walletRegisterSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: result.error.issues[0].message 
        },
        { status: 400 }
      );
    }

    const { address, signature, message, publicKey, walletType, businessName, businessType, email } = result.data;

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

    // Check if wallet is already registered (check both network and original address)
    let existingUser = await User.findOne({ walletAddress: networkAddress });
    if (!existingUser) {
      existingUser = await User.findOne({ walletAddress: address });
    }
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'Wallet is already registered' },
        { status: 409 }
      );
    }

    // Check if email is already taken (if provided)
    if (email) {
      const existingEmailUser = await User.findOne({ email: email.toLowerCase() });
      if (existingEmailUser) {
        return NextResponse.json(
          { success: false, error: 'Email is already registered' },
          { status: 409 }
        );
      }
    }

    // Generate default user data if not provided (use network address)
    const defaultData = generateDefaultUserData(networkAddress);

    // Create user with network-specific address
    const user = new User({
      name: businessName || defaultData.name,
      email: email?.toLowerCase() || defaultData.email,
      walletAddress: networkAddress, // Use testnet address if on testnet
      walletPublicKey: publicKey,
      walletType,
      isEmailVerified: false, // Wallet users don't need email verification initially
      profileComplete: !!(businessName && businessType && email), // Complete if all details provided
    });

    await user.save();

    // Generate JWT token
    const token = generateToken({
      userId: user._id!.toString(),
      email: user.email,
      name: user.name,
    });

    // Don't send sensitive data in response
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      walletAddress: networkAddress, // Return network address to frontend
      walletType: user.walletType,
      profileComplete: user.profileComplete,
      createdAt: user.createdAt,
    };

    console.log('✅ Wallet user registered successfully:', networkAddress);

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      message: 'Wallet registration successful',
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
    console.error('❌ Wallet registration error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
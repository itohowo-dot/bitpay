import { NextRequest, NextResponse } from "next/server";
import { turnkeyServer, getUserSubOrg, getSubOrgWallets } from "@/lib/turnkey-server";
import connectDB from "@/lib/db";
import User from "@/models/User";

/**
 * POST /api/auth/turnkey
 * Link a Turnkey wallet to a BitPay user account
 *
 * This endpoint is called after successful Turnkey authentication
 * to create or link the user in our database
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { subOrgId, email, walletAddress } = body;

    if (!subOrgId || !walletAddress) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify the sub-organization exists in Turnkey
    try {
      const subOrg = await getUserSubOrg(subOrgId);
      console.log("✅ Verified Turnkey sub-org:", subOrg.subOrganizationId);
    } catch (error) {
      console.error("❌ Failed to verify sub-org:", error);
      return NextResponse.json(
        { success: false, error: "Invalid Turnkey sub-organization" },
        { status: 401 }
      );
    }

    // Get or create user in database
    let user = await User.findOne({
      $or: [
        { turnkeySubOrgId: subOrgId },
        { email: email },
        { walletAddress: walletAddress }
      ]
    });

    if (user) {
      // Update existing user with Turnkey info
      user.turnkeySubOrgId = subOrgId;
      user.walletAddress = walletAddress;
      if (email && !user.email) {
        user.email = email;
      }
      await user.save();
      console.log("✅ Updated existing user:", user._id);
    } else {
      // Create new user
      user = await User.create({
        email: email || `${walletAddress.slice(0, 8)}@bitpay.app`,
        walletAddress,
        turnkeySubOrgId: subOrgId,
        role: "user",
        emailVerified: !!email, // If email was provided via OAuth, mark as verified
      });
      console.log("✅ Created new user:", user._id);
    }

    // Return success with user data
    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error in Turnkey auth:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/turnkey?subOrgId=xxx
 * Get user info by Turnkey sub-org ID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const subOrgId = searchParams.get("subOrgId");

    if (!subOrgId) {
      return NextResponse.json(
        { success: false, error: "Missing subOrgId" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ turnkeySubOrgId: subOrgId });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        walletAddress: user.walletAddress,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error fetching Turnkey user:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

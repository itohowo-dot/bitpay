/**
 * GET /api/health
 * System health check endpoint for monitoring and debugging
 */

import { NextResponse } from 'next/server';
import { clientPromise } from '@/lib/db';
import { verifyEmailConfig } from '@/lib/email/email-service';
import { STACKS_API_URL, getStacksNetwork } from '@/lib/contracts/config';

export async function GET() {
  const checks: Record<string, any> = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  };

  // Check Blockchain Connection
  try {
    const network = getStacksNetwork();
    const response = await fetch(`${STACKS_API_URL}/v2/info`, {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data = await response.json();
      checks.blockchain = {
        connected: true,
        network: process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet',
        blockHeight: data.stacks_tip_height,
        apiUrl: STACKS_API_URL,
      };
    } else {
      checks.blockchain = {
        connected: false,
        error: `HTTP ${response.status}`,
      };
      checks.status = 'degraded';
    }
  } catch (error) {
    checks.blockchain = {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
    checks.status = 'degraded';
  }

  // Check Database Connection
  try {
    const client = await clientPromise;
    const db = client.db();

    // Ping database
    await db.admin().ping();

    checks.database = {
      connected: true,
      type: 'MongoDB',
    };
  } catch (error) {
    checks.database = {
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
    checks.status = 'degraded';
  }

  // Check Email Service
  try {
    const emailConfigured = await verifyEmailConfig();
    checks.email = {
      configured: emailConfigured,
      provider: process.env.SMTP_HOST || 'Not configured',
    };

    if (!emailConfigured) {
      checks.status = 'degraded';
    }
  } catch (error) {
    checks.email = {
      configured: false,
      error: error instanceof Error ? error.message : 'Verification failed',
    };
    checks.status = 'degraded';
  }

  // Check Environment Variables
  const requiredEnvVars = [
    'MONGODB_URI',
    'NEXT_PUBLIC_STACKS_NETWORK',
    'NEXT_PUBLIC_BITPAY_DEPLOYER_ADDRESS',
    'CHAINHOOK_SECRET_TOKEN',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  checks.environment_variables = {
    allConfigured: missingEnvVars.length === 0,
    missing: missingEnvVars.length > 0 ? missingEnvVars : undefined,
  };

  if (missingEnvVars.length > 0) {
    checks.status = 'degraded';
  }

  // Chainhook Configuration
  checks.chainhooks = {
    configured: !!process.env.CHAINHOOK_SECRET_TOKEN,
    endpoints: [
      '/api/webhooks/chainhook/streams',
      '/api/webhooks/chainhook/marketplace',
      '/api/webhooks/chainhook/treasury',
      '/api/webhooks/chainhook/access-control',
      '/api/webhooks/chainhook/nft',
    ],
  };

  // Contract Configuration
  checks.contracts = {
    deployer: process.env.NEXT_PUBLIC_BITPAY_DEPLOYER_ADDRESS || 'Not configured',
    network: process.env.NEXT_PUBLIC_STACKS_NETWORK || 'testnet',
    contracts: [
      'bitpay-core-v2',
      'bitpay-treasury-v2',
      'bitpay-marketplace-v2',
      'bitpay-nft-v2',
      'bitpay-obligation-nft-v2',
      'bitpay-access-control-v2',
      'bitpay-sbtc-helper-v2',
    ],
  };

  // Return appropriate status code
  const statusCode = checks.status === 'healthy' ? 200 : 503;

  return NextResponse.json(checks, { status: statusCode });
}

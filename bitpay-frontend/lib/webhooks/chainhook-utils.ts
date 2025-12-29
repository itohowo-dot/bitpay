/**
 * Shared utilities for Chainhook webhook processing
 */

import { NextResponse } from 'next/server';
import type {
  ChainhookPayload,
  ChainhookBlock,
  ChainhookTransaction,
  ChainhookEvent,
  WebhookContext,
  ProcessedWebhookResult,
} from '@/types/chainhook';

/**
 * Verify the authorization header from Chainhook webhook
 */
export function verifyWebhookAuth(request: Request): {
  valid: boolean;
  error?: string;
} {
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.CHAINHOOK_SECRET_TOKEN;

  if (!expectedToken) {
    console.error('❌ CHAINHOOK_SECRET_TOKEN not configured');
    return {
      valid: false,
      error: 'Webhook not configured',
    };
  }

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    console.error('❌ Invalid authorization token');
    return {
      valid: false,
      error: 'Unauthorized',
    };
  }

  return { valid: true };
}

/**
 * Create standardized error response
 */
export function errorResponse(error: string, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    { status }
  );
}

/**
 * Create standardized success response
 */
export function successResponse(data: ProcessedWebhookResult) {
  return NextResponse.json(data);
}

/**
 * Extract webhook context from transaction and block
 */
export function getWebhookContext(
  tx: ChainhookTransaction,
  block: ChainhookBlock
): WebhookContext {
  return {
    txHash: tx.transaction_identifier.hash,
    blockHeight: block.block_identifier.index,
    blockHash: block.block_identifier.hash,
    timestamp: block.timestamp,
    sender: tx.metadata.sender,
    contractIdentifier: '', // Will be filled from event data
  };
}

/**
 * Extract print events from a transaction
 */
export function extractPrintEvents(tx: ChainhookTransaction): ChainhookEvent[] {
  const events = tx.metadata.events || tx.metadata.receipt?.events || [];
  return events.filter((event) => event.type === 'print_event');
}

/**
 * Parse event data from Chainhook event
 * Handles both decoded Clarity values and raw format
 */
export function parseEventData<T>(event: ChainhookEvent): T | null {
  try {
    const eventData = event.data.value;

    // If Chainhook decoded Clarity values, the data is already structured
    if (typeof eventData === 'object' && eventData !== null) {
      return eventData as T;
    }

    // Otherwise, try to parse as JSON
    if (typeof eventData === 'string') {
      return JSON.parse(eventData) as T;
    }

    return null;
  } catch (error) {
    console.error('Failed to parse event data:', error);
    return null;
  }
}

/**
 * Convert Clarity bigint values to strings for JSON serialization
 */
export function normalizeBigIntValues<T extends Record<string, any>>(
  obj: T
): Record<string, any> {
  const normalized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'bigint') {
      normalized[key] = value.toString();
    } else if (typeof value === 'number') {
      normalized[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      normalized[key] = normalizeBigIntValues(value);
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
}

/**
 * Log structured webhook event for debugging
 */
export function logWebhookEvent(
  eventType: string,
  data: any,
  context: WebhookContext
) {
  console.log(`📢 [${eventType}]`, {
    event: eventType,
    txHash: context.txHash,
    blockHeight: context.blockHeight,
    timestamp: new Date(context.timestamp * 1000).toISOString(),
    data: normalizeBigIntValues(data),
  });
}

/**
 * Handle blockchain reorganization
 * Mark transactions as rolled back and notify relevant systems
 */
export async function handleReorg(
  blocks: ChainhookBlock[]
): Promise<ProcessedWebhookResult> {
  const errors: string[] = [];
  let processed = 0;

  for (const block of blocks) {
    console.warn(`🔄 Rolling back block ${block.block_identifier.index}`);

    try {
      // TODO: Implement database rollback logic
      // 1. Find all transactions from this block
      // 2. Mark them as "rolled_back" status
      // 3. Revert any state changes (stream withdrawals, marketplace sales, etc.)
      // 4. Send notifications to affected users

      processed++;
    } catch (error) {
      const errorMsg = `Failed to rollback block ${block.block_identifier.index}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return {
    success: errors.length === 0,
    eventType: 'reorg',
    processed,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Validate webhook payload structure
 */
export function validatePayload(payload: any): payload is ChainhookPayload {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  if (!Array.isArray(payload.apply) && !Array.isArray(payload.rollback)) {
    return false;
  }

  if (!payload.chainhook || !payload.chainhook.uuid) {
    return false;
  }

  return true;
}

/**
 * Rate limiting helper (simple in-memory implementation)
 * For production, use Redis or similar
 */
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  check(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get existing requests for this identifier
    let requests = this.requests.get(identifier) || [];

    // Filter out old requests
    requests = requests.filter((timestamp) => timestamp > windowStart);

    // Check if limit exceeded
    if (requests.length >= this.maxRequests) {
      return false;
    }

    // Add current request
    requests.push(now);
    this.requests.set(identifier, requests);

    return true;
  }

  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
}

export const webhookRateLimiter = new RateLimiter(
  parseInt(process.env.WEBHOOK_RATE_LIMIT_MAX || '100'),
  parseInt(process.env.WEBHOOK_RATE_LIMIT_WINDOW_MS || '60000')
);

/**
 * Retry helper for failed database operations
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(
        `Operation failed (attempt ${attempt}/${maxRetries}):`,
        error
      );

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw lastError || new Error('Operation failed after retries');
}

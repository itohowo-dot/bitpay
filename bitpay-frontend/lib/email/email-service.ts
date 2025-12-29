/**
 * Email service using Nodemailer with EJS templates
 * Handles all transactional emails for BitPay platform
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import ejs from 'ejs';
import path from 'path';
import fs from 'fs';

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
};

const FROM_EMAIL = process.env.FROM_EMAIL || 'notifications@bitpay.app';
const FROM_NAME = process.env.FROM_NAME || 'BitPay';

// Singleton transporter
let transporter: Transporter | null = null;

/**
 * Get or create email transporter
 */
function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(EMAIL_CONFIG);
  }
  return transporter;
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transport = getTransporter();
    await transport.verify();
    console.log('✅ Email service is ready');
    return true;
  } catch (error) {
    console.error('❌ Email service verification failed:', error);
    return false;
  }
}

/**
 * Render EJS template
 */
async function renderTemplate(
  templateName: string,
  data: Record<string, any>
): Promise<string> {
  const templatePath = path.join(
    process.cwd(),
    'lib',
    'email',
    'templates',
    `${templateName}.ejs`
  );

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templateName}`);
  }

  return ejs.renderFile(templatePath, {
    ...data,
    year: new Date().getFullYear(),
    appName: 'BitPay',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  });
}

/**
 * Send email with template
 */
async function sendTemplateEmail(
  to: string,
  subject: string,
  templateName: string,
  data: Record<string, any>
): Promise<boolean> {
  try {
    const html = await renderTemplate(templateName, data);
    const transport = getTransporter();

    const info = await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });

    console.log('✅ Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
}

// ============================================================================
// Specific Email Functions
// ============================================================================

/**
 * Send stream created notification to recipient
 */
export async function sendStreamCreatedEmail(
  to: string,
  data: {
    recipientAddress: string;
    senderAddress: string;
    amount: string;
    startBlock: string;
    endBlock: string;
    streamId: string;
    txHash: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '💰 New Payment Stream Received',
    'stream-created',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/streams/${data.streamId}`,
    }
  );
}

/**
 * Send withdrawal notification
 */
export async function sendStreamWithdrawalEmail(
  to: string,
  data: {
    recipientAddress: string;
    amount: string;
    streamId: string;
    remainingAmount: string;
    txHash: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '✅ Stream Withdrawal Successful',
    'stream-withdrawal',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/streams/${data.streamId}`,
    }
  );
}

/**
 * Send stream cancelled notification
 */
export async function sendStreamCancelledEmail(
  to: string,
  data: {
    recipientAddress: string;
    senderAddress: string;
    streamId: string;
    vestedPaid: string;
    unvestedReturned: string;
    txHash: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '⚠️ Payment Stream Cancelled',
    'stream-cancelled',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/streams/${data.streamId}`,
    }
  );
}

/**
 * Send purchase completed notification to buyer
 */
export async function sendPurchaseCompletedEmail(
  to: string,
  data: {
    buyerAddress: string;
    sellerAddress: string;
    streamId: string;
    price: string;
    marketplaceFee: string;
    netAmount: string;
    saleId: string;
    txHash: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '🎉 Purchase Completed Successfully',
    'purchase-completed',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/streams/${data.streamId}`,
    }
  );
}

/**
 * Send sale notification to seller
 */
export async function sendSaleCompletedEmail(
  to: string,
  data: {
    sellerAddress: string;
    buyerAddress: string;
    streamId: string;
    price: string;
    marketplaceFee: string;
    netAmount: string;
    saleId: string;
    txHash: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '💸 Your Stream Has Been Sold',
    'sale-completed',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/marketplace/sales`,
    }
  );
}

/**
 * Send payment link for gateway purchase
 */
export async function sendPaymentLinkEmail(
  to: string,
  data: {
    buyerAddress: string;
    streamId: string;
    price: string;
    paymentUrl: string;
    expiresAt: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '🔗 Complete Your Purchase',
    'payment-link',
    data
  );
}

/**
 * Send withdrawal proposal notification to admins
 */
export async function sendWithdrawalProposalEmail(
  to: string,
  data: {
    proposalId: string;
    recipient: string;
    amount: string;
    proposedBy: string;
    timelockExpires: string;
    requiredApprovals: number;
    currentApprovals: number;
    txHash: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '🏦 New Withdrawal Proposal Requires Approval',
    'withdrawal-proposal',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/treasury`,
    }
  );
}

/**
 * Send withdrawal approved notification
 */
export async function sendWithdrawalApprovedEmail(
  to: string,
  data: {
    proposalId: string;
    approver: string;
    currentApprovals: number;
    requiredApprovals: number;
    canExecute: boolean;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '✅ Withdrawal Proposal Approved',
    'withdrawal-approved',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/treasury`,
    }
  );
}

/**
 * Send withdrawal executed notification
 */
export async function sendWithdrawalExecutedEmail(
  to: string,
  data: {
    proposalId: string;
    recipient: string;
    amount: string;
    txHash: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '💸 Withdrawal Executed Successfully',
    'withdrawal-executed',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/treasury`,
    }
  );
}

/**
 * Send security alert
 */
export async function sendSecurityAlertEmail(
  to: string,
  data: {
    alertType: string;
    alertMessage: string;
    timestamp: string;
    action: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '🚨 Security Alert - Action Required',
    'security-alert',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/security`,
    }
  );
}

/**
 * Send protocol paused alert
 */
export async function sendProtocolPausedEmail(
  to: string,
  data: {
    pausedBy: string;
    pausedAt: string;
    reason?: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '⚠️ Protocol Paused - Emergency Alert',
    'protocol-paused',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }
  );
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  to: string,
  data: {
    userAddress: string;
    userName?: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '👋 Welcome to BitPay',
    'welcome',
    {
      ...data,
      dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      docsUrl: `${process.env.NEXT_PUBLIC_APP_URL}/docs`,
    }
  );
}

/**
 * Send email verification
 */
export async function sendEmailVerificationEmail(
  to: string,
  data: {
    userAddress: string;
    verificationToken: string;
  }
): Promise<boolean> {
  return sendTemplateEmail(
    to,
    '✉️ Verify Your Email Address',
    'email-verification',
    {
      ...data,
      verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify-email?token=${data.verificationToken}`,
    }
  );
}

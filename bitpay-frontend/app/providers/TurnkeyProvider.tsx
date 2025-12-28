"use client";

import { ReactNode } from "react";
import {
  TurnkeyProvider as BaseTurnkeyProvider,
  TurnkeyProviderConfig,
  CreateSubOrgParams,
} from "@turnkey/react-wallet-kit";
import { toast } from "sonner";

// Stacks wallet configuration for sub-organizations
const stacksWalletConfig: CreateSubOrgParams = {
  customWallet: {
    walletName: "BitPay Wallet",
    walletAccounts: [
      {
        // Stacks uses secp256k1 curve
        addressFormat: "ADDRESS_FORMAT_UNCOMPRESSED",
        curve: "CURVE_SECP256K1",
        pathFormat: "PATH_FORMAT_BIP32",
        // Stacks BIP44 path: m/44'/5757'/0'/0/0
        path: "m/44'/5757'/0'/0/0",
      },
    ],
  },
};

const turnkeyConfig: TurnkeyProviderConfig = {
  // API Configuration
  apiBaseUrl: process.env.NEXT_PUBLIC_TURNKEY_API_BASE_URL || "https://api.turnkey.com",
  authProxyUrl: process.env.NEXT_PUBLIC_TURNKEY_AUTH_PROXY_URL || "https://authproxy.turnkey.com",
  authProxyConfigId: process.env.NEXT_PUBLIC_TURNKEY_AUTH_PROXY_ID!,
  organizationId: process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID!,

  // Iframe URLs for import/export
  importIframeUrl: process.env.NEXT_PUBLIC_TURNKEY_IMPORT_IFRAME_URL || "https://import.turnkey.com",
  exportIframeUrl: process.env.NEXT_PUBLIC_TURNKEY_EXPORT_IFRAME_URL || "https://export.turnkey.com",

  // Authentication configuration
  auth: {
    // Enable authentication methods
    methods: {
      emailOtpAuthEnabled: true,
      passkeyAuthEnabled: true,
      walletAuthEnabled: true,
      googleOauthEnabled: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      smsOtpAuthEnabled: false,
      appleOauthEnabled: false,
      facebookOauthEnabled: false,
      xOauthEnabled: false,
      discordOauthEnabled: false,
    },

    // Order of authentication methods in UI
    methodOrder: ["socials", "email", "passkey", "wallet"],
    oauthOrder: ["google"],

    // OAuth configuration
    oauthConfig: {
      googleClientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      oauthRedirectUri: process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI,
      openOauthInPage: true, // Open OAuth in same page instead of popup
    },

    // Auto refresh session before expiration
    autoRefreshSession: true,

    // Sub-organization parameters for each auth method
    // This creates a Stacks wallet for each user
    createSuborgParams: {
      emailOtpAuth: stacksWalletConfig,
      passkeyAuth: {
        ...stacksWalletConfig,
        passkeyName: "BitPay Passkey",
      },
      walletAuth: stacksWalletConfig,
      oauth: stacksWalletConfig,
    },
  },

  // UI customization to match BitPay design
  ui: {
    darkMode: true,

    // Custom colors matching BitPay design
    colors: {
      dark: {
        // Primary pink color
        primary: "#da14c3",
        primaryText: "#ffffff",

        // Modal background
        modalBackground: "#0a0a0a",
        modalText: "#ffffff",

        // Button color
        button: "#da14c3",

        // Icon styling
        iconBackground: "#1a1a1a",
        iconText: "#ffffff",

        // Status colors
        success: "#22c55e",
        successText: "#ffffff",
        danger: "#ef4444",
        dangerText: "#ffffff",
      },
    },

    // Border radius - less rounded for cleaner look
    borderRadius: 8,

    // Background blur
    backgroundBlur: 10,

    // Render in provider
    renderModalInProvider: true,
  },
};

interface TurnkeyProviderProps {
  children: ReactNode;
}

export function TurnkeyProvider({ children }: TurnkeyProviderProps) {
  // Error handling callback
  const handleError = (error: any) => {
    console.error("Turnkey Error:", error);

    // Show user-friendly error message
    const errorMessage = error?.message || "An authentication error occurred";
    toast.error(errorMessage);
  };

  // Authentication success callback
  const handleAuthSuccess = (params: any) => {
    console.log("✅ Authentication successful:", params);
    toast.success("Successfully logged in!");
  };

  return (
    <BaseTurnkeyProvider
      config={turnkeyConfig}
      callbacks={{
        onError: handleError,
        onAuthenticationSuccess: handleAuthSuccess,
      }}
    >
      {children}
    </BaseTurnkeyProvider>
  );
}

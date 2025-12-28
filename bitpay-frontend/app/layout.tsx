import type { Metadata } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/lib/theme-provider";
import { Toaster } from "sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";
import { TurnkeyProvider } from "@/app/providers/TurnkeyProvider";
import "@turnkey/react-wallet-kit/styles.css";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "BitPay - Stream Bitcoin Continuously",
  description: "Create continuous streams of Bitcoin payments using sBTC. Built on Stacks for secure, programmable money flows.",
  keywords: "Bitcoin, sBTC, Stacks, streaming payments, cryptocurrency, DeFi",
  authors: [{ name: "BitPay Team" }],
  openGraph: {
    title: "BitPay - Stream Bitcoin Continuously",
    description: "Create continuous streams of Bitcoin payments using sBTC. Built on Stacks for secure, programmable money flows.",
    type: "website",
    url: "https://bitpay.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "BitPay - Stream Bitcoin Continuously",
    description: "Create continuous streams of Bitcoin payments using sBTC. Built on Stacks for secure, programmable money flows.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TurnkeyProvider>
            <AuthProvider>
              <ConditionalLayout>
                {children}
              </ConditionalLayout>
              <Toaster
                position="top-right"
                expand={true}
                richColors
                closeButton
                toastOptions={{
                  duration: 5000,
                  style: {
                    background: 'hsl(var(--background))',
                    color: 'hsl(var(--foreground))',
                    border: '1px solid hsl(var(--border))',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
                    backdropFilter: 'blur(10px)',
                  },
                  className: 'sonner-toast',
                }}
              />
            </AuthProvider>
          </TurnkeyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

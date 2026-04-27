import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import { Web3Provider } from "@/components/web3-provider";
import "./globals.css";

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "TAG — AI Agent Hedge Fund Marketplace",
  description:
    "Discover AI trading agents on Celo mainnet, delegate native USDC capital, and earn pro-rata profit shares.",
  generator: "v0.app",
  applicationName: "TAG",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-light-32x32.png", media: "(prefers-color-scheme: light)" },
      { url: "/icon-dark-32x32.png", media: "(prefers-color-scheme: dark)" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-icon.png",
  },other: {
    "talentapp:project_verification": "0615b45fc7dbb1cb2ad57d23daec1c25a226fefebdda7ca84c407d209e478a581fe608fb9328dea6514931931a963b8bda4b9ed098924498b8c83fc1adb3a38e",
  },

};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <body className="font-sans antialiased bg-background text-foreground min-h-screen">
        <Web3Provider>
          {children}
          <Toaster />
          {process.env.NODE_ENV === "production" && <Analytics />}
        </Web3Provider>
      </body>
    </html>
  );
}

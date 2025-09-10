import type { Metadata } from "next";
import { Shantell_Sans } from "next/font/google";
import "./globals.css";
import MiniAppReady from "@/components/MiniAppReady";

const shantellSans = Shantell_Sans({
  variable: "--font-shantell-sans",
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800'],
});

const APP_NAME = "OhSnap Scanner";
const APP_DESC = "Scan and explore Farcaster user data with OhSnap API";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://scan.ohsnap.it";

export const metadata: Metadata = {
  title: APP_NAME,
  description: APP_DESC,
  openGraph: {
    title: APP_NAME,
    description: APP_DESC,
    images: [
      {
        url: `${BASE_URL}/opengraph-image`,
        width: 1200,
        height: 800,
        alt: `${APP_NAME} Preview`,
      },
    ],
  },
  other: {
    // Farcaster Mini App Embed metadata
    "fc:miniapp": JSON.stringify({
      version: "1",
      imageUrl: `${BASE_URL}/opengraph-image`,
      button: {
        title: "Open OhSnap Scanner",
        action: {
          type: "launch_frame",
          name: APP_NAME,
          url: `${BASE_URL}`,
          splashImageUrl: `${BASE_URL}/logo.png`,
          splashBackgroundColor: "#0b0b0f",
        },
      },
    }),
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${shantellSans.variable} ${shantellSans.className} antialiased`}
        style={{backgroundColor: 'var(--background)', color: 'var(--foreground)', minHeight: '100vh'}}
      >
        {/* Signals readiness to Farcaster hosts (hides splash) */}
        <MiniAppReady />
        {children}
      </body>
    </html>
  );
}

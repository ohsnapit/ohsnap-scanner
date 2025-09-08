import type { Metadata } from "next";
import { Shantell_Sans } from "next/font/google";
import "./globals.css";

const shantellSans = Shantell_Sans({
  variable: "--font-shantell-sans",
  subsets: ["latin"],
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: "OhSnap Scanner",
  description: "Scan and explore Farcaster user data with OhSnap API",
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
        {children}
      </body>
    </html>
  );
}

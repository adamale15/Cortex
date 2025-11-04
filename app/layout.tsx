import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const spaceGrotesk = Space_Grotesk({ 
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "Cortex",
  description: "Universal learning app with AI context that records everything and helps you learn",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${spaceGrotesk.variable} ${spaceGrotesk.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


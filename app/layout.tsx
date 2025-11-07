import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({ 
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-inter",
  display: 'swap',
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
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} ${inter.className} font-normal`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}


import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/app-context";
import { Toaster } from "sonner";
import { NavProvider } from "@/components/nav-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  applicationName: "FodiFood Delivery",
  title: "FodiFood Delivery | Gdańsk",
  description: "Fast food delivery: sushi, wok, ramen in Gdańsk, Sopot, Gdynia",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FodiFood",
    startupImage: [
      {
        url: "/icons/icon-512.png",
        media: "(device-width: 428px) and (device-height: 926px)",
      },
    ],
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider>
          {children}
          <NavProvider />
          <Toaster position="top-center" richColors />
        </AppProvider>
      </body>
    </html>
  );
}

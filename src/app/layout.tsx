import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { QueryProvider } from "@/components/providers/query-provider";
import { ServiceWorkerRegister } from "@/components/providers/sw-register";
import { OfflineBanner } from "@/components/providers/offline-banner";

const hind = Hind_Siliguri({
  variable: "--font-hind",
  subsets: ["bengali", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ইসমা গুড়া মসলা প্রাইভেট লিমিটেড",
  description: "গুণগত মান, বিশ্বাস আমাদের — মসলা ব্যবসা ব্যবস্থাপনা অ্যাপ",
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }, { url: "/logo.png", type: "image/png" }],
    apple: "/logo.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#1B5E20",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="bn" suppressHydrationWarning>
      <body
        className={`${hind.variable} antialiased bg-background text-foreground`}
      >
        <QueryProvider>
          <OfflineBanner />
          {children}
          <Toaster />
          <SonnerToaster position="top-center" richColors />
          <ServiceWorkerRegister />
        </QueryProvider>
      </body>
    </html>
  );
}

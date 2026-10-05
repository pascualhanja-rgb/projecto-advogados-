import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/lib/auth";
import { CallNotificationProvider } from "@/components/CallNotification";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kizua Legal — Advogados ao seu alcance",
  description:
    "Plataforma angolana que conecta clientes a advogados verificados por categoria: Bronze, Prata, Ouro e Black.",
  applicationName: "Kizua Legal",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Kizua Legal",
  },
  icons: {
    icon: [
      { url: "/icon.ico", sizes: "48x48" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/icon-180.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0F172A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <AuthProvider>
          <CallNotificationProvider>{children}</CallNotificationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

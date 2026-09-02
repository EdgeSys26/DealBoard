import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist } from "next/font/google";
import "./globals.css";
import { RegisterSW } from "@/components/RegisterSW";
import { AppChrome } from "@/components/AppChrome";
import { ThemeInit } from "@/components/ThemeInit";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Deal Board",
  description:
    "Wholesale assignment marketplace for cash buyers and wholesalers. Independent of Frontburner and Edge.Sys.",
  appleWebApp: {
    capable: true,
    title: "Deal Board",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192.png",
  },
};

export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  themeColor: "#1A4DFF",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = (await cookies()).get("dealboard-theme")?.value;
  return (
    <html lang="en" className={theme === "dark" ? "dark" : undefined} suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('dealboard-theme');if(t==='dark')document.documentElement.classList.add('dark');if(t==='light')document.documentElement.classList.remove('dark')}catch(e){}`,
          }}
        />
        <ThemeInit />
        <RegisterSW />
        <div className="phone-shell">
          <AppChrome>{children}</AppChrome>
        </div>
      </body>
    </html>
  );
}

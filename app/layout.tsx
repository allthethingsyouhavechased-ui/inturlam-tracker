import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { SidebarMobileProvider } from "@/components/SidebarMobileContext";
import SidebarMobileFrame from "@/components/SidebarMobileFrame";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "İNTURLAM · İş Takip",
  description: "İNTURLAM marka içerik ve görev takip aracı",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="tr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <SidebarMobileProvider>
          <Header />
          <div className="flex">
            <SidebarMobileFrame>
              <Sidebar />
            </SidebarMobileFrame>
            <main className="min-w-0 flex-1 px-4 py-6 md:mx-auto md:max-w-5xl">
              {children}
            </main>
          </div>
        </SidebarMobileProvider>
      </body>
    </html>
  );
}

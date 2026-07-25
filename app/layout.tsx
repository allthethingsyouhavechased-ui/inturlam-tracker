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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-zinc-50 font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        {/* Sayfa boyanmadan önce `.dark` class'ını uygula — tema seçimi
            localStorage'da, yoksa OS tercihi. Böylece koyu modda beyaz
            ekran parlaması (FOUC) olmaz. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}`,
          }}
        />
        <SidebarMobileProvider>
          <Header />
          <div className="flex">
            <SidebarMobileFrame>
              <Sidebar />
            </SidebarMobileFrame>
            <main className="min-w-0 flex-1">
              {/* 5xl (1024px) veri yoğun tablolar/panolar için dardı: 1920px
                  ekranda tablo sıkışırken sağ-sol boş kalıyordu. Uzun metin
                  okunan yerler (marka denetim metni, yorumlar) kendi içinde
                  max-w-3xl ile sınırlanıyor — satır uzunluğu bozulmasın. */}
              <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
            </main>
          </div>
        </SidebarMobileProvider>
      </body>
    </html>
  );
}

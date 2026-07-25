import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/SidebarContext";
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
        {/* Sayfa boyanmadan önce iki tercihi uygula (FOUC yok):
            - tema → `.dark` class'ı (localStorage, yoksa OS tercihi)
            - sidebar daraltması → `data-sidebar` özniteliği; genişliği
              globals.css bundan okuyor, React'i beklemez. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}try{if(localStorage.getItem('sidebar-collapsed')==='1'){document.documentElement.dataset.sidebar='collapsed'}}catch(e){}`,
          }}
        />
        <SidebarProvider>
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
        </SidebarProvider>
      </body>
    </html>
  );
}

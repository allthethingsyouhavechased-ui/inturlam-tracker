// Üst menüdeki bölüm linkleri. Hem masaüstü header'ı (components/NavLinks.tsx)
// hem de mobil off-canvas panel (components/Sidebar.tsx) buradan okur —
// header dar ekranda 7 linki sığdıramadığı için gizleniyor, linkler panele
// taşınıyor. Tek liste, iki yerde: yeni sayfa eklerken burayı güncellemek yeter.
export const MAIN_NAV = [
  { href: "/brands", label: "Markalar" },
  { href: "/tasks", label: "Görevler" },
  { href: "/calendar", label: "Takvim" },
  { href: "/social", label: "Sosyal" },
  { href: "/reports", label: "Raporlar" },
  { href: "/activity", label: "Aktivite" },
  { href: "/team", label: "Ekip" },
  { href: "/templates", label: "Şablonlar" },
  { href: "/panom", label: "Panom" },
] as const;

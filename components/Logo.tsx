// İNTURLAM amblemi — orijinal logo dosyası (`public/inturlam-logo.jpg`, 150×150,
// beyaz zemin üzerinde koyu gri çember + ikosahedron). Boyut className ile verilir
// (ör. "h-6 w-6").
//
// Neden `dark:invert`: kaynak dosya beyaz zeminli ve tek renk; koyu temada ters
// çevirince koyu zemin üzerinde açık amblem oluyor. `rounded-full` de kare beyaz
// köşeleri kırpıyor — amblem zaten daire, kayıp yok.
export default function Logo({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/inturlam-logo.jpg"
      alt="İNTURLAM"
      className={`${className ?? ""} rounded-full object-cover dark:invert`}
    />
  );
}

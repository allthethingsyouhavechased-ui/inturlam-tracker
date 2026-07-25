// Yorum göstergesi ikonu. Kart altında ve liste görünümünün "Yorum" sütununda
// aynı ikon kullanılsın diye ayrı dosyada — emoji yerine SVG, çünkü emoji
// işletim sistemine göre farklı boyut/hizada çiziliyor ve metin satırını kaydırıyor.
export default function CommentIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={`${className} shrink-0 fill-current`}>
      <path d="M8 1.5c-3.9 0-7 2.4-7 5.4 0 1.7 1 3.2 2.6 4.2-.1.8-.5 1.7-1.2 2.5 1.4-.2 2.6-.8 3.4-1.5.7.2 1.4.3 2.2.3 3.9 0 7-2.4 7-5.5S11.9 1.5 8 1.5Z" />
    </svg>
  );
}

// İNTURLAM markası: çember içinde faceted (ikosahedron/geodezik) geometrik amblem.
// `currentColor` ile çizildiği için bulunduğu yerin metin rengini alır → açık/koyu
// temaya otomatik uyar. Boyutu className (ör. "h-6 w-6") ile verilir.
export default function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeLinejoin="round"
      strokeLinecap="round"
      className={className}
      role="img"
      aria-label="İNTURLAM"
    >
      {/* dış çember */}
      <circle cx="50" cy="50" r="46" strokeWidth="3" />

      {/* dış beşgen (siluet) */}
      <path
        strokeWidth="2.4"
        d="M50 16 L82.3 39.5 L70 77.5 L30 77.5 L17.7 39.5 Z"
      />
      {/* iç beşgen */}
      <path
        strokeWidth="2.4"
        d="M58.8 37.9 L64.3 54.6 L50 65 L35.7 54.6 L41.2 37.9 Z"
      />
      {/* merkez ışınları (iç pinwheel) */}
      <path
        strokeWidth="2.4"
        d="M50 50 L58.8 37.9 M50 50 L64.3 54.6 M50 50 L50 65 M50 50 L35.7 54.6 M50 50 L41.2 37.9"
      />
      {/* dış köşeleri iç beşgene bağlayan üçgen halka */}
      <path
        strokeWidth="2.4"
        d="M50 16 L41.2 37.9 M50 16 L58.8 37.9 M82.3 39.5 L58.8 37.9 M82.3 39.5 L64.3 54.6 M70 77.5 L64.3 54.6 M70 77.5 L50 65 M30 77.5 L50 65 M30 77.5 L35.7 54.6 M17.7 39.5 L35.7 54.6 M17.7 39.5 L41.2 37.9"
      />
    </svg>
  );
}

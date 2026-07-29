import { hashColor } from "@/lib/colorHash";

// Tek kelimelik isimlerde (Emrullah/Erhan/Ekin gibi) sadece ilk harfi almak
// aynı harfle başlayan kişileri ayırt edilemez kılıyordu — bu durumda ilk 2
// harfi kullan. Birden fazla kelimeli isimlerde (Yunus Emre → "YE") her
// kelimenin ilk harfi yeterince ayırt edici, o davranış aynen kalıyor.
function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return parts
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("");
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export default function PersonAvatar({
  name,
  size = "sm",
}: {
  name: string;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const sizeClass = {
    xs: "h-5 w-5 text-[10px]",
    sm: "h-6 w-6 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  }[size];
  return (
    <span
      title={name}
      className={`inline-flex ${sizeClass} shrink-0 items-center justify-center rounded-full font-semibold ${hashColor(name)}`}
    >
      {initialsOf(name)}
    </span>
  );
}

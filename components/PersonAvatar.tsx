import Image from "next/image";
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
  avatarPath = null,
  size = "sm",
}: {
  name: string;
  avatarPath?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}) {
  const sizeClass = {
    xs: "h-5 w-5 text-[10px]",
    sm: "h-6 w-6 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
    xl: "h-20 w-20 text-xl",
  }[size];
  const imageSizes = {
    xs: "20px",
    sm: "24px",
    md: "36px",
    lg: "48px",
    xl: "80px",
  }[size];
  return (
    <span
      title={name}
      className={`relative inline-flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${hashColor(name)}`}
    >
      {avatarPath ? (
        <Image src={avatarPath} alt={name} fill sizes={imageSizes} className="object-cover" />
      ) : (
        initialsOf(name)
      )}
    </span>
  );
}

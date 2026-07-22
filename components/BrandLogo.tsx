const SIZE_CLASS = {
  sm: "h-7 w-7 text-xs",
  lg: "h-16 w-16 text-xl",
} as const;

export default function BrandLogo({
  name,
  logoPath,
  size = "sm",
}: {
  name: string;
  logoPath: string | null;
  size?: "sm" | "lg";
}) {
  const sizeClass = SIZE_CLASS[size];
  if (logoPath) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoPath}
        alt={name}
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-1 ring-black/10 dark:ring-white/10`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300`}
      aria-hidden
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

// Server action'lardan fırlatılan hataları form'larda gösterilebilir bir
// metne çevirir. Server Component'lerden fırlatılan hatalar production'da
// generic bir mesaja indirgenir (Next.js hassas detay sızdırmasın diye) —
// bu yüzden burada da genel bir yedek mesaj tutuyoruz.
export function getActionErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Bir şeyler ters gitti, tekrar dene.";
}

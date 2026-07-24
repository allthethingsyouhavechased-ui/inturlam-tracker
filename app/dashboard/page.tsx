import { redirect } from "next/navigation";

// Panom artık "/panom"da yaşıyor. Eski /dashboard linkleri kırılmasın diye
// buradan yönlendiriyoruz.
export default function DashboardRedirect() {
  redirect("/panom");
}

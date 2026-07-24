import { redirect } from "next/navigation";

// Panom artık ana sayfa ("/"). Eski /dashboard linkleri kırılmasın diye
// buradan yönlendiriyoruz.
export default function DashboardRedirect() {
  redirect("/");
}

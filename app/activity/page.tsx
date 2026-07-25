import ActivityFeed from "@/components/ActivityFeed";
import AutoRefresh from "@/components/AutoRefresh";
import { listRecentActivity } from "@/lib/repositories/activity";

export const dynamic = "force-dynamic";

export default function ActivityPage() {
  const entries = listRecentActivity(150);

  return (
    <div className="space-y-4">
      <AutoRefresh />
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Aktivite</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Portföydeki tüm hareketler — en yeni en üstte (son 150 kayıt).
        </p>
      </div>

      <div className="rounded-xl border border-black/10 bg-white p-2 dark:border-white/10 dark:bg-zinc-900">
        <ActivityFeed
          entries={entries}
          emptyText="Henüz kayıtlı hareket yok. Bir görev oluştur, durum değiştir ya da yorum yaz — burada görünecek."
        />
      </div>
    </div>
  );
}

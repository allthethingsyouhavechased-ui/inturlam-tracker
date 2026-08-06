import ActivitySearch from "@/components/ActivitySearch";
import AutoRefresh from "@/components/AutoRefresh";
import { listRecentActivity } from "@/lib/repositories/activity";

export const dynamic = "force-dynamic";

export default function ActivityPage() {
  const entries = listRecentActivity(150);

  return (
    <div className="space-y-4">
      <AutoRefresh />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Aktivite</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Portföydeki tüm hareketler — en yeni en üstte (son 150 kayıt).
        </p>
      </div>

      <ActivitySearch entries={entries} />
    </div>
  );
}

import AutoRefresh from "@/components/AutoRefresh";
import TaskExplorer from "@/components/TaskExplorer";
import { isDepartmentId, NO_DEPARTMENT } from "@/lib/departments";
import { listBrands } from "@/lib/repositories/brands";
import { listActivePeople } from "@/lib/repositories/people";
import { listAllTasks, sweepArchivablePublishedTasks } from "@/lib/repositories/tasks";
import { archiveCountdownBadge } from "@/lib/taskArchive";

export const dynamic = "force-dynamic";

// Filtreler istemci state'inde tutuluyor; URL yalnızca BAŞLANGIÇ değerini
// veriyor (rapor sayfasından "Görevlerini aç" / "Ekibin görevleri" linkleri).
// Kullanıcı sonrasında filtreyi değiştirdiğinde URL güncellenmiyor — bilinçli:
// her tıklamada sunucu render'ı tetiklemek listeyi yavaşlatırdı.
export default async function AllTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ assignee?: string; department?: string }>;
}) {
  const sp = await searchParams;
  // Okumadan ÖNCE süpür, yoksa süresi dolmuş işler bu render'da bir kez daha
  // arşivlenmemiş görünürdü.
  sweepArchivablePublishedTasks();
  // Arşiv de indiriliyor (`true`): "Arşivi göster" düğmesi sayfadaki diğer
  // filtreler gibi tamamen istemci tarafında çalışsın, tıklayınca sunucuya
  // gidilmesin diye.
  // Geri sayım rozeti SUNUCUDA iliştiriliyor (bkz. `archiveCountdownBadge`):
  // kart bileşeni istemci tarafında, orada `new Date()` çağırmak gün sınırında
  // hydration uyuşmazlığı üretebilirdi.
  const tasks = listAllTasks(true).map((task) => {
    const countdown = archiveCountdownBadge(task);
    return countdown ? { ...task, badges: [countdown] } : task;
  });
  const brands = listBrands();
  const people = listActivePeople();

  const initialAssigneeId =
    sp.assignee && people.some((person) => person.id === sp.assignee) ? sp.assignee : "";
  const initialDepartment =
    sp.department && (isDepartmentId(sp.department) || sp.department === NO_DEPARTMENT)
      ? sp.department
      : "";

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <h1 className="text-2xl font-semibold tracking-tight">Görevler</h1>
      <TaskExplorer
        tasks={tasks}
        brands={brands}
        people={people}
        initialAssigneeId={initialAssigneeId}
        initialDepartment={initialDepartment}
      />
    </div>
  );
}

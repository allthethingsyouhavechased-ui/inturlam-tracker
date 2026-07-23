import AutoRefresh from "@/components/AutoRefresh";
import TaskExplorer from "@/components/TaskExplorer";
import { listBrands } from "@/lib/repositories/brands";
import { listActivePeople } from "@/lib/repositories/people";
import { listAllTasks } from "@/lib/repositories/tasks";

export const dynamic = "force-dynamic";

export default function AllTasksPage() {
  const tasks = listAllTasks();
  const brands = listBrands();
  const people = listActivePeople();

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <h1 className="text-xl font-semibold tracking-tight">Görevler</h1>
      <TaskExplorer tasks={tasks} brands={brands} people={people} />
    </div>
  );
}

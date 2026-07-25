"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordActivity } from "@/lib/activity";
import {
  REPEAT_OPTIONS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  TASK_STATUSES,
} from "@/lib/constants";
import { todayISO } from "@/lib/date";
import { getPerson } from "@/lib/repositories/people";
import {
  bulkDeleteTasks,
  bulkUpdateTaskAssignee,
  bulkUpdateTaskPriority,
  bulkUpdateTaskStatus,
  createNextOccurrence,
  createTask,
  deleteTask,
  getTask,
  updateTaskAssignee,
  updateTaskDetails,
  updateTaskPriority,
  updateTaskRepeat,
  updateTaskStatus,
} from "@/lib/repositories/tasks";
import type { TaskPriority, TaskStatus } from "@/lib/types";

function cleanText(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length > 0 ? s : null;
}

export async function createTaskAction(formData: FormData): Promise<string> {
  const contentItemId = String(formData.get("contentItemId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const priorityRaw = String(formData.get("priority") ?? "Normal") as TaskPriority;
  const priority = TASK_PRIORITIES.includes(priorityRaw) ? priorityRaw : "Normal";

  if (!contentItemId) throw new Error("İçerik bulunamadı.");
  if (!title) throw new Error("Görev başlığı zorunlu.");

  const id = createTask({
    contentItemId,
    title,
    assigneeId: cleanText(formData.get("assigneeId")),
    dueDate: cleanText(formData.get("dueDate")),
    priority,
  });

  const created = getTask(id);
  await recordActivity({
    action: "task.create",
    entityType: "task",
    entityId: id,
    brandId: created?.brand_id ?? null,
    summary: `“${title}” görevini oluşturdu`,
  });

  revalidatePath("/", "layout");
  return id;
}

export async function setTaskStatusAction(taskId: string, status: TaskStatus) {
  if (!TASK_STATUSES.includes(status)) throw new Error("Geçersiz durum.");
  const task = getTask(taskId);
  updateTaskStatus(taskId, status);
  await recordActivity({
    action: "task.status",
    entityType: "task",
    entityId: taskId,
    brandId: task?.brand_id ?? null,
    summary: `“${task?.title ?? "Görev"}” görevini ${TASK_STATUS_LABEL[status]} durumuna aldı`,
  });

  // Tekrar eden görev tamamlandıysa bir sonraki örneğini aç. Yeni görev
  // "Beklemede" başladığı için bu dal tekrar tetiklenmez (sonsuz döngü yok).
  if (status === "Yayinlandi" && task && (task.repeat_days ?? 0) > 0) {
    createNextOccurrence(task, todayISO());
    await recordActivity({
      action: "task.repeat",
      entityType: "task",
      entityId: taskId,
      brandId: task.brand_id,
      summary: `“${task.title}” tekrar eden görevinin bir sonraki örneği açıldı`,
    });
  }

  revalidatePath("/", "layout");
}

export async function setTaskRepeatAction(taskId: string, repeatDays: number) {
  if (!REPEAT_OPTIONS.some((o) => o.days === repeatDays)) {
    throw new Error("Geçersiz tekrar aralığı.");
  }
  const task = getTask(taskId);
  if (!task) throw new Error("Görev bulunamadı.");

  updateTaskRepeat(taskId, repeatDays > 0 ? repeatDays : null);
  const label = REPEAT_OPTIONS.find((o) => o.days === repeatDays)!.label;
  await recordActivity({
    action: "task.repeat.set",
    entityType: "task",
    entityId: taskId,
    brandId: task.brand_id,
    summary: `“${task.title}” görevinin tekrarını “${label}” yaptı`,
  });
  revalidatePath("/", "layout");
}

export async function setTaskPriorityAction(
  taskId: string,
  priority: TaskPriority,
) {
  if (!TASK_PRIORITIES.includes(priority)) throw new Error("Geçersiz öncelik.");
  const task = getTask(taskId);
  updateTaskPriority(taskId, priority);
  await recordActivity({
    action: "task.priority",
    entityType: "task",
    entityId: taskId,
    brandId: task?.brand_id ?? null,
    summary: `“${task?.title ?? "Görev"}” önceliğini ${TASK_PRIORITY_LABEL[priority]} yaptı`,
  });
  revalidatePath("/", "layout");
}

export async function setTaskAssigneeAction(
  taskId: string,
  assigneeId: string | null,
) {
  const target = assigneeId && assigneeId.length > 0 ? assigneeId : null;
  const task = getTask(taskId);
  updateTaskAssignee(taskId, target);
  const name = target ? (getPerson(target)?.name ?? null) : null;
  await recordActivity({
    action: "task.assignee",
    entityType: "task",
    entityId: taskId,
    brandId: task?.brand_id ?? null,
    summary: name
      ? `“${task?.title ?? "Görev"}” görevini ${name} kişisine atadı`
      : `“${task?.title ?? "Görev"}” görevinin atamasını kaldırdı`,
  });
  revalidatePath("/", "layout");
}

export async function updateTaskDetailsAction(formData: FormData) {
  const id = String(formData.get("taskId") ?? "").trim();
  if (!id) throw new Error("Görev bulunamadı.");
  const task = getTask(id);
  updateTaskDetails({
    id,
    dueDate: cleanText(formData.get("dueDate")),
    notes: cleanText(formData.get("notes")),
  });
  await recordActivity({
    action: "task.details",
    entityType: "task",
    entityId: id,
    brandId: task?.brand_id ?? null,
    summary: `“${task?.title ?? "Görev"}” görev detaylarını güncelledi`,
  });
  revalidatePath("/", "layout");
}

export async function deleteTaskAction(taskId: string) {
  const task = getTask(taskId);
  deleteTask(taskId);
  await recordActivity({
    action: "task.delete",
    entityType: "task",
    entityId: null,
    brandId: task?.brand_id ?? null,
    summary: `“${task?.title ?? "Görev"}” görevini sildi`,
  });
  revalidatePath("/", "layout");
  if (task) {
    redirect(`/brands/${task.brand_id}/content/${task.content_item_id}`);
  }
  redirect("/");
}

// ---- Toplu görev işlemleri (Görevler > Liste görünümü) ----

function cleanIds(ids: string[]): string[] {
  return Array.from(
    new Set(ids.map((id) => String(id ?? "").trim()).filter(Boolean)),
  );
}

export async function bulkSetTaskStatusAction(ids: string[], status: TaskStatus) {
  if (!TASK_STATUSES.includes(status)) throw new Error("Geçersiz durum.");
  const clean = cleanIds(ids);
  bulkUpdateTaskStatus(clean, status);
  if (clean.length > 0) {
    await recordActivity({
      action: "task.bulk.status",
      entityType: "task",
      entityId: null,
      brandId: null,
      summary: `${clean.length} görevi ${TASK_STATUS_LABEL[status]} durumuna aldı`,
    });
  }
  revalidatePath("/", "layout");
}

export async function bulkSetTaskPriorityAction(
  ids: string[],
  priority: TaskPriority,
) {
  if (!TASK_PRIORITIES.includes(priority)) throw new Error("Geçersiz öncelik.");
  const clean = cleanIds(ids);
  bulkUpdateTaskPriority(clean, priority);
  if (clean.length > 0) {
    await recordActivity({
      action: "task.bulk.priority",
      entityType: "task",
      entityId: null,
      brandId: null,
      summary: `${clean.length} görevin önceliğini ${TASK_PRIORITY_LABEL[priority]} yaptı`,
    });
  }
  revalidatePath("/", "layout");
}

export async function bulkSetTaskAssigneeAction(
  ids: string[],
  assigneeId: string | null,
) {
  const clean = cleanIds(ids);
  const target = assigneeId && assigneeId.length > 0 ? assigneeId : null;
  bulkUpdateTaskAssignee(clean, target);
  if (clean.length > 0) {
    const name = target ? (getPerson(target)?.name ?? null) : null;
    await recordActivity({
      action: "task.bulk.assignee",
      entityType: "task",
      entityId: null,
      brandId: null,
      summary: name
        ? `${clean.length} görevi ${name} kişisine atadı`
        : `${clean.length} görevin atamasını kaldırdı`,
    });
  }
  revalidatePath("/", "layout");
}

export async function bulkDeleteTasksAction(ids: string[]) {
  const clean = cleanIds(ids);
  bulkDeleteTasks(clean);
  if (clean.length > 0) {
    await recordActivity({
      action: "task.bulk.delete",
      entityType: "task",
      entityId: null,
      brandId: null,
      summary: `${clean.length} görevi sildi`,
    });
  }
  revalidatePath("/", "layout");
}

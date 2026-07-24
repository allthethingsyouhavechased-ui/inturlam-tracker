"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TASK_PRIORITIES, TASK_STATUSES } from "@/lib/constants";
import {
  createTask,
  deleteTask,
  getTask,
  updateTaskAssignee,
  updateTaskDetails,
  updateTaskPriority,
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

  revalidatePath("/", "layout");
  return id;
}

export async function setTaskStatusAction(taskId: string, status: TaskStatus) {
  if (!TASK_STATUSES.includes(status)) throw new Error("Geçersiz durum.");
  updateTaskStatus(taskId, status);
  revalidatePath("/", "layout");
}

export async function setTaskPriorityAction(
  taskId: string,
  priority: TaskPriority,
) {
  if (!TASK_PRIORITIES.includes(priority)) throw new Error("Geçersiz öncelik.");
  updateTaskPriority(taskId, priority);
  revalidatePath("/", "layout");
}

export async function setTaskAssigneeAction(
  taskId: string,
  assigneeId: string | null,
) {
  updateTaskAssignee(taskId, assigneeId && assigneeId.length > 0 ? assigneeId : null);
  revalidatePath("/", "layout");
}

export async function updateTaskDetailsAction(formData: FormData) {
  const id = String(formData.get("taskId") ?? "").trim();
  if (!id) throw new Error("Görev bulunamadı.");
  updateTaskDetails({
    id,
    dueDate: cleanText(formData.get("dueDate")),
    notes: cleanText(formData.get("notes")),
  });
  revalidatePath("/", "layout");
}

export async function deleteTaskAction(taskId: string) {
  const task = getTask(taskId);
  deleteTask(taskId);
  revalidatePath("/", "layout");
  if (task) {
    redirect(`/brands/${task.brand_id}/content/${task.content_item_id}`);
  }
  redirect("/");
}

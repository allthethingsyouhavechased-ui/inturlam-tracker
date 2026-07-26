import { extractMentionedPeople } from "@/lib/mentions";
import { createNotification } from "@/lib/repositories/notifications";
import { listActivePeople } from "@/lib/repositories/people";
import type { Person } from "@/lib/types";

// Bir yorum gövdesindeki @mention'lardan bildirim üretir. `recordActivity()`
// (lib/activity.ts) ile aynı felsefe: bildirim üretimi asıl yorum gönderimini
// ASLA bozmamalı — bu yüzden tüm gövde try/catch içinde, hata sessizce yutulur.
export function notifyMentions(input: {
  body: string;
  actor: Person;
  taskId: string;
  taskTitle: string;
  brandId: string | null;
}): void {
  try {
    const people = listActivePeople();
    const mentioned = extractMentionedPeople(input.body, people).filter(
      // Kendine mention atan kişiye bildirim gitmez.
      (p) => p.id !== input.actor.id,
    );
    if (mentioned.length === 0) return;

    const summary = `${input.actor.name} seni “${input.taskTitle}” görevindeki bir yorumda etiketledi`;
    for (const person of mentioned) {
      createNotification({
        recipientId: person.id,
        recipientName: person.name,
        actorId: input.actor.id,
        actorName: input.actor.name,
        taskId: input.taskId,
        brandId: input.brandId,
        summary,
      });
    }
  } catch {
    // yut — bildirim en iyi çabadır, asıl yorum kaydını asla düşürmez.
  }
}

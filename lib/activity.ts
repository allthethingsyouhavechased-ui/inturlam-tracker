import { getCurrentPerson } from "@/lib/identity";
import { insertActivity } from "@/lib/repositories/activity";
import type { ActivityEntityType } from "@/lib/types";

// Server action'ların çağırdığı tek loglama noktası. Aktif kişiyi cookie'den
// okur, kaydı yazar. Loglama HİÇBİR zaman kullanıcının asıl işlemini bozmamalı:
// bu yüzden tüm gövde try/catch içinde — hata olursa sessizce yutulur.
export async function recordActivity(input: {
  action: string;
  entityType: ActivityEntityType;
  entityId: string | null;
  brandId?: string | null;
  summary: string;
}): Promise<void> {
  try {
    const person = await getCurrentPerson();
    insertActivity({
      actorId: person?.id ?? null,
      actorName: person?.name ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      brandId: input.brandId ?? null,
      summary: input.summary,
    });
  } catch {
    // yut — aktivite kaydı en iyi çabadır, asıl mutasyonu asla düşürmez.
  }
}

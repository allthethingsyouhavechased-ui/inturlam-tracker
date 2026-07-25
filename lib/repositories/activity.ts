import { getDb, plainList } from "@/lib/db/client";
import type { ActivityEntry, ActivityEntityType } from "@/lib/types";

export interface NewActivity {
  actorId: string | null;
  actorName: string | null;
  action: string;
  entityType: ActivityEntityType;
  entityId: string | null;
  brandId: string | null;
  summary: string;
}

// Append-only kayıt. Loglama asla ana mutasyonu bozmamalı — çağıran taraf
// (lib/activity.ts) bu çağrıyı try/catch ile sarıyor.
export function insertActivity(a: NewActivity): void {
  getDb()
    .prepare(
      `INSERT INTO activity_log
         (id, actor_id, actor_name, action, entity_type, entity_id, brand_id, summary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      crypto.randomUUID(),
      a.actorId,
      a.actorName,
      a.action,
      a.entityType,
      a.entityId,
      a.brandId,
      a.summary,
    );
}

export function listRecentActivity(limit = 100): ActivityEntry[] {
  return plainList<ActivityEntry>(
    getDb()
      .prepare(
        `SELECT * FROM activity_log ORDER BY created_at DESC, rowid DESC LIMIT ?`,
      )
      .all(limit),
  );
}

// Bir görevin zaman çizelgesi — göreve ait olaylar + o görevin altındaki
// yorumlar (yorumlar entity_type='task', entity_id=görev id ile loglanıyor).
export function listActivityForEntity(
  entityType: ActivityEntityType,
  entityId: string,
  limit = 50,
): ActivityEntry[] {
  return plainList<ActivityEntry>(
    getDb()
      .prepare(
        `SELECT * FROM activity_log
         WHERE entity_type = ? AND entity_id = ?
         ORDER BY created_at DESC, rowid DESC LIMIT ?`,
      )
      .all(entityType, entityId, limit),
  );
}

export function listActivityForBrand(
  brandId: string,
  limit = 30,
): ActivityEntry[] {
  return plainList<ActivityEntry>(
    getDb()
      .prepare(
        `SELECT * FROM activity_log
         WHERE brand_id = ?
         ORDER BY created_at DESC, rowid DESC LIMIT ?`,
      )
      .all(brandId, limit),
  );
}

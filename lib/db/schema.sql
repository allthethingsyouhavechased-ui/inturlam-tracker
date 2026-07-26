-- Marka kategorileri (küme). Kullanıcı arayüzden yeni kategori ekleyebildiği
-- için sabit listede değil, tabloda tutuluyor. brands.cluster bu tablonun id'sini
-- taşır ama bilinçli olarak FK YOK: kategori silinse bile marka kaydı düşmesin,
-- gruplanamayan markalar "Kategorisiz" başlığı altında görünsün istiyoruz.
CREATE TABLE IF NOT EXISTS clusters (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS brands (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  cluster    TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  archived   INTEGER NOT NULL DEFAULT 0,
  logo_path          TEXT,
  instagram_handle   TEXT,
  follower_count     INTEGER,
  post_count         INTEGER,
  median_reel_views  TEXT,
  cover_test_verdict TEXT CHECK (cover_test_verdict IN ('Gecti','Kismen','Basarisiz','Sinirda')),
  cover_test_note    TEXT,
  key_finding        TEXT,
  first_action       TEXT,
  tier               TEXT,
  -- Takipçi/gönderi sayılarının son tazelenme tarihi (YYYY-MM-DD). Sayılar
  -- haftalık elle giriliyor; bu damga rakamın ne kadar bayat olduğunu gösterir.
  stats_updated_at   TEXT
);

CREATE TABLE IF NOT EXISTS brand_relations (
  id               TEXT PRIMARY KEY,
  brand_id         TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  related_brand_id TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  relation_type    TEXT NOT NULL CHECK (relation_type IN
                     ('rakip','tedarikci','ortaklik_muhtemel','kismi_cakisma',
                      'portfoy_ici','marka_ailesi','kardes_sube','nuansli')),
  risk_level       TEXT CHECK (risk_level IN ('yuksek','dusuk','yok')),
  note             TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS brand_audits (
  brand_id      TEXT PRIMARY KEY REFERENCES brands(id) ON DELETE CASCADE,
  body_markdown TEXT NOT NULL,
  source_file   TEXT,
  audit_date    TEXT,
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS people (
  id     TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS content_items (
  id          TEXT PRIMARY KEY,
  brand_id    TEXT NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('Reel','Foto','Kampanya','Video','Carousel','KurumsalKimlik','Diger')),
  target_date TEXT,
  status      TEXT NOT NULL DEFAULT 'Planlandi' CHECK (status IN ('Planlandi','Uretimde','Tamamlandi','IptalEdildi')),
  assignee_id TEXT REFERENCES people(id) ON DELETE SET NULL,
  archived    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS tasks (
  id              TEXT PRIMARY KEY,
  content_item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Beklemede' CHECK (status IN ('Beklemede','DevamEdiyor','Incelemede','Onaylandi','Yayinlandi')),
  priority        TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Dusuk','Normal','Yuksek','Acil')),
  assignee_id     TEXT REFERENCES people(id) ON DELETE SET NULL,
  due_date        TEXT,
  notes           TEXT,
  -- Tekrar eden görev: kaç günde bir. NULL/0 = tekrar yok. Görev "Yayınlandı"
  -- durumuna alınınca bir sonraki örneği otomatik açılır (lib/actions/tasks.ts).
  repeat_days     INTEGER,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Görev şablonları: aynı iş akışı (Reel → brief/çekim/kurgu/kapak/yayın) her
-- içerik için elle yazılmasın. Kategoriler gibi bunlar da kullanıcı tarafından
-- yönetiliyor, sabit listede değil.
CREATE TABLE IF NOT EXISTS task_templates (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  -- Hangi içerik türünde önerilecek. NULL = her tür.
  content_type TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS task_template_items (
  id              TEXT PRIMARY KEY,
  template_id     TEXT NOT NULL REFERENCES task_templates(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'Normal' CHECK (priority IN ('Dusuk','Normal','Yuksek','Acil')),
  assignee_id     TEXT REFERENCES people(id) ON DELETE SET NULL,
  -- İçeriğin target_date'ine göre gün kayması: -3 = teslimden 3 gün önce.
  -- NULL = tarihsiz görev.
  due_offset_days INTEGER,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY,
  task_id    TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id  TEXT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  body       TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comment_attachments (
  id            TEXT PRIMARY KEY,
  comment_id    TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  file_path     TEXT NOT NULL,
  original_name TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Görevin "Notlar" alanına eklenen görseller — comment_attachments ile aynı
-- desen, ama comments'e değil doğrudan tasks'e bağlı (not, yorumdan bağımsız
-- bir alan).
CREATE TABLE IF NOT EXISTS task_attachments (
  id            TEXT PRIMARY KEY,
  task_id       TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  file_path     TEXT NOT NULL,
  original_name TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Aktivite geçmişi: kim, ne zaman, hangi varlıkta ne yaptı. Denetlenebilirlik
-- için append-only. actor_name/entity bilgileri anlık (snapshot) tutulur ki
-- kişi/varlık sonradan silinse bile kayıt okunabilir kalsın — bu yüzden FK yok.
CREATE TABLE IF NOT EXISTS activity_log (
  id          TEXT PRIMARY KEY,
  actor_id    TEXT,
  actor_name  TEXT,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   TEXT,
  brand_id    TEXT,
  summary     TEXT NOT NULL,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- @mention bildirimleri: bir yorumda @İsim ile bahsedilen kişiye. activity_log
-- ile aynı gerekçeyle (yukarıya bak) actor/recipient/task/brand bilgisi anlık
-- (snapshot) metin/id olarak tutulur, FK YOK — kişi ya da görev sonradan
-- silinse bile bildirim geçmişi okunabilir kalsın.
CREATE TABLE IF NOT EXISTS notifications (
  id             TEXT PRIMARY KEY,
  recipient_id   TEXT NOT NULL,
  recipient_name TEXT,
  actor_id       TEXT,
  actor_name     TEXT,
  task_id        TEXT,
  brand_id       TEXT,
  summary        TEXT NOT NULL,
  read           INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_brands_cluster      ON brands(cluster);
CREATE INDEX IF NOT EXISTS idx_clusters_sort       ON clusters(sort_order);
CREATE INDEX IF NOT EXISTS idx_content_items_brand    ON content_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_items_assignee ON content_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_content_item  ON tasks(content_item_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee      ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date      ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_comments_task       ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_template_items_template ON task_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment ON comment_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_task ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_brand_relations_brand   ON brand_relations(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_relations_related ON brand_relations(related_brand_id);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_brand   ON activity_log(brand_id);
CREATE INDEX IF NOT EXISTS idx_activity_entity  ON activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read ON notifications(recipient_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created        ON notifications(created_at);

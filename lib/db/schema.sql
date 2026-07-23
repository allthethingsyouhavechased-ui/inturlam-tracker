CREATE TABLE IF NOT EXISTS brands (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  cluster    TEXT NOT NULL CHECK (cluster IN ('balik-deniz','kahve-gida','b2b-yapi','hamam','emlak','tek')),
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
  tier               TEXT
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
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
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

CREATE INDEX IF NOT EXISTS idx_brands_cluster      ON brands(cluster);
CREATE INDEX IF NOT EXISTS idx_content_items_brand    ON content_items(brand_id);
CREATE INDEX IF NOT EXISTS idx_content_items_assignee ON content_items(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_content_item  ON tasks(content_item_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee      ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date      ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_comments_task       ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comment_attachments_comment ON comment_attachments(comment_id);
CREATE INDEX IF NOT EXISTS idx_brand_relations_brand   ON brand_relations(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_relations_related ON brand_relations(related_brand_id);

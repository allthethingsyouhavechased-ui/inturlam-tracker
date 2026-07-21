import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const DB_PATH = path.join(process.cwd(), "data", "inturlam.db");
const SCHEMA_PATH = path.join(process.cwd(), "lib", "db", "schema.sql");

declare global {
  // eslint-disable-next-line no-var
  var __inturlamDb: DatabaseSync | undefined;
}

function createConnection(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));
  return db;
}

export function getDb(): DatabaseSync {
  if (!globalThis.__inturlamDb) {
    globalThis.__inturlamDb = createConnection();
  }
  return globalThis.__inturlamDb;
}

// node:sqlite satırları null-prototype obje döner; React bunları Client
// Component'lere geçiremiyor. Düz objeye çevirerek her yerde güvenli kılıyoruz.
export function plainList<T>(rows: unknown[]): T[] {
  return rows.map((r) => ({ ...(r as Record<string, unknown>) }) as T);
}

export function plainOne<T>(row: unknown): T | undefined {
  return row == null
    ? undefined
    : ({ ...(row as Record<string, unknown>) } as T);
}

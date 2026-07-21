import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = path.join(process.cwd(), "data", "inturlam.db");
const SCHEMA_PATH = path.join(process.cwd(), "lib", "db", "schema.sql");

// id = Instagram handle. name = görünen ad (gerekirse düzenle ve tekrar çalıştır).
const BRANDS: { id: string; name: string; cluster: string }[] = [
  // Balık & Deniz
  { id: "sihirliolta", name: "Sihirli Olta", cluster: "balik-deniz" },
  { id: "ns.blackhole", name: "NS Blackhole", cluster: "balik-deniz" },
  { id: "travellabbalikturu", name: "Travellab Balık Turu", cluster: "balik-deniz" },
  { id: "cengizbalikcilik", name: "Cengiz Balıkçılık", cluster: "balik-deniz" },
  { id: "arkaymarine", name: "Arkay Marine", cluster: "balik-deniz" },
  { id: "tersanmarine", name: "Tersan Marine", cluster: "balik-deniz" },
  // Kahve & Gıda
  { id: "hacibabacoffee", name: "Hacıbaba Coffee", cluster: "kahve-gida" },
  { id: "pellegrocaffe", name: "Pellegro Caffe", cluster: "kahve-gida" },
  { id: "justcafejust", name: "Just Cafe", cluster: "kahve-gida" },
  { id: "hbkuruyemis", name: "HB Kuruyemiş", cluster: "kahve-gida" },
  // B2B / Yapı
  { id: "ateknikyalitim", name: "A Teknik Yalıtım", cluster: "b2b-yapi" },
  { id: "antek_makina", name: "Antek Makina", cluster: "b2b-yapi" },
  { id: "ozanparke", name: "Ozan Parke", cluster: "b2b-yapi" },
  { id: "adadisticaret", name: "Ada Dış Ticaret", cluster: "b2b-yapi" },
  // Hamam
  { id: "alaaddinhammam", name: "Alaaddin Hamam", cluster: "hamam" },
  { id: "buyukhammam", name: "Büyük Hamam", cluster: "hamam" },
  // Diğer
  { id: "famedans", name: "Fame Dans", cluster: "tek" },
];

// TODO: Gerçek isimlerle değiştir. id sabit kalsın, name'i düzenleyip tekrar çalıştır.
const PEOPLE: { id: string; name: string }[] = [
  { id: "yunus", name: "Yunus Emre" },
  { id: "kisi-2", name: "Kişi 2" },
  { id: "kisi-3", name: "Kişi 3" },
];

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON");
db.exec(fs.readFileSync(SCHEMA_PATH, "utf-8"));

const insertBrand = db.prepare(
  `INSERT INTO brands (id, name, cluster, sort_order) VALUES (?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET name = excluded.name, cluster = excluded.cluster, sort_order = excluded.sort_order`,
);
BRANDS.forEach((b, i) => insertBrand.run(b.id, b.name, b.cluster, i));

const insertPerson = db.prepare(
  `INSERT INTO people (id, name) VALUES (?, ?)
   ON CONFLICT(id) DO UPDATE SET name = excluded.name`,
);
for (const p of PEOPLE) insertPerson.run(p.id, p.name);

const brandCount = db.prepare("SELECT COUNT(*) AS n FROM brands").get() as {
  n: number;
};
const peopleCount = db.prepare("SELECT COUNT(*) AS n FROM people").get() as {
  n: number;
};

console.log(
  `Seed tamam → ${brandCount.n} marka, ${peopleCount.n} kişi. DB: ${DB_PATH}`,
);
db.close();

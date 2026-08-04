import assert from "node:assert/strict";
import test from "node:test";
import {
  departmentLabel,
  groupPeopleByDepartment,
  normalizeDepartment,
} from "@/lib/departments";

test("ekip üyelerini departman sütununa göre sabit sırada gruplar", () => {
  const people = [
    { name: "Berkant", department: "management" },
    { name: "Sıla", department: "design" },
    { name: "Yunus Emre", department: "video" },
    { name: "Cansu", department: "social" },
    { name: "Murat", department: "design" },
  ];

  assert.deepEqual(
    groupPeopleByDepartment(people).map((row) => ({
      label: row.label,
      names: row.people.map((person) => person.name),
    })),
    [
      { label: "Video", names: ["Yunus Emre"] },
      { label: "Tasarım", names: ["Sıla", "Murat"] },
      { label: "Sosyal Medya", names: ["Cansu"] },
      { label: "Yönetim", names: ["Berkant"] },
    ],
  );
});

test("departmanı olmayan kişileri görünmez bırakmak yerine Diğer satırında korur", () => {
  const rows = groupPeopleByDepartment([
    { name: "Arman", department: "video" },
    { name: "Yeni Üye", department: null },
    // Departman listesinden kaldırılmış eski bir değer de kaybolmamalı.
    { name: "Eski Kayıt", department: "silinmis-departman" },
  ]);

  assert.deepEqual(rows.at(-1), {
    id: "other",
    label: "Diğer",
    people: [
      { name: "Yeni Üye", department: null },
      { name: "Eski Kayıt", department: "silinmis-departman" },
    ],
  });
});

test("boş departman satırı üretmek yerine tüm departmanları korur", () => {
  const rows = groupPeopleByDepartment([{ name: "Tek Kişi", department: "video" }]);
  // 4 sabit departman her zaman görünür (ekip kanbanı satırları sabit kalsın),
  // "Diğer" ise yalnızca gerçekten sahipsiz kişi varsa eklenir.
  assert.deepEqual(
    rows.map((row) => row.id),
    ["video", "design", "social", "management"],
  );
});

test("form/URL'den gelen geçersiz departman değerini null'a indirger", () => {
  assert.equal(normalizeDepartment("video"), "video");
  assert.equal(normalizeDepartment(""), null);
  assert.equal(normalizeDepartment("other"), null);
  assert.equal(normalizeDepartment(null), null);
});

test("etiket çözümlemesi bilinmeyen değerde Diğer'e düşer", () => {
  assert.equal(departmentLabel("design"), "Tasarım");
  assert.equal(departmentLabel(null), "Diğer");
  assert.equal(departmentLabel("yok-boyle"), "Diğer");
});

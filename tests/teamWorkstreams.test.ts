import assert from "node:assert/strict";
import test from "node:test";
import { groupPeopleByWorkstream } from "@/lib/teamWorkstreams";

test("ekip üyelerini belirtilen disiplin ve sıraya göre gruplar", () => {
  const people = [
    { name: "Berkant" },
    { name: "Sıla" },
    { name: "Yunus Emre" },
    { name: "Özgün" },
    { name: "Özgür" },
    { name: "Cansu" },
    { name: "Emrullah" },
    { name: "Arman" },
    { name: "Erhan" },
    { name: "Murat" },
    { name: "Ekin" },
    { name: "Defne" },
  ];

  const rows = groupPeopleByWorkstream(people);

  assert.deepEqual(
    rows.map((row) => ({
      label: row.label,
      names: row.people.map((person) => person.name),
    })),
    [
      {
        label: "Video",
        names: ["Yunus Emre", "Emrullah", "Arman", "Özgün", "Erhan"],
      },
      { label: "Tasarım", names: ["Murat", "Ekin", "Sıla"] },
      { label: "Sosyal Medya", names: ["Cansu", "Defne"] },
      { label: "Yönetim", names: ["Özgür", "Berkant"] },
    ],
  );
});

test("tanımlı olmayan kişileri görünmez bırakmak yerine Diğer satırında korur", () => {
  const rows = groupPeopleByWorkstream([
    { name: "Arman" },
    { name: "Yeni Üye" },
  ]);

  assert.deepEqual(rows.at(-1), {
    id: "other",
    label: "Diğer",
    people: [{ name: "Yeni Üye" }],
  });
});

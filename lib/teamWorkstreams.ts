export const TEAM_WORKSTREAMS = [
  {
    id: "video",
    label: "Video",
    memberKeys: ["yunus", "emrullah", "arman", "özgün", "erhan"],
  },
  {
    id: "design",
    label: "Tasarım",
    memberKeys: ["murat", "ekin", "sıla"],
  },
  {
    id: "social",
    label: "Sosyal Medya",
    memberKeys: ["cansu", "defne"],
  },
  {
    id: "management",
    label: "Yönetim",
    memberKeys: ["özgür", "berkant"],
  },
] as const;

export type TeamWorkstreamId = (typeof TEAM_WORKSTREAMS)[number]["id"];

export type TeamWorkstreamRow<T> = {
  id: TeamWorkstreamId | "other";
  label: string;
  people: T[];
};

function firstNameKey(name: string): string {
  return name.trim().toLocaleLowerCase("tr-TR").split(/\s+/)[0] ?? "";
}

export function groupPeopleByWorkstream<T extends { name: string }>(
  people: T[],
): TeamWorkstreamRow<T>[] {
  const peopleByKey = new Map(people.map((person) => [firstNameKey(person.name), person]));
  const assignedPeople = new Set<T>();

  const rows: TeamWorkstreamRow<T>[] = TEAM_WORKSTREAMS.map((workstream) => {
    const workstreamPeople = workstream.memberKeys.flatMap((memberKey) => {
      const person = peopleByKey.get(memberKey);
      if (!person) return [];
      assignedPeople.add(person);
      return [person];
    });

    return {
      id: workstream.id,
      label: workstream.label,
      people: workstreamPeople,
    };
  });

  const unassignedPeople = people.filter((person) => !assignedPeople.has(person));
  if (unassignedPeople.length > 0) {
    rows.push({
      id: "other",
      label: "Diğer",
      people: unassignedPeople,
    });
  }

  return rows;
}

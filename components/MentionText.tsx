import { findMentionMatches } from "@/lib/mentions";
import type { Person } from "@/lib/types";

// @mention'ları vurgulayan tek ortak render — bildirim üretimi ve yorum
// gösterimi (CommentItem, TaskCommentsPanel) hepsi aynı findMentionMatches'ı
// kullanır, biri güncellenip diğeri unutulamaz (bkz. CLAUDE.md).
export default function MentionText({ body, people }: { body: string; people: Person[] }) {
  const matches = findMentionMatches(body, people);
  if (matches.length === 0) return <>{body}</>;

  const nodes: React.ReactNode[] = [];
  let cursor = 0;
  matches.forEach((m, i) => {
    if (m.start > cursor) nodes.push(body.slice(cursor, m.start));
    nodes.push(
      <span key={i} className="font-semibold text-brand-600 dark:text-brand-400">
        {body.slice(m.start, m.end)}
      </span>,
    );
    cursor = m.end;
  });
  if (cursor < body.length) nodes.push(body.slice(cursor));
  return <>{nodes}</>;
}

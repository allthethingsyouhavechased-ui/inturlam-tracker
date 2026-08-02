import Link from "next/link";
import AutoRefresh from "@/components/AutoRefresh";
import CalendarGrid from "@/components/CalendarGrid";
import TaskListView from "@/components/TaskListView";
import {
  calendarGridDays,
  formatDateLong,
  formatMonthLabel,
  monthParamISO,
  monthParamToDate,
  shiftMonthParam,
  todayISO,
} from "@/lib/date";
import { listActivePeople } from "@/lib/repositories/people";
import { listTasksDueInRange } from "@/lib/repositories/tasks";
import type { TaskWithContext } from "@/lib/types";

export const dynamic = "force-dynamic";

const DAY_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/;

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string }>;
}) {
  const sp = await searchParams;
  const monthDate = monthParamToDate(sp.month);
  const monthParam = monthParamISO(monthDate);
  const selectedDay = sp.day && DAY_PARAM_RE.test(sp.day) ? sp.day : null;

  // Aralık, görüntülenen AYIN değil IZGARANIN sınırlarına göre çekiliyor:
  // ızgara başta/sonda bir önceki/sonraki aydan dolgu günleri gösteriyor
  // (bkz. CalendarGrid) ve o hücrelerde de gerçek görevler görünsün istiyoruz
  // — yoksa "soluk" günler her zaman boş görünür, oysa komşu ayda iş olabilir.
  const gridDays = calendarGridDays(monthDate);
  const rangeStart = gridDays[0].date;
  const rangeEnd = gridDays[gridDays.length - 1].date;
  const tasks = listTasksDueInRange(rangeStart, rangeEnd);
  const people = listActivePeople();
  const today = todayISO();

  const tasksByDate = new Map<string, TaskWithContext[]>();
  for (const t of tasks) {
    if (!t.due_date) continue;
    const list = tasksByDate.get(t.due_date);
    if (list) list.push(t);
    else tasksByDate.set(t.due_date, [t]);
  }

  // Boş ay kontrolü ızgaranın dolgu günlerini SAYMAZ: bir önceki/sonraki aydan
  // taşan 1-6 gün dolu olsa bile "bu ay boş" mesajı görüntülenen ay için doğru
  // kalmalı.
  const hasTasksThisMonth = tasks.some((t) => t.due_date?.startsWith(monthParam));

  const prevMonthParam = shiftMonthParam(monthParam, -1);
  const nextMonthParam = shiftMonthParam(monthParam, 1);
  const isCurrentMonth = monthParam === monthParamISO(new Date());

  const dayTasks = selectedDay ? (tasksByDate.get(selectedDay) ?? []) : [];

  return (
    <div className="space-y-3">
      <AutoRefresh />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Takvim</h1>
        <div className="flex items-center gap-1">
          <Link
            href={`/calendar?month=${prevMonthParam}`}
            aria-label="Önceki ay"
            className="ui-press inline-flex size-10 items-center justify-center rounded-xl text-xl leading-none text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            ‹
          </Link>
          <h2 className="min-w-[12ch] text-center text-base font-semibold sm:text-lg">
            {formatMonthLabel(monthDate)}
          </h2>
          <Link
            href={`/calendar?month=${nextMonthParam}`}
            aria-label="Sonraki ay"
            className="ui-press inline-flex size-10 items-center justify-center rounded-xl text-xl leading-none text-zinc-600 hover:bg-black/5 dark:text-zinc-300 dark:hover:bg-white/10"
          >
            ›
          </Link>
        </div>
        {!isCurrentMonth && (
          <Link
            href="/calendar"
            className="ui-press ml-1 inline-flex min-h-10 items-center rounded-xl px-3 text-sm font-medium text-brand-600 hover:bg-brand-50 dark:text-brand-400 dark:hover:bg-brand-950/30"
          >
            Bugün
          </Link>
        )}
      </div>

      {!hasTasksThisMonth && (
        <div className="rounded-xl border border-black/10 bg-white p-6 text-center dark:border-white/10 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
            Bu ayda teslim tarihi olan görev yok.
          </p>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Başka bir aya bakabilir ya da{" "}
            <Link href="/tasks" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Görevler
            </Link>{" "}
            sayfasından bir göreve tarih atayabilirsin.
          </p>
        </div>
      )}

      <CalendarGrid
        gridDays={gridDays}
        tasksByDate={tasksByDate}
        today={today}
        monthParam={monthParam}
        selectedDay={selectedDay}
      />

      {selectedDay && (
        <section className="ui-enter space-y-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold">
              {formatDateLong(selectedDay)}{" "}
              <span className="font-normal text-zinc-500 dark:text-zinc-400">
                · {dayTasks.length > 0 ? `${dayTasks.length} görev` : "görev yok"}
              </span>
            </h2>
            <Link
              href={`/calendar?month=${monthParam}`}
              className="ui-press inline-flex min-h-11 items-center rounded-lg px-3 text-xs font-medium text-zinc-500 hover:bg-black/5 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-white/10 dark:hover:text-zinc-200"
            >
              Kapat ×
            </Link>
          </div>
          {dayTasks.length > 0 ? (
            <TaskListView tasks={dayTasks} people={people} />
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Bu günde teslim tarihi olan görev yok.
            </p>
          )}
        </section>
      )}
    </div>
  );
}

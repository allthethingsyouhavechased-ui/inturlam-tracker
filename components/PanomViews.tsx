"use client";

import { useState } from "react";
import TaskBoard from "@/components/TaskBoard";
import TaskGridCard from "@/components/TaskGridCard";
import TaskListView from "@/components/TaskListView";
import type { Person, TaskWithContext } from "@/lib/types";

// Panom'un iki bölümü (bana atanmışlar + ekipte gecikmiş/bu hafta) tek bir
// Pano/Liste düğmesiyle birlikte görünüm değiştirir — /tasks'taki alışkanlığın
// aynısı. Liste görünümü sütun başlıklarından sıralanabilir (TaskListView).
export default function PanomViews({
  myTasks,
  otherTasks,
  people,
  hasIdentity,
}: {
  myTasks: TaskWithContext[];
  otherTasks: TaskWithContext[];
  people: Person[];
  hasIdentity: boolean;
}) {
  const [view, setView] = useState<"pano" | "liste">("pano");

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {view === "liste"
            ? "Sütun başlığına tıklayıp sırala, satırları seçip toplu işlem yap"
            : "Kartları sürükleyerek durumunu değiştir"}
        </p>
        <div className="inline-flex overflow-hidden rounded-md border border-black/10 text-xs dark:border-white/15">
          {(["pano", "liste"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-3 py-1 font-medium transition-colors ${
                view === v
                  ? "bg-brand-600 text-white"
                  : "bg-white text-zinc-600 hover:bg-black/5 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-white/10"
              }`}
            >
              {v === "pano" ? "Pano" : "Liste"}
            </button>
          ))}
        </div>
      </div>

      {hasIdentity && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Bana atanmış görevler{" "}
            {myTasks.length > 0 && <span>({myTasks.length})</span>}
          </h2>
          {/* Yayınlananlar da burada: “Yayınlandı” sütununda bir süre daha
              durup sonra arşive düşerler — yanlışlıkla oraya sürüklenen kart
              geri sürüklenebilsin diye. */}
          {myTasks.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Sana atanmış görev yok. 🎉</p>
          ) : view === "pano" ? (
            <TaskBoard tasks={myTasks} boardId="panom" />
          ) : (
            <TaskListView tasks={myTasks} people={people} />
          )}
        </section>
      )}

      {otherTasks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            Ekipte gecikmiş / bu hafta teslim ({otherTasks.length})
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Bu görevler başkalarına atanmış ya da hiç atanmamış — takip için burada.
          </p>
          {view === "pano" ? (
            // Bilinçli olarak sürüklenemez: bu bölüm başkasının işi, Panom'dan
            // durum değiştirmek yerine görünürlük sağlıyor.
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {otherTasks.map((t) => (
                <TaskGridCard key={t.id} task={t} badges={t.badges} />
              ))}
            </div>
          ) : (
            <TaskListView tasks={otherTasks} people={people} />
          )}
        </section>
      )}
    </div>
  );
}

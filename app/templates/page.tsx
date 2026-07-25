import TemplateManager from "@/components/TemplateManager";
import { listTemplatesWithItems } from "@/lib/repositories/templates";

export const dynamic = "force-dynamic";

export default function TemplatesPage() {
  const templates = listTemplatesWithItems();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Görev şablonları</h1>
        <p className="mt-1 max-w-3xl text-sm text-zinc-500 dark:text-zinc-400">
          Her içerikte tekrarlayan iş akışları. Yeni içerik açarken şablon seçersen
          buradaki görevler otomatik oluşur; tarihler içeriğin teslim tarihine göre
          kaydırılır (ör. “3 gün önce”). İçeriğin teslim tarihi yoksa görevler
          tarihsiz açılır.
        </p>
      </div>

      <TemplateManager templates={templates} />
    </div>
  );
}

import fs from "node:fs/promises";
import path from "node:path";

export const MAX_IMAGE_FILES = 6;
export const MAX_IMAGE_SIZE = 8 * 1024 * 1024; // 8MB

const ALLOWED_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export function extractImageFiles(formData: FormData, field = "images"): File[] {
  return formData
    .getAll(field)
    .filter((v): v is File => v instanceof File && v.size > 0)
    .slice(0, MAX_IMAGE_FILES);
}

export function validateImageFiles(images: File[]): void {
  for (const image of images) {
    if (image.size > MAX_IMAGE_SIZE) {
      throw new Error(`${image.name}: dosya çok büyük (max 8MB).`);
    }
    if (!(image.type in ALLOWED_IMAGE_EXTENSIONS)) {
      throw new Error(`${image.name}: sadece görsel dosyaları (PNG/JPG/GIF/WEBP) yüklenebilir.`);
    }
  }
}

// `subdir` public/uploads altında ayrı bir klasör (ör. "comments", "tasks") —
// farklı varlık türlerinin ekleri karışmasın diye.
export async function saveImageFiles(
  images: File[],
  subdir: string,
): Promise<{ filePath: string; originalName: string | null }[]> {
  if (images.length === 0) return [];
  const uploadDir = path.join(process.cwd(), "public", "uploads", subdir);
  await fs.mkdir(uploadDir, { recursive: true });
  const saved: { filePath: string; originalName: string | null }[] = [];
  for (const image of images) {
    const ext = ALLOWED_IMAGE_EXTENSIONS[image.type];
    const fileName = `${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await image.arrayBuffer());
    await fs.writeFile(path.join(uploadDir, fileName), buffer);
    saved.push({ filePath: `/uploads/${subdir}/${fileName}`, originalName: image.name || null });
  }
  return saved;
}

export async function deleteUploadedFile(filePath: string): Promise<void> {
  const abs = path.join(process.cwd(), "public", filePath.replace(/^\//, ""));
  await fs.unlink(abs).catch(() => {});
}

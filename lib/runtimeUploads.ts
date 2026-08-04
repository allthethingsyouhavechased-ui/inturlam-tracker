import path from "node:path";

const CONTENT_TYPES: Record<string, string> = {
  ".gif": "image/gif",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function resolveRuntimeUpload(
  uploadRoot: string,
  segments: string[],
): { absolutePath: string; contentType: string } | null {
  if (
    segments.length === 0 ||
    segments.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("/") ||
        segment.includes("\\"),
    )
  ) {
    return null;
  }

  const absolutePath = path.resolve(uploadRoot, ...segments);
  const relativePath = path.relative(uploadRoot, absolutePath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) return null;

  const contentType = CONTENT_TYPES[path.extname(absolutePath).toLowerCase()];
  return contentType ? { absolutePath, contentType } : null;
}

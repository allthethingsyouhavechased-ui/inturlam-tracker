import fs from "node:fs/promises";
import path from "node:path";
import { resolveRuntimeUpload } from "@/lib/runtimeUploads";

export const dynamic = "force-dynamic";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const resolved = resolveRuntimeUpload(UPLOAD_ROOT, (await context.params).path);
  if (!resolved) return new Response(null, { status: 404 });

  try {
    const file = await fs.readFile(resolved.absolutePath);
    return new Response(file, {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Content-Type": resolved.contentType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "EISDIR") {
      return new Response(null, { status: 404 });
    }
    throw error;
  }
}

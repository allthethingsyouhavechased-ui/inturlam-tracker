import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { resolveRuntimeUpload } from "@/lib/runtimeUploads";

const root = path.resolve("public", "uploads");

test("runtime upload yolunu ve MIME tipini çözer", () => {
  assert.deepEqual(resolveRuntimeUpload(root, ["people", "avatar.png"]), {
    absolutePath: path.join(root, "people", "avatar.png"),
    contentType: "image/png",
  });
});

test("dizin dışına çıkmayı ve desteklenmeyen dosyaları reddeder", () => {
  assert.equal(resolveRuntimeUpload(root, ["..", "data", "inturlam.db"]), null);
  assert.equal(resolveRuntimeUpload(root, ["people\\..\\secret.png"]), null);
  assert.equal(resolveRuntimeUpload(root, ["people", "avatar.svg"]), null);
});

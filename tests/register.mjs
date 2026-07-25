// `node --import ./tests/register.mjs --test tests/` ile yüklenir.
// Tek işi alias hook'unu kaydetmek (bkz. tests/alias-hook.mjs).
import { register } from "node:module";

register("./alias-hook.mjs", import.meta.url);

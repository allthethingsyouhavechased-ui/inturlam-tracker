// `node --import ./scripts/register.mjs ...` ile yüklenir; hem test koşucusu
// hem de `lib/` içindeki modülleri kullanan CLI script'leri (ör.
// db/sync-instagram.mts) buna ihtiyaç duyar.
// Tek işi alias hook'unu kaydetmek (bkz. scripts/alias-hook.mjs).
import { register } from "node:module";

register("./alias-hook.mjs", import.meta.url);

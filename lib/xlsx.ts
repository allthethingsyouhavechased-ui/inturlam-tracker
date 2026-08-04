// Bağımlılıksız XLSX (Excel) yazıcı.
//
// Neden elle: bu proje bilinçli olarak harici paket/derleme istemiyor (bkz.
// `node:sqlite` tercihi, CLAUDE.md). XLSX aslında birkaç XML dosyasını içeren
// bir ZIP; ZIP'i Node'un yerleşik `node:zlib`i ile üretmek ~150 satır. Karşılığı:
// çok sayfalı, başlıklı, sütun genişlikli gerçek bir .xlsx — CSV'nin yapamadığı
// şey (tek dosyada birden çok tablo + görünümün kendisi).
//
// SUNUCU TARAFI: `node:zlib` tarayıcıda yok. Bu modül yalnızca route
// handler'lardan (`app/reports/export/route.ts`) çağrılır.

import { deflateRawSync } from "node:zlib";

/** Bir hücre. `number` sayı olarak, geri kalan metin olarak yazılır. */
export type CellValue = string | number | null | undefined;

export interface SheetColumn {
  header: string;
  /** Excel "karakter" birimi sütun genişliği. Verilmezse otomatik hesaplanır. */
  width?: number;
}

export interface Sheet {
  /** Sekme adı. Excel'in yasakladığı karakterler temizlenir, 31 karaktere kırpılır. */
  name: string;
  columns?: SheetColumn[];
  rows: CellValue[][];
  /**
   * Kalın yazılacak satır indeksleri (0 tabanlı, `rows` içinde). Başlık satırı
   * `columns` verildiğinde zaten kalındır; bu, tablo İÇİNE serpiştirilen ara
   * başlıklar için ("Operasyon özeti" gibi bölüm satırları).
   */
  boldRows?: number[];
}

// ---- XML ----

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // XML 1.0'ın kabul etmediği kontrol karakterleri (bir metinde kazara
    // bulunurlarsa Excel dosyayı 'bozuk' sayar) atılır. Sekme/satır sonu korunur.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

// A, B, … Z, AA, AB … — sütun indeksinden Excel harfi.
function columnLetter(index: number): string {
  let letter = "";
  let n = index;
  while (n >= 0) {
    letter = String.fromCharCode(65 + (n % 26)) + letter;
    n = Math.floor(n / 26) - 1;
  }
  return letter;
}

// Excel sekme adı kuralları: [ ] : * ? / \ yasak, en fazla 31 karakter, boş olamaz.
function safeSheetName(name: string, fallback: string): string {
  const cleaned = name.replace(/[[\]:*?/\\]/g, " ").trim().slice(0, 31);
  return cleaned.length > 0 ? cleaned : fallback;
}

// Otomatik sütun genişliği: en uzun hücrenin karakter sayısı, makul sınırlar
// içinde. Excel bir sütunu içeriğe göre kendiliğinden genişletmez — genişlik
// verilmezse uzun görev adları komşu hücrenin altında kaybolur.
function autoWidth(rows: CellValue[][], header: string, index: number): number {
  let longest = header.length;
  for (const row of rows) {
    const cell = row[index];
    if (cell == null) continue;
    const length = String(cell).length;
    if (length > longest) longest = length;
  }
  return Math.min(60, Math.max(10, longest + 2));
}

function cellXml(reference: string, value: CellValue, styleId: number): string {
  const style = styleId > 0 ? ` s="${styleId}"` : "";
  if (value == null || value === "") return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${reference}"${style}><v>${value}</v></c>`;
  }
  // `t="inlineStr"`: sharedStrings.xml tablosunu tamamen atlıyoruz. Rapor
  // dökümünde tekrar eden metin az; dosya birkaç KB büyür ama yazıcı yarı yarıya
  // basitleşir (ikinci bir XML + indeks eşlemesi yok).
  return `<c r="${reference}"${style} t="inlineStr"><is><t xml:space="preserve">${escapeXml(
    String(value),
  )}</t></is></c>`;
}

// styles.xml'de tanımlı 2 biçim: 0 = normal, 1 = kalın (başlıklar).
const STYLE_NORMAL = 0;
const STYLE_BOLD = 1;

function sheetXml(sheet: Sheet): string {
  const columns = sheet.columns ?? [];
  const bold = new Set(sheet.boldRows ?? []);
  const allRows: { cells: CellValue[]; bold: boolean }[] = [];
  if (columns.length > 0) {
    allRows.push({ cells: columns.map((column) => column.header), bold: true });
  }
  for (const [index, row] of sheet.rows.entries()) {
    allRows.push({ cells: row, bold: bold.has(index) });
  }

  const colsXml =
    columns.length > 0
      ? `<cols>${columns
          .map(
            (column, index) =>
              `<col min="${index + 1}" max="${index + 1}" width="${
                column.width ?? autoWidth(sheet.rows, column.header, index)
              }" customWidth="1"/>`,
          )
          .join("")}</cols>`
      : "";

  const rowsXml = allRows
    .map((row, rowIndex) => {
      const cells = row.cells
        .map((value, columnIndex) =>
          cellXml(
            `${columnLetter(columnIndex)}${rowIndex + 1}`,
            value,
            row.bold ? STYLE_BOLD : STYLE_NORMAL,
          ),
        )
        .join("");
      return `<row r="${rowIndex + 1}">${cells}</row>`;
    })
    .join("");

  // Başlık satırı `columns` verildiğinde donduruluyor: uzun görev dökümünde
  // aşağı kaydırırken hangi sütuna baktığın kaybolmasın.
  const freeze =
    columns.length > 0
      ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
      : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${freeze}${colsXml}<sheetData>${rowsXml}</sheetData></worksheet>`;
}

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

// ---- ZIP ----
// XLSX bir ZIP arşividir. Burada yalnızca ihtiyacımız olan alt küme var:
// deflate (yöntem 8), ZIP64 yok, şifreleme yok, dizin girdisi yok.

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let i = 0; i < 256; i += 1) {
    let c = i;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

function crc32(data: Buffer): number {
  let crc = -1;
  for (const byte of data) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

interface ZipEntry {
  path: string;
  data: Buffer;
}

function zip(entries: ZipEntry[]): Buffer {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.path, "utf-8");
    const compressed = deflateRawSync(entry.data);
    const checksum = crc32(entry.data);

    const local = Buffer.alloc(30 + name.length);
    local.writeUInt32LE(0x04034b50, 0); // yerel başlık imzası
    local.writeUInt16LE(20, 4); // çıkarmak için gereken sürüm (2.0)
    local.writeUInt16LE(0x0800, 6); // bayraklar: dosya adı UTF-8
    local.writeUInt16LE(8, 8); // yöntem: deflate
    local.writeUInt16LE(0, 10); // değişiklik saati (sabit)
    local.writeUInt16LE(0x2821, 12); // değişiklik tarihi (2020-01-01, sabit)
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(entry.data.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28); // ek alan yok
    name.copy(local, 30);
    locals.push(local, compressed);

    const central = Buffer.alloc(46 + name.length);
    central.writeUInt32LE(0x02014b50, 0); // merkezi dizin imzası
    central.writeUInt16LE(20, 4); // oluşturan sürüm
    central.writeUInt16LE(20, 6); // gereken sürüm
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x2821, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(compressed.length, 20);
    central.writeUInt32LE(entry.data.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt16LE(0, 30); // ek alan
    central.writeUInt16LE(0, 32); // yorum
    central.writeUInt16LE(0, 34); // disk numarası
    central.writeUInt16LE(0, 36); // iç öznitelikler
    central.writeUInt32LE(0, 38); // dış öznitelikler
    central.writeUInt32LE(offset, 42);
    name.copy(central, 46);
    centrals.push(central);

    offset += local.length + compressed.length;
  }

  const centralDirectory = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // merkezi dizin sonu imzası
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(offset, 16);
  end.writeUInt16LE(0, 20); // arşiv yorumu yok

  return Buffer.concat([...locals, centralDirectory, end]);
}

// ---- Genel API ----

/**
 * Sayfaları tek bir .xlsx dosyasına yazar. Boş `sheets` dizisi Excel'in
 * açamayacağı bir dosya üretirdi, bu yüzden en az bir sayfa şart.
 */
export function buildXlsx(sheets: Sheet[]): Buffer {
  if (sheets.length === 0) throw new Error("En az bir sayfa gerekli.");
  const names = sheets.map((sheet, index) => safeSheetName(sheet.name, `Sayfa${index + 1}`));

  const contentTypes = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${sheets
  .map(
    (_, index) =>
      `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
  )
  .join("\n")}
</Types>`;

  const rootRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`;

  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${names
    .map((name, index) => `<sheet name="${escapeXml(name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join("")}</sheets>
</workbook>`;

  // styles.xml ilişkisi sayfalardan SONRA gelen bir rId almalı — sayfa
  // r:id'leri workbook.xml'de sırayla rId1..rIdN olarak yazılıyor.
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${sheets
  .map(
    (_, index) =>
      `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`,
  )
  .join("\n")}
<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

  return zip([
    { path: "[Content_Types].xml", data: Buffer.from(contentTypes, "utf-8") },
    { path: "_rels/.rels", data: Buffer.from(rootRels, "utf-8") },
    { path: "xl/workbook.xml", data: Buffer.from(workbook, "utf-8") },
    { path: "xl/_rels/workbook.xml.rels", data: Buffer.from(workbookRels, "utf-8") },
    { path: "xl/styles.xml", data: Buffer.from(STYLES_XML, "utf-8") },
    ...sheets.map((sheet, index) => ({
      path: `xl/worksheets/sheet${index + 1}.xml`,
      data: Buffer.from(sheetXml(sheet), "utf-8"),
    })),
  ]);
}

/** Türkçe karakterleri ASCII'ye indirger — dosya adı her sistemde açılsın. */
export function xlsxFileName(parts: string[]): string {
  const map: Record<string, string> = {
    ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
    Ç: "c", Ğ: "g", İ: "i", I: "i", Ö: "o", Ş: "s", Ü: "u",
  };
  const slug = parts
    .join("-")
    .split("")
    .map((character) => map[character] ?? character)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${slug || "rapor"}.xlsx`;
}

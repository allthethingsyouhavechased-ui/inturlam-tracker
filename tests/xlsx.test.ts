// Elle yazılmış bir ZIP/XLSX üreticisi sessizce bozulabilir: Excel dosyayı
// açamayınca "onarılsın mı?" der, hata mesajı bize ulaşmaz. Bu testler dosyayı
// gerçekten AÇARAK (kendi zip okuyucumuzla) yapıyı doğruluyor.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { inflateRawSync } from "node:zlib";
import { buildXlsx, xlsxFileName } from "@/lib/xlsx";

// Excel (ve her gerçek zip okuyucu) arşivi SONDAN okur: merkezi dizin sonu →
// merkezi dizin → her girdinin yerel başlık offset'i. Yerel başlıkları sırayla
// taramak bu zinciri doğrulamaz; offset'lerden biri bir bayt kaysa dosya bizim
// testimizden geçer, Excel'de "onarılsın mı?" der. Bu yüzden okuyucu tam olarak
// o yolu izliyor.
function readZipViaCentralDirectory(buffer: Buffer): Map<string, string> {
  const end = buffer.length - 22;
  assert.equal(buffer.readUInt32LE(end), 0x06054b50, "merkezi dizin sonu imzası");
  const entryCount = buffer.readUInt16LE(end + 10);
  let cursor = buffer.readUInt32LE(end + 16);

  const entries = new Map<string, string>();
  for (let index = 0; index < entryCount; index += 1) {
    assert.equal(buffer.readUInt32LE(cursor), 0x02014b50, "merkezi dizin girdi imzası");
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf-8", cursor + 46, cursor + 46 + nameLength);

    // Merkezi dizinin işaret ettiği yerde gerçekten o girdinin yerel başlığı
    // olmalı — offset hesabındaki bir hata tam olarak burada yakalanır.
    assert.equal(buffer.readUInt32LE(localOffset), 0x04034b50, `${name}: yerel başlık`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    assert.equal(
      buffer.toString("utf-8", localOffset + 30, localOffset + 30 + localNameLength),
      name,
    );

    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    entries.set(
      name,
      inflateRawSync(buffer.subarray(dataStart, dataStart + compressedSize)).toString("utf-8"),
    );
    cursor += 46 + nameLength + buffer.readUInt16LE(cursor + 30) + buffer.readUInt16LE(cursor + 32);
  }
  return entries;
}

// Yerel başlıkları sırayla tarayan ikinci okuyucu: iki yolun AYNI dosyaları
// vermesi, iki yapının birbiriyle tutarlı olduğunu gösterir.
function readZip(buffer: Buffer): Map<string, string> {
  const entries = new Map<string, string>();
  let offset = 0;
  while (buffer.readUInt32LE(offset) === 0x04034b50) {
    const compressedSize = buffer.readUInt32LE(offset + 18);
    const nameLength = buffer.readUInt16LE(offset + 26);
    const extraLength = buffer.readUInt16LE(offset + 28);
    const name = buffer.toString("utf-8", offset + 30, offset + 30 + nameLength);
    const dataStart = offset + 30 + nameLength + extraLength;
    const data = buffer.subarray(dataStart, dataStart + compressedSize);
    entries.set(name, inflateRawSync(data).toString("utf-8"));
    offset = dataStart + compressedSize;
  }
  return entries;
}

describe("buildXlsx", () => {
  const workbook = buildXlsx([
    {
      name: "Özet",
      rows: [["İNTURLAM"], ["Dönemde açılan", 12]],
      boldRows: [0],
    },
    {
      name: "Görev dökümü",
      columns: [{ header: "Görev" }, { header: "Marka" }, { header: "Kategori" }],
      rows: [["Kapak & <görsel>", "Sihirli Olta", "Balık & Deniz"]],
    },
  ]);
  const files = readZip(workbook);

  it("Excel'in beklediği paket dosyalarını üretiyor", () => {
    assert.deepEqual(
      [...files.keys()],
      [
        "[Content_Types].xml",
        "_rels/.rels",
        "xl/workbook.xml",
        "xl/_rels/workbook.xml.rels",
        "xl/styles.xml",
        "xl/worksheets/sheet1.xml",
        "xl/worksheets/sheet2.xml",
      ],
    );
  });

  it("merkezi dizinden okunduğunda da aynı dosyaları veriyor", () => {
    // Excel'in izlediği yol. Assertion'ların çoğu okuyucunun içinde.
    const viaDirectory = readZipViaCentralDirectory(workbook);
    assert.deepEqual([...viaDirectory.keys()], [...files.keys()]);
    assert.deepEqual([...viaDirectory.values()], [...files.values()]);
  });

  it("sayfa adlarını ve ilişkilerini eşleştiriyor", () => {
    const bookXml = files.get("xl/workbook.xml")!;
    assert.match(bookXml, /name="Özet" sheetId="1" r:id="rId1"/);
    assert.match(bookXml, /name="Görev dökümü" sheetId="2" r:id="rId2"/);
    // styles.xml sayfalardan SONRAKİ rId'yi almalı, yoksa Excel biçimleri
    // bir sayfaya bağlamaya çalışır ve dosyayı reddeder.
    const relsXml = files.get("xl/_rels/workbook.xml.rels")!;
    assert.match(relsXml, /Id="rId3"[^>]*Target="styles\.xml"/);
  });

  it("metni XML'e kaçırıyor, sayıyı sayı olarak yazıyor", () => {
    const sheet2 = files.get("xl/worksheets/sheet2.xml")!;
    assert.match(sheet2, /Kapak &amp; &lt;görsel&gt;/);
    assert.ok(!sheet2.includes("<görsel>"), "kaçırılmamış açı parantezi kalmamalı");

    const sheet1 = files.get("xl/worksheets/sheet1.xml")!;
    assert.match(sheet1, /<c r="B2"><v>12<\/v><\/c>/, "sayı inlineStr değil <v> olmalı");
    assert.match(sheet1, /<c r="A1" s="1" t="inlineStr">/, "kalın satır s=\"1\" almalı");
  });

  it("başlıklı sayfada başlık satırını donduruyor ve sütun genişliği veriyor", () => {
    const sheet2 = files.get("xl/worksheets/sheet2.xml")!;
    assert.match(sheet2, /<pane ySplit="1"/);
    assert.match(sheet2, /<col min="1" max="1" width="\d+"/);
    // Başlıksız özet sayfasında dondurma olmamalı.
    assert.ok(!files.get("xl/worksheets/sheet1.xml")!.includes("<pane"));
  });

  it("en az bir sayfa istiyor", () => {
    assert.throws(() => buildXlsx([]), /En az bir sayfa/);
  });
});

describe("xlsxFileName", () => {
  it("Türkçe karakterleri sadeleştirip .xlsx uzantısı veriyor", () => {
    assert.equal(xlsxFileName(["Özgür Şahin", "rapor"]), "ozgur-sahin-rapor.xlsx");
    // Alt çizgi/boşluk gibi her ayırıcı tek bir tireye iniyor: dosya adı her
    // işletim sisteminde ve tarayıcıda aynı görünsün.
    assert.equal(
      xlsxFileName(["inturlam", "rapor", "2026-07-01_2026-07-31"]),
      "inturlam-rapor-2026-07-01-2026-07-31.xlsx",
    );
    assert.equal(xlsxFileName(["///"]), "rapor.xlsx");
  });
});

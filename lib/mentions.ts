import type { Person } from "@/lib/types";

// Yorum gövdesindeki "@İsim" bahsetmelerini bulur/tekilleştirir. Saf fonksiyon,
// DB'ye dokunmaz — hem bildirim oluşturma (lib/actions/comments.ts) hem de
// yorum metnindeki vurgulama (components/CommentItem.tsx) AYNI bu dosyayı
// kullanır ki "kim bildirim alıyor" ile "hangi metin vurgulanıyor" birbirinden
// asla sapmasın.
//
// Türkçe isimler boşluk içerebilir ("Yunus Emre") ve büyük/küçük harf dönüşümü
// ASCII'den farklı çalışır (İ→i, I→ı). SQLite `COLLATE NOCASE` yalnızca
// ASCII a-z/A-Z'yi katlar, locale'siz `toLowerCase()` da "İ"yi "i" + birleşen
// nokta işaretine çevirip normal klavyeyle yazılmış "i" ile eşleşmeyi
// bozar — bu yüzden `lib/repositories/search.ts`nin benimsediği
// `toLocaleLowerCase("tr-TR")` deseni burada da kullanılıyor (bkz. commit
// d124eb0).

export interface MentionMatch {
  person: Person;
  start: number;
  end: number;
}

function foldTr(value: string): string {
  return value.toLocaleLowerCase("tr-TR");
}

// "@" işaretinin bir mention'ı mı yoksa daha uzun bir kelimenin/e-posta
// benzeri bir dizinin parçasını mı belirttiğini ayırt etmek için: eşleşen
// ismin hemen öncesinde/sonrasında harf ya da rakam VARSA bu isim değil, daha
// uzun başka bir dizinin önekidir.
function isNameChar(ch: string | undefined): boolean {
  return !!ch && /[\p{L}\p{N}]/u.test(ch);
}

function rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Metindeki tüm "@İsim" eşleşmelerini, metindeki geçiş sırasına göre döner.
 *
 * En uzun aktif kişi adı önce denenir: "Yunus" ve "Yunus Emre" gibi biri
 * diğerinin öneki olan iki isim varsa "@Yunus Emre" bütün olarak "Yunus
 * Emre"ye bağlanır — o aralık `claimed`e girer ve daha kısa "Yunus" adı için
 * AYNI aralıkta ikinci (yanlış/kısmi) bir eşleşme sayılmaz. "Yunus" başka bir
 * yerde tek başına geçiyorsa (farklı bir aralıkta) yine kendi başına eşleşir.
 */
export function findMentionMatches(body: string, people: Person[]): MentionMatch[] {
  if (!body || people.length === 0) return [];

  const candidates = [...people].sort((a, b) => b.name.length - a.name.length);
  const folded = foldTr(body);
  const claimed: Array<[number, number]> = [];
  const matches: MentionMatch[] = [];

  for (const person of candidates) {
    const needle = "@" + foldTr(person.name);
    let searchFrom = 0;
    while (searchFrom <= folded.length) {
      const idx = folded.indexOf(needle, searchFrom);
      if (idx === -1) break;
      const end = idx + needle.length;
      searchFrom = idx + 1;

      // Devamı harf/rakamla sürüyorsa bu isim değil, daha uzun BAŞKA bir
      // kelimenin öneki — "@Yunusxyz" "Yunus" demek değildir.
      if (isNameChar(folded[end])) continue;
      // "@" öncesi harf/rakamsa mention tetikleyicisi değildir
      // (ör. "mail@yunus" bir bahsetme değil, e-postaya benzer bir dizidir).
      if (idx > 0 && isNameChar(folded[idx - 1])) continue;
      // Aralık daha uzun bir isim tarafından zaten claim edildiyse atla.
      if (claimed.some(([s, e]) => rangesOverlap(idx, end, s, e))) continue;

      claimed.push([idx, end]);
      matches.push({ person, start: idx, end });
    }
  }

  return matches.sort((a, b) => a.start - b.start);
}

// Bir yorumda bahsedilen kişilerin tekilleştirilmiş listesi (bildirim
// oluşturmak için) — aynı kişi birden çok kez bahsedilse de sonuçta bir kez
// geçer, ilk geçtiği sıradaki konumu korunur.
export function extractMentionedPeople(body: string, people: Person[]): Person[] {
  const seen = new Set<string>();
  const result: Person[] = [];
  for (const { person } of findMentionMatches(body, people)) {
    if (seen.has(person.id)) continue;
    seen.add(person.id);
    result.push(person);
  }
  return result;
}

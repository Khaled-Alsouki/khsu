import { applyRound, createEmptyStats, sanitizeStats } from "@/lib/stats";
import { loadStats, removeStorage, saveStats } from "@/lib/storage";
import type { RoundResult } from "@/types";

const TEST_KEY = "pattern-game:selftest";

export interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const round = (over: Partial<RoundResult> = {}): RoundResult => ({
  playedAt: 1,
  score: 100,
  correct: 10,
  wrong: 2,
  bestStreak: 5,
  maxLevelReached: 3,
  ...over,
});

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b);
const show = (value: unknown): string => JSON.stringify(value);

export function runStorageChecks(): CheckResult[] {
  const results: CheckResult[] = [];
  const check = (name: string, ok: boolean, detail = ""): void => {
    results.push({ name, ok, detail });
  };

  // ===== sanitizeStats =====
  check("تنظيف: null ← إحصائيات فارغة", same(sanitizeStats(null), createEmptyStats()));

  const garbage = sanitizeStats({
    highScore: "x",
    longestStreak: null,
    recentRounds: 5,
    mistakesByType: [1, 2],
  });
  check("تنظيف: أنواع خاطئة ← قيم افتراضية", same(garbage, createEmptyStats()), show(garbage));

  const bad = sanitizeStats({
    highScore: -5,
    longestStreak: Number.NaN,
    roundsPlayed: Number.POSITIVE_INFINITY,
    totalScore: 12.9,
  });
  check(
    "تنظيف: سالب/NaN/∞ ← 0، والكسر يُقرَّب للأسفل",
    bad.highScore === 0 && bad.longestStreak === 0 && bad.roundsPlayed === 0 && bad.totalScore === 12,
    show(bad)
  );

  const valid = {
    highScore: 200,
    longestStreak: 7,
    roundsPlayed: 4,
    totalScore: 500,
    mistakesByType: { squares: 3 },
    recentRounds: [round({ playedAt: 9 })],
  };
  check("تنظيف: البيانات السليمة تبقى كما هي", same(sanitizeStats(valid), valid), show(sanitizeStats(valid)));

  const many = Array.from({ length: 12 }, (_, i) => round({ playedAt: i + 1 }));
  const trimmed = sanitizeStats({ recentRounds: [...many, { bad: true }] });
  check(
    "تنظيف: يحذف الجولات التالفة ويُبقي آخر 10 فقط",
    trimmed.recentRounds.length === 10 &&
      trimmed.recentRounds[0]?.playedAt === 3 &&
      trimmed.recentRounds[9]?.playedAt === 12,
    show(trimmed.recentRounds.map((r) => r.playedAt))
  );

  const clamped = sanitizeStats({
    recentRounds: [
      { ...round(), maxLevelReached: 99 },
      { ...round(), maxLevelReached: 0 },
    ],
  });
  check(
    "تنظيف: المستوى يُقيَّد بين 1 و10",
    clamped.recentRounds[0]?.maxLevelReached === 10 && clamped.recentRounds[1]?.maxLevelReached === 1,
    show(clamped.recentRounds.map((r) => r.maxLevelReached))
  );

  const mistakes = sanitizeStats({
    mistakesByType: { squares: 3, geometric: -1, fibonacci: "x" },
  });
  check("تنظيف: أخطاء الأنماط تحتفظ بالقيم الموجبة فقط", same(mistakes.mistakesByType, { squares: 3 }), show(mistakes.mistakesByType));

  // ===== applyRound =====
  const first = applyRound(createEmptyStats(), round({ score: 120, bestStreak: 6 }));
  check(
    "جولة: الأولى تحدّث كل الحقول",
    first.stats.highScore === 120 &&
      first.stats.longestStreak === 6 &&
      first.stats.roundsPlayed === 1 &&
      first.stats.totalScore === 120 &&
      first.stats.recentRounds.length === 1,
    show(first.stats)
  );
  check("جولة: تجاوز الرقم القياسي ← isNewHighScore = true", first.isNewHighScore);

  const lower = applyRound(first.stats, round({ score: 80 }));
  check(
    "جولة: نتيجة أقل تُبقي الرقم القياسي و isNewHighScore = false",
    lower.stats.highScore === 120 && !lower.isNewHighScore && lower.stats.totalScore === 200,
    show(lower)
  );

  const zero = applyRound(createEmptyStats(), round({ score: 0, bestStreak: 0 }));
  check("جولة: النتيجة 0 في أول جولة ليست رقماً قياسياً", !zero.isNewHighScore && zero.stats.roundsPlayed === 1);

  const streak = applyRound(first.stats, round({ score: 10, bestStreak: 2 }));
  check("جولة: أطول سلسلة تحتفظ بالأكبر", streak.stats.longestStreak === 6, show(streak.stats));

  const m1 = applyRound(createEmptyStats(), round(), { squares: 2, geometric: 1 });
  const m2 = applyRound(m1.stats, round(), { squares: 1, fibonacci: 4 });
  check(
    "جولة: دمج أخطاء الأنماط بين الجولات",
    same(m2.stats.mistakesByType, { squares: 3, geometric: 1, fibonacci: 4 }),
    show(m2.stats.mistakesByType)
  );

  let acc = createEmptyStats();
  for (let i = 1; i <= 13; i++) acc = applyRound(acc, round({ playedAt: i })).stats;
  check(
    "جولة: آخر 10 فقط والأحدث في النهاية (4 ... 13)",
    acc.recentRounds.length === 10 &&
      acc.recentRounds[0]?.playedAt === 4 &&
      acc.recentRounds[9]?.playedAt === 13 &&
      acc.roundsPlayed === 13,
    show(acc.recentRounds.map((r) => r.playedAt))
  );

  const original = createEmptyStats();
  const snapshot = JSON.stringify(original);
  applyRound(original, round(), { squares: 2 });
  check("جولة: لا تعدّل الكائن الأصلي", JSON.stringify(original) === snapshot);

  // ===== التخزين الفعلي (بمفتاح اختباري لا يمس بياناتك) =====
  const toSave = applyRound(createEmptyStats(), round({ score: 77 }), { squares: 2 }).stats;
  removeStorage(TEST_KEY);
  const written = saveStats(toSave, TEST_KEY);
  const loaded = loadStats(TEST_KEY);
  check("تخزين: حفظ ثم تحميل يعطيان نفس البيانات", written && same(loaded, toSave), show(loaded));

  window.localStorage.setItem(TEST_KEY, "{bad json");
  check("تخزين: JSON تالف ← إحصائيات فارغة بلا انهيار", same(loadStats(TEST_KEY), createEmptyStats()));

  removeStorage(TEST_KEY);
  check("تخزين: مفتاح غير موجود ← إحصائيات فارغة", same(loadStats(TEST_KEY), createEmptyStats()));

  return results;
}
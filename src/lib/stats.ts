import {
  EMPTY_STATS,
  type Level,
  type PatternMistakes,
  type PatternType,
  type PersistedStats,
  type RoundResult,
} from "@/types";

/** عدد الجولات الأخيرة المحفوظة للرسم البياني */
export const MAX_RECENT_ROUNDS = 10;

/**
 * نسخة جديدة فارغة من الإحصائيات.
 * نستخدمها بدل EMPTY_STATS مباشرة حتى لا نشارك كائنات قابلة للتعديل.
 */
export function createEmptyStats(): PersistedStats {
  return { ...EMPTY_STATS, mistakesByType: {}, recentRounds: [] };
}

// ─────────── تنظيف البيانات (البيانات المحفوظة غير موثوقة) ───────────

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** عدد صحيح غير سالب، وأي قيمة غير صالحة تصبح 0 */
function nonNegativeInt(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.floor(value)
    : 0;
}

function sanitizeRound(raw: unknown): RoundResult | null {
  if (!isRecord(raw)) return null;
  if (typeof raw.score !== "number" || typeof raw.playedAt !== "number") return null;

  const level = Math.min(10, Math.max(1, nonNegativeInt(raw.maxLevelReached)));
  return {
    playedAt: nonNegativeInt(raw.playedAt),
    score: nonNegativeInt(raw.score),
    correct: nonNegativeInt(raw.correct),
    wrong: nonNegativeInt(raw.wrong),
    bestStreak: nonNegativeInt(raw.bestStreak),
    maxLevelReached: level as Level,
  };
}

function sanitizeMistakes(raw: unknown): PatternMistakes {
  const result: PatternMistakes = {};
  if (!isRecord(raw)) return result;
  for (const [key, value] of Object.entries(raw)) {
    const count = nonNegativeInt(value);
    if (count > 0) result[key as PatternType] = count;
  }
  return result;
}

/** يحوّل أي قيمة مقروءة من التخزين إلى إحصائيات سليمة */
export function sanitizeStats(raw: unknown): PersistedStats {
  if (!isRecord(raw)) return createEmptyStats();

  const recentRounds = Array.isArray(raw.recentRounds)
    ? raw.recentRounds
        .map(sanitizeRound)
        .filter((round): round is RoundResult => round !== null)
        .slice(-MAX_RECENT_ROUNDS)
    : [];

  return {
    highScore: nonNegativeInt(raw.highScore),
    longestStreak: nonNegativeInt(raw.longestStreak),
    roundsPlayed: nonNegativeInt(raw.roundsPlayed),
    totalScore: nonNegativeInt(raw.totalScore),
    mistakesByType: sanitizeMistakes(raw.mistakesByType),
    recentRounds,
  };
}

// ─────────── تطبيق نتيجة جولة ───────────

export interface AppliedRound {
  stats: PersistedStats;
  /** هل حطّمت هذه الجولة الرقم القياسي السابق؟ */
  isNewHighScore: boolean;
}

/**
 * يطبّق نتيجة جولة على الإحصائيات ويُرجع نسخة جديدة (لا يعدّل الأصل).
 * @param mistakes عدد الأخطاء لكل نوع نمط في هذه الجولة
 */
export function applyRound(
  stats: PersistedStats,
  round: RoundResult,
  mistakes: PatternMistakes = {}
): AppliedRound {
  const merged: PatternMistakes = { ...stats.mistakesByType };
  for (const [key, value] of Object.entries(mistakes)) {
    if (typeof value !== "number" || value <= 0) continue;
    const type = key as PatternType;
    merged[type] = (merged[type] ?? 0) + value;
  }

  return {
    stats: {
      highScore: Math.max(stats.highScore, round.score),
      longestStreak: Math.max(stats.longestStreak, round.bestStreak),
      roundsPlayed: stats.roundsPlayed + 1,
      totalScore: stats.totalScore + round.score,
      mistakesByType: merged,
      recentRounds: [...stats.recentRounds, round].slice(-MAX_RECENT_ROUNDS),
    },
    isNewHighScore: round.score > stats.highScore,
  };
}
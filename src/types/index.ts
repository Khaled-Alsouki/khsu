// ═══════════════════════════════════════════
// أنواع اللعبة الأساسية
// ═══════════════════════════════════════════

/** مستوى الصعوبة من 1 إلى 10 */
export type Level = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** حالة اللعبة */
export type GameStatus = "idle" | "playing" | "result";

/** فئة الصعوبة العامة */
export type DifficultyTier = "easy" | "medium" | "hard";

/** معرّفات أنواع الأنماط */
export type PatternType =
  | "arithmetic-add"
  | "arithmetic-sub"
  | "color-alternate"
  | "letter-alternate"
  | "geometric"
  | "fibonacci"
  | "squares"
  | "color-triple"
  | "even-odd"
  | "alphabet"
  | "cubes"
  | "primes"
  | "interleaved"
  | "shapes-complex"
  | "growing-diff"
  | "mixed"
  | "general-knowledge"
  | "syrian-proverbs";

/** نوع العناصر المعروضة في التسلسل */
export type ItemKind = "number" | "color" | "letter" | "shape" | "text";

/** عنصر واحد في التسلسل أو في الخيارات */
export interface PatternItem {
  kind: ItemKind;
  /** القيمة المعروضة (رقم، إيموجي، حرف...) */
  value: string | number;
}

/** لغز كامل */
export interface Puzzle {
  /** معرّف فريد لمنع تكرار اللغز في الجولة */
  id: string;
  type: PatternType;
  level: Level;
  /** نص السؤال في اختبارات المعلومات والأمثال */
  question?: string;
  /** العناصر الظاهرة (بدون المجهول) */
  sequence: PatternItem[];
  /** الإجابة الصحيحة */
  answer: PatternItem;
  /** 4 خيارات مرتبة عشوائياً وتتضمن الإجابة */
  options: PatternItem[];
}

/** دالة مولّد: تأخذ المستوى وتُرجع لغزاً */
export type PuzzleGenerator = (level: Level) => Puzzle;

/** سجل المولّدات المسجّلة */
export interface GeneratorConfig {
  type: PatternType;
  /** أدنى مستوى يظهر فيه هذا النمط */
  minLevel: Level;
  /** أعلى مستوى يظهر فيه */
  maxLevel: Level;
  /** وزن الظهور (الأعلى = أكثر تكراراً) */
  weight: number;
  generate: PuzzleGenerator;
}

// ═══════════════════════════════════════════
// نتائج الجولة والإحصائيات
// ═══════════════════════════════════════════

/** ملخّص جولة واحدة */
export interface RoundResult {
  /** وقت انتهاء الجولة (timestamp) */
  playedAt: number;
  score: number;
  correct: number;
  wrong: number;
  bestStreak: number;
  maxLevelReached: Level;
}

/** إحصائيات الأخطاء لكل نوع نمط */
export type PatternMistakes = Partial<Record<PatternType, number>>;

/** البيانات المحفوظة في localStorage */
export interface PersistedStats {
  highScore: number;
  longestStreak: number;
  roundsPlayed: number;
  totalScore: number;
  mistakesByType: PatternMistakes;
  /** آخر 10 جولات للرسم البياني */
  recentRounds: RoundResult[];
}

export const EMPTY_STATS: PersistedStats = {
  highScore: 0,
  longestStreak: 0,
  roundsPlayed: 0,
  totalScore: 0,
  mistakesByType: {},
  recentRounds: [],
};

// ═══════════════════════════════════════════
// ثوابت اللعبة
// ═══════════════════════════════════════════

export const ROUND_DURATION_SEC = 60;
export const WRONG_FEEDBACK_DELAY_MS = 800;
export const STORAGE_KEY = "pattern-game:v1";
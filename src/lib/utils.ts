import type { Level, PatternItem, PatternType, Puzzle } from "@/types";

/** عدد صحيح عشوائي بين min و max (شاملين) */
export function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** اختيار عنصر عشوائي (يشترط ألا تكون المصفوفة فارغة) */
export function pick<T>(items: readonly T[]): T {
  return items[randInt(0, items.length - 1)] as T;
}

/** خلط Fisher-Yates بدون تعديل المصفوفة الأصلية */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [result[i], result[j]] = [result[j] as T, result[i] as T];
  }
  return result;
}

/** عنصر من دورة متكررة (للأنماط المتناوبة) */
export function cycleAt<T>(cycle: readonly T[], index: number): T {
  return cycle[index % cycle.length] as T;
}

/** إنشاء عنصر رقمي */
export function num(value: number): PatternItem {
  return { kind: "number", value };
}

/** مفتاح فريد للعنصر (للمقارنة ومنع التكرار بين الخيارات) */
export function itemKey(item: PatternItem): string {
  return `${item.kind}:${item.value}`;
}

interface BuildPuzzleParams {
  type: PatternType;
  level: Level;
  sequence: PatternItem[];
  answer: PatternItem;
  options: PatternItem[];
}

/**
 * بناء لغز كامل. المعرّف مشتق من محتوى اللغز نفسه،
 * فيمكن للموزّع منع تكرار نفس اللغز داخل الجولة بمقارنة المعرّفات.
 */
export function buildPuzzle(params: BuildPuzzleParams): Puzzle {
  const id = `${params.type}|${params.sequence
    .map((item) => item.value)
    .join(",")}|${params.answer.value}`;
  return { id, ...params };
}
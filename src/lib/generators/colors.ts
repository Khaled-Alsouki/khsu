import type { Level, PatternItem, Puzzle } from "@/types";
import { buildItemOptions } from "@/lib/distractors";
import { buildPuzzle, cycleAt, shuffle } from "@/lib/utils";

const COLOR_EMOJIS = ["🔴", "🔵", "🟢", "🟡", "🟣", "🟠"] as const;

export const COLOR_POOL: readonly PatternItem[] = COLOR_EMOJIS.map(
  (value): PatternItem => ({ kind: "color", value })
);

/** بناء لغز دوري: نختار cycleSize ألوان ونكرّرها بالترتيب */
function buildCyclePuzzle(
  type: "color-alternate" | "color-triple",
  level: Level,
  cycleSize: number,
  length: number
): Puzzle {
  const cycle = shuffle(COLOR_POOL).slice(0, cycleSize);
  const sequence = Array.from({ length }, (_, i) => cycleAt(cycle, i));
  const answer = cycleAt(cycle, length);
  // الخيارات الخاطئة تُفضَّل من ألوان التسلسل نفسه لأنها الأكثر إغراءً
  const options = buildItemOptions(answer, COLOR_POOL, sequence);
  return buildPuzzle({ type, level, sequence, answer, options });
}

/** تناوب لوني: 🔴 🔵 🔴 🔵 ? */
export function generateColorAlternate(level: Level): Puzzle {
  return buildCyclePuzzle("color-alternate", level, 2, level <= 2 ? 4 : 5);
}

/** تناوب ثلاثي: 🔴 🔵 🟢 🔴 🔵 ? */
export function generateColorTriple(level: Level): Puzzle {
  return buildCyclePuzzle("color-triple", level, 3, 5);
}
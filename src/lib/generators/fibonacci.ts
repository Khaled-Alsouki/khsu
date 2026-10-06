import type { Level, Puzzle } from "@/types";
import { buildNumericOptions } from "@/lib/distractors";
import { buildPuzzle, num, pick } from "@/lib/utils";

/** بذور كل مستوى: [الأول, الثاني] */
const EASY_SEEDS: ReadonlyArray<readonly [number, number]> = [
  [1, 1],
  [1, 2],
  [2, 1],
  [2, 3],
];
const HARD_SEEDS: ReadonlyArray<readonly [number, number]> = [
  [1, 3],
  [3, 4],
  [2, 5],
  [4, 3],
  [5, 2],
  [3, 7],
];

/** فيبوناتشي: 1, 1, 2, 3, 5, ? (كل عنصر = مجموع السابقين) */
export function generateFibonacci(level: Level): Puzzle {
  const [a, b] = pick(level <= 6 ? EASY_SEEDS : HARD_SEEDS);
  const length = level <= 7 ? 5 : 6;

  const terms: number[] = [];
  let x = a;
  let y = b;
  for (let i = 0; i < length; i++) {
    terms.push(x);
    const next = x + y;
    x = y;
    y = next;
  }
  // بعد الحلقة: x هو العنصر التالي = الإجابة
  const answerValue = x;
  const last = terms[length - 1] ?? 0;
  const prev = terms[length - 2] ?? 0;

  // أخطاء شائعة: مضاعفة الأخير، أو إضافة نفس الفرق السابق
  const smart = [last * 2, 2 * last - prev, answerValue + 1, answerValue - 1];

  return buildPuzzle({
    type: "fibonacci",
    level,
    sequence: terms.map((t) => num(t)),
    answer: num(answerValue),
    options: buildNumericOptions(answerValue, {
      step: Math.max(1, Math.round(answerValue / 10)),
      smart,
    }),
  });
}
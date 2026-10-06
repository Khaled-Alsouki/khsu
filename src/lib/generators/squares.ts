import type { Level, Puzzle } from "@/types";
import { buildNumericOptions } from "@/lib/distractors";
import { buildPuzzle, num, randInt } from "@/lib/utils";

interface SquaresParams {
  minN: number;
  maxN: number;
  length: number;
}

function paramsFor(level: Level): SquaresParams {
  if (level <= 5) return { minN: 1, maxN: 3, length: 4 };
  if (level === 6) return { minN: 1, maxN: 5, length: 5 };
  return { minN: 3, maxN: 12, length: 5 };
}

/** مربعات: 1, 4, 9, 16, ? (قد تبدأ من n أكبر من 1 في المستويات العليا) */
export function generateSquares(level: Level): Puzzle {
  const p = paramsFor(level);
  const startN = randInt(p.minN, p.maxN);
  const termAt = (i: number): number => (startN + i) ** 2;

  const sequence = Array.from({ length: p.length }, (_, i) => num(termAt(i)));
  const answerValue = termAt(p.length);
  const last = termAt(p.length - 1);
  const prev = termAt(p.length - 2);

  // الخطأ الشائع: تكرار نفس الفرق الأخير (16 + 7 = 23 بدل 25)
  const smart = [2 * last - prev, answerValue - 1, answerValue + 1];

  return buildPuzzle({
    type: "squares",
    level,
    sequence,
    answer: num(answerValue),
    options: buildNumericOptions(answerValue, { step: 2, smart }),
  });
}
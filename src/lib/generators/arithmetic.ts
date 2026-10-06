import type { Level, Puzzle } from "@/types";
import { buildNumericOptions } from "@/lib/distractors";
import { buildPuzzle, num, randInt } from "@/lib/utils";

interface ArithmeticParams {
  /** عدد العناصر الظاهرة */
  length: number;
  minStep: number;
  maxStep: number;
  maxStart: number;
}

/** المعاملات حسب المستوى: كلما ارتفع زادت الخطوة والطول */
function paramsFor(level: Level): ArithmeticParams {
  if (level <= 1) return { length: 4, minStep: 2, maxStep: 5, maxStart: 10 };
  if (level === 2) return { length: 4, minStep: 2, maxStep: 9, maxStart: 20 };
  if (level === 3) return { length: 5, minStep: 3, maxStep: 12, maxStart: 40 };
  if (level <= 6) return { length: 5, minStep: 3, maxStep: 20, maxStart: 100 };
  return { length: 6, minStep: 6, maxStep: 40, maxStart: 200 };
}

/** حسابي (+ ثابت): 2, 4, 6, 8, ? */
export function generateArithmeticAdd(level: Level): Puzzle {
  const p = paramsFor(level);
  const step = randInt(p.minStep, p.maxStep);
  const start = randInt(0, p.maxStart);
  const termAt = (i: number): number => start + step * i;

  const sequence = Array.from({ length: p.length }, (_, i) => num(termAt(i)));
  const answerValue = termAt(p.length);

  return buildPuzzle({
    type: "arithmetic-add",
    level,
    sequence,
    answer: num(answerValue),
    options: buildNumericOptions(answerValue, { step }),
  });
}

/** حسابي (- ثابت): 20, 15, 10, 5, ? (لا يعطي إجابة سالبة أبداً) */
export function generateArithmeticSub(level: Level): Puzzle {
  const p = paramsFor(level);
  const step = randInt(p.minStep, p.maxStep);
  // البداية تضمن أن الإجابة >= 0
  const start = step * p.length + randInt(0, p.maxStart);
  const termAt = (i: number): number => start - step * i;

  const sequence = Array.from({ length: p.length }, (_, i) => num(termAt(i)));
  const answerValue = termAt(p.length);

  return buildPuzzle({
    type: "arithmetic-sub",
    level,
    sequence,
    answer: num(answerValue),
    options: buildNumericOptions(answerValue, { step }),
  });
}
import type { Level, Puzzle } from "@/types";
import { buildNumericOptions } from "@/lib/distractors";
import { buildPuzzle, num, pick, randInt } from "@/lib/utils";

interface GeometricParams {
  ratios: readonly number[];
  maxStart: number;
  length: number;
  /** احتمال أن يكون النمط تنازلياً (÷ ثابت) مثل 162, 54, 18, 6, ? */
  descendingChance: number;
}

/** أكبر قيمة مسموحة في اللغز (حتى تبقى الأرقام مقروءة) */
const MAX_VALUE = 5000;

function paramsFor(level: Level): GeometricParams {
  if (level <= 5) return { ratios: [2], maxStart: 5, length: 4, descendingChance: 0 };
  if (level === 6) return { ratios: [2, 3], maxStart: 5, length: 4, descendingChance: 0 };
  if (level <= 8)
    return { ratios: [2, 3, 4], maxStart: 6, length: 5, descendingChance: 0.25 };
  return { ratios: [2, 3, 4, 5], maxStart: 6, length: 5, descendingChance: 0.35 };
}

/** هندسي (× ثابت): 2, 4, 8, 16, ? */
export function generateGeometric(level: Level): Puzzle {
  const p = paramsFor(level);
  const ratio = pick(p.ratios);
  const start = randInt(1, p.maxStart);
  const descending = Math.random() < p.descendingChance;

  // تقليل الطول إذا تجاوزت القيم الحد (لا ينزل عن 4 عناصر)
  let length = p.length;
  while (length > 4 && start * ratio ** length > MAX_VALUE) length--;

  // التنازلي: نفس المتتالية معكوسة، فتنتهي دائماً بعدد صحيح (= start)
  const termAt = (i: number): number =>
    start * ratio ** (descending ? length - i : i);

  const sequence = Array.from({ length }, (_, i) => num(termAt(i)));
  const answerValue = termAt(length);
  const last = termAt(length - 1);
  const prev = termAt(length - 2);

  // أخطاء شائعة: تطبيق قاعدة حسابية، أو خطأ في معامل الضرب
  const smart = descending
    ? [2 * last - prev, answerValue + 1, answerValue + ratio, last - 1]
    : [2 * last - prev, last * (ratio + 1), last * (ratio - 1)];

  return buildPuzzle({
    type: "geometric",
    level,
    sequence,
    answer: num(answerValue),
    options: buildNumericOptions(answerValue, {
      step: Math.max(1, Math.round(answerValue / 8)),
      smart,
    }),
  });
}
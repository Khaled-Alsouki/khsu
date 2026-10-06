import type { Puzzle } from "@/types";
import { itemKey } from "@/lib/utils";

/** يتحقق أن الإجابة تطابق قاعدة النمط (منطق مستقل عن المولّدات) */
function ruleHolds(puzzle: Puzzle): boolean {
  const full = [...puzzle.sequence, puzzle.answer];
  const all = full.map((item) => Number(item.value));
  const n = (i: number): number => all[i] ?? Number.NaN;
  const key = (i: number): string => {
    const item = full[i];
    return item ? itemKey(item) : `missing-${i}`;
  };

  switch (puzzle.type) {
    case "arithmetic-add":
    case "arithmetic-sub": {
      const d = n(1) - n(0);
      const directionOk = puzzle.type === "arithmetic-add" ? d > 0 : d < 0;
      return directionOk && all.every((_, i) => i === 0 || n(i) - n(i - 1) === d);
    }
    case "geometric": {
      // نسبة ثابتة (ضرب تبادلي لتفادي الكسور): a[i+1]*a[0] == a[i]*a[1]
      if (n(1) === n(0)) return false;
      return all.every((_, i) => i >= all.length - 1 || n(i + 1) * n(0) === n(i) * n(1));
    }
    case "fibonacci":
      return all.every((_, i) => i < 2 || n(i) === n(i - 1) + n(i - 2));
    case "squares": {
      const roots = all.map((v) => Math.sqrt(v));
      const r0 = roots[0] ?? Number.NaN;
      return roots.every((r, i) => Number.isInteger(r) && r === r0 + i);
    }
    case "color-alternate":
      return key(0) !== key(1) && full.every((_, i) => i < 2 || key(i) === key(i - 2));
    case "color-triple":
      return (
        new Set([key(0), key(1), key(2)]).size === 3 &&
        full.every((_, i) => i < 3 || key(i) === key(i - 3))
      );
    default:
      return true; // أنماط المراحل القادمة
  }
}

/** يُرجع قائمة الأخطاء (فارغة = لغز سليم) */
export function validatePuzzle(puzzle: Puzzle): string[] {
  const errors: string[] = [];
  const { sequence, answer, options } = puzzle;
  const isQuestion = puzzle.type === "general-knowledge" || puzzle.type === "syrian-proverbs";

  if (!puzzle.id) errors.push("معرّف فارغ");
  if (isQuestion && !puzzle.question?.trim()) errors.push("نص السؤال فارغ");
  if (isQuestion && sequence.length !== 0) errors.push("السؤال لا يحتاج إلى تسلسل");
  if (isQuestion && answer.kind !== "text") errors.push("إجابة السؤال يجب أن تكون نصية");
  if (!isQuestion && (sequence.length < 4 || sequence.length > 6)) {
    errors.push(`طول التسلسل ${sequence.length} خارج النطاق 4-6`);
  }
  if (options.length !== 4) errors.push(`عدد الخيارات ${options.length} بدل 4`);

  const keys = options.map(itemKey);
  if (new Set(keys).size !== keys.length) errors.push("خيارات مكررة");
  if (keys.filter((k) => k === itemKey(answer)).length !== 1) {
    errors.push("الإجابة الصحيحة ليست موجودة مرة واحدة بالضبط في الخيارات");
  }
  if (options.some((o) => o.kind !== answer.kind) || sequence.some((s) => s.kind !== answer.kind)) {
    errors.push("أنواع العناصر غير متجانسة");
  }

  if (answer.kind === "number") {
    const values = [...sequence, ...options].map((i) => Number(i.value));
    if (values.some((v) => !Number.isInteger(v) || v < 0)) {
      errors.push("يوجد رقم سالب أو كسري");
    }
  }

  if (!ruleHolds(puzzle)) errors.push("الإجابة لا تطابق قاعدة النمط");
  return errors;
}
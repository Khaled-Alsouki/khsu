import type { PatternItem } from "@/types";
import { itemKey, shuffle } from "@/lib/utils";

interface NumericOptionsConfig {
  step?: number;
  smart?: readonly number[];
}

export function buildNumericOptions(
  answer: number,
  { step = 1, smart = [] }: NumericOptionsConfig = {}
): PatternItem[] {
  const values = new Set<number>([answer]);
  const add = (value: number): void => {
    if (Number.isInteger(value) && value >= 0 && (values.size < 4 || values.has(value))) {
      values.add(value);
    }
  };

  smart.forEach(add);
  for (let multiplier = 1; values.size < 4; multiplier++) {
    add(answer + step * multiplier);
    add(answer - step * multiplier);
  }

  return shuffle([...values].map((value) => ({ kind: "number", value })));
}

export function buildItemOptions(
  answer: PatternItem,
  pool: readonly PatternItem[],
  preferred: readonly PatternItem[] = []
): PatternItem[] {
  const options = new Map<string, PatternItem>([[itemKey(answer), answer]]);
  for (const item of [...preferred, ...pool]) {
    options.set(itemKey(item), item);
    if (options.size === 4) break;
  }

  return shuffle([...options.values()]);
}
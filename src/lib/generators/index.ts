import type { GeneratorConfig, Level, PatternType, Puzzle } from "@/types";
import { generateArithmeticAdd, generateArithmeticSub } from "./arithmetic";
import { generateColorAlternate, generateColorTriple } from "./colors";
import { generateFibonacci } from "./fibonacci";
import { generateGeometric } from "./geometric";
import { generateSquares } from "./squares";

export const GENERATORS: readonly GeneratorConfig[] = [
  { type: "arithmetic-add", minLevel: 1, maxLevel: 10, weight: 10, generate: generateArithmeticAdd },
  { type: "arithmetic-sub", minLevel: 1, maxLevel: 10, weight: 8, generate: generateArithmeticSub },
  { type: "color-alternate", minLevel: 1, maxLevel: 3, weight: 6, generate: generateColorAlternate },
  { type: "color-triple", minLevel: 4, maxLevel: 6, weight: 6, generate: generateColorTriple },
  { type: "geometric", minLevel: 4, maxLevel: 10, weight: 8, generate: generateGeometric },
  { type: "fibonacci", minLevel: 4, maxLevel: 10, weight: 6, generate: generateFibonacci },
  { type: "squares", minLevel: 4, maxLevel: 10, weight: 6, generate: generateSquares },
];

export interface GenerateOptions {
  seenIds?: ReadonlySet<string>;
  lastType?: PatternType | null;
  maxAttempts?: number;
}

export function getEligibleGenerators(level: Level): GeneratorConfig[] {
  return GENERATORS.filter((generator) => level >= generator.minLevel && level <= generator.maxLevel);
}

function effectiveWeight(config: GeneratorConfig, level: Level): number {
  const isFresh = config.minLevel > 1 && level - config.minLevel < 2;
  return isFresh ? config.weight * 2 : config.weight;
}

function pickWeighted(list: readonly GeneratorConfig[], level: Level): GeneratorConfig {
  const total = list.reduce((sum, generator) => sum + effectiveWeight(generator, level), 0);
  let roll = Math.random() * total;
  for (const generator of list) {
    roll -= effectiveWeight(generator, level);
    if (roll <= 0) return generator;
  }
  return list[list.length - 1] as GeneratorConfig;
}

export function generatePuzzle(level: Level, options: GenerateOptions = {}): Puzzle {
  const { seenIds, lastType = null, maxAttempts = 30 } = options;
  const eligible = getEligibleGenerators(level);
  if (eligible.length === 0) throw new Error(`لا توجد مولّدات للمستوى ${level}`);

  const varied = eligible.filter((generator) => generator.type !== lastType);
  const candidates = varied.length > 0 ? varied : eligible;
  let latest: Puzzle | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    latest = pickWeighted(candidates, level).generate(level);
    if (!seenIds || !seenIds.has(latest.id)) return latest;
  }

  return latest ?? pickWeighted(candidates, level).generate(level);
}

export { generateArithmeticAdd, generateArithmeticSub } from "./arithmetic";
export { generateColorAlternate, generateColorTriple } from "./colors";
export { generateFibonacci } from "./fibonacci";
export { generateGeometric } from "./geometric";
export { generateSquares } from "./squares";
export { generateQuestionPuzzle } from "./questions";
"use client";

import { useCallback, useEffect, useState } from "react";
import { generatePuzzle } from "@/lib/generators";
import { validatePuzzle } from "@/lib/generators/validate";
import type { Level, PatternType, Puzzle } from "@/types";

const LEVELS: readonly Level[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const RUNS_PER_LEVEL = 2000;
/** حجم "جولة" تقريبي: نفرّغ قائمة المعرّفات كل 40 لغزاً */
const ROUND_SIZE = 40;

interface LevelReport {
  level: Level;
  runs: number;
  errors: number;
  duplicates: number;
  avgMs: number;
  maxMs: number;
  types: Record<string, number>;
  firstError?: string;
}

function runTests(): LevelReport[] {
  return LEVELS.map((level) => {
    const seen = new Set<string>();
    const types: Record<string, number> = {};
    let lastType: PatternType | null = null;
    let errors = 0;
    let duplicates = 0;
    let totalMs = 0;
    let maxMs = 0;
    let firstError: string | undefined;

    for (let i = 0; i < RUNS_PER_LEVEL; i++) {
      if (i % ROUND_SIZE === 0) seen.clear();

      const t0 = performance.now();
      const puzzle = generatePuzzle(level, { seenIds: seen, lastType });
      const dt = performance.now() - t0;
      totalMs += dt;
      maxMs = Math.max(maxMs, dt);

      if (seen.has(puzzle.id)) duplicates++;
      seen.add(puzzle.id);
      lastType = puzzle.type;
      types[puzzle.type] = (types[puzzle.type] ?? 0) + 1;

      const problems = validatePuzzle(puzzle);
      if (problems.length > 0) {
        errors++;
        firstError ??= `${puzzle.id} → ${problems.join(" | ")}`;
      }
    }

    return {
      level,
      runs: RUNS_PER_LEVEL,
      errors,
      duplicates,
      avgMs: totalMs / RUNS_PER_LEVEL,
      maxMs,
      types,
      firstError,
    };
  });
}

export default function DevPage() {
  const [reports, setReports] = useState<LevelReport[]>([]);
  const [samples, setSamples] = useState<Puzzle[]>([]);

  const refreshSamples = useCallback(() => {
    setSamples(LEVELS.map((level) => generatePuzzle(level)));
  }, []);

  useEffect(() => {
    const result = runTests();
    console.table(
      result.map(({ types, firstError, ...rest }) => ({ ...rest, types: JSON.stringify(types) }))
    );
    result.forEach((r) => r.firstError && console.error(`L${r.level}:`, r.firstError));
    setReports(result);
    refreshSamples();
  }, [refreshSamples]);

  const allPassed = reports.length > 0 && reports.every((r) => r.errors === 0);

  return (
    <main className="flex flex-col gap-6 text-sm">
      <h1 className="text-2xl font-extrabold text-brand-400">اختبار المولّدات 🧪</h1>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">
          النتيجة: {reports.length === 0 ? "..." : allPassed ? "✅ كل الألغاز سليمة" : "❌ توجد أخطاء"}
        </h2>
        {reports.map((r) => (
          <div key={r.level} className="rounded-lg bg-slate-800 p-3">
            <p className="ltr-seq font-mono">
              L{r.level} | errors: {r.errors} | dup: {r.duplicates} | avg:{" "}
              {r.avgMs.toFixed(3)}ms | max: {r.maxMs.toFixed(2)}ms
            </p>
            <p className="ltr-seq font-mono text-xs text-slate-400">
              {JSON.stringify(r.types)}
            </p>
            {r.firstError && <p className="ltr-seq text-xs text-wrong">{r.firstError}</p>}
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">عيّنة ألغاز (لغز لكل مستوى)</h2>
          <button
            onClick={refreshSamples}
            className="rounded-lg bg-brand-600 px-3 py-1 font-bold"
          >
            تحديث
          </button>
        </div>
        {samples.map((p) => (
          <div key={p.id} className="rounded-lg bg-slate-800 p-3">
            <p className="text-xs text-slate-400">
              مستوى {p.level} · {p.type}
            </p>
            <p className="ltr-seq text-xl font-bold">
              {p.sequence.map((i) => i.value).join(", ")}, ?
            </p>
            <p className="ltr-seq text-slate-300">
              {p.options.map((o) => (o.value === p.answer.value ? `[${o.value}]` : o.value)).join("   ")}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
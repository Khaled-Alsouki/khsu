"use client";

import { useEffect, useState } from "react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { useTimer } from "@/hooks/useTimer";
import { runStorageChecks, type CheckResult } from "@/lib/statsTest";
import { useGameStore, useHydrateGameStore } from "@/store/gameStore";
import type { RoundResult } from "@/types";

const DEMO_DURATION_MS = 10_000;

function randomRound(): RoundResult {
  const correct = 5 + Math.floor(Math.random() * 20);
  return {
    playedAt: Date.now(),
    score: Math.floor(Math.random() * 300),
    correct,
    wrong: Math.floor(Math.random() * 6),
    bestStreak: Math.min(correct, 1 + Math.floor(Math.random() * 12)),
    maxLevelReached: 3,
  };
}

const sanitizeCount = (raw: unknown): number | null =>
  typeof raw === "number" && Number.isFinite(raw) ? raw : null;

export default function StorageTestPage() {
  const [checks, setChecks] = useState<CheckResult[]>([]);
  const [finishCount, setFinishCount] = useState(0);

  const timer = useTimer({
    durationMs: DEMO_DURATION_MS,
    onFinish: () => setFinishCount((count) => count + 1),
  });

  const hydrated = useHydrateGameStore();
  const stats = useGameStore((s) => s.stats);
  const lastRound = useGameStore((s) => s.lastRound);
  const lastRoundWasRecord = useGameStore((s) => s.lastRoundWasRecord);
  const recordRound = useGameStore((s) => s.recordRound);
  const resetStats = useGameStore((s) => s.resetStats);

  const [clicks, setClicks, clicksReady] = useLocalStorage<number>(
    "pattern-game:dev-counter",
    0,
    { sanitize: sanitizeCount }
  );

  useEffect(() => {
    const results = runStorageChecks();
    console.table(results.map(({ name, ok }) => ({ name, ok })));
    setChecks(results);
  }, []);

  const passed = checks.filter((c) => c.ok).length;
  const allPassed = checks.length > 0 && passed === checks.length;

  return (
    <main className="flex flex-col gap-8 text-sm">
      <h1 className="text-2xl font-extrabold text-brand-400">اختبار الحالة والتخزين 💾</h1>

      {/* 1) الفحوص التلقائية */}
      <section className="flex flex-col gap-2">
        <h2 className="font-bold">
          الفحوص:{" "}
          {checks.length === 0
            ? "..."
            : allPassed
            ? `✅ نجحت كلها (${passed}/${checks.length})`
            : `❌ نجح ${passed} من ${checks.length}`}
        </h2>
        {checks
          .filter((c) => !c.ok)
          .map((c) => (
            <div key={c.name} className="rounded-lg bg-red-950 p-3">
              <p>❌ {c.name}</p>
              <p className="ltr-seq mt-1 font-mono text-xs text-wrong">{c.detail}</p>
            </div>
          ))}
      </section>

      {/* 2) المؤقت (10 ثوان للتجربة) */}
      <section className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4">
        <h2 className="font-bold">المؤقت (10 ثوانٍ للتجربة)</h2>
        <p className="ltr-seq text-center text-5xl font-extrabold tabular-nums">
          {timer.remainingSec}
        </p>
        <div className="h-3 w-full overflow-hidden rounded-full bg-slate-700">
          <div
            className="h-full bg-brand-500 transition-[width] duration-100 ease-linear"
            style={{ width: `${timer.fractionLeft * 100}%` }}
          />
        </div>
        <p className="text-xs text-slate-400">
          الحالة: {timer.isRunning ? "يعمل" : timer.hasFinished ? "انتهى" : "متوقف"} · مرات
          استدعاء onFinish: {finishCount}
        </p>
        <div className="flex gap-2">
          <button onClick={timer.start} className="rounded-lg bg-brand-600 px-3 py-1 font-bold">
            ابدأ
          </button>
          <button onClick={timer.stop} className="rounded-lg bg-slate-600 px-3 py-1 font-bold">
            أوقف
          </button>
          <button onClick={timer.reset} className="rounded-lg bg-slate-600 px-3 py-1 font-bold">
            إعادة
          </button>
        </div>
        <p className="text-xs text-slate-400">
          اختبار التبويبات: اضغط «ابدأ»، ثم انتقل لتبويب آخر 6 ثوانٍ وعد. يجب أن يظهر
          الرقم 4 تقريباً (لا 10)، وأن يزيد onFinish مرة واحدة فقط.
        </p>
      </section>

      {/* 3) المتجر */}
      <section className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4">
        <h2 className="font-bold">المتجر (Zustand) {hydrated ? "✅ جاهز" : "⏳ يُحمَّل"}</h2>
        <div className="ltr-seq font-mono text-xs leading-6 text-slate-300">
          <p>highScore: {stats.highScore}</p>
          <p>longestStreak: {stats.longestStreak}</p>
          <p>roundsPlayed: {stats.roundsPlayed}</p>
          <p>totalScore: {stats.totalScore}</p>
          <p>mistakes: {JSON.stringify(stats.mistakesByType)}</p>
          <p>recent scores: [{stats.recentRounds.map((r) => r.score).join(", ")}]</p>
        </div>
        <p className="text-xs text-slate-400">
          آخر جولة: {lastRound ? `${lastRound.score} نقطة` : "لا يوجد"}
          {lastRoundWasRecord ? " 🏆 رقم قياسي جديد" : ""}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => recordRound(randomRound(), { squares: 1, fibonacci: 2 })}
            className="rounded-lg bg-brand-600 px-3 py-1 font-bold"
          >
            سجّل جولة تجريبية
          </button>
          <button onClick={resetStats} className="rounded-lg bg-red-700 px-3 py-1 font-bold">
            مسح الإحصائيات
          </button>
        </div>
        <p className="text-xs text-slate-400">
          سجّل عدة جولات ثم أعد تحميل الصفحة (F5): يجب أن تبقى الأرقام كما هي.
        </p>
      </section>

      {/* 4) useLocalStorage */}
      <section className="flex flex-col gap-3 rounded-xl bg-slate-800 p-4">
        <h2 className="font-bold">useLocalStorage {clicksReady ? "✅" : "⏳"}</h2>
        <p className="ltr-seq text-2xl font-bold tabular-nums">{clicks}</p>
        <div className="flex gap-2">
          <button
            disabled={!clicksReady}
            onClick={() => setClicks((n) => n + 1)}
            className="rounded-lg bg-brand-600 px-3 py-1 font-bold disabled:opacity-40"
          >
            +1
          </button>
          <button
            disabled={!clicksReady}
            onClick={() => setClicks(0)}
            className="rounded-lg bg-slate-600 px-3 py-1 font-bold disabled:opacity-40"
          >
            تصفير
          </button>
        </div>
      </section>
    </main>
  );
}
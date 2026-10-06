"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTimer } from "@/hooks/useTimer";
import { generatePuzzle, generateQuestionPuzzle } from "@/lib/generators";
import { itemKey } from "@/lib/utils";
import { useGameStore, useHydrateGameStore } from "@/store/gameStore";
import {
  ROUND_DURATION_SEC,
  WRONG_FEEDBACK_DELAY_MS,
  type GameStatus,
  type Level,
  type PatternItem,
  type PatternMistakes,
  type PatternType,
  type Puzzle,
} from "@/types";

interface RoundProgress {
  score: number;
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  level: Level;
  maxLevelReached: Level;
}

const EMPTY_PROGRESS: RoundProgress = {
  score: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  bestStreak: 0,
  level: 1,
  maxLevelReached: 1,
};

export default function HomePage() {
  const [status, setStatus] = useState<GameStatus>("idle");
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [progress, setProgress] = useState(EMPTY_PROGRESS);
  const [mistakes, setMistakes] = useState<PatternMistakes>({});
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);

  const statusRef = useRef<GameStatus>("idle");
  const progressRef = useRef(EMPTY_PROGRESS);
  const mistakesRef = useRef<PatternMistakes>({});
  const seenIdsRef = useRef(new Set<string>());
  const lastTypeRef = useRef<PatternType | null>(null);
  const answerLockedRef = useRef(false);
  const nextPuzzleTimeoutRef = useRef<number | null>(null);

  const hydrated = useHydrateGameStore();
  const highScore = useGameStore((state) => state.stats.highScore);
  const lastRoundWasRecord = useGameStore((state) => state.lastRoundWasRecord);
  const recordRound = useGameStore((state) => state.recordRound);

  const finishRound = useCallback(() => {
    if (statusRef.current !== "playing") return;

    statusRef.current = "result";
    setStatus("result");
    if (nextPuzzleTimeoutRef.current !== null) {
      window.clearTimeout(nextPuzzleTimeoutRef.current);
      nextPuzzleTimeoutRef.current = null;
    }

    const result = progressRef.current;
    recordRound(
      {
        playedAt: Date.now(),
        score: result.score,
        correct: result.correct,
        wrong: result.wrong,
        bestStreak: result.bestStreak,
        maxLevelReached: result.maxLevelReached,
      },
      mistakesRef.current
    );
  }, [recordRound]);

  const timer = useTimer({ onFinish: finishRound });

  useEffect(
    () => () => {
      if (nextPuzzleTimeoutRef.current !== null) {
        window.clearTimeout(nextPuzzleTimeoutRef.current);
      }
    },
    []
  );

  const makePuzzle = (level: Level): Puzzle => {
    if (Math.random() < 0.35) {
      const question = generateQuestionPuzzle(level, seenIdsRef.current, lastTypeRef.current);
      seenIdsRef.current.add(question.id);
      lastTypeRef.current = question.type;
      return question;
    }

    const next = generatePuzzle(level, {
      seenIds: seenIdsRef.current,
      lastType: lastTypeRef.current,
    });
    seenIdsRef.current.add(next.id);
    lastTypeRef.current = next.type;
    return next;
  };

  const startRound = (): void => {
    if (nextPuzzleTimeoutRef.current !== null) {
      window.clearTimeout(nextPuzzleTimeoutRef.current);
      nextPuzzleTimeoutRef.current = null;
    }

    const initialProgress = { ...EMPTY_PROGRESS };
    progressRef.current = initialProgress;
    mistakesRef.current = {};
    seenIdsRef.current = new Set();
    lastTypeRef.current = null;
    answerLockedRef.current = false;

    setProgress(initialProgress);
    setMistakes({});
    setSelectedKey(null);
    setLastAnswerCorrect(null);
    setPuzzle(makePuzzle(1));
    statusRef.current = "playing";
    setStatus("playing");
    timer.start();
  };

  const chooseAnswer = (option: PatternItem): void => {
    if (statusRef.current !== "playing" || answerLockedRef.current || !puzzle) return;

    answerLockedRef.current = true;
    const isCorrect = itemKey(option) === itemKey(puzzle.answer);
    setSelectedKey(itemKey(option));
    setLastAnswerCorrect(isCorrect);

    const current = progressRef.current;
    let next: RoundProgress;

    if (isCorrect) {
      const streak = current.streak + 1;
      const level = Math.min(10, 1 + Math.floor((current.correct + 1) / 5)) as Level;
      next = {
        ...current,
        score: current.score + current.level * 10 + (streak % 5 === 0 ? 5 : 0),
        correct: current.correct + 1,
        streak,
        bestStreak: Math.max(current.bestStreak, streak),
        level,
        maxLevelReached: Math.max(current.maxLevelReached, level) as Level,
      };
    } else {
      next = { ...current, wrong: current.wrong + 1, streak: 0 };
      const updatedMistakes = {
        ...mistakesRef.current,
        [puzzle.type]: (mistakesRef.current[puzzle.type] ?? 0) + 1,
      };
      mistakesRef.current = updatedMistakes;
      setMistakes(updatedMistakes);
    }

    progressRef.current = next;
    setProgress(next);

    nextPuzzleTimeoutRef.current = window.setTimeout(
      () => {
        nextPuzzleTimeoutRef.current = null;
        if (statusRef.current !== "playing") return;
        setPuzzle(makePuzzle(progressRef.current.level));
        setSelectedKey(null);
        setLastAnswerCorrect(null);
        answerLockedRef.current = false;
      },
      isCorrect ? 350 : WRONG_FEEDBACK_DELAY_MS
    );
  };

  const timerPercent = `${timer.fractionLeft * 100}%`;
  const timerColor = timer.remainingSec <= 10 ? "bg-rose-400" : "bg-emerald-400";

  return (
    <main className="flex flex-1 flex-col gap-6 py-2">
      <header className="flex items-center justify-between border-b border-slate-700/80 pb-4">
        <div>
          <p className="text-xs font-bold uppercase text-emerald-300">تحدّي الأنماط</p>
          <h1 className="text-3xl font-extrabold text-slate-50">نمط</h1>
        </div>
        <div className="text-left">
          <p className="text-xs text-slate-400">أفضل نتيجة</p>
          <p className="ltr-seq text-xl font-extrabold tabular-nums text-amber-300">
            {hydrated ? highScore : "—"}
          </p>
        </div>
      </header>

      {status === "idle" && (
        <section className="flex flex-col gap-5 py-4">
          <div className="space-y-3">
            <p className="text-sm font-bold text-emerald-300">60 ثانية · أنماط وأسئلة وأمثال سورية</p>
            <h2 className="text-4xl font-extrabold leading-tight text-white">اختبر سرعتك ومعرفتك</h2>
            <p className="max-w-sm text-slate-300">أكمل الأنماط، أجب عن معلومات عامة، واختبر معرفتك بالأمثال السورية.</p>
          </div>

          <div className="ltr-seq border-y border-slate-700 py-4 text-center text-3xl font-extrabold tabular-nums text-slate-100">
            2, 4, 6, 8, ?
          </div>

          <button
            type="button"
            onClick={startRound}
            className="min-h-14 w-full rounded-md bg-emerald-400 px-5 py-4 text-lg font-extrabold text-slate-950 transition-colors hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
          >
            ابدأ اللعب
          </button>
        </section>
      )}

      {status === "playing" && puzzle && (
        <section className="flex flex-1 flex-col gap-6">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-slate-400">النتيجة</p>
              <p key={progress.score} className="score-bump ltr-seq text-3xl font-extrabold tabular-nums text-white">{progress.score}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-slate-400">المستوى</p>
              <p className="ltr-seq text-2xl font-bold tabular-nums text-emerald-300">{progress.level}</p>
            </div>
            <div className="text-left">
              <p className="text-xs text-slate-400">السلسلة</p>
              <p className="ltr-seq text-2xl font-bold tabular-nums text-amber-300">{progress.streak}</p>
            </div>
          </div>

          <div
            className="h-2 overflow-hidden rounded-full bg-slate-700"
            role="progressbar"
            aria-label="الوقت المتبقي"
            aria-valuemin={0}
            aria-valuemax={ROUND_DURATION_SEC}
            aria-valuenow={timer.remainingSec}
          >
            <div className={`h-full ${timerColor} transition-[width] duration-100`} style={{ width: timerPercent }} />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-300">
              {puzzle.question ? "اختر الإجابة الصحيحة" : "أكمل النمط"}
            </p>
            <p className={`ltr-seq text-2xl font-extrabold tabular-nums ${timer.remainingSec <= 10 ? "text-rose-300" : "text-white"}`}>
              {timer.remainingSec}
            </p>
          </div>

          <div className="flex min-h-40 flex-1 flex-col justify-center gap-5 rounded-md border border-slate-700 bg-slate-800/70 px-4 py-7">
            <p className={`${puzzle.question ? "text-xl sm:text-2xl" : "ltr-seq text-2xl sm:text-3xl"} text-center font-extrabold leading-relaxed text-white`}>
              {puzzle.question ?? `${puzzle.sequence.map((item) => item.value).join(", ")}, ?`}
            </p>
            <p className="text-center text-xs text-slate-400">
              {puzzle.type === "general-knowledge"
                ? "معلومات عامة"
                : puzzle.type === "syrian-proverbs"
                ? "أمثال سورية شعبية"
                : puzzle.type.replaceAll("-", " ")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3" aria-label="خيارات الإجابة">
            {puzzle.options.map((option) => {
              const key = itemKey(option);
              const isSelected = selectedKey === key;
              const isCorrectOption = key === itemKey(puzzle.answer);
              const showCorrect = selectedKey !== null && isCorrectOption;
              const showWrong = isSelected && lastAnswerCorrect === false;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => chooseAnswer(option)}
                  disabled={selectedKey !== null}
                  className={`${puzzle.question ? "text-base leading-relaxed" : "ltr-seq text-2xl tabular-nums"} min-h-16 rounded-md border px-4 py-3 font-extrabold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-default ${
                    showCorrect
                      ? "answer-correct border-emerald-300 bg-emerald-300 text-slate-950"
                      : showWrong
                      ? "border-rose-400 bg-rose-400/15 text-rose-200"
                      : "border-slate-600 bg-slate-800 text-slate-100 hover:border-emerald-300 hover:bg-slate-700"
                  }`}
                >
                  {option.value}
                </button>
              );
            })}
          </div>

          <p className="min-h-6 text-center text-sm font-bold" aria-live="polite">
            {lastAnswerCorrect === true && <span className="text-emerald-300">إجابة صحيحة</span>}
            {lastAnswerCorrect === false && <span className="text-rose-300">ليست هذه المرة</span>}
          </p>
        </section>
      )}

      {status === "result" && (
        <section className="flex flex-1 flex-col justify-center gap-7 py-8">
          <div className="space-y-2 text-center">
            <p className="text-sm font-bold text-rose-300">انتهى الوقت</p>
            <h2 className={`${lastRoundWasRecord ? "record-celebration" : ""} text-4xl font-extrabold text-white`}>
              {lastRoundWasRecord ? "رقم قياسي جديد" : "أحسنت اللعب"}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-slate-700 bg-slate-700">
            {[
              ["النتيجة", progress.score],
              ["الصحيحة", progress.correct],
              ["الخاطئة", progress.wrong],
              ["أفضل سلسلة", progress.bestStreak],
            ].map(([label, value]) => (
              <div key={label} className="bg-slate-800 p-4 text-center">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="ltr-seq mt-1 text-2xl font-extrabold tabular-nums text-white">{value}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={startRound}
            className="min-h-14 w-full rounded-md bg-emerald-400 px-5 py-4 text-lg font-extrabold text-slate-950 transition-colors hover:bg-emerald-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-300"
          >
            العب مرة أخرى
          </button>
        </section>
      )}
    </main>
  );
}
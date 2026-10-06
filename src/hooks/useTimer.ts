"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ROUND_DURATION_SEC } from "@/types";

/** تردد التحديث: 100ms كافٍ لشريط سلس دون إعادة رسم مفرطة */
const TICK_MS = 100;

export interface UseTimerOptions {
  /** مدة المؤقت بالميلي ثانية (الافتراضي 60 ثانية) */
  durationMs?: number;
  /** يُستدعى مرة واحدة عند انتهاء الوقت */
  onFinish?: () => void;
}

export interface UseTimerReturn {
  remainingMs: number;
  /** الثواني المتبقية مقرّبة للأعلى (للرقم المعروض: 60 ... 1) */
  remainingSec: number;
  /** نسبة الوقت المتبقي من 0 إلى 1 (للشريط) */
  fractionLeft: number;
  isRunning: boolean;
  hasFinished: boolean;
  start: () => void;
  /** إيقاف دون استدعاء onFinish */
  stop: () => void;
  /** إيقاف وإعادة الوقت كاملاً */
  reset: () => void;
}

/**
 * مؤقت دقيق: نحفظ "موعد الانتهاء" (performance.now() + المدة) ونحسب المتبقي منه،
 * فلا يتراكم أي انحراف حتى لو تأخرت النبضات، ولا يتأثر بتبديل التبويبات:
 * عند العودة للتبويب نحدّث فوراً (visibilitychange) فيظهر الوقت الحقيقي.
 */
export function useTimer({
  durationMs = ROUND_DURATION_SEC * 1000,
  onFinish,
}: UseTimerOptions = {}): UseTimerReturn {
  const [remainingMs, setRemainingMs] = useState(durationMs);
  const [isRunning, setIsRunning] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);

  const deadlineRef = useRef(0);
  const runningRef = useRef(false);
  const onFinishRef = useRef(onFinish);

  // نحتفظ بآخر نسخة من onFinish دون إعادة تشغيل المؤقت
  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const tick = useCallback((): void => {
    if (!runningRef.current) return;

    const remaining = Math.max(0, deadlineRef.current - performance.now());
    setRemainingMs((prev) =>
      remaining === 0 || Math.abs(prev - remaining) >= TICK_MS / 2 ? remaining : prev
    );

    if (remaining === 0) {
      runningRef.current = false;
      setIsRunning(false);
      setHasFinished(true);
      onFinishRef.current?.();
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const interval = window.setInterval(tick, TICK_MS);
    // مؤقت إضافي عند موعد الانتهاء بالضبط حتى لا يتأخر الانتهاء حتى 100ms
    const timeout = window.setTimeout(
      tick,
      Math.max(0, deadlineRef.current - performance.now()) + 5
    );
    const onVisibility = (): void => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isRunning, tick]);

  const start = useCallback((): void => {
    deadlineRef.current = performance.now() + durationMs;
    runningRef.current = true;
    setHasFinished(false);
    setRemainingMs(durationMs);
    setIsRunning(true);
  }, [durationMs]);

  const stop = useCallback((): void => {
    runningRef.current = false;
    setIsRunning(false);
  }, []);

  const reset = useCallback((): void => {
    runningRef.current = false;
    setIsRunning(false);
    setHasFinished(false);
    setRemainingMs(durationMs);
  }, [durationMs]);

  return {
    remainingMs,
    remainingSec: Math.ceil(remainingMs / 1000),
    fractionLeft: durationMs > 0 ? remainingMs / durationMs : 0,
    isRunning,
    hasFinished,
    start,
    stop,
    reset,
  };
}
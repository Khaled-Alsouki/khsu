"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { loadStats, saveStats } from "@/lib/storage";
import { applyRound, createEmptyStats } from "@/lib/stats";
import type { PatternMistakes, PersistedStats, RoundResult } from "@/types";

interface GameStoreState {
  /** الإحصائيات المحفوظة (تبدأ فارغة حتى يحدث hydrate) */
  stats: PersistedStats;
  /** هل قُرئت البيانات من localStorage؟ */
  hydrated: boolean;
  /** آخر جولة منتهية (لصفحة النتائج) */
  lastRound: RoundResult | null;
  /** هل حطّمت آخر جولة الرقم القياسي؟ */
  lastRoundWasRecord: boolean;

  /** قراءة localStorage (مرة واحدة فقط، آمنة للاستدعاء المتكرر) */
  hydrate: () => void;
  /** تسجيل جولة منتهية: تحديث الإحصائيات وحفظها */
  recordRound: (round: RoundResult, mistakes?: PatternMistakes) => void;
  clearLastRound: () => void;
  /** مسح كل الإحصائيات */
  resetStats: () => void;
}

export const useGameStore = create<GameStoreState>()((set, get) => ({
  stats: createEmptyStats(),
  hydrated: false,
  lastRound: null,
  lastRoundWasRecord: false,

  hydrate: () => {
    if (get().hydrated) return;
    set({ stats: loadStats(), hydrated: true });
  },

  recordRound: (round, mistakes = {}) => {
    // حماية: لو سُجّلت جولة قبل القراءة لا نكتب فوق البيانات المحفوظة بأصفار
    get().hydrate();
    const { stats, isNewHighScore } = applyRound(get().stats, round, mistakes);
    saveStats(stats);
    set({ stats, lastRound: round, lastRoundWasRecord: isNewHighScore });
  },

  clearLastRound: () => set({ lastRound: null, lastRoundWasRecord: false }),

  resetStats: () => {
    const empty = createEmptyStats();
    saveStats(empty);
    set({ stats: empty, lastRound: null, lastRoundWasRecord: false });
  },
}));

/**
 * استدعِه في أي صفحة تعرض الإحصائيات (الرئيسية، النتائج، الإحصائيات).
 * يقرأ localStorage بعد التحميل ويُرجع hydrated،
 * فتعرض الصفحة هيكلاً مؤقتاً حتى يصبح true بدل عرض أصفار خاطئة.
 */
export function useHydrateGameStore(): boolean {
  const hydrate = useGameStore((state) => state.hydrate);
  const hydrated = useGameStore((state) => state.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return hydrated;
}
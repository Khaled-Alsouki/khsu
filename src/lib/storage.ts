import { STORAGE_KEY, type PersistedStats } from "@/types";
import { sanitizeStats } from "@/lib/stats";

/**
 * قراءة آمنة: تُرجع null عند غياب المفتاح، أو فساد JSON،
 * أو عدم توفر localStorage (الخادم، الوضع الخاص، حظر الكوكيز).
 */
export function readStorage(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? null : (JSON.parse(raw) as unknown);
  } catch {
    return null;
  }
}

/** كتابة آمنة: تُرجع false عند الفشل (امتلاء المساحة مثلاً) بدل رمي خطأ */
export function writeStorage(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // لا شيء نفعله
  }
}

/** تحميل الإحصائيات (دائماً تُرجع بيانات سليمة) */
export function loadStats(key: string = STORAGE_KEY): PersistedStats {
  return sanitizeStats(readStorage(key));
}

export function saveStats(stats: PersistedStats, key: string = STORAGE_KEY): boolean {
  return writeStorage(key, stats);
}
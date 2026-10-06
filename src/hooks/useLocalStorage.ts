"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readStorage, writeStorage } from "@/lib/storage";

type Updater<T> = T | ((prev: T) => T);

export interface UseLocalStorageOptions<T> {
  /** يتحقق من القيمة المقروءة؛ أرجع null لرفضها واستخدام القيمة الابتدائية */
  sanitize?: (raw: unknown) => T | null;
}

/**
 * Hook عام للقيم البسيطة (إعدادات الصوت، الوضع الليلي...).
 * يبدأ دائماً بالقيمة الابتدائية (لتفادي اختلاف Hydration بين الخادم والمتصفح)،
 * ثم يقرأ القيمة المحفوظة بعد التحميل، ويضبط hydrated = true.
 * تنبيه: لا تستدعِ setValue قبل hydrated = true وإلا ستستبدل القيمة المحفوظة.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): readonly [T, (next: Updater<T>) => void, boolean] {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);

  const valueRef = useRef<T>(initialValue);
  const initialRef = useRef<T>(initialValue);
  const sanitizeRef = useRef(options.sanitize);

  useEffect(() => {
    sanitizeRef.current = options.sanitize;
  }, [options.sanitize]);

  useEffect(() => {
    const raw = readStorage(key);
    if (raw !== null) {
      const sanitize = sanitizeRef.current;
      const parsed = sanitize
        ? sanitize(raw)
        : typeof raw === typeof initialRef.current
        ? (raw as T)
        : null;
      if (parsed !== null) {
        valueRef.current = parsed;
        setValue(parsed);
      }
    }
    setHydrated(true);
  }, [key]);

  const set = useCallback(
    (next: Updater<T>): void => {
      const resolved =
        typeof next === "function" ? (next as (prev: T) => T)(valueRef.current) : next;
      valueRef.current = resolved;
      setValue(resolved);
      writeStorage(key, resolved);
    },
    [key]
  );

  return [value, set, hydrated] as const;
}
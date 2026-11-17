"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export function usePreference<T>(
  key: string,
  fallback: T,
): [T, (value: T) => void, boolean] {
  const initial = useRef(fallback);
  const [stored, setStored] = useState<{ key: string; value: T }>({
    key: "",
    value: fallback,
  });
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      let value = initial.current;
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          const parsed = JSON.parse(raw);
          if (
            Array.isArray(initial.current)
              ? Array.isArray(parsed) &&
                parsed.every((x) => typeof x === "string")
              : typeof parsed === typeof initial.current
          )
            value = parsed as T;
        }
      } catch {}
      if (active) setStored({ key, value });
    });
    return () => {
      active = false;
    };
  }, [key]);
  const update = useCallback(
    (value: T) => {
      setStored({ key, value });
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {}
    },
    [key],
  );
  return [
    stored.key === key ? stored.value : fallback,
    update,
    stored.key === key,
  ];
}

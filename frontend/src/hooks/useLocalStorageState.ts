import { useEffect, useState } from "react";

function readStoredValue<StoredValue>(storageKey: string, fallbackValue: StoredValue): StoredValue {
  try {
    const rawStoredValue = localStorage.getItem(storageKey);
    return rawStoredValue === null ? fallbackValue : (JSON.parse(rawStoredValue) as StoredValue);
  } catch {
    return fallbackValue;
  }
}

export function useLocalStorageState<StoredValue>(storageKey: string, fallbackValue: StoredValue) {
  const [storedValue, setStoredValue] = useState<StoredValue>(() => readStoredValue(storageKey, fallbackValue));

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(storedValue));
    } catch {
      /* storage indisponível */
    }
  }, [storageKey, storedValue]);

  return [storedValue, setStoredValue] as const;
}

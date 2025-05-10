import { useEffect, useState } from "react";

export function useSyncedState<T>(externalValue: T): [T, (v: T) => void] {
  const [value, setValue] = useState(externalValue);

  useEffect(() => {
    setValue(externalValue);
  }, [externalValue]);

  return [value, setValue];
}

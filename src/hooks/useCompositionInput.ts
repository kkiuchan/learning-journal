import { useCallback, useState } from "react";

export function useCompositionInput() {
  const [isComposing, setIsComposing] = useState(false);

  const onCompositionStart = useCallback(() => setIsComposing(true), []);
  const onCompositionEnd = useCallback(() => setIsComposing(false), []);

  return { isComposing, onCompositionStart, onCompositionEnd };
}

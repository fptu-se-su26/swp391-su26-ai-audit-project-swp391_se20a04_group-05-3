import { useEffect, useRef, MutableRefObject } from "react";

export function useMountedRef(): MutableRefObject<boolean> {
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return mountedRef;
}

import { PRState } from "@/types/github";

// utils/debounce.ts
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
  };

  return debounced;
}

export const getPRType = (state: string): PRState => {
  switch (state) {
    case 'open':
      return PRState.OPEN;
    case 'close':
      return PRState.CLOSED;
    case 'merged':
      return PRState.MERGED;
    default:
      return PRState.OPEN;
  }
}
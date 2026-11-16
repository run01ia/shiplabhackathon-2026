import { useEffect } from "react";

type Props = { message: string | null; onDone: () => void; ms?: number };

export function Toast({ message, onDone, ms = 1600 }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, ms);
    return () => clearTimeout(t);
  }, [message, ms, onDone]);
  if (!message) return null;
  return <div
      className="absolute top-[70px] left-1/2 z-20 -translate-x-1/2 rounded-pill bg-ink px-4 py-2.5 text-sm whitespace-nowrap text-white"
      role="status"
    >
      {message}
    </div>;
}

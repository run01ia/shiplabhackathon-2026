import { useEffect } from "react";

type Props = { message: string | null; onDone: () => void; ms?: number };

export function Toast({ message, onDone, ms = 1600 }: Props) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onDone, ms);
    return () => clearTimeout(t);
  }, [message, ms, onDone]);
  if (!message) return null;
  return <div className="toast" role="status">{message}</div>;
}

export function Coin({ amount }: { amount: number }) {
  return (
    <div
      className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border-3 border-ink bg-paper py-1 pr-3 pl-1.5"
      aria-label={`コイン ${amount}`}
    >
      <i className="inline-block size-[22px] rounded-full border-3 border-ink bg-sun" />
      <span>{amount.toLocaleString()}</span>
    </div>
  );
}

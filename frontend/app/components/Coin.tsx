export function Coin({ amount }: { amount: number }) {
  return (
    <div className="coin" aria-label={`コイン ${amount}`}>
      <i />
      <span>{amount.toLocaleString()}</span>
    </div>
  );
}

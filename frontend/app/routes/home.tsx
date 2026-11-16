import { Coin } from "~/components/Coin";
import { ProgressBar } from "~/components/ProgressBar";
import { Pet } from "~/features/pet";

export default function Home() {
  return (
    <section className="screen">
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <b style={{ fontSize: 20 }}>Lv.3</b>
        <div style={{ flex: 1 }}><ProgressBar value={62} color="var(--sun)" /></div>
        <Coin amount={120} />
      </div>
      <h2 className="title">ホーム</h2>
      <Pet accessories={["cap"]} size={230} bob />
    </section>
  );
}

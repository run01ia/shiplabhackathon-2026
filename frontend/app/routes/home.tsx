import { Coin } from "~/components/Coin";
import { ProgressBar } from "~/components/ProgressBar";
import { Screen, ScreenTitle } from "~/components/Screen";
import { Pet } from "~/features/pet";

export default function Home() {
  return (
    <Screen>
      <div className="mb-3 flex items-center gap-3">
        <b className="text-xl">Lv.3</b>
        <div className="flex-1">
          <ProgressBar value={62} color="var(--color-sun)" />
        </div>
        <Coin amount={120} />
      </div>
      <ScreenTitle>ホーム</ScreenTitle>
      <Pet accessories={["cap"]} size={230} bob />
    </Screen>
  );
}

import { Screen, ScreenTitle } from "~/components/Screen";
import { Pet } from "~/features/pet";

export default function Login() {
  return (
    <Screen tab={false} className="justify-center">
      <Pet accessories={["cap"]} size={170} bob />
      <ScreenTitle className="text-center text-[28px]">お買い物上手</ScreenTitle>
    </Screen>
  );
}

import { redirect, useActionData, useNavigation } from "react-router";
import { Screen, ScreenTitle } from "~/components/Screen";
import { LoginForm, signIn, signUp } from "~/features/auth";
import { Pet } from "~/features/pet";
import type { Route } from "./+types/login";

export async function clientAction({ request }: Route.ClientActionArgs) {
  const form = await request.formData();
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const result =
    form.get("intent") === "signup" ? await signUp(email, password) : await signIn(email, password);
  if (result.error) return { message: result.error };
  if (result.needsConfirm) return { message: "確認メールを送りました。リンクを開いてからログインしてください" };
  return redirect("/home");
}

export default function Login() {
  const data = useActionData<typeof clientAction>();
  const pending = useNavigation().state !== "idle";
  return (
    <Screen tab={false} className="justify-center">
      <Pet accessories={["cap"]} size={170} bob />
      <ScreenTitle className="mt-2 text-center text-[28px]">お買い物上手</ScreenTitle>
      <p className="mb-5 text-center text-sm">買い物をがんばって、もちおを育てよう</p>
      <LoginForm message={data?.message} pending={pending} />
    </Screen>
  );
}

import { Form } from "react-router";
import { Button } from "~/components/Button";

const fieldClass =
  "mb-3 block min-h-13 w-full rounded-btn border-3 border-ink bg-paper p-3 text-base";

type Props = { message?: string; pending?: boolean };

export function LoginForm({ message, pending }: Props) {
  return (
    <Form method="post">
      <input className={fieldClass} name="email" type="email" placeholder="メールアドレス" autoComplete="email" required />
      <input className={fieldClass} name="password" type="password" placeholder="パスワード" autoComplete="current-password" minLength={6} required />
      {message && <p className="mb-3 text-center text-sm">{message}</p>}
      <Button type="submit" name="intent" value="login" disabled={pending}>
        ログイン
      </Button>
      <Button type="submit" name="intent" value="signup" variant="sub" disabled={pending}>
        はじめて？ 新規登録
      </Button>
    </Form>
  );
}

import type { InputHTMLAttributes } from 'react'

/** 入力欄 (ログイン画面と同じ見た目)。金額は inputMode="numeric" で渡す */
export function Field({ className = '', ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`mb-3 block min-h-13 w-full rounded-btn border-3 border-ink bg-white p-3 text-base ${className}`}
      {...rest}
    />
  )
}

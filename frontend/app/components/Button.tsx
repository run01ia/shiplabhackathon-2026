import type { ButtonHTMLAttributes } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'sub' | 'mint' | 'sun'
  small?: boolean
}

const variants = {
  primary: 'bg-red text-white',
  sub: 'bg-paper text-ink',
  mint: 'bg-mint text-white',
  sun: 'bg-sun text-ink',
}

export function Button({ variant = 'primary', small, className = '', ...rest }: Props) {
  const size = small ? 'min-h-11 p-2 text-sm' : 'min-h-13 p-3 text-[17px]'
  return (
    <button
      type="button"
      className={`mb-3 block w-full cursor-pointer rounded-btn border-3 border-ink text-center shadow-pop active:translate-y-1 active:shadow-none ${variants[variant]} ${size} ${className}`}
      {...rest}
    />
  )
}

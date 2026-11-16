import type { HTMLAttributes } from 'react'

export function Card({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`mb-3.5 rounded-card border-3 border-ink bg-paper p-3.5 shadow-pop ${className}`}
      {...rest}
    />
  )
}

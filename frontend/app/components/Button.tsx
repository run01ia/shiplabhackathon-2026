import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "sub" | "mint" | "sun";
  small?: boolean;
};

const cls = { primary: "", sub: "btn-sub", mint: "btn-mint", sun: "btn-sun" };

export function Button({ variant = "primary", small, className = "", ...rest }: Props) {
  return (
    <button
      type="button"
      className={`btn ${cls[variant]} ${small ? "btn-sm" : ""} ${className}`}
      {...rest}
    />
  );
}

import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLElement> & { tab?: boolean };

/** 1 画面ぶんの縦スクロール領域。tab=true (既定) は下タブの分だけ下に余白を空ける */
export function Screen({ tab = true, className = "", ...rest }: Props) {
  const pb = tab ? "pb-24" : "pb-[calc(env(safe-area-inset-bottom)+24px)]";
  return (
    <section
      className={`absolute inset-0 flex flex-col overflow-y-auto px-4.5 pt-[calc(env(safe-area-inset-top)+20px)] ${pb} ${className}`}
      {...rest}
    />
  );
}

export function ScreenTitle({ className = "", ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`mb-3 text-[22px] ${className}`} {...rest} />;
}

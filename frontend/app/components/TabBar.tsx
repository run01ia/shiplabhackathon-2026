import { NavLink } from "react-router";

const tabs = [
  { to: "/home", label: "ホーム", d: "M3 11l9-8 9 8v10H3z" },
  { to: "/lists", label: "リスト", d: "M5 4h14v17H5zM9 9h6M9 13h6" },
  { to: "/history", label: "履歴", d: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2" },
];

export function TabBar() {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-5 flex justify-around border-t-3 border-ink bg-paper px-3 pt-2 pb-[calc(env(safe-area-inset-bottom)+8px)]">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) =>
            `min-h-13 min-w-11 flex-1 text-center text-xs text-ink no-underline ${isActive ? "opacity-100" : "opacity-50"}`
          }>
          <svg
            viewBox="0 0 24 24"
            className="mx-auto mb-0.5 block size-[26px] fill-none stroke-ink stroke-[2.5] [stroke-linejoin:round]"
          ><path d={t.d} /></svg>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

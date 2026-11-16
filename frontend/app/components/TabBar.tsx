import { NavLink } from "react-router";

const tabs = [
  { to: "/home", label: "ホーム", d: "M3 11l9-8 9 8v10H3z" },
  { to: "/lists", label: "リスト", d: "M5 4h14v17H5zM9 9h6M9 13h6" },
  { to: "/history", label: "履歴", d: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2" },
];

export function TabBar() {
  return (
    <nav className="tabs">
      {tabs.map((t) => (
        <NavLink key={t.to} to={t.to} className={({ isActive }) => (isActive ? "active" : "")}>
          <svg viewBox="0 0 24 24"><path d={t.d} /></svg>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}

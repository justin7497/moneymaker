import { NavLink, Outlet } from "react-router-dom";
import { channels } from "../channels";

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" end>
          <span className="brand-name">돈버는 앱</span>
          <span className="brand-sub">moneymaker</span>
        </NavLink>
        <nav className="topnav" aria-label="채널 메뉴">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : undefined)}>
            홈
          </NavLink>
          {channels.map((channel) => (
            <NavLink
              key={channel.id}
              to={channel.path}
              className={({ isActive }) => (isActive ? "active" : undefined)}
            >
              {channel.title}
            </NavLink>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  );
}

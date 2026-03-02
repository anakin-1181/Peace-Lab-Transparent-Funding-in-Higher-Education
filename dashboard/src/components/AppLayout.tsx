import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

export function AppLayout({ children }: PropsWithChildren) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-badge">UCL</span>
          <div>
            <h1>Peace Lab - UCL Transparent Funding</h1>
            <p>Use data from HESA Finance</p>
          </div>
        </div>

        <nav className="topnav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Overview
          </NavLink>
          <NavLink to="/departments" className={({ isActive }) => (isActive ? 'active' : '')}>
            Departments
          </NavLink>
          <NavLink to="/data-reference" className={({ isActive }) => (isActive ? 'active' : '')}>
            Data Reference
          </NavLink>
        </nav>
      </header>

      <main className="content">{children}</main>
    </div>
  );
}

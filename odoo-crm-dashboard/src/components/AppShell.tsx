import Link from 'next/link';
import type { ReactNode } from 'react';

const nav = [
  ['/', 'Command Center'],
  ['/leads', 'Leads Workspace'],
  ['/telecallers', 'Telecaller OS'],
  ['/analytics', 'Management Analytics'],
];

export function AppShell({ title, subtitle, active, children }: { title: string; subtitle: string; active: string; children: ReactNode }) {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">Admissions <span>OS</span></div>
        <div className="side-caption">Odoo-connected operating system</div>
        <nav className="nav">
          {nav.map(([href, label]) => (
            <Link className={active === href ? 'active' : ''} href={href} key={href}>{label}</Link>
          ))}
        </nav>
        <div className="side-footer">St. Mary&apos;s Operations<br/><span>Live Odoo workspace</span></div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <h1>{title}</h1>
            <div className="sub">{subtitle}</div>
          </div>
          <div className="filters">
            <select defaultValue="2026-27"><option>2026-27</option><option>2027-28</option></select>
            <select defaultValue="all"><option value="all">All Institutes</option><option>St. Mary&apos;s ISC</option><option>SMIS</option><option>State Board</option><option>St. Mary&apos;s Kids</option></select>
            <select defaultValue="30"><option value="30">Last 30 Days</option><option value="7">Last 7 Days</option><option value="today">Today</option></select>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}

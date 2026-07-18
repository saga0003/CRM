import { AppShell } from '@/components/AppShell';
import { getDashboardData } from '@/lib/dashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const data = await getDashboardData();
  return (
    <AppShell active="/" title="Admissions Command Center" subtitle="Live operational view across institutes, programmes, agents and lead stages.">
      <div className="title-row" style={{marginBottom:16}}><span className={`connection ${data.connected ? 'online' : 'offline'}`}>{data.connected ? 'Live Odoo' : 'Odoo disconnected'}</span></div>
      {!data.connected && <div className="connection-error"><strong>Odoo connection failed.</strong><span>{data.error}</span></div>}
      <section className="grid kpis">{data.kpis.map(([label,value,note])=><div className="card" key={label}><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div><div className="kpi-note">{note}</div></div>)}</section>
      <section className="alerts"><div className="alert danger"><span>Overdue follow-ups</span><strong>{data.alerts.overdue}</strong></div><div className="alert warn"><span>Stagnant leads</span><strong>{data.alerts.stagnant}</strong></div><div className="alert warn"><span>No action recorded</span><strong>{data.alerts.noAction}</strong></div><div className="alert good"><span>Appointments</span><strong>{data.alerts.appointments}</strong></div></section>
      <section className="grid two"><div className="card"><div className="section-title">Pipeline Distribution</div><div className="section-sub">Live lead count and expected revenue grouped by Odoo stage.</div>{data.stages.length?data.stages.map(([stage,count,share,value])=><div className="pipeline-row" key={String(stage)}><strong>{stage}</strong><span>{count}</span><div className="bar"><span style={{width:`${share}%`}}/></div><span>{value}</span></div>):<div className="empty">No pipeline data available.</div>}</div>
      <div className="card"><div className="section-title">Operational Priorities</div><div className="section-sub">Queues requiring immediate attention in Odoo.</div><table><thead><tr><th>Queue</th><th>Count</th><th>Priority</th></tr></thead><tbody><tr><td>Overdue follow-ups</td><td>{data.alerts.overdue}</td><td><span className="badge hot">Immediate</span></td></tr><tr><td>Due today</td><td>{data.kpis[3]?.[1]}</td><td><span className="badge">Today</span></td></tr><tr><td>Stagnant leads</td><td>{data.alerts.stagnant}</td><td><span className="badge">Review</span></td></tr><tr><td>Appointments</td><td>{data.alerts.appointments}</td><td><span className="badge good">Active</span></td></tr></tbody></table></div></section>
      <section className="card" style={{marginTop:16}}><div className="section-head"><div><div className="section-title">Telecaller Performance</div><div className="section-sub">Live assigned leads and confirmed admissions by Odoo salesperson.</div></div><a href="/telecallers" className="badge">Open full Telecaller OS</a></div>{data.agents.length?<div className="table-scroll"><table><thead><tr><th>Agent</th><th>Calls</th><th>Leads</th><th>Admissions</th><th>Conversion</th><th>Overdue</th><th>Stagnant</th></tr></thead><tbody>{data.agents.map(([name,calls,leads,admissions,conversion,overdue,stagnant])=><tr key={String(name)}><td><strong>{name}</strong></td><td>{calls||'—'}</td><td>{leads}</td><td>{admissions}</td><td>{conversion}</td><td>{overdue||'—'}</td><td>{stagnant||'—'}</td></tr>)}</tbody></table></div>:<div className="empty">No salesperson data available.</div>}</section>
    </AppShell>
  );
}

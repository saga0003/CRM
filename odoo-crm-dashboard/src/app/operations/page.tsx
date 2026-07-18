import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { getOperations, rel, money } from '@/lib/operations';

const queueMeta = [
  ['Overdue', 'Immediate follow-ups requiring action', 'danger'],
  ['Due today', 'Activities due before the end of today', 'warn'],
  ['Stagnant', 'Leads unchanged for seven or more days', 'warn'],
  ['No action', 'Active leads without an open activity', 'danger'],
  ['Hot leads', 'High probability or advanced-stage enquiries', 'good'],
  ['Dropped', 'Lost, dropped or no-response enquiries', ''],
] as const;

export default async function OperationsPage({searchParams}:{searchParams:Promise<{queue?:string}>}) {
  const {queue='overdue'} = await searchParams;
  const data = await getOperations();
  const lists:Record<string,typeof data.leads> = {
    overdue:data.overdue.map(x=>x.lead!), due:data.dueToday.map(x=>x.lead!), stagnant:data.stagnant,
    noaction:data.noAction, hot:data.hot, dropped:data.dropped,
  };
  const rows = lists[queue] || lists.overdue;
  const counts = [data.overdue.length,data.dueToday.length,data.stagnant.length,data.noAction.length,data.hot.length,data.dropped.length];
  const keys=['overdue','due','stagnant','noaction','hot','dropped'];
  return <AppShell active="/operations" title="Operations Queues" subtitle="Clickable live queues for immediate admissions-team action.">
    <section className="alerts" style={{marginTop:0}}>{queueMeta.map(([title,desc,tone],i)=><Link href={`/operations?queue=${keys[i]}`} className={`alert ${tone}`} key={title} style={{textDecoration:'none',color:'inherit'}}><span>{title}</span><strong>{counts[i]}</strong><div className="cell-muted">{desc}</div></Link>)}</section>
    <section className="card table-card" style={{marginTop:16}}><div className="section-head"><div><div className="section-title">Selected action queue</div><div className="section-sub">Open any lead to inspect its timeline and perform safe Odoo actions.</div></div><span className="count-pill">{rows.length} leads</span></div>
    <div className="table-scroll"><table><thead><tr><th>Lead</th><th>Contact</th><th>Stage</th><th>Owner</th><th>Probability</th><th>Value</th><th>Last updated</th></tr></thead><tbody>{rows.slice(0,150).map(lead=><tr key={lead.id}><td><Link href={`/leads/${lead.id}`}><strong>{lead.name||'Untitled lead'}</strong></Link><div className="cell-muted">#{lead.id}</div></td><td>{lead.contact_name||'—'}<div className="cell-muted">{lead.phone||lead.email_from||'No contact'}</div></td><td><span className="badge">{rel(lead.stage_id)}</span></td><td>{rel(lead.user_id)}</td><td>{lead.probability||0}%</td><td>{money(lead.expected_revenue)}</td><td>{lead.write_date?.slice(0,16)||'—'}</td></tr>)}</tbody></table></div></section>
  </AppShell>;
}

import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { getOperations, rel, money } from '@/lib/operations';

export default async function LeadsPage({searchParams}:{searchParams:Promise<{q?:string;stage?:string;owner?:string}>}) {
  const filters=await searchParams;const ops=await getOperations();const q=(filters.q||'').toLowerCase();
  const stages=[...new Set(ops.leads.map(l=>rel(l.stage_id)))].sort();const owners=[...new Set(ops.leads.map(l=>rel(l.user_id)))].sort();
  const leads=ops.leads.filter(l=>(!q||[l.name,l.contact_name,l.phone,l.email_from].some(v=>v?.toLowerCase().includes(q)))&&(!filters.stage||rel(l.stage_id)===filters.stage)&&(!filters.owner||rel(l.user_id)===filters.owner));
  const activityByLead=new Map<number,string>();for(const a of ops.activities){const current=activityByLead.get(a.res_id);if(!current||a.date_deadline<current)activityByLead.set(a.res_id,a.date_deadline);}
  return <AppShell active="/leads" title="Leads Workspace" subtitle="Search, filter, prioritize and open live Odoo enquiries.">
    <form className="toolbar card"><input name="q" defaultValue={filters.q} placeholder="Search student, parent, phone or email"/><select name="stage" defaultValue={filters.stage||''}><option value="">All stages</option>{stages.map(s=><option key={s}>{s}</option>)}</select><select name="owner" defaultValue={filters.owner||''}><option value="">All agents</option>{owners.map(s=><option key={s}>{s}</option>)}</select><button>Apply filters</button></form>
    <section className="card table-card"><div className="section-head"><div><div className="section-title">Filtered lead directory</div><div className="section-sub">Cached live snapshot with direct lead-detail access.</div></div><span className="count-pill">{leads.length} loaded</span></div><div className="table-scroll"><table><thead><tr><th>Lead</th><th>Contact</th><th>Stage</th><th>Owner</th><th>Next activity</th><th>Probability</th><th>Expected value</th><th>Last updated</th></tr></thead><tbody>{leads.map(lead=><tr key={lead.id}><td><Link href={`/leads/${lead.id}`}><strong>{lead.name||'Untitled lead'}</strong></Link><div className="cell-muted">#{lead.id}</div></td><td>{lead.contact_name||'—'}<div className="cell-muted">{lead.phone||lead.email_from||'No contact details'}</div></td><td><span className="badge">{rel(lead.stage_id)}</span></td><td>{rel(lead.user_id)}</td><td className={activityByLead.has(lead.id)?'':'risk-text'}>{activityByLead.get(lead.id)||'No follow-up'}</td><td>{lead.probability||0}%</td><td>{money(lead.expected_revenue)}</td><td>{lead.write_date?.slice(0,16)||'—'}</td></tr>)}</tbody></table></div></section>
  </AppShell>;
}

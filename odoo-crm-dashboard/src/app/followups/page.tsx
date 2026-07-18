import { unstable_cache } from 'next/cache';
import { AppShell } from '@/components/AppShell';
import { searchRead } from '@/lib/odoo';

type Lead = {
  id: number; name?: string; contact_name?: string; phone?: string;
  stage_id?: [number,string] | false; user_id?: [number,string] | false;
  activity_date_deadline?: string | false; expected_revenue?: number;
};

const loadFollowups = unstable_cache(async () => {
  const today = new Date().toISOString().slice(0,10);
  return searchRead<Lead>('crm.lead', [['active','=',true],['activity_date_deadline','<=',today]], ['name','contact_name','phone','stage_id','user_id','activity_date_deadline','expected_revenue'], { limit: 150, order: 'activity_date_deadline asc' });
}, ['odoo-followup-queue-v1'], { revalidate: 90, tags: ['odoo-followups'] });

const relation = (value: [number,string] | false | undefined) => Array.isArray(value) ? value[1] : 'Unassigned';
const money = (value=0) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);

export default async function FollowupsPage() {
  let rows: Lead[] = []; let error = '';
  try { rows = await loadFollowups(); } catch (e) { error = e instanceof Error ? e.message : 'Unable to load follow-ups'; }
  const today = new Date().toISOString().slice(0,10);
  const overdue = rows.filter((row)=>Boolean(row.activity_date_deadline && row.activity_date_deadline < today));
  const dueToday = rows.filter((row)=>row.activity_date_deadline === today);

  return (
    <AppShell active="/followups" title="Follow-up Queue" subtitle="A focused action list of overdue and due-today admissions enquiries.">
      {error ? <div className="error-banner">{error}</div> : null}
      <section className="alerts" style={{marginTop:0}}>
        <div className="alert danger"><span>Overdue</span><strong>{overdue.length}</strong></div>
        <div className="alert warn"><span>Due today</span><strong>{dueToday.length}</strong></div>
        <div className="alert good"><span>Loaded actions</span><strong>{rows.length}</strong></div>
        <div className="alert"><span>Snapshot refresh</span><strong style={{fontSize:18}}>90 sec</strong></div>
      </section>
      <section className="card table-card" style={{marginTop:16}}>
        <div className="section-head"><div><div className="section-title">Priority calling list</div><div className="section-sub">Oldest overdue follow-ups appear first.</div></div><span className="count-pill">{rows.length} actions</span></div>
        <div className="table-scroll"><table><thead><tr><th>Lead</th><th>Contact</th><th>Owner</th><th>Stage</th><th>Deadline</th><th>Value</th><th>Status</th></tr></thead><tbody>
          {rows.map((lead)=>{const isOverdue=Boolean(lead.activity_date_deadline && lead.activity_date_deadline < today);return <tr key={lead.id}>
            <td><strong>{lead.name || 'Untitled lead'}</strong><div className="cell-muted">#{lead.id}</div></td>
            <td>{lead.contact_name || '—'}<div className="cell-muted">{lead.phone || 'No phone'}</div></td>
            <td>{relation(lead.user_id)}</td><td><span className="badge">{relation(lead.stage_id)}</span></td>
            <td className={isOverdue?'risk-text':''}>{lead.activity_date_deadline || '—'}</td><td>{money(lead.expected_revenue)}</td>
            <td><span className={`badge ${isOverdue?'hot':'good'}`}>{isOverdue?'Overdue':'Due today'}</span></td>
          </tr>})}
        </tbody></table></div>
      </section>
    </AppShell>
  );
}

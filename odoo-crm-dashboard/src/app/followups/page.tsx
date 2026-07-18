import { unstable_cache } from 'next/cache';
import { AppShell } from '@/components/AppShell';
import { searchRead } from '@/lib/odoo';

type Activity = {
  id: number;
  res_id?: number;
  res_name?: string;
  date_deadline?: string;
  user_id?: [number,string] | false;
  activity_type_id?: [number,string] | false;
  summary?: string | false;
};

type Lead = {
  id: number;
  name?: string;
  contact_name?: string;
  phone?: string;
  stage_id?: [number,string] | false;
  user_id?: [number,string] | false;
  expected_revenue?: number;
};

type FollowupRow = Lead & {
  activityId: number;
  deadline: string;
  activityOwner?: [number,string] | false;
  activityType?: [number,string] | false;
  summary?: string | false;
};

const loadFollowups = unstable_cache(async (): Promise<FollowupRow[]> => {
  const today = new Date().toISOString().slice(0,10);
  const activities = await searchRead<Activity>(
    'mail.activity',
    [['res_model','=','crm.lead'],['date_deadline','<=',today]],
    ['res_id','res_name','date_deadline','user_id','activity_type_id','summary'],
    { limit: 200, order: 'date_deadline asc,id asc' },
  );

  const leadIds = [...new Set(activities.map((activity) => Number(activity.res_id || 0)).filter(Boolean))];
  if (!leadIds.length) return [];

  const leads = await searchRead<Lead>(
    'crm.lead',
    [['id','in',leadIds]],
    ['name','contact_name','phone','stage_id','user_id','expected_revenue'],
    { limit: leadIds.length },
  );

  const leadMap = new Map(leads.map((lead) => [lead.id, lead]));
  return activities.map((activity) => {
    const lead = leadMap.get(Number(activity.res_id));
    return {
      id: lead?.id || Number(activity.res_id),
      name: lead?.name || activity.res_name || 'Untitled lead',
      contact_name: lead?.contact_name,
      phone: lead?.phone,
      stage_id: lead?.stage_id,
      user_id: lead?.user_id,
      expected_revenue: lead?.expected_revenue,
      activityId: activity.id,
      deadline: activity.date_deadline || today,
      activityOwner: activity.user_id,
      activityType: activity.activity_type_id,
      summary: activity.summary,
    };
  });
}, ['odoo-followup-queue-v2'], { revalidate: 90, tags: ['odoo-followups'] });

const relation = (value: [number,string] | false | undefined) => Array.isArray(value) ? value[1] : 'Unassigned';
const money = (value=0) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);

export default async function FollowupsPage() {
  let rows: FollowupRow[] = []; let error = '';
  try { rows = await loadFollowups(); } catch (e) { error = e instanceof Error ? e.message : 'Unable to load follow-ups'; }
  const today = new Date().toISOString().slice(0,10);
  const overdue = rows.filter((row)=>row.deadline < today);
  const dueToday = rows.filter((row)=>row.deadline === today);

  return (
    <AppShell active="/followups" title="Follow-up Queue" subtitle="A focused action list of overdue and due-today admissions enquiries.">
      {error ? <div className="error-banner">{error}</div> : null}
      <section className="alerts" style={{marginTop:0}}>
        <div className="alert danger"><span>Overdue activities</span><strong>{overdue.length}</strong></div>
        <div className="alert warn"><span>Due today</span><strong>{dueToday.length}</strong></div>
        <div className="alert good"><span>Loaded actions</span><strong>{rows.length}</strong></div>
        <div className="alert"><span>Snapshot refresh</span><strong style={{fontSize:18}}>90 sec</strong></div>
      </section>
      <section className="card table-card" style={{marginTop:16}}>
        <div className="section-head"><div><div className="section-title">Priority calling list</div><div className="section-sub">Built from stored Odoo activities; oldest overdue actions appear first.</div></div><span className="count-pill">{rows.length} actions</span></div>
        <div className="table-scroll"><table><thead><tr><th>Lead</th><th>Contact</th><th>Owner</th><th>Stage</th><th>Activity</th><th>Deadline</th><th>Value</th><th>Status</th></tr></thead><tbody>
          {rows.map((lead)=>{const isOverdue=lead.deadline < today;return <tr key={lead.activityId}>
            <td><strong>{lead.name || 'Untitled lead'}</strong><div className="cell-muted">Lead #{lead.id}</div></td>
            <td>{lead.contact_name || '—'}<div className="cell-muted">{lead.phone || 'No phone'}</div></td>
            <td>{relation(lead.activityOwner || lead.user_id)}</td><td><span className="badge">{relation(lead.stage_id)}</span></td>
            <td>{lead.summary || relation(lead.activityType)}</td>
            <td className={isOverdue?'risk-text':''}>{lead.deadline}</td><td>{money(lead.expected_revenue)}</td>
            <td><span className={`badge ${isOverdue?'hot':'good'}`}>{isOverdue?'Overdue':'Due today'}</span></td>
          </tr>})}
        </tbody></table></div>
      </section>
    </AppShell>
  );
}

import { AppShell } from '@/components/AppShell';
import { searchRead } from '@/lib/odoo';

export const revalidate = 60;

type Lead = {
  id: number;
  name?: string;
  contact_name?: string;
  phone?: string;
  email_from?: string;
  stage_id?: [number, string] | false;
  user_id?: [number, string] | false;
  expected_revenue?: number;
  activity_date_deadline?: string | false;
  write_date?: string;
};

function relation(value: [number, string] | false | undefined) { return Array.isArray(value) ? value[1] : 'Unassigned'; }
function money(value = 0) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value); }

export default async function LeadsPage() {
  let leads: Lead[] = [];
  let error = '';
  try {
    leads = await searchRead<Lead>('crm.lead', [['active', '=', true]], ['name','contact_name','phone','email_from','stage_id','user_id','expected_revenue','activity_date_deadline','write_date'], { limit: 100, order: 'write_date desc' });
  } catch (e) { error = e instanceof Error ? e.message : 'Unable to load leads'; }

  return (
    <AppShell active="/leads" title="Leads Workspace" subtitle="Search, prioritize and inspect the latest enquiries directly from Odoo.">
      <section className="toolbar card">
        <input placeholder="Search student, parent, phone or email" />
        <select><option>All stages</option><option>New Lead</option><option>Appointment Scheduled</option><option>Admission Confirmed</option></select>
        <select><option>All agents</option></select>
        <button>Export current view</button>
      </section>
      {error ? <div className="error-banner">{error}</div> : null}
      <section className="card table-card">
        <div className="section-head"><div><div className="section-title">Latest 100 leads</div><div className="section-sub">Updated from Odoo every minute.</div></div><span className="count-pill">{leads.length} loaded</span></div>
        <div className="table-scroll"><table><thead><tr><th>Lead</th><th>Contact</th><th>Stage</th><th>Owner</th><th>Follow-up</th><th>Expected value</th><th>Last updated</th></tr></thead>
        <tbody>{leads.map((lead) => <tr key={lead.id}>
          <td><strong>{lead.name || 'Untitled lead'}</strong><div className="cell-muted">#{lead.id}</div></td>
          <td>{lead.contact_name || '—'}<div className="cell-muted">{lead.phone || lead.email_from || 'No contact details'}</div></td>
          <td><span className="badge">{relation(lead.stage_id)}</span></td>
          <td>{relation(lead.user_id)}</td>
          <td className={lead.activity_date_deadline ? '' : 'risk-text'}>{lead.activity_date_deadline || 'No follow-up'}</td>
          <td>{money(lead.expected_revenue)}</td>
          <td>{lead.write_date?.slice(0,16) || '—'}</td>
        </tr>)}</tbody></table></div>
      </section>
    </AppShell>
  );
}

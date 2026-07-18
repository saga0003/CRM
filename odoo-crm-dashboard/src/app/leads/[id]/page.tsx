import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { LeadActions } from '@/components/LeadActions';
import { nameSearch, searchRead } from '@/lib/odoo';
import { LeadRow, ActivityRow, rel, money } from '@/lib/operations';

type Message={id:number;date?:string;body?:string;author_id?:[number,string]|false;subtype_id?:[number,string]|false};
export default async function LeadDetail({params}:{params:Promise<{id:string}>}){
  const {id}=await params;const leadId=Number(id);if(!Number.isInteger(leadId))notFound();
  const [leads,activities,messages,stages]=await Promise.all([
    searchRead<LeadRow>('crm.lead',[['id','=',leadId]],['name','contact_name','phone','email_from','stage_id','user_id','source_id','expected_revenue','create_date','write_date','probability','description'],{limit:1}),
    searchRead<ActivityRow>('mail.activity',[['res_model','=','crm.lead'],['res_id','=',leadId]],['res_id','date_deadline','user_id','activity_type_id','summary','note'],{limit:50,order:'date_deadline asc'}),
    searchRead<Message>('mail.message',[['model','=','crm.lead'],['res_id','=',leadId]],['date','body','author_id','subtype_id'],{limit:50,order:'date desc'}),
    nameSearch('crm.stage','',[],100),
  ]);
  const lead=leads[0];if(!lead)notFound();
  return <AppShell active="/leads" title={lead.name||'Lead Detail'} subtitle={`Lead #${lead.id} · live Odoo workspace`}>
    <section className="detail-grid"><div>
      <section className="grid compact-kpis"><div className="card"><div className="kpi-label">Stage</div><div className="kpi-value small-value">{rel(lead.stage_id)}</div></div><div className="card"><div className="kpi-label">Owner</div><div className="kpi-value small-value">{rel(lead.user_id)}</div></div><div className="card"><div className="kpi-label">Probability</div><div className="kpi-value">{lead.probability||0}%</div></div><div className="card"><div className="kpi-label">Expected value</div><div className="kpi-value small-value">{money(lead.expected_revenue)}</div></div></section>
      <section className="card"><div className="section-title">Student and enquiry profile</div><div className="profile-grid"><div><span>Contact</span><strong>{lead.contact_name||'—'}</strong></div><div><span>Phone</span><strong>{lead.phone||'—'}</strong></div><div><span>Email</span><strong>{lead.email_from||'—'}</strong></div><div><span>Source</span><strong>{rel(lead.source_id,'Unknown')}</strong></div><div><span>Created</span><strong>{lead.create_date?.slice(0,16)||'—'}</strong></div><div><span>Last updated</span><strong>{lead.write_date?.slice(0,16)||'—'}</strong></div></div>{lead.description&&<div className="description-box">{lead.description}</div>}</section>
      <section className="card" style={{marginTop:16}}><div className="section-title">Open activities</div>{activities.length?activities.map(a=><div className="timeline-item" key={a.id}><b>{a.date_deadline}</b><div><strong>{a.summary||rel(a.activity_type_id,'Activity')}</strong><span>{rel(a.user_id)} · {a.note||'No note'}</span></div></div>):<div className="empty">No open activities.</div>}</section>
      <section className="card" style={{marginTop:16}}><div className="section-title">Communication timeline</div>{messages.length?messages.map(m=><div className="timeline-item" key={m.id}><b>{m.date?.slice(0,16)||'—'}</b><div><strong>{rel(m.author_id,'System')}</strong><span>{(m.body||'').replace(/<[^>]+>/g,' ').slice(0,500)||'Activity recorded'}</span></div></div>):<div className="empty">No timeline messages available.</div>}</section>
    </div><aside className="card sticky-actions"><LeadActions leadId={lead.id} stages={stages}/></aside></section>
  </AppShell>;
}

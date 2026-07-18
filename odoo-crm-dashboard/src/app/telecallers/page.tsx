import { AppShell } from '@/components/AppShell';
import { readGroup } from '@/lib/odoo';

export const revalidate = 60;

type Group = { user_id?: [number,string] | false; user_id_count?: number; __count?: number; expected_revenue?: number };

export default async function TelecallersPage() {
  let rows: Array<{name:string;leads:number;overdue:number;stagnant:number;confirmed:number;revenue:number}> = [];
  let error = '';
  try {
    const today = new Date().toISOString().slice(0,10);
    const stagnant = new Date(); stagnant.setDate(stagnant.getDate()-7);
    const cutoff = stagnant.toISOString().slice(0,19).replace('T',' ');
    const all = await readGroup<Group>('crm.lead', [['active','=',true]], ['user_id','expected_revenue:sum'], ['user_id']);
    const overdue = await readGroup<Group>('crm.lead', [['active','=',true],['activity_date_deadline','<',today]], ['user_id'], ['user_id']);
    const stale = await readGroup<Group>('crm.lead', [['active','=',true],['write_date','<',cutoff]], ['user_id'], ['user_id']);
    const confirmed = await readGroup<Group>('crm.lead', [['stage_id.name','=','Admission Confirmed']], ['user_id','expected_revenue:sum'], ['user_id']);
    const index = (items:Group[]) => new Map(items.filter(x=>Array.isArray(x.user_id)).map(x=>[(x.user_id as [number,string])[0],x]));
    const o=index(overdue), s=index(stale), c=index(confirmed);
    rows = all.filter(x=>Array.isArray(x.user_id)).map(x=>{ const [id,name]=x.user_id as [number,string]; return {name,leads:Number(x.user_id_count??x.__count??0),overdue:Number(o.get(id)?.user_id_count??o.get(id)?.__count??0),stagnant:Number(s.get(id)?.user_id_count??s.get(id)?.__count??0),confirmed:Number(c.get(id)?.user_id_count??c.get(id)?.__count??0),revenue:Number(c.get(id)?.expected_revenue??0)}; }).sort((a,b)=>b.leads-a.leads);
  } catch(e){ error=e instanceof Error?e.message:'Unable to load telecaller data'; }
  const total = rows.reduce((a,r)=>a+r.leads,0);
  const confirmed = rows.reduce((a,r)=>a+r.confirmed,0);
  return <AppShell active="/telecallers" title="Telecaller OS" subtitle="Daily accountability, risk queues and conversion performance by agent.">
    <section className="grid kpis compact-kpis">
      <div className="card"><div className="kpi-label">Assigned leads</div><div className="kpi-value">{total.toLocaleString('en-IN')}</div><div className="kpi-note">Across active agents</div></div>
      <div className="card"><div className="kpi-label">Confirmed</div><div className="kpi-value">{confirmed}</div><div className="kpi-note">Admission Confirmed stage</div></div>
      <div className="card"><div className="kpi-label">Team conversion</div><div className="kpi-value">{total?((confirmed/total)*100).toFixed(2):'0'}%</div><div className="kpi-note">Current live ratio</div></div>
      <div className="card"><div className="kpi-label">Agents</div><div className="kpi-value">{rows.length}</div><div className="kpi-note">With assigned leads</div></div>
    </section>
    {error?<div className="error-banner">{error}</div>:null}
    <section className="card table-card"><div className="section-head"><div><div className="section-title">Agent performance and risk</div><div className="section-sub">Use overdue and stagnant columns as the daily action queue.</div></div></div>
      <div className="table-scroll"><table><thead><tr><th>Agent</th><th>Assigned</th><th>Confirmed</th><th>Conversion</th><th>Overdue</th><th>Stagnant 7d+</th><th>Confirmed revenue</th><th>Priority</th></tr></thead><tbody>
        {rows.map(r=><tr key={r.name}><td><strong>{r.name}</strong></td><td>{r.leads}</td><td>{r.confirmed}</td><td>{r.leads?((r.confirmed/r.leads)*100).toFixed(1):'0'}%</td><td className={r.overdue?'risk-text':''}>{r.overdue}</td><td className={r.stagnant?'risk-text':''}>{r.stagnant}</td><td>₹{r.revenue.toLocaleString('en-IN')}</td><td><span className={r.overdue>20?'badge hot':'badge good'}>{r.overdue>20?'Immediate action':'On track'}</span></td></tr>)}
      </tbody></table></div>
    </section>
  </AppShell>;
}

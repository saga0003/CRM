import { AppShell } from '@/components/AppShell';
import { readGroup } from '@/lib/odoo';

export const revalidate = 90;

type Group = { stage_id?: [number,string]|false; source_id?: [number,string]|false; stage_id_count?: number; source_id_count?: number; __count?: number; expected_revenue?: number };
const count=(g:Group)=>Number(g.stage_id_count??g.source_id_count??g.__count??0);
const money=(v=0)=>v>=10000000?`₹${(v/10000000).toFixed(1)}Cr`:v>=100000?`₹${(v/100000).toFixed(1)}L`:`₹${Math.round(v/1000)}K`;

export default async function AnalyticsPage(){
  let stages:Group[]=[]; let sources:Group[]=[]; let error='';
  try{
    stages=await readGroup<Group>('crm.lead',[['active','=',true]],['stage_id','expected_revenue:sum'],['stage_id']);
    sources=await readGroup<Group>('crm.lead',[['active','=',true]],['source_id','expected_revenue:sum'],['source_id']);
  }catch(e){error=e instanceof Error?e.message:'Unable to load analytics';}
  const sortedStages=[...stages].sort((a,b)=>count(b)-count(a));
  const sortedSources=[...sources].sort((a,b)=>count(b)-count(a)).slice(0,12);
  const total=sortedStages.reduce((a,g)=>a+count(g),0);
  const pipeline=sortedStages.reduce((a,g)=>a+Number(g.expected_revenue||0),0);
  const confirmed=sortedStages.find(g=>Array.isArray(g.stage_id)&&(g.stage_id as [number,string])[1]==='Admission Confirmed');
  return <AppShell active="/analytics" title="Management Analytics" subtitle="Pipeline health, funnel concentration, acquisition sources and revenue exposure.">
    <section className="grid kpis compact-kpis">
      <div className="card"><div className="kpi-label">Active pipeline</div><div className="kpi-value">{total.toLocaleString('en-IN')}</div><div className="kpi-note">Live Odoo records</div></div>
      <div className="card"><div className="kpi-label">Expected value</div><div className="kpi-value">{money(pipeline)}</div><div className="kpi-note">Unweighted opportunity value</div></div>
      <div className="card"><div className="kpi-label">Confirmed</div><div className="kpi-value">{count(confirmed||{})}</div><div className="kpi-note">Admission Confirmed stage</div></div>
      <div className="card"><div className="kpi-label">Lead sources</div><div className="kpi-value">{sources.length}</div><div className="kpi-note">Tracked acquisition channels</div></div>
    </section>
    {error?<div className="error-banner">{error}</div>:null}
    <section className="grid two analytics-grid">
      <div className="card"><div className="section-title">Full funnel distribution</div><div className="section-sub">Concentration and value at every Odoo stage.</div>
        {sortedStages.map(g=>{const name=Array.isArray(g.stage_id)?g.stage_id[1]:'Unassigned';const c=count(g);return <div className="metric-row" key={name}><div><strong>{name}</strong><span>{c} leads</span></div><div className="bar"><span style={{width:`${Math.max(2,total?c/total*100:0)}%`}}/></div><b>{money(Number(g.expected_revenue||0))}</b></div>})}
      </div>
      <div className="card"><div className="section-title">Top acquisition sources</div><div className="section-sub">Where enquiries and expected revenue originate.</div>
        <div className="rank-list">{sortedSources.map((g,i)=>{const name=Array.isArray(g.source_id)?g.source_id[1]:'Unknown source';return <div className="rank-item" key={`${name}-${i}`}><span className="rank-no">{i+1}</span><div><strong>{name}</strong><small>{count(g)} leads</small></div><b>{money(Number(g.expected_revenue||0))}</b></div>})}</div>
      </div>
    </section>
  </AppShell>;
}

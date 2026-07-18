import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { AppShell } from '@/components/AppShell';
import { searchRead } from '@/lib/odoo';
import { inferGrade,inferInstitute,scoreLead,type ScorableLead } from '@/lib/scoring';

const load=unstable_cache(()=>searchRead<ScorableLead>('crm.lead',[['active','=',true]],['name','contact_name','phone','email_from','stage_id','user_id','team_id','probability','expected_revenue','description','create_date','write_date','activity_ids','source_id'],{limit:300,order:'write_date desc'}),['local-intelligence-v1'],{revalidate:180});

export default async function IntelligencePage(){
 let leads:ScorableLead[]=[];let error='';try{leads=await load();}catch(e){error=e instanceof Error?e.message:'Unable to score leads';}
 const rows=leads.map(l=>({lead:l,score:scoreLead(l),institute:inferInstitute(l),grade:inferGrade(l)})).sort((a,b)=>b.score.score-a.score.score);
 const bands=['Hot','Warm','Develop','Cold','Risk'].map(b=>[b,rows.filter(r=>r.score.band===b).length]);
 return <AppShell active="/intelligence" title="Local Lead Intelligence" subtitle="Explainable scoring without external AI APIs, calculated from live Odoo behaviour and data quality.">
  {error?<div className="error-banner">{error}</div>:null}
  <section className="alerts" style={{marginTop:0}}>{bands.slice(0,4).map(([b,n])=><div className={`alert ${b==='Hot'?'danger':b==='Warm'?'warn':'good'}`} key={b}><span>{b}</span><strong>{n}</strong></div>)}</section>
  <section className="card table-card" style={{marginTop:16}}><div className="section-head"><div><div className="section-title">Priority scored leads</div><div className="section-sub">Score combines stage 36%, Odoo probability 24%, recency 16%, engagement 10%, completeness 8% and value 6%, with risk adjustments.</div></div><span className="count-pill">{rows.length} scored</span></div>
  <div className="table-scroll"><table><thead><tr><th>Lead</th><th>Institute / Grade</th><th>Stage</th><th>Owner</th><th>Score</th><th>Why</th><th>Next action</th></tr></thead><tbody>{rows.slice(0,150).map(r=><tr key={r.lead.id}><td><Link href={`/leads/${r.lead.id}`}><strong>{r.lead.name||'Untitled'}</strong></Link><div className="cell-muted">#{r.lead.id}</div></td><td>{r.institute}<div className="cell-muted">{r.grade}</div></td><td>{Array.isArray(r.lead.stage_id)?r.lead.stage_id[1]:'Unassigned'}</td><td>{Array.isArray(r.lead.user_id)?r.lead.user_id[1]:'Unassigned'}</td><td><span className={`score-pill score-${r.score.band.toLowerCase()}`}>{r.score.score} · {r.score.band}</span></td><td>{r.score.reasons.join(' · ')}</td><td>{r.score.nextAction}</td></tr>)}</tbody></table></div></section>
 </AppShell>;
}
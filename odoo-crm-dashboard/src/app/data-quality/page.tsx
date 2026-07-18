import Link from 'next/link';
import { unstable_cache } from 'next/cache';
import { AppShell } from '@/components/AppShell';
import { searchRead } from '@/lib/odoo';
import type { ScorableLead } from '@/lib/scoring';

const load=unstable_cache(()=>searchRead<ScorableLead>('crm.lead',[['active','=',true]],['name','contact_name','phone','email_from','stage_id','user_id','team_id','source_id','description','write_date'],{limit:1500,order:'write_date desc'}),['data-quality-v1'],{revalidate:300});
export default async function DataQualityPage(){let leads:ScorableLead[]=[];let error='';try{leads=await load();}catch(e){error=e instanceof Error?e.message:'Unable to audit data';}
 const rules=[
  ['Missing phone and email',(l:ScorableLead)=>!l.phone&&!l.email_from],['Missing owner',(l:ScorableLead)=>!l.user_id],['Missing source',(l:ScorableLead)=>!l.source_id],['Missing contact/parent',(l:ScorableLead)=>!l.contact_name],['Missing institute/team',(l:ScorableLead)=>!l.team_id],['Blank description',(l:ScorableLead)=>!l.description],
 ] as const;
 const duplicates=new Map<string,ScorableLead[]>();for(const l of leads){const k=(l.phone||l.email_from||'').toLowerCase().replace(/\s/g,'');if(k){const a=duplicates.get(k)||[];a.push(l);duplicates.set(k,a);}}
 const dup=[...duplicates.values()].filter(x=>x.length>1).flat();
 return <AppShell active="/data-quality" title="Data Quality & Import Control" subtitle="Audit incomplete, duplicate and operationally weak records before reporting or automation.">{error?<div className="error-banner">{error}</div>:null}
 <section className="alerts" style={{marginTop:0}}>{rules.slice(0,4).map(([label,test])=><div className="alert warn" key={label}><span>{label}</span><strong>{leads.filter(test).length}</strong></div>)}</section>
 <section className="grid two"><div className="card"><div className="section-title">Quality rule summary</div>{rules.map(([label,test])=>{const n=leads.filter(test).length;return <div className="metric-row" key={label}><div><strong>{label}</strong><span>{leads.length?((n/leads.length)*100).toFixed(1):0}% of loaded leads</span></div><div className="bar"><span style={{width:`${leads.length?n/leads.length*100:0}%`}}/></div><b>{n}</b></div>})}</div><div className="card"><div className="section-title">Import readiness</div><div className="section-sub">Safe workflow for CSV/Excel imports.</div><ol><li>Upload and preview rows</li><li>Map student, parent, phone, programme, institute and source</li><li>Detect duplicate phones/emails</li><li>Choose agent, academic year and default stage</li><li>Validate before writing to Odoo</li><li>Download rejected-row report</li></ol><div className="connection-error" style={{marginTop:16}}>Bulk import write-back is intentionally disabled until authentication and role permissions are active.</div></div></section>
 <section className="card table-card" style={{marginTop:16}}><div className="section-head"><div><div className="section-title">Potential duplicate records</div><div className="section-sub">Matching phone or email within the current audit snapshot.</div></div><span className="count-pill">{dup.length}</span></div><div className="table-scroll"><table><thead><tr><th>Lead</th><th>Phone/email</th><th>Owner</th><th>Stage</th></tr></thead><tbody>{dup.slice(0,100).map(l=><tr key={l.id}><td><Link href={`/leads/${l.id}`}>{l.name||`Lead #${l.id}`}</Link></td><td>{l.phone||l.email_from}</td><td>{Array.isArray(l.user_id)?l.user_id[1]:'Unassigned'}</td><td>{Array.isArray(l.stage_id)?l.stage_id[1]:'Unassigned'}</td></tr>)}</tbody></table></div></section>
 </AppShell>;
}
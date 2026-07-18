import Link from 'next/link';
import { AppShell } from '@/components/AppShell';
import { getAdvancedSalesOS, money } from '@/lib/salesos-advanced';

export const revalidate=180;

export default async function SalesOSPage(){
 const data=await getAdvancedSalesOS();
 const institutes=data.segments.filter(x=>x.kind==='Institute').slice(0,8);
 const grades=data.segments.filter(x=>x.kind==='Grade').slice(0,10);
 const programmes=data.segments.filter(x=>x.kind==='Programme').slice(0,10);
 return <AppShell active="/salesos" title="SalesOS Advanced Command Centre" subtitle="The V7.3 operating model merged with live Odoo data, local scoring, call intelligence and management action queues.">
  <div className="salesos-banner"><div><strong>Live operational snapshot</strong><span>Refreshed {new Date(data.refreshedAt).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}</span></div><div className="badge good">V7.3 intelligence merged</div></div>
  <section className="grid kpis">{data.kpis.map(k=><div className="card" key={k.label}><div className="kpi-label">{k.label}</div><div className="kpi-value">{k.value}</div><div className="kpi-note">{k.note}</div></div>)}</section>

  <section className="grid two">
   <div className="card table-card"><div className="section-head"><div><div className="section-title">Director Action Worklist</div><div className="section-sub">Critical, overdue, stagnant and high-intent leads ranked by urgency and local score.</div></div><Link className="badge" href="/operations">Open all queues</Link></div><div className="table-scroll"><table><thead><tr><th>Lead</th><th>Score</th><th>Urgency</th><th>Stage</th><th>Owner</th><th>Next action</th></tr></thead><tbody>{data.actions.slice(0,25).map(l=><tr key={l.id}><td><Link href={`/leads/${l.id}`}><strong>{l.name}</strong></Link><div className="cell-muted">{l.institute} · {l.grade} · {l.programme}</div></td><td><span className={`score-pill ${l.score>=78?'score-hot':l.score>=60?'score-warm':''}`}>{l.score}</span><div className="cell-muted">{l.label}</div></td><td><span className={`badge ${l.urgency==='Critical'?'hot':l.urgency==='Normal'?'good':''}`}>{l.urgency}</span><div className="cell-muted">{l.flags.join(' · ')||'No risk flag'}</div></td><td>{l.stage}</td><td>{l.owner}</td><td>{l.nextAction}</td></tr>)}</tbody></table></div></div>
   <div className="card"><div className="section-title">Call Intelligence — last 30 days</div><div className="section-sub">Confirmed calls require explicit conversation evidence. Probable notes are shown separately and never presented as exact calls.</div><div className="call-kpis"><div><span>Confirmed</span><strong>{data.calls.confirmed}</strong></div><div><span>Probable notes</span><strong>{data.calls.probable}</strong></div><div><span>Unique leads</span><strong>{data.calls.uniqueLeads}</strong></div></div><div className="rank-list">{data.calls.byAgent.slice(0,10).map((a,i)=><div className="rank-item" key={a.name}><span className="rank-no">{i+1}</span><div><strong>{a.name}</strong><small>{a.unique} unique leads</small></div><b>{a.confirmed} / {a.probable}</b></div>)}</div></div>
  </section>

  <section className="card table-card" style={{marginTop:16}}><div className="section-head"><div><div className="section-title">Transparent Team Scorecard</div><div className="section-sub">Conversion, follow-up discipline and measured activity are visible separately.</div></div><Link className="badge" href="/telecallers">Full Telecaller OS</Link></div><div className="table-scroll"><table><thead><tr><th>Agent</th><th>Score</th><th>Leads</th><th>Admissions</th><th>Conversion</th><th>Overdue</th><th>Stagnant</th><th>Confirmed calls</th><th>Probable</th></tr></thead><tbody>{data.team.map(r=><tr key={r.name}><td><strong>{r.name}</strong></td><td><span className={`score-pill ${r.score>=75?'score-hot':r.score>=55?'score-warm':''}`}>{r.score}</span></td><td>{r.leads}</td><td>{r.admissions}</td><td>{r.conversion.toFixed(1)}%</td><td className={r.overdue?'risk-text':''}>{r.overdue}</td><td className={r.stagnant?'risk-text':''}>{r.stagnant}</td><td>{r.confirmedCalls}</td><td>{r.probableCalls}</td></tr>)}</tbody></table></div></section>

  <section className="grid three salesos-segments">
   {[['Institute performance',institutes],['Grade performance',grades],['Programme performance',programmes]].map(([title,rows])=><div className="card" key={String(title)}><div className="section-title">{String(title)}</div><div className="section-sub">Leads, admissions, hot opportunities and pipeline.</div>{(rows as typeof institutes).map(r=><div className="segment-row" key={`${r.kind}-${r.name}`}><div><strong>{r.name}</strong><span>{r.admissions} admissions · {r.hot} hot</span></div><b>{r.leads}</b><em>{money(r.pipeline)}</em></div>)}</div>)}
  </section>

  <section className="grid two">
   <div className="card"><div className="section-title">Exact Odoo Stage Register</div><div className="section-sub">No generic stages are invented; every exact stage remains visible.</div>{data.stages.map(s=><div className="pipeline-row" key={s.name}><strong>{s.name}</strong><span>{s.count}</span><div className="bar"><span style={{width:`${Math.max(3,Math.min(100,s.count/Math.max(...data.stages.map(x=>x.count),1)*100))}%`}}/></div><span>{money(s.value)}</span></div>)}</div>
   <div className="card"><div className="section-title">Why Leads Were Lost</div><div className="section-sub">Rule-classified from stage and lead description until structured drop reasons are mandatory.</div><div className="rank-list">{data.lost.map((x,i)=><div className="rank-item" key={x.reason}><span className="rank-no">{i+1}</span><div><strong>{x.reason}</strong><small>Recovery and data-cleaning input</small></div><b>{x.count}</b></div>)}</div></div>
  </section>
 </AppShell>
}
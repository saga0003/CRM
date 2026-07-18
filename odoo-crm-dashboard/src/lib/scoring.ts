export type ScorableLead = {
  id: number; name?: string; contact_name?: string; phone?: string; email_from?: string;
  stage_id?: [number,string] | false; user_id?: [number,string] | false; team_id?: [number,string] | false;
  probability?: number; expected_revenue?: number; description?: string | false; create_date?: string; write_date?: string;
  activity_ids?: number[]; tag_ids?: number[]; source_id?: [number,string] | false;
};

export type LeadScore = { score:number; band:'Hot'|'Warm'|'Develop'|'Cold'|'Risk'; reasons:string[]; nextAction:string };

const stageWeight: Record<string,number> = {
  'admission confirmed':100,'seat allotted':92,'visited school':84,'school visit scheduled':78,
  'appointment scheduled':72,'awaiting decision':64,'qualified':58,'3rd call':52,'2nd call':46,
  '1st call':38,'new lead':25,'open':22,'no response':10,'drop':0,
};

function daysSince(value?:string){ if(!value)return 999; return Math.max(0,Math.floor((Date.now()-new Date(value.replace(' ','T')+'Z').getTime())/86400000)); }
function text(value:unknown){ return String(value||'').toLowerCase(); }

export function scoreLead(lead:ScorableLead):LeadScore{
  const reasons:string[]=[]; const stage=Array.isArray(lead.stage_id)?lead.stage_id[1]:'Unassigned';
  const stageScore=stageWeight[text(stage)] ?? 30; let score=stageScore*0.36;
  const probability=Math.max(0,Math.min(100,Number(lead.probability||0))); score+=probability*0.24;
  const age=daysSince(lead.write_date); const recency=age<=1?100:age<=3?82:age<=7?62:age<=15?38:age<=30?18:5; score+=recency*0.16;
  const engagement=Math.min(100,(lead.activity_ids?.length||0)*18+(lead.description?20:0)); score+=engagement*0.10;
  const completeness=[lead.phone,lead.email_from,lead.contact_name,lead.user_id].filter(Boolean).length/4*100; score+=completeness*0.08;
  const value=Math.min(100,Math.log10(Math.max(1,Number(lead.expected_revenue||0)))*18); score+=value*0.06;
  const blob=text(`${lead.name} ${lead.description} ${stage}`);
  if(/drop|not interested|wrong number|invalid/.test(blob)){score-=28;reasons.push('Drop or invalid intent signal');}
  if(/appointment|visit|interested|confirm|admission/.test(blob)){score+=8;reasons.push('Strong intent language or advanced stage');}
  if(!lead.phone&&!lead.email_from){score-=12;reasons.push('No usable contact information');}
  if(!lead.user_id){score-=7;reasons.push('Lead is unassigned');}
  if(age>7){reasons.push(`${age} days since last update`);} else reasons.push('Recently updated');
  if(probability>=60)reasons.push(`Odoo probability ${probability}%`);
  if((lead.activity_ids?.length||0)>0)reasons.push(`${lead.activity_ids?.length} open activities`);
  score=Math.round(Math.max(0,Math.min(100,score)));
  const band:LeadScore['band']=/drop/.test(text(stage))?'Risk':score>=76?'Hot':score>=58?'Warm':score>=38?'Develop':score>=20?'Cold':'Risk';
  const nextAction=band==='Hot'?'Call now and secure appointment/admission commitment':band==='Warm'?'Complete follow-up within 24 hours':band==='Develop'?'Clarify programme, fee and decision timeline':band==='Cold'?'Validate contact and intent before further effort':'Review drop reason or move to recovery queue';
  return {score,band,reasons:reasons.slice(0,4),nextAction};
}

export function inferInstitute(lead:ScorableLead){
  const s=text(`${Array.isArray(lead.team_id)?lead.team_id[1]:''} ${lead.name} ${lead.description}`);
  if(/isc|grade 11|grade 12|jee|neet/.test(s))return "St. Mary's ISC";
  if(/state board|sslc/.test(s))return "St. Mary's State Board";
  if(/kids|montessori|pre.?school/.test(s))return "St. Mary's Kids";
  if(/smis|international|icse/.test(s))return 'SMIS';
  return Array.isArray(lead.team_id)?lead.team_id[1]:'Unclassified';
}

export function inferGrade(lead:ScorableLead){
  const s=text(`${lead.name} ${lead.description}`);
  const m=s.match(/(?:grade|class|std)\s*(\d{1,2})/); if(m)return `Grade ${m[1]}`;
  if(/neet|jee|science|commerce/.test(s))return 'Grade 11–12';
  if(/kids|montessori|nursery|lkg|ukg/.test(s))return 'Pre-primary';
  return 'Unclassified';
}

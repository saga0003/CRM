import { unstable_cache } from 'next/cache';
import { readGroup, searchRead } from '@/lib/odoo';

export type Relation = [number, string] | false;
export type LeadRow = {
  id: number; name?: string; contact_name?: string; phone?: string; email_from?: string;
  stage_id?: Relation; user_id?: Relation; source_id?: Relation; expected_revenue?: number;
  create_date?: string; write_date?: string; probability?: number; description?: string;
};
export type ActivityRow = { id:number; res_id:number; date_deadline:string; user_id?:Relation; activity_type_id?:Relation; summary?:string; note?:string };

type StageGroup = { stage_id?: Relation; stage_id_count?: number; __count?: number; expected_revenue?: number };
type UserGroup = { user_id?: Relation; user_id_count?: number; __count?: number; expected_revenue?: number };
type SourceGroup = { source_id?: Relation; source_id_count?: number; __count?: number; expected_revenue?: number };

export const rel = (value: Relation | undefined, fallback='Unassigned') => Array.isArray(value) ? value[1] : fallback;
export const money = (value=0) => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(value);
const daysSince = (value?: string) => value ? Math.max(0, Math.floor((Date.now()-new Date(value.replace(' ','T')+'Z').getTime())/86400000)) : 0;

async function loadOperations() {
  const today = new Date().toISOString().slice(0,10);
  const [leads, activities] = await Promise.all([
    searchRead<LeadRow>('crm.lead', [['active','=',true]], ['name','contact_name','phone','email_from','stage_id','user_id','source_id','expected_revenue','create_date','write_date','probability','description'], {limit:300,order:'write_date desc'}),
    searchRead<ActivityRow>('mail.activity', [['res_model','=','crm.lead'],['date_deadline','<=',today]], ['res_id','date_deadline','user_id','activity_type_id','summary','note'], {limit:300,order:'date_deadline asc'}),
  ]);
  const leadMap = new Map(leads.map(l=>[l.id,l]));
  const queues = activities.map(activity=>({activity,lead:leadMap.get(activity.res_id)})).filter(item=>item.lead);
  const overdue = queues.filter(x=>x.activity.date_deadline<today);
  const dueToday = queues.filter(x=>x.activity.date_deadline===today);
  const stagnant = leads.filter(l=>daysSince(l.write_date)>=7);
  const noActionIds = new Set(activities.map(a=>a.res_id));
  const noAction = leads.filter(l=>!noActionIds.has(l.id));
  const hot = leads.filter(l=>(l.probability||0)>=70 || /appointment|visited|counselling/i.test(rel(l.stage_id,'')));
  const dropped = leads.filter(l=>/drop|lost|not interested|no response/i.test(rel(l.stage_id,'')));
  return {today,leads,activities,queues,overdue,dueToday,stagnant,noAction,hot,dropped,refreshedAt:new Date().toISOString()};
}
export const getOperations = unstable_cache(loadOperations,['operations-suite-v1'],{revalidate:120,tags:['operations']});

async function loadAnalytics() {
  const [stages,users,sources] = await Promise.all([
    readGroup<StageGroup>('crm.lead',[['active','=',true]],['stage_id','expected_revenue:sum'],['stage_id']),
    readGroup<UserGroup>('crm.lead',[['active','=',true]],['user_id','expected_revenue:sum'],['user_id']),
    readGroup<SourceGroup>('crm.lead',[['active','=',true]],['source_id','expected_revenue:sum'],['source_id']),
  ]);
  return {
    stages: stages.map(g=>({name:rel(g.stage_id),count:Number(g.stage_id_count??g.__count??0),value:Number(g.expected_revenue||0)})).sort((a,b)=>b.count-a.count),
    users: users.map(g=>({id:Array.isArray(g.user_id)?g.user_id[0]:0,name:rel(g.user_id),count:Number(g.user_id_count??g.__count??0),value:Number(g.expected_revenue||0)})).filter(x=>x.id).sort((a,b)=>b.count-a.count),
    sources: sources.map(g=>({name:rel(g.source_id,'Unknown'),count:Number(g.source_id_count??g.__count??0),value:Number(g.expected_revenue||0)})).sort((a,b)=>b.count-a.count),
  };
}
export const getOperationsAnalytics = unstable_cache(loadAnalytics,['operations-analytics-v1'],{revalidate:180,tags:['operations-analytics']});

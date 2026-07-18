import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { writeRecord } from '@/lib/odoo';
export async function POST(request:Request){try{const {leadId,stageId,probability}=await request.json();if(!Number.isInteger(leadId)||!Number.isInteger(stageId))return NextResponse.json({error:'Invalid lead or stage'},{status:400});const values:Record<string,unknown>={stage_id:stageId};if(Number.isFinite(probability))values.probability=Math.max(0,Math.min(100,probability));await writeRecord('crm.lead',[leadId],values);revalidateTag('operations','max');revalidateTag('odoo-dashboard','max');return NextResponse.json({ok:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Update failed'},{status:500});}}

import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { createRecord, searchRead } from '@/lib/odoo';

type IdRow={id:number};
export async function POST(request:Request){try{const {leadId,date,summary}=await request.json();if(!Number.isInteger(leadId)||!/\d{4}-\d{2}-\d{2}/.test(date)||!summary?.trim())return NextResponse.json({error:'Lead, date and summary are required'},{status:400});const [models,types]=await Promise.all([searchRead<IdRow>('ir.model',[['model','=','crm.lead']],['id'],{limit:1}),searchRead<IdRow>('mail.activity.type',[],['id'],{limit:1,order:'sequence asc'})]);if(!models[0]||!types[0])throw new Error('Odoo activity configuration was not found');const id=await createRecord('mail.activity',{res_model_id:models[0].id,res_id:leadId,activity_type_id:types[0].id,date_deadline:date,summary:summary.trim()});revalidateTag('operations','max');revalidateTag('odoo-followups','max');return NextResponse.json({ok:true,id});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to schedule activity'},{status:500});}}

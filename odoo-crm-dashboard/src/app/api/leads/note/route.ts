import { NextResponse } from 'next/server';
import { executeKw } from '@/lib/odoo';
export async function POST(request:Request){try{const {leadId,note}=await request.json();if(!Number.isInteger(leadId)||!note?.trim())return NextResponse.json({error:'Lead and note are required'},{status:400});await executeKw('crm.lead','message_post',[[leadId]],{body:note.trim(),message_type:'comment',subtype_xmlid:'mail.mt_note'});return NextResponse.json({ok:true});}catch(e){return NextResponse.json({error:e instanceof Error?e.message:'Unable to add note'},{status:500});}}

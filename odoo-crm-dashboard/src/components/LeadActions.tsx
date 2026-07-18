'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LeadActions({leadId,stages}:{leadId:number;stages:Array<[number,string]>}) {
  const router=useRouter(); const [message,setMessage]=useState(''); const [busy,setBusy]=useState(false);
  async function submit(path:string,body:Record<string,unknown>){setBusy(true);setMessage('');try{const r=await fetch(path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const j=await r.json();if(!r.ok)throw new Error(j.error||'Action failed');setMessage('Saved successfully');router.refresh();}catch(e){setMessage(e instanceof Error?e.message:'Action failed');}finally{setBusy(false)}}
  return <div className="action-panel">
    <div className="section-title">Quick actions</div><div className="section-sub">Changes are written directly to Odoo.</div>
    <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);submit('/api/leads/update',{leadId,stageId:Number(f.get('stageId')),probability:Number(f.get('probability'))})}} className="action-form">
      <select name="stageId" required><option value="">Change stage</option>{stages.map(([id,name])=><option value={id} key={id}>{name}</option>)}</select>
      <input name="probability" type="number" min="0" max="100" placeholder="Probability %"/>
      <button disabled={busy}>Update lead</button>
    </form>
    <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);submit('/api/leads/activity',{leadId,date:String(f.get('date')),summary:String(f.get('summary'))})}} className="action-form">
      <input name="date" type="date" required/><input name="summary" placeholder="Follow-up summary" required/><button disabled={busy}>Schedule follow-up</button>
    </form>
    <form onSubmit={e=>{e.preventDefault();const f=new FormData(e.currentTarget);submit('/api/leads/note',{leadId,note:String(f.get('note'))})}} className="action-form"><textarea name="note" placeholder="Add internal note" required/><button disabled={busy}>Add note</button></form>
    {message&&<div className="cell-muted">{message}</div>}
  </div>;
}

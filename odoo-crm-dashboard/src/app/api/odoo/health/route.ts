import { NextResponse } from 'next/server';
import { authenticateOdoo } from '@/lib/odoo';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const uid = await authenticateOdoo();
    return NextResponse.json({ ok: true, connected: true, uid });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Odoo connection error';
    return NextResponse.json({ ok: false, connected: false, error: message }, { status: 500 });
  }
}

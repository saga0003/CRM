import { readGroup, searchCount } from '@/lib/odoo';

type StageGroup = {
  stage_id?: [number, string] | false;
  stage_id_count?: number;
  __count?: number;
  expected_revenue?: number;
};

type UserGroup = {
  user_id?: [number, string] | false;
  user_id_count?: number;
  __count?: number;
  expected_revenue?: number;
};

export type DashboardData = {
  connected: boolean;
  error?: string;
  kpis: Array<[string, string, string]>;
  alerts: { overdue: number; stagnant: number; noAction: number; appointments: number };
  stages: Array<[string, number, number, string]>;
  agents: Array<[string, number, number, number, string, number, number]>;
};

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

function formatMoney(value: number): string {
  if (value >= 10_000_000) return `₹${(value / 10_000_000).toFixed(1)}Cr`;
  if (value >= 100_000) return `₹${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `₹${(value / 1_000).toFixed(0)}K`;
  return inr.format(value || 0);
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

let dashboardCache: { expiresAt: number; data: DashboardData } | null = null;
let inFlightDashboard: Promise<DashboardData> | null = null;

async function loadDashboardData(): Promise<DashboardData> {
  try {
    const today = isoDate(new Date());
    const stagnantDate = new Date();
    stagnantDate.setDate(stagnantDate.getDate() - 7);
    const stagnantCutoff = stagnantDate.toISOString().slice(0, 19).replace('T', ' ');
    const confirmedDomain = [['stage_id.name', '=', 'Admission Confirmed']];

    // Keep Odoo calls sequential. Some hosted Odoo instances rate-limit bursts of parallel JSON-RPC requests.
    const stageGroups = await readGroup<StageGroup>(
      'crm.lead',
      [['active', '=', true]],
      ['stage_id', 'expected_revenue:sum'],
      ['stage_id'],
    );
    const userGroups = await readGroup<UserGroup>(
      'crm.lead',
      [['active', '=', true]],
      ['user_id', 'expected_revenue:sum'],
      ['user_id'],
    );
    const admissionUserGroups = await readGroup<UserGroup>('crm.lead', confirmedDomain, ['user_id'], ['user_id']);
    const dueToday = await searchCount('crm.lead', [['active', '=', true], ['activity_date_deadline', '=', today]]);
    const overdue = await searchCount('crm.lead', [['active', '=', true], ['activity_date_deadline', '<', today]]);
    const stagnant = await searchCount('crm.lead', [['active', '=', true], ['write_date', '<', stagnantCutoff]]);
    const noAction = await searchCount('crm.lead', [['active', '=', true], ['activity_date_deadline', '=', false]]);
    const appointments = await searchCount('crm.lead', [['active', '=', true], ['stage_id.name', 'ilike', 'Appointment']]);

    const normalizedStages = stageGroups
      .map((group) => ({
        name: Array.isArray(group.stage_id) ? group.stage_id[1] : 'Unassigned',
        count: Number(group.stage_id_count ?? group.__count ?? 0),
        value: Number(group.expected_revenue || 0),
      }))
      .sort((a, b) => b.count - a.count);

    const totalLeads = normalizedStages.reduce((sum, stage) => sum + stage.count, 0);
    const confirmedStage = normalizedStages.find((stage) => stage.name.toLowerCase() === 'admission confirmed');
    const admissions = confirmedStage?.count || 0;
    const confirmedRevenue = confirmedStage?.value || 0;
    const conversion = totalLeads > 0 ? (admissions / totalLeads) * 100 : 0;

    const maxStageCount = Math.max(...normalizedStages.map((stage) => stage.count), 1);
    const stages: DashboardData['stages'] = normalizedStages.slice(0, 10).map((stage) => [
      stage.name,
      stage.count,
      Math.max(2, Math.round((stage.count / maxStageCount) * 100)),
      formatMoney(stage.value),
    ]);

    const admissionsByUser = new Map<number, number>();
    for (const group of admissionUserGroups) {
      if (Array.isArray(group.user_id)) {
        admissionsByUser.set(group.user_id[0], Number(group.user_id_count ?? group.__count ?? 0));
      }
    }

    const agents: DashboardData['agents'] = userGroups
      .filter((group) => Array.isArray(group.user_id))
      .map((group) => {
        const [id, name] = group.user_id as [number, string];
        const leads = Number(group.user_id_count ?? group.__count ?? 0);
        const agentAdmissions = admissionsByUser.get(id) || 0;
        const agentConversion = leads ? `${((agentAdmissions / leads) * 100).toFixed(1)}%` : '0%';
        return [name, 0, leads, agentAdmissions, agentConversion, 0, 0] as DashboardData['agents'][number];
      })
      .sort((a, b) => Number(b[2]) - Number(a[2]))
      .slice(0, 12);

    return {
      connected: true,
      kpis: [
        ['Total Leads', totalLeads.toLocaleString('en-IN'), 'Live from Odoo'],
        ['Admissions', admissions.toLocaleString('en-IN'), `${formatMoney(confirmedRevenue)} confirmed`],
        ['Conversion', `${conversion.toFixed(2)}%`, 'Admissions ÷ total leads'],
        ['Due Today', dueToday.toLocaleString('en-IN'), 'Needs action'],
        ['Overdue', overdue.toLocaleString('en-IN'), 'Follow-up deadline passed'],
        ['Forecast', formatMoney(normalizedStages.reduce((sum, stage) => sum + stage.value, 0)), 'Expected revenue pipeline'],
      ],
      alerts: { overdue, stagnant, noAction, appointments },
      stages,
      agents,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Odoo connection error';
    return {
      connected: false,
      error: message,
      kpis: [
        ['Total Leads', '—', 'Odoo temporarily unavailable'],
        ['Admissions', '—', 'Odoo temporarily unavailable'],
        ['Conversion', '—', 'Odoo temporarily unavailable'],
        ['Due Today', '—', 'Odoo temporarily unavailable'],
        ['Overdue', '—', 'Odoo temporarily unavailable'],
        ['Forecast', '—', 'Odoo temporarily unavailable'],
      ],
      alerts: { overdue: 0, stagnant: 0, noAction: 0, appointments: 0 },
      stages: [],
      agents: [],
    };
  }
}

export async function getDashboardData(): Promise<DashboardData> {
  const now = Date.now();
  if (dashboardCache && dashboardCache.expiresAt > now) return dashboardCache.data;
  if (inFlightDashboard) return inFlightDashboard;

  inFlightDashboard = loadDashboardData();
  const data = await inFlightDashboard;
  inFlightDashboard = null;

  if (data.connected) {
    dashboardCache = { data, expiresAt: Date.now() + 60_000 };
  }

  return data;
}

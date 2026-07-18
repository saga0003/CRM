type JsonRpcResponse<T> = {
  result?: T;
  error?: { code?: number; message?: string; data?: { message?: string; debug?: string } };
};

export type OdooDomain = Array<unknown>;
type OdooConfig = { url: string; database: string; username: string; password: string };

function getConfig(): OdooConfig {
  const url = process.env.ODOO_URL?.replace(/\/$/, '');
  const database = process.env.ODOO_DATABASE || process.env.ODOO_DB;
  const username = process.env.ODOO_USERNAME;
  const password = process.env.ODOO_PASSWORD || process.env.ODOO_API_KEY;
  if (!url || !database || !username || !password) {
    const missing = [!url ? 'ODOO_URL' : null, !database ? 'ODOO_DATABASE or ODOO_DB' : null, !username ? 'ODOO_USERNAME' : null, !password ? 'ODOO_PASSWORD or ODOO_API_KEY' : null].filter(Boolean);
    throw new Error(`Missing Odoo environment variables: ${missing.join(', ')}.`);
  }
  return { url, database, username, password };
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function jsonRpc<T>(service: string, method: string, args: unknown[]): Promise<T> {
  const { url } = getConfig();
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(`${url}/jsonrpc`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', method: 'call', params: { service, method, args }, id: Date.now() }), cache: 'no-store',
    });
    if (response.status === 429 && attempt < 3) {
      const retryAfter = Number(response.headers.get('retry-after') || 0);
      await sleep(retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt);
      continue;
    }
    if (!response.ok) throw new Error(`Odoo HTTP error ${response.status}`);
    const payload = (await response.json()) as JsonRpcResponse<T>;
    if (payload.error) throw new Error(payload.error.data?.message || payload.error.message || 'Unknown Odoo RPC error');
    if (payload.result === undefined) throw new Error('Odoo returned no result.');
    return payload.result;
  }
  throw new Error('Odoo rate limit exceeded. Please retry shortly.');
}

let cachedUid: number | null = null;
export async function authenticateOdoo(): Promise<number> {
  if (cachedUid) return cachedUid;
  const { database, username, password } = getConfig();
  const uid = await jsonRpc<number>('common', 'authenticate', [database, username, password, {}]);
  if (!uid) throw new Error('Odoo authentication failed. Check database, username and API key/password.');
  cachedUid = uid;
  return uid;
}

export async function executeKw<T>(model: string, method: string, args: unknown[] = [], kwargs: Record<string, unknown> = {}): Promise<T> {
  const { database, password } = getConfig();
  const uid = await authenticateOdoo();
  return jsonRpc<T>('object', 'execute_kw', [database, uid, password, model, method, args, kwargs]);
}

export const searchCount = (model: string, domain: OdooDomain = []) => executeKw<number>(model, 'search_count', [domain]);
export const readGroup = <T>(model: string, domain: OdooDomain, fields: string[], groupBy: string[], kwargs: Record<string, unknown> = {}) => executeKw<T[]>(model, 'read_group', [domain, fields, groupBy], { lazy: false, ...kwargs });
export const searchRead = <T>(model: string, domain: OdooDomain, fields: string[], options: { limit?: number; offset?: number; order?: string } = {}) => executeKw<T[]>(model, 'search_read', [domain], { fields, limit: options.limit ?? 80, offset: options.offset ?? 0, order: options.order ?? 'write_date desc' });
export const readRecords = <T>(model: string, ids: number[], fields: string[]) => executeKw<T[]>(model, 'read', [ids], { fields });
export const writeRecord = (model: string, ids: number[], values: Record<string, unknown>) => executeKw<boolean>(model, 'write', [ids, values]);
export const createRecord = (model: string, values: Record<string, unknown>) => executeKw<number>(model, 'create', [values]);
export const nameSearch = (model: string, name = '', domain: OdooDomain = [], limit = 50) => executeKw<Array<[number, string]>>(model, 'name_search', [name], { args: domain, limit });

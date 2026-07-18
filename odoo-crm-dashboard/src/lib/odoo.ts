type JsonRpcResponse<T> = {
  result?: T;
  error?: {
    code?: number;
    message?: string;
    data?: { message?: string; debug?: string };
  };
};

export type OdooDomain = Array<unknown>;

type OdooConfig = {
  url: string;
  database: string;
  username: string;
  password: string;
};

function getConfig(): OdooConfig {
  const url = process.env.ODOO_URL?.replace(/\/$/, '');
  const database = process.env.ODOO_DATABASE || process.env.ODOO_DB;
  const username = process.env.ODOO_USERNAME;
  const password = process.env.ODOO_PASSWORD || process.env.ODOO_API_KEY;

  if (!url || !database || !username || !password) {
    const missing = [
      !url ? 'ODOO_URL' : null,
      !database ? 'ODOO_DATABASE or ODOO_DB' : null,
      !username ? 'ODOO_USERNAME' : null,
      !password ? 'ODOO_PASSWORD or ODOO_API_KEY' : null,
    ].filter(Boolean);

    throw new Error(`Missing Odoo environment variables: ${missing.join(', ')}.`);
  }

  return { url, database, username, password };
}

async function jsonRpc<T>(service: string, method: string, args: unknown[]): Promise<T> {
  const { url } = getConfig();
  const response = await fetch(`${url}/jsonrpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'call',
      params: { service, method, args },
      id: Date.now(),
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Odoo HTTP error ${response.status}`);
  }

  const payload = (await response.json()) as JsonRpcResponse<T>;
  if (payload.error) {
    throw new Error(payload.error.data?.message || payload.error.message || 'Unknown Odoo RPC error');
  }

  if (payload.result === undefined) {
    throw new Error('Odoo returned no result.');
  }

  return payload.result;
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

export async function executeKw<T>(
  model: string,
  method: string,
  args: unknown[] = [],
  kwargs: Record<string, unknown> = {},
): Promise<T> {
  const { database, password } = getConfig();
  const uid = await authenticateOdoo();
  return jsonRpc<T>('object', 'execute_kw', [database, uid, password, model, method, args, kwargs]);
}

export async function searchCount(model: string, domain: OdooDomain = []): Promise<number> {
  return executeKw<number>(model, 'search_count', [domain]);
}

export async function readGroup<T>(
  model: string,
  domain: OdooDomain,
  fields: string[],
  groupBy: string[],
  kwargs: Record<string, unknown> = {},
): Promise<T[]> {
  return executeKw<T[]>(model, 'read_group', [domain, fields, groupBy], { lazy: false, ...kwargs });
}

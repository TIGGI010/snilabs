// Startline Labs: /api routes. Everything else is served from static assets.
const APPS = new Set(['startline', 'herwellness', 'apps']);
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});
const cell = v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

async function subscribe(request, env) {
  let data;
  const type = request.headers.get('content-type') || '';
  try { data = type.includes('application/json') ? await request.json() : Object.fromEntries(await request.formData()); }
  catch { return json({ ok: false, error: 'Bad request' }, 400); }
  const html = !type.includes('application/json');
  const back = ok => html ? Response.redirect(new URL((data.page || '/') + (ok ? '?joined=1' : '?joined=0'), request.url).toString(), 303) : null;
  if (data.company) return back(true) || json({ ok: true });          // honeypot
  const email = String(data.email || '').trim().toLowerCase();
  const app = APPS.has(data.app) ? data.app : 'apps';
  if (!EMAIL_RE.test(email)) return back(false) || json({ ok: false, error: 'Please check your email address.' }, 400);
  if (!env.SIGNUPS) return back(false) || json({ ok: false, error: 'The launch list is not switched on yet.' }, 503);
  const key = `${app}:${email}`;
  if (await env.SIGNUPS.get(key)) return back(true) || json({ ok: true, already: true });
  const record = { email, app, beta: data.beta === '1' || data.beta === true, page: String(data.page || '').slice(0, 120),
    country: (request.cf && request.cf.country) || '', at: new Date().toISOString() };
  await env.SIGNUPS.put(key, JSON.stringify(record), { metadata: record });
  return back(true) || json({ ok: true });
}

// GET /api/signups?key=ADMIN_KEY            CSV download
//     &format=json | &app=startline | &remove=email
async function signups(request, env) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || request.headers.get('x-admin-key') || '';
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return new Response('Not found', { status: 404 });
  if (!env.SIGNUPS) return new Response('SIGNUPS KV is not bound', { status: 503 });
  const app = url.searchParams.get('app') || '';
  const remove = (url.searchParams.get('remove') || '').trim().toLowerCase();
  if (remove) {
    const apps = app ? [app] : [...APPS];
    await Promise.all(apps.map(a => env.SIGNUPS.delete(`${a}:${remove}`)));
    return new Response(`Removed ${remove} from ${apps.join(', ')}`, { headers: { 'cache-control': 'no-store' } });
  }
  const rows = []; let cursor;
  do {
    const page = await env.SIGNUPS.list({ prefix: app ? app + ':' : undefined, cursor });
    for (const k of page.keys) { let r = k.metadata; if (!r) { try { r = JSON.parse(await env.SIGNUPS.get(k.name)); } catch { r = null; } } if (r) rows.push(r); }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  rows.sort((a, b) => String(a.at).localeCompare(String(b.at)));
  if (url.searchParams.get('format') === 'json') return json({ count: rows.length, rows });
  const cols = ['at', 'email', 'app', 'beta', 'page', 'country'];
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => cell(c === 'beta' ? (r.beta ? 'yes' : 'no') : r[c])).join(','))].join('\n');
  return new Response(csv, { headers: { 'cache-control': 'no-store', 'content-type': 'text/csv; charset=utf-8',
    'content-disposition': `attachment; filename="startline-launch-list-${new Date().toISOString().slice(0, 10)}.csv"` } });
}

export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/subscribe') return request.method === 'POST' ? subscribe(request, env) : json({ ok: false, error: 'Use POST' }, 405);
    if (pathname === '/api/signups' && request.method === 'GET') return signups(request, env);
    if (pathname.startsWith('/api/')) return json({ ok: false, error: 'Not found' }, 404);
    return env.ASSETS.fetch(request);
  },
};

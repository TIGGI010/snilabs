// GET /api/signups?key=ADMIN_KEY            -> CSV download of the launch list
// GET /api/signups?key=ADMIN_KEY&format=json -> JSON
// GET /api/signups?key=ADMIN_KEY&app=startline -> one app only
// GET /api/signups?key=ADMIN_KEY&remove=someone@example.com&app=startline -> take someone off the list
// Set ADMIN_KEY as an encrypted variable in Cloudflare Pages > Settings > Variables and secrets.
const cell = v => {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key') || request.headers.get('x-admin-key') || '';
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return new Response('Not found', { status: 404 });
  if (!env.SIGNUPS) return new Response('SIGNUPS KV is not bound', { status: 503 });

  const app = url.searchParams.get('app') || '';
  const remove = (url.searchParams.get('remove') || '').trim().toLowerCase();
  if (remove) {
    const apps = app ? [app] : ['startline', 'herwellness', 'apps'];
    await Promise.all(apps.map(a => env.SIGNUPS.delete(`${a}:${remove}`)));
    return new Response(`Removed ${remove} from ${apps.join(', ')}`, { headers: { 'cache-control': 'no-store' } });
  }

  const rows = [];
  let cursor;
  do {
    const page = await env.SIGNUPS.list({ prefix: app ? app + ':' : undefined, cursor });
    for (const k of page.keys) {
      let r = k.metadata;
      if (!r) { try { r = JSON.parse(await env.SIGNUPS.get(k.name)); } catch { r = null; } }
      if (r) rows.push(r);
    }
    cursor = page.list_complete ? null : page.cursor;
  } while (cursor);
  rows.sort((a, b) => String(a.at).localeCompare(String(b.at)));

  const headers = { 'cache-control': 'no-store' };
  if (url.searchParams.get('format') === 'json') {
    return new Response(JSON.stringify({ count: rows.length, rows }, null, 2), { headers: { ...headers, 'content-type': 'application/json' } });
  }
  const cols = ['at', 'email', 'app', 'beta', 'page', 'country'];
  const csv = [cols.join(','), ...rows.map(r => cols.map(c => cell(c === 'beta' ? (r.beta ? 'yes' : 'no') : r[c])).join(','))].join('\n');
  const day = new Date().toISOString().slice(0, 10);
  return new Response(csv, { headers: { ...headers, 'content-type': 'text/csv; charset=utf-8', 'content-disposition': `attachment; filename="startline-launch-list-${day}.csv"` } });
}

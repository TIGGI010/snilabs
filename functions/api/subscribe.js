// POST /api/subscribe — saves a launch-list email to the SIGNUPS KV namespace.
// Bind a KV namespace as SIGNUPS in Cloudflare Pages > Settings > Bindings.
const APPS = new Set(['startline', 'herwellness', 'apps']);
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

const reply = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
});

async function readBody(request) {
  const type = request.headers.get('content-type') || '';
  if (type.includes('application/json')) return await request.json();
  const form = await request.formData();
  return Object.fromEntries(form);
}

export async function onRequestPost({ request, env }) {
  let data;
  try { data = await readBody(request); } catch { return reply({ ok: false, error: 'Bad request' }, 400); }
  const html = !(request.headers.get('content-type') || '').includes('application/json');
  const back = (ok) => html ? Response.redirect(new URL((data.page || '/') + (ok ? '?joined=1' : '?joined=0'), request.url).toString(), 303) : null;

  // Bots fill the hidden field; pretend it worked.
  if (data.company) return back(true) || reply({ ok: true });

  const email = String(data.email || '').trim().toLowerCase();
  const app = APPS.has(data.app) ? data.app : 'apps';
  if (!EMAIL_RE.test(email)) return back(false) || reply({ ok: false, error: 'Please check your email address.' }, 400);
  if (!env.SIGNUPS) return back(false) || reply({ ok: false, error: 'The launch list is not switched on yet.' }, 503);

  const key = `${app}:${email}`;
  const existing = await env.SIGNUPS.get(key);
  if (existing) return back(true) || reply({ ok: true, already: true });

  const record = {
    email, app,
    beta: data.beta === '1' || data.beta === true,
    page: String(data.page || '').slice(0, 120),
    country: (request.cf && request.cf.country) || '',
    at: new Date().toISOString(),
  };
  // Metadata lets the export list everyone without reading each key.
  await env.SIGNUPS.put(key, JSON.stringify(record), { metadata: record });
  return back(true) || reply({ ok: true });
}

export const onRequestGet = () => reply({ ok: false, error: 'Use POST' }, 405);

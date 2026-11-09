/* Startline Labs: site behaviour. Everything degrades gracefully without it. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const mq = q => (window.matchMedia ? window.matchMedia(q) : { matches: false });
  const reduced = mq('(prefers-reduced-motion: reduce)').matches;
  const canHover = mq('(hover: hover)').matches;
  const PHONE = '065 769 1052';
  const WA = 'https://wa.me/27657691052';
  const EMAIL = 'hello@startlinelab.com';

  /* ---------- splash: once a session, then out of the way ---------- */
  if (root.classList.contains('splash')) {
    try { sessionStorage.setItem('startline-splash', '1'); } catch (e) {}
    setTimeout(() => root.classList.remove('splash'), 2500);
  }

  /* ---------- numbers that count up when they come into view ---------- */
  const counters = $$('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    const run = el => {
      const end = +el.dataset.count, t0 = performance.now(), dur = reduced ? 0 : 1100;
      const tick = now => {
        const k = dur ? Math.min(1, (now - t0) / dur) : 1;
        el.textContent = Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: 0.6 });
    counters.forEach(el => io.observe(el));
  }

  /* ---------- theme ---------- */
  const isDark = () => {
    const t = root.getAttribute('data-theme');
    if (t === 'dark') return true;
    if (t === 'light') return false;
    return mq('(prefers-color-scheme: dark)').matches;
  };
  /* the new theme spreads out in a circle from whatever was clicked */
  const toggleTheme = origin => {
    const next = isDark() ? 'light' : 'dark';
    const apply = () => {
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('startline-theme', next); } catch (e) {}
    };
    if (!document.startViewTransition || reduced) { apply(); return; }
    let x = innerWidth - 40, y = 34;
    if (origin && origin.getBoundingClientRect) {
      const r = origin.getBoundingClientRect();
      x = r.left + r.width / 2; y = r.top + r.height / 2;
    }
    root.style.setProperty('--vx', x + 'px');
    root.style.setProperty('--vy', y + 'px');
    root.classList.add('vt-theme');
    const t = document.startViewTransition(apply);
    t.finished.finally(() => root.classList.remove('vt-theme'));
  };
  $$('[data-theme-toggle]').forEach(b => b.addEventListener('click', () => toggleTheme(b)));

  /* ---------- toast + copy ---------- */
  const toast = (() => {
    let el, t;
    return msg => {
      if (!el) {
        el = document.createElement('div');
        el.className = 'toast';
        el.setAttribute('role', 'status');
        document.body.appendChild(el);
      }
      el.textContent = msg;
      requestAnimationFrame(() => el.classList.add('show'));
      clearTimeout(t);
      t = setTimeout(() => el.classList.remove('show'), 2400);
    };
  })();
  const copy = (text, ok) => {
    const fail = () => toast('Copy blocked here. ' + text);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => toast(ok || 'Copied'), fail);
      } else fail();
    } catch (e) { fail(); }
  };
  $$('[data-copy]').forEach(b => b.addEventListener('click', () => copy(b.getAttribute('data-copy'), b.getAttribute('data-copied'))));

  /* open an outside link from script without window.open */
  const go = (href, ext) => {
    if (!ext) { location.href = href; return; }
    const a = document.createElement('a');
    a.href = href; a.target = '_blank'; a.rel = 'noopener';
    document.body.appendChild(a); a.click(); a.remove();
  };

  /* ---------- header ---------- */
  const header = $('.site-header');
  const onScroll = () => { if (header) header.classList.toggle('scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const nav = $('.nav');
  if (nav) {
    const move = a => {
      nav.style.setProperty('--px', a.offsetLeft + 'px');
      nav.style.setProperty('--pw', a.offsetWidth + 'px');
    };
    const home = $('a[aria-current="page"]', nav) || $('a', nav);
    if (home) move(home);
    $$('a', nav).forEach(a => a.addEventListener('mouseenter', () => move(a)));
    nav.addEventListener('mouseleave', () => { if (home) move(home); });
  }

  if (!/Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '')) {
    $$('[data-mod]').forEach(k => { k.textContent = 'Ctrl'; });
  }

  /* ---------- mobile menu (popover, with a fallback) ---------- */
  const menu = $('#menu');
  if (menu) {
    const native = typeof HTMLElement !== 'undefined' && Object.prototype.hasOwnProperty.call(HTMLElement.prototype, 'popover');
    if (!native) {
      $$('[popovertarget="menu"]').forEach(b => b.addEventListener('click', () => menu.classList.toggle('open')));
    }
    $$('a', menu).forEach(a => a.addEventListener('click', () => {
      try { menu.hidePopover(); } catch (e) { menu.classList.remove('open'); }
    }));
  }

  /* ---------- command palette ---------- */
  const dlg = $('#cmdk');
  if (dlg && typeof dlg.showModal === 'function') {
    const input = $('input', dlg);
    /* a typed request ("make an app in the web") goes straight into the estimator */
    const ask = document.createElement('button');
    ask.type = 'button'; ask.className = 'cmdk-item cmdk-ask'; ask.setAttribute('role', 'option'); ask.setAttribute('aria-selected', 'false');
    ask.dataset.action = 'estimate'; ask.hidden = true;
    ask.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9Z"/></svg><span></span><small>Price it</small>';
    $('.cmdk-list', dlg).prepend(ask);
    const items = $$('.cmdk-item', dlg);
    const empty = $('.cmdk-empty', dlg);
    const NEED = /\b(app|apps|website|site|web|store|shop|system|booking|bot|chatbot|automation|dashboard|logo|brand|landing|portal|build|make|need|want|create)\b/;
    let active = 0;
    const visible = () => items.filter(i => !i.hidden);
    const setActive = n => {
      const v = visible();
      items.forEach(i => i.setAttribute('aria-selected', 'false'));
      if (!v.length) return;
      active = (n + v.length) % v.length;
      v[active].setAttribute('aria-selected', 'true');
      v[active].scrollIntoView({ block: 'nearest' });
    };
    const filter = () => {
      const q = input.value.trim().toLowerCase();
      items.forEach(i => { if (i !== ask) i.hidden = !!q && !(i.textContent + ' ' + (i.dataset.k || '')).toLowerCase().includes(q); });
      $$('.cmdk-sep', dlg).forEach(s => { s.hidden = !!q; });
      const others = items.some(i => i !== ask && !i.hidden);
      ask.hidden = !q || !dlg.dataset.est || (others && !(q.includes(' ') && NEED.test(q)));
      if (!ask.hidden) $('span', ask).textContent = 'Estimate “' + input.value.trim() + '”';
      empty.hidden = visible().length > 0;
      setActive(0);
    };
    const run = el => {
      if (!el) return;
      const act = el.dataset.action, href = el.dataset.href;
      dlg.close();
      if (act === 'theme') toggleTheme(null);
      else if (act === 'copy-phone') copy(PHONE, 'Number copied');
      else if (act === 'estimate') {
        const said = input.value.trim(), target = dlg.dataset.est;
        let saved = false;
        try { sessionStorage.setItem('startline-brief', said); saved = true; } catch (e) {}
        const url = saved ? target : target.replace('#', '?brief=' + encodeURIComponent(said) + '#');
        if (location.pathname === new URL(url, location.href).pathname && $('#e-brief')) {
          try { sessionStorage.removeItem('startline-brief'); } catch (e) {}
          $('#e-brief').value = said; $('#e-parse').click();
        } else location.href = url;
      }
      else if (href) go(href, el.hasAttribute('data-ext'));
    };
    const open = () => {
      if (dlg.open) return;
      try { menu && menu.hidePopover && menu.hidePopover(); } catch (e) {}
      input.value = '';
      filter();
      dlg.showModal();
      input.focus();
    };
    $$('[data-cmdk]').forEach(b => b.addEventListener('click', open));
    input.addEventListener('input', filter);
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(active - 1); }
      else if (e.key === 'Enter') { e.preventDefault(); run(visible()[active]); }
    });
    items.forEach(el => {
      el.addEventListener('click', () => run(el));
      el.addEventListener('mousemove', () => { const k = visible().indexOf(el); if (k !== active) setActive(k); });
    });
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    document.addEventListener('keydown', e => {
      const t = document.activeElement;
      const typing = t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable);
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) { e.preventDefault(); dlg.open ? dlg.close() : open(); }
      else if (e.key === '/' && !typing && !dlg.open) { e.preventDefault(); open(); }
    });
  }

  /* ---------- pointer effects ---------- */
  if (canHover && !reduced) {
    $$('.spot').forEach(el => el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }));
    $$('[data-tilt]').forEach(card => {
      const ic = $('.app-icon', card);
      if (!ic) return;
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        ic.style.setProperty('--ry', (x * 26).toFixed(2) + 'deg');
        ic.style.setProperty('--rx', (-y * 26).toFixed(2) + 'deg');
      });
      card.addEventListener('pointerleave', () => { ic.style.setProperty('--ry', '0deg'); ic.style.setProperty('--rx', '0deg'); });
    });
  }

  /* ---------- hero terminal ---------- */
  const term = $('.term');
  if (term) {
    const lines = $$('.tl', term), cmd = $('[data-type]', term);
    const html = cmd ? cmd.innerHTML : '', txt = cmd ? cmd.textContent : '';
    let timers = [];
    const play = () => {
      if (!cmd) return;
      timers.forEach(clearTimeout); timers = [];
      lines.forEach((l, i) => { if (i) l.classList.add('hide'); });
      cmd.textContent = '';
      let i = 0;
      const step = () => {
        i += 1;
        cmd.textContent = txt.slice(0, i);
        if (i < txt.length) timers.push(setTimeout(step, 32 + Math.random() * 48));
        else {
          cmd.innerHTML = html;
          lines.slice(1).forEach((l, k) => timers.push(setTimeout(() => l.classList.remove('hide'), 420 + k * 230)));
        }
      };
      timers.push(setTimeout(step, 450));
    };
    const rb = $('.term-replay', term);
    if (rb) rb.addEventListener('click', play);
    if (!reduced && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(es => {
        if (es.some(e => e.isIntersecting)) { io.disconnect(); play(); }
      }, { threshold: 0.35 });
      io.observe(term);
    }
  }

  /* ---------- shared bits for the estimator and the app planner ---------- */
  const fmt = n => 'R' + Math.round(n).toLocaleString('en-US');
  const num = n => Math.round(n).toLocaleString('en-US');
  const fillRange = r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min || 1) * 100) + '%');
  const payPlan = lo => lo > 20000
    ? fmt(lo * 0.4) + ' deposit, 30% at the working build, 30% at launch'
    : fmt(lo / 2) + ' deposit to start, the rest at launch';
  const weeksText = w => w <= 1 ? 'Ready in about a week' : 'Ready in about ' + w + ' to ' + (w + 1) + ' weeks';
  const tween = (() => {
    const state = new WeakMap();
    return (el, lo, hi) => {
      const paint = (a, b) => { el.textContent = Math.round(a) === Math.round(b) ? fmt(a) : fmt(a) + ' – ' + fmt(b); };
      const prev = state.get(el);
      if (!prev || reduced) { state.set(el, { lo, hi }); paint(lo, hi); return; }
      cancelAnimationFrame(prev.raf);
      const from = { lo: prev.lo, hi: prev.hi }, t0 = performance.now();
      const tick = now => {
        const k = Math.min(1, (now - t0) / 480), e = 1 - Math.pow(1 - k, 3);
        const cur = { lo: from.lo + (lo - from.lo) * e, hi: from.hi + (hi - from.hi) * e };
        paint(cur.lo, cur.hi);
        cur.raf = k < 1 ? requestAnimationFrame(tick) : 0;
        state.set(el, k < 1 ? cur : { lo, hi });
      };
      state.set(el, Object.assign({}, from, { raf: requestAnimationFrame(tick) }));
    };
  })();
  const fillLines = (ul, lines) => {
    ul.textContent = '';
    lines.forEach(([k, v]) => {
      const li = document.createElement('li');
      const a = document.createElement('span'); a.textContent = k;
      const b = document.createElement('b'); b.textContent = v;
      li.append(a, b);
      ul.appendChild(li);
    });
  };
  const readHash = key => {
    try {
      const h = location.hash;
      if (!h.startsWith('#' + key + '=')) return null;
      return JSON.parse(decodeURIComponent(h.slice(key.length + 2)));
    } catch (e) { return null; }
  };
  const linkTo = (key, obj, anchor) => location.href.split('#')[0] + '#' + key + '=' + encodeURIComponent(JSON.stringify(obj));

  /* ---------- map: loads Google's embed only when asked ---------- */
  $$('[data-loadmap]').forEach(btn => btn.addEventListener('click', () => {
    const box = btn.closest('.mapbox');
    const f = document.createElement('iframe');
    f.src = box.dataset.embed; f.title = 'Map: 30 Brunel Road, Thulisa Park'; f.loading = 'lazy';
    f.referrerPolicy = 'strict-origin-when-cross-origin'; f.allowFullscreen = true;
    box.classList.add('live'); box.appendChild(f);
  }));

  /* ---------- the send form: fills itself from an estimate or app plan ---------- */
  const sendDlg = $('#sendform');
  const openSend = (text, title, opt) => {
    opt = opt || {};
    if (!sendDlg) { location.href = WA + '?text=' + encodeURIComponent(text); return; }
    const msg = $('#sf-msg'), name = $('#sf-name'), biz = $('#sf-biz'), phone = $('#sf-phone'), email = $('#sf-email');
    $('#sf-title').firstChild.textContent = title;
    msg.value = text;
    const sync = () => {
      let head = 'Hi Startline Labs' + (name.value.trim() ? ", it's " + name.value.trim() : '') + (biz.value.trim() ? ' from ' + biz.value.trim() : '') + '.\n';
      const contact = [phone.value.trim() && 'Phone: ' + phone.value.trim(), email.value.trim() && 'Email: ' + email.value.trim()].filter(Boolean).join('\n');
      const body = head + (contact ? contact + '\n' : '') + '\n' + msg.value.replace(/^Hi Startline Labs,?\s*/, '');
      $('#sf-wa').href = WA + '?text=' + encodeURIComponent(body);
      $('#sf-mail').href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent((opt.subject || (/app/.test(title) ? 'App plan' : 'Project estimate')) + (biz.value.trim() ? ' for ' + biz.value.trim() : '')) + '&body=' + encodeURIComponent(body);
    };
    const next = $('.sf-next', sendDlg), guide = $('.sf-guide', sendDlg), lab = $('label[for="sf-msg"]');
    if (next) next.hidden = !opt.order;
    if (guide) { guide.hidden = !opt.guide; if (opt.guide) guide.href = opt.guide; }
    if (lab) { if (opt.label) lab.textContent = opt.label; else if (lab.textContent === 'Your order') lab.textContent = 'Your estimate'; }
    $('.sf-lead', sendDlg).textContent = opt.order ? 'Add your details and send your order by WhatsApp or email. Nothing to pay yet: here is what happens next.' : 'Your choices are already filled in. Add your details and send it by WhatsApp or email. We reply the same working day.';
    [msg, name, biz, phone, email].forEach(el => { el.oninput = sync; });
    sync();
    if (sendDlg.showModal) sendDlg.showModal(); else sendDlg.setAttribute('open', '');
    setTimeout(() => name.focus(), 50);
  };

  /* ---------- order buttons: any [data-order] opens the order sheet ---------- */
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-order]');
    if (!a || !sendDlg || e.metaKey || e.ctrlKey) return;
    e.preventDefault();
    const item = a.dataset.order, price = a.dataset.price || '';
    openSend('Hi Startline Labs, I would like to order: ' + item + (price ? ' (' + price + ')' : '') + '.\nPlease send me the quote and deposit invoice.\n\nAnything we should know (optional):\n',
      'Start your order', { order: true, subject: 'Order: ' + item, label: 'Your order', guide: a.dataset.guide });
  });

  /* ---------- estimator ---------- */
  const est = $('#est');
  if (est) {
    const BOT_RUN = 450;
    const WEB = ['landing', 'starter', 'business', 'advanced', 'showcase', 'update'];
    /* add-ons a build already includes: shown switched on, marked Included, not charged again */
    const INCLUDED = { store: ['pay'], showcase: ['bot', 'v3d'] };
    const kindOf = b => WEB.includes(b) ? 'web' : (b === 'system' || b === 'mobile') ? 'app' : b;
    const P = n => ({ person: 'people', 'user type': 'user types' }[n] || n + 's');
    /* each build type has its own sliders: what they count, what is included, what each extra costs */
    const SIZE = {
      landing: { weeks: 1, legend: 'How long is the page?', r1: { label: 'Sections on the page', min: 3, max: 12, step: 1, value: 5, inc: 5, unit: 200, per: 1, noun: 'section' } },
      starter: { weeks: 1, legend: 'How many pages?', r1: { label: 'Pages', min: 1, max: 8, step: 1, value: 3, inc: 3, unit: 450, per: 1, noun: 'page' } },
      business: { weeks: 2, legend: 'How many pages?', r1: { label: 'Pages', min: 1, max: 15, step: 1, value: 6, inc: 8, unit: 450, per: 1, noun: 'page' } },
      advanced: { weeks: 4, legend: 'How many pages?', r1: { label: 'Pages', min: 10, max: 40, step: 1, value: 16, inc: 20, unit: 450, per: 1, noun: 'page' } },
      showcase: { weeks: 6, legend: 'How many pages?', r1: { label: 'Pages', min: 5, max: 40, step: 1, value: 12, inc: 20, unit: 450, per: 1, noun: 'page' } },
      store: { weeks: 2, legend: 'How big is the shop?',
        r1: { label: 'Products to load', min: 0, max: 1000, step: 10, value: 20, inc: 20, unit: 200, per: 10, noun: 'product' },
        r2: { label: 'Pages besides the shop', min: 1, max: 15, step: 1, value: 6, inc: 8, unit: 450, per: 1, noun: 'page' } },
      update: { weeks: 1, legend: 'How much changes?', r1: { label: 'Pages to change', min: 1, max: 20, step: 1, value: 3, inc: 3, unit: 300, per: 1, noun: 'page' } },
      system: { weeks: 6, legend: 'How big is the system?',
        r1: { label: 'Screens', min: 3, max: 40, step: 1, value: 8, inc: 8, unit: 900, per: 1, noun: 'screen' },
        r2: { label: 'Types of user (customer, staff, admin)', min: 1, max: 6, step: 1, value: 2, inc: 2, unit: 1500, per: 1, noun: 'user type' } },
      mobile: { weeks: 10, legend: 'How big is the app?',
        r1: { label: 'Screens', min: 5, max: 60, step: 1, value: 12, inc: 12, unit: 900, per: 1, noun: 'screen' },
        r2: { label: 'Types of user (customer, staff, admin)', min: 1, max: 6, step: 1, value: 2, inc: 2, unit: 1500, per: 1, noun: 'user type' } },
      ai: { weeks: 2, legend: 'How much should it do?',
        r1: { label: 'Automations or chat flows', min: 1, max: 10, step: 1, value: 1, inc: 1, unit: 2000, per: 1, noun: 'flow' },
        r2: { label: 'Chatbot conversations a month', min: 0, max: 5000, step: 250, value: 0, monthly: true, noun: 'conversation' } },
      security: { weeks: 1, legend: 'How big is the team?',
        r1: { label: 'People in the team', min: 1, max: 50, step: 1, value: 5, inc: 10, unit: 250, per: 1, noun: 'person' },
        r2: { label: 'Websites or systems to check', min: 1, max: 5, step: 1, value: 1, inc: 1, unit: 750, per: 1, noun: 'site' } },
    };
    const R = ['r1', 'r2'].map(k => ({ k, wrap: $('#e-' + k + '-wrap'), input: $('#e-' + k), label: $('#e-' + k + '-label'), out: $('#e-' + k + '-out'), hint: $('#e-' + k + '-hint') }));
    const adds = $$('input[data-add]', est);
    const legend = $('#e-size-legend'), appsLink = $('#e-apps-link');
    const outTotal = $('#e-total'), outDep = $('#e-deposit'), outTime = $('#e-time span'), outLines = $('#e-lines'), outMonthly = $('#e-monthly'), monthK = $('#e-month-k');
    const wa = $('#e-wa'), copyBtn = $('#e-copy'), linkBtn = $('#e-link'), careNote = $('#e-care-note');
    const briefBox = $('#e-brief'), parseBtn = $('#e-parse'), found = $('#e-found');
    const baseEl = () => $('input[name="base"]:checked', est);
    let curBase = null, last = null;

    const convRun = n => n > 0 ? BOT_RUN + Math.ceil(Math.max(0, n - 1000) / 1000) * 150 : 0;
    const hintFor = c => c.monthly
      ? 'R450 a month covers up to 1,000 conversations, then R150 per extra 1,000. Leave at 0 if there is no chatbot.'
      : c.inc + ' ' + (c.inc === 1 ? c.noun : P(c.noun)) + ' included, then ' + fmt(c.unit) + ' per ' + (c.per > 1 ? c.per + ' ' + P(c.noun) : c.noun);

    /* switch the sliders and the add-ons to the ones that make sense for this build */
    const setBase = (base, keep) => {
      const cfg = SIZE[base], kind = kindOf(base);
      legend.textContent = cfg.legend;
      R.forEach(r => {
        const c = cfg[r.k];
        r.wrap.hidden = !c;
        if (!c) return;
        r.label.textContent = c.label;
        r.input.min = c.min; r.input.max = c.max; r.input.step = c.step;
        const v = keep && keep[r.k] != null ? keep[r.k] : c.value;
        r.input.value = Math.min(c.max, Math.max(c.min, v));
        r.hint.textContent = hintFor(c);
      });
      appsLink.hidden = kind !== 'app';
      adds.forEach(cb => {
        const sw = cb.closest('.switch');
        const show = sw.dataset.for.split(' ').includes(kind);
        sw.hidden = !show;
        sw.classList.toggle('more', !(sw.dataset.pop || '').split(' ').includes(kind));
        if (!show) cb.checked = false;
      });
      curBase = base;
    };

    const compute = () => {
      const b = baseEl(), base = b.value, cfg = SIZE[base], store = base === 'store';
      let lo = +b.dataset.lo, hi = +b.dataset.hi, extra = 0, addTotal = 0, run = 0;
      const lines = [[b.dataset.label, fmt(lo) + ' – ' + fmt(hi)]], sizes = [];
      R.forEach(r => {
        const c = cfg[r.k];
        if (!c) return;
        const v = +r.input.value;
        sizes.push(c.label + ': ' + num(v));
        if (c.monthly) { run += convRun(v); return; }
        const over = Math.max(0, v - c.inc);
        if (!over) return;
        const cost = Math.ceil(over / c.per) * c.unit;
        lo += cost; hi += cost; extra += cost;
        lines.push([num(over) + ' extra ' + (over === 1 ? c.noun : P(c.noun)), '+' + fmt(cost)]);
      });
      const picked = [];
      const incl = INCLUDED[base] || [];
      adds.forEach(cb => {
        const tag = cb.closest('.switch').querySelector('.add'), inc = incl.includes(cb.dataset.key);
        if (inc) {
          if (!cb.disabled) cb.dataset.prev = cb.checked ? '1' : '';
          cb.checked = true; cb.disabled = true;
          if (tag) tag.textContent = 'Included';
        } else if (cb.disabled) {
          cb.disabled = false; cb.checked = cb.dataset.prev === '1';
          if (tag) tag.textContent = '+' + fmt(+cb.dataset.add);
        }
        if (!cb.checked || cb.closest('.switch').hidden) return;
        picked.push(cb.dataset.label);
        if (cb.dataset.key === 'bot') run += BOT_RUN;
        if (inc) { lines.push([cb.dataset.label, 'Included']); return; }
        const a = +cb.dataset.add; lo += a; hi += a; addTotal += a;
        lines.push([cb.dataset.label, '+' + fmt(a)]);
      });
      const c = $('input[name="care"]:checked', est);
      const weeks = cfg.weeks + Math.round((addTotal + extra) / 8000);
      return { base, lo, hi, lines, picked, sizes, run, weeks, care: +c.value, careLabel: c.dataset.label, careNote: c.dataset.note, label: b.dataset.label };
    };

    const state = () => {
      const s = { b: baseEl().value, a: adds.filter(cb => cb.checked && !cb.closest('.switch').hidden && !cb.disabled).map(cb => cb.dataset.key), c: +$('input[name="care"]:checked', est).value };
      R.forEach(r => { if (!r.wrap.hidden) s[r.k] = +r.input.value; });
      return s;
    };

    const brief = q => {
      let t = 'Hi Startline Labs, I used the estimator on your site.\n\n';
      const said = briefBox ? briefBox.value.trim() : '';
      if (said) t += 'What I need: ' + said + '\n\n';
      t += 'Build: ' + q.label + '\n';
      q.sizes.forEach(x => { t += x + '\n'; });
      if (q.picked.length) t += 'Add-ons: ' + q.picked.join(', ') + '\n';
      t += 'Care plan: ' + q.careLabel + '\n\n';
      t += 'Estimate: ' + fmt(q.lo) + ' – ' + fmt(q.hi) + ' once-off';
      if (q.care || q.run) t += ', plus ' + fmt(q.care + q.run) + ' a month';
      t += '\n' + weeksText(q.weeks) + '\n\nCould we set up a quick call?';
      return t;
    };

    const render = () => {
      if (baseEl().value !== curBase) setBase(baseEl().value);
      R.forEach(r => { if (!r.wrap.hidden) { fillRange(r.input); r.out.textContent = num(+r.input.value); } });
      const q = compute();
      last = q;
      tween(outTotal, q.lo, q.hi);
      outDep.textContent = payPlan(q.lo);
      outTime.textContent = weeksText(q.weeks);
      outMonthly.textContent = (q.care || q.run) ? fmt(q.care + q.run) + ' / month' : 'None';
      if (monthK) monthK.textContent = q.run ? 'A month, incl. ' + fmt(q.run) + ' chatbot' : 'Care plan a month';
      if (careNote) careNote.textContent = q.careNote || '';
      fillLines(outLines, q.lines);
      wa.href = WA + '?text=' + encodeURIComponent(brief(q));
      if (moreBtn) {
        const rest = adds.filter(cb => { const w = cb.closest('.switch'); return !w.hidden && w.classList.contains('more') && !cb.checked; }).length;
        moreN.textContent = rest && !addsBox.classList.contains('open') ? '(' + rest + ')' : '';
        moreBtn.hidden = !rest && !addsBox.classList.contains('open');
      }
    };

    /* put the estimator in a given state: used by ideas, shared links and the brief reader */
    const apply = s => {
      const r = $('input[name="base"][value="' + s.b + '"]', est);
      if (!r) return;
      r.checked = true;
      setBase(s.b, s);
      const want = (s.a || []).includes('brandid') ? (s.a || []).filter(k => k !== 'brand') : (s.a || []);
      adds.forEach(cb => { if (!cb.closest('.switch').hidden && !cb.disabled) cb.checked = want.includes(cb.dataset.key); });
      if (s.c != null) { const c = $('input[name="care"][value="' + s.c + '"]', est); if (c) c.checked = true; }
      render();
    };

    const addsBox = $('#e-adds', est), moreBtn = $('#e-more', est), moreN = $('#e-more-n', est);
    if (moreBtn) moreBtn.addEventListener('click', () => {
      const open = addsBox.classList.toggle('open');
      moreBtn.setAttribute('aria-expanded', open);
      moreBtn.querySelector('span').textContent = open ? 'Fewer options' : 'More options';
      render();
    });
    /* a logo starter and a full brand identity overlap: picking one clears the other */
    est.addEventListener('change', e => {
      const k = e.target.dataset && e.target.dataset.key;
      if (!e.target.checked || (k !== 'brand' && k !== 'brandid')) return;
      const other = adds.find(cb => cb.dataset.key === (k === 'brand' ? 'brandid' : 'brand'));
      if (other && other.checked) { other.checked = false; render(); }
    });
    est.addEventListener('input', render);
    est.addEventListener('change', render);
    est.addEventListener('submit', e => e.preventDefault());
    if (copyBtn) copyBtn.addEventListener('click', () => copy(brief(last || compute()), 'Brief copied'));
    if (linkBtn) linkBtn.addEventListener('click', () => copy(linkTo('est', state()), 'Link to this estimate copied'));
    const sendBtn = $('#e-send');
    if (sendBtn) sendBtn.addEventListener('click', () => openSend(brief(last || compute()), 'Send your estimate'));
    setBase(baseEl().value);
    render();

    /* read a plain-English description and set the estimator from it */
    const WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11,
      twelve: 12, fifteen: 15, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100 };
    const NUMW = '(\\d+|' + Object.keys(WORDS).join('|') + ')';
    const toNum = w => (/^\d+$/.test(w) ? +w : WORDS[w]);
    const AI = /\b(chatbot|chat bot|bot|ai|artificial intelligence|automate|automation|automations|whatsapp assistant|virtual assistant)\b/;
    const PAY = /\b(payments?|card payments?|pay online|pay by card|yoco|payfast|card machine|take cards?|deposits?)\b/;
    const ADD_WORDS = [
      ['setup', /\b(email|emails|workspace|domain|gmail|google business|google maps|listed on google|google listing)\b/],
      ['pay', PAY], ['apay', PAY],
      ['booking', /\b(book online|online booking|bookings?|appointments?|reservations?)\b/],
      ['quote', /\b(quote|quotation|rfq|enrolment|enrollment|application|enquiry|inquiry)s? (form|forms|system|request|requests|tool|builder)\b|\brequest (a )?quotes?\b|\bquote form\b/],
      ['listings', /\b(menu|listings?|properties|property|vehicles|cars for sale|catalogue)\b/],
      ['events', /\b(events?|rsvp|registrations?|schedule)\b/],
      ['donate', /\b(donations?|donate|giving|tickets?|tithes?)\b/],
      ['gallery', /\b(gallery|photos|portfolio|pictures)\b/],
      ['blog', /\b(blog|news|articles|stories)\b/],
      ['shipping', /\b(courier|shipping|delivery|deliver)\b/],
      ['sync', /\b(stock sync|sync stock|inventory sync|point of sale|till)\b/],
      ['login', /\b(login|log in|sign in|accounts?|members?|clients log)\b/],
      ['push', /\b(push|notifications?|reminders?)\b/],
      ['maps', /\b(maps?|location|gps|tracking|delivery zones?)\b/],
      ['admin', /\b(admin|dashboard|back ?office)\b/],
      ['chat', /\b(chat|messaging|message me)\b/],
      ['aiapp', AI], ['bot', AI],
      ['wa', /\bwhatsapp\b/],
      ['crm', /\b(crm|spreadsheet|google sheets|leads?)\b/],
      ['docs', /\b(invoices?|documents?|receipts?|pdfs?)\b/],
      ['train', /\b(training|phishing|scams?|awareness)\b/],
      ['fix', /\b(fix them|fix it|harden|two.step|2fa)\b/],
      ['popia', /\b(popia|privacy policy|paia)\b/],
      ['sec', /\b(security|secure|cyber|hacked)\b/],
      ['lang', /\b(afrikaans|zulu|isizulu|xhosa|sotho|portuguese|french|bilingual|second language|two languages)\b/],
      ['brandid', /\b(brand identity|corporate identity|brand package|branding package|full brand|rebrand)\b/],
      ['brand', /\b(logo|branding|brand(?! identity| package))\b/],
      ['v3d', /\b(3d|3 d|three d|product viewer|visuali[sz]er|configurator|augmented reality|ar view)\b/],
      ['copy', /\b(copywriting|copy writing|write the (words|content|text)|content writing|you write)\b/],
    ];
    const read = raw => {
      const t = ' ' + raw.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\bin store\b/g, ' ').replace(/\s+/g, ' ') + ' ';
      const has = re => re.test(t);
      const p = { base: null, pages: null, products: null, screens: null, adds: [], care: null };
      let m = t.match(new RegExp('\\b' + NUMW + ' (?:[a-z]+ ){0,2}pages?\\b'));
      if (m) p.pages = toNum(m[1]);
      m = t.match(new RegExp('\\b' + NUMW + ' (?:[a-z]+ ){0,2}(?:products?|items?|skus?|listings?)\\b'));
      if (m) p.products = toNum(m[1]);
      m = t.match(new RegExp('\\b' + NUMW + ' (?:[a-z]+ ){0,2}screens?\\b'));
      if (m) p.screens = toNum(m[1]);
      const site = has(/\b(website|site|webpage|web page|landing page|pages?)\b/);
      if (has(/\b(update|updating|redesign|redo|refresh|revamp|fix|fixing|improve|existing|current (site|website)|old (site|website)|make changes)\b/) &&
          !has(/\bnew (website|site|store|shop)\b/) && site) p.base = 'update';
      else if (has(/\b(visuali[sz]er|configurator|3d showcase|showcase website)\b/)) p.base = 'showcase';
      else if (has(/\b(online store|store|shop|webshop|e ?commerce|sell (products|online|my products|stock)|checkout|cart)\b/) || (has(/\b(sell|selling|sells)\b/) && has(/\bonline\b/)) || p.products) p.base = 'store';
      else if (has(/\b(mobile app|phone app|cell ?phone app|smartphone app|native app|android|ios|iphone|ipad|play store|app store|apple store)\b/) ||
               has(/\bapp (for|on|in) (the |my |a |our |their )?(phone|phones|cell ?phone|mobile|smartphones?)\b/)) p.base = 'mobile';
      else if (has(/\b(web ?app|web ?based app|web application|online app|browser app|app (in|on|for|through|via) (the |a )?(web|browser|internet|online)|app online|apps online|cloud app|saas|software)\b/)) p.base = 'system';
      else if (!site && has(/\b(booking|bookings|book online|appointments?|reservations?|job cards?|job track\w*|portal|system|app|apps|application|crm|inventory|stock control|web app)\b/)) p.base = 'system';
      else if (!site && AI.test(t)) p.base = 'ai';
      else if (!site && has(/\b(dashboards?|reports?|analytics|power bi|data)\b/)) p.base = 'ai';
      else if (!site && has(/\b(security|cyber|popia|hacked|phishing)\b/)) p.base = 'security';
      else if (has(/\b(landing|one page|single page)\b/)) p.base = 'landing';
      else if (p.pages && p.pages > 12) p.base = 'advanced';
      else if (p.pages && p.pages <= 3) p.base = 'starter';
      else if (has(/\b(wedding|portfolio|cv|resume)\b/)) p.base = 'starter';
      else if (site) p.base = 'business';
      ADD_WORDS.forEach(([k, re]) => { if (has(re)) p.adds.push(k); });
      if (p.base === 'ai') p.adds = p.adds.filter(k => k !== 'bot');
      if (p.base === 'security') p.adds = p.adds.filter(k => k !== 'sec');
      if (has(/\b(growth|seo report|traffic report)\b/)) p.care = 1200;
      else if (has(/\b(maintain|maintenance|look after|care plan|monthly support|ongoing|backups?|keep it (updated|running))\b/)) p.care = 550;
      return p;
    };
    const showFound = (items, said) => {
      found.hidden = false;
      found.textContent = '';
      const lbl = document.createElement('span');
      lbl.className = 'lbl';
      lbl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9Z"/></svg>';
      lbl.append(items.length ? 'Picked up' : 'Nothing specific yet');
      found.appendChild(lbl);
      if (!items.length) {
        const n = document.createElement('span');
        n.className = 'none';
        n.textContent = said ? 'Choose the options below, or send it as it is and we will price it by hand.' : 'Type what you need above first.';
        found.appendChild(n);
        return;
      }
      items.forEach((txt, i) => {
        const c = document.createElement('span');
        c.className = 'chip'; c.style.setProperty('--i', i); c.textContent = txt;
        found.appendChild(c);
      });
    };
    const summary = () => {
      const q = compute(), items = [q.label];
      q.sizes.forEach(x => items.push(x));
      return items.concat(q.picked);
    };
    const scrollToEst = () => {
      const target = window.innerWidth < 920 ? $('.est-out') : est;
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    };
    const applyBrief = scroll => {
      const said = briefBox.value.trim();
      if (!said) { showFound([], ''); return; }
      const p = read(said);
      const base = p.base || baseEl().value, kind = kindOf(base), s = { b: base, a: p.adds, c: p.care != null ? p.care : +$('input[name="care"]:checked', est).value };
      if (kind === 'web' && p.pages) s.r1 = p.pages;
      if (base === 'store') { if (p.products) s.r1 = Math.round(p.products / 10) * 10; if (p.pages) s.r2 = p.pages; }
      if (kind === 'app' && p.screens) s.r1 = p.screens;
      if (base === 'ai' && /\b(chat ?bots?|bots?|whatsapp)\b/.test(said.toLowerCase())) s.r2 = 1000;
      apply(s);
      $$('.idea', $('#e-ideas')).forEach(x => x.classList.remove('on'));
      showFound(p.base || p.adds.length ? summary() : [], said);
      if (scroll) scrollToEst();
    };
    if (briefBox) {
      parseBtn.addEventListener('click', () => applyBrief(true));
      briefBox.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); applyBrief(true); } });
      briefBox.addEventListener('input', () => render());
    }
    /* "What each add-on includes" opens its drop-down */
    $$('a[href="#features"]').forEach(a => a.addEventListener('click', () => { const d = $('#features details'); if (d) d.open = true; }));
    /* package cards above the estimator: one tap fills it in for that package */
    $$('[data-est]').forEach(a => a.addEventListener('click', e => {
      let st;
      try { st = JSON.parse(a.dataset.est); } catch (err) { return; }
      e.preventDefault();
      $$('#packages .tier').forEach(t => t.classList.toggle('on', t.contains(a)));
      $$('.idea', $('#e-ideas')).forEach(x => x.classList.remove('on'));
      if (briefBox) briefBox.value = '';
      showFound([], '');
      apply(Object.assign({ c: +$('input[name="care"]:checked', est).value }, st));
      scrollToEst();
    }));
    /* ideas: one tap sets the build, the sliders and the add-ons */
    $$('.idea', $('#e-ideas')).forEach(btn => btn.addEventListener('click', () => {
      let idea;
      try { idea = JSON.parse(btn.dataset.idea); } catch (e) { return; }
      $$('.idea', $('#e-ideas')).forEach(x => x.classList.toggle('on', x === btn));
      if (briefBox) briefBox.value = idea.say || '';
      apply(Object.assign({ c: +$('input[name="care"]:checked', est).value }, idea));
      showFound(summary(), idea.say);
      scrollToEst();
    }));
    /* a shared link, a brief carried from the home page, or nothing */
    const shared = readHash('est');
    let incoming = '';
    try { incoming = sessionStorage.getItem('startline-brief') || ''; sessionStorage.removeItem('startline-brief'); } catch (e) {}
    if (!incoming) { try { incoming = new URLSearchParams(location.search).get('brief') || ''; } catch (e) {} }
    if (shared) {
      if (shared.say && briefBox) briefBox.value = shared.say;
      apply(Object.assign({ c: 550 }, shared));
      if (shared.say) showFound(summary(), shared.say);
      setTimeout(() => $('#estimate').scrollIntoView({ behavior: 'auto', block: 'start' }), 60);
    } else if (incoming && briefBox) {
      briefBox.value = incoming;
      applyBrief(false);
      setTimeout(() => $('#estimate').scrollIntoView({ behavior: 'auto', block: 'start' }), 60);
    }
  }

  /* ---------- app planner ---------- */
  const appq = $('#appq');
  if (appq) {
    const screens = $('#a-screens'), screensOut = $('#a-screens-out');
    const outTotal = $('#a-total'), outDep = $('#a-deposit'), outTime = $('#a-time span'), outLines = $('#a-lines'), outMonthly = $('#a-monthly');
    const wa = $('#a-wa'), idea = $('#a-idea'), like = $('#a-like');
    const feats = $$('input[name="feat"]', appq);
    const pick = n => $('input[name="' + n + '"]:checked', appq);
    const SCREENS_INC = 12, SCREEN_UNIT = 900, APPLE_MONTH = 150;
    let last = null;

    const compute = () => {
      const plat = pick('plat'), type = pick('atype'), scale = pick('scale'), design = pick('design'), stage = pick('stage');
      const factor = +type.dataset.factor || 1;
      const lines = [[plat.dataset.label, fmt(+plat.dataset.lo) + ' – ' + fmt(+plat.dataset.hi)]];
      let fsum = 0;
      const chosen = feats.filter(f => f.checked);
      chosen.forEach(f => { fsum += +f.dataset.add; lines.push([f.dataset.label, '+' + fmt(+f.dataset.add)]); });
      const sc = +screens.value, overS = Math.max(0, sc - SCREENS_INC), sCost = overS * SCREEN_UNIT;
      if (sCost) lines.push([overS + ' extra screen' + (overS > 1 ? 's' : ''), '+' + fmt(sCost)]);
      const dAdd = +design.dataset.add;
      if (dAdd) lines.push([design.dataset.label, '+' + fmt(dAdd)]);
      let lo = (+plat.dataset.lo + fsum + sCost) * factor + dAdd;
      let hi = (+plat.dataset.hi + fsum * 1.3 + sCost) * factor + dAdd;
      if (factor > 1) lines.push([type.dataset.label + ' is more involved', '× ' + factor.toFixed(2)]);
      let weeks = +plat.dataset.weeks + Math.round(fsum / 10000) + Math.round(sCost / 9000);
      if (stage.value === 'full') { lo *= 1.3; hi *= 1.3; weeks += 3; lines.push(['Full product, polished', '× 1.30']); }
      if (stage.value === 'prototype') {
        lo = 6000 + overS * 250; hi = 12000 + overS * 400; weeks = 2;
        lines.length = 0;
        lines.push(['Clickable prototype of ' + sc + ' screens', fmt(lo) + ' – ' + fmt(hi)]);
        lines.push(['Counts towards the build if you go ahead', '']);
      }
      lo = Math.round(lo / 500) * 500; hi = Math.round(hi / 500) * 500;
      const ios = plat.value === 'both' || plat.value === 'all';
      const monthly = stage.value === 'prototype' ? 0 : +scale.dataset.month + (ios ? APPLE_MONTH : 0);
      return { lo, hi, weeks, lines, monthly, ios, plat: plat.dataset.label, type: type.dataset.label, feats: chosen.map(f => f.dataset.label), sc,
        scale: scale.dataset.label, design: design.dataset.label, stage: stage.dataset.label };
    };
    const brief = q => {
      let t = 'Hi Startline Labs, I planned an app on your site.\n\n';
      if (idea.value.trim()) t += 'The idea: ' + idea.value.trim() + '\n';
      if (like.value.trim()) t += 'A bit like: ' + like.value.trim() + '\n';
      t += '\nRuns on: ' + q.plat + '\nKind: ' + q.type + '\nFeatures: ' + (q.feats.join(', ') || 'none yet') + '\nScreens: ' + q.sc +
        '\nUsers in year one: ' + q.scale + '\nDesign: ' + q.design + '\nStart with: ' + q.stage + '\n\n';
      t += 'Estimate: ' + fmt(q.lo) + ' – ' + fmt(q.hi) + (q.monthly ? ', plus about ' + fmt(q.monthly) + ' a month to run' : '') + '\n' + weeksText(q.weeks) + '\n\nCould we book a discovery call?';
      return t;
    };
    const state = () => ({ p: pick('plat').value, t: pick('atype').value, f: feats.filter(f => f.checked).map(f => f.value), sc: +screens.value,
      u: pick('scale').value, d: pick('design').value, st: pick('stage').value });
    const render = () => {
      fillRange(screens); screensOut.textContent = screens.value;
      const q = compute();
      last = q;
      tween(outTotal, q.lo, q.hi);
      outDep.textContent = payPlan(q.lo);
      outTime.textContent = weeksText(q.weeks);
      outMonthly.textContent = q.monthly ? 'about ' + fmt(q.monthly) : 'None yet';
      outMonthly.title = q.ios ? 'Includes about R150 a month for the Apple developer fee' : '';
      fillLines(outLines, q.lines);
      wa.href = WA + '?text=' + encodeURIComponent(brief(q));
    };
    const apply = s => {
      const set = (n, v) => { const r = v != null && $('input[name="' + n + '"][value="' + v + '"]', appq); if (r) r.checked = true; };
      set('plat', s.p); set('atype', s.t); set('scale', s.u); set('design', s.d); set('stage', s.st);
      if (s.f) feats.forEach(f => { f.checked = s.f.includes(f.value); });
      if (s.sc) screens.value = s.sc;
      render();
    };
    /* choosing a kind of app ticks the features it usually needs */
    $$('input[name="atype"]', appq).forEach(r => r.addEventListener('change', () => {
      const sug = (r.dataset.suggest || '').split(' ').filter(Boolean);
      feats.forEach(f => { if (sug.includes(f.value)) f.checked = true; });
      render();
    }));
    appq.addEventListener('input', render);
    appq.addEventListener('change', render);
    appq.addEventListener('submit', e => e.preventDefault());
    $('#a-copy').addEventListener('click', () => copy(brief(last || compute()), 'Brief copied'));
    $('#a-link').addEventListener('click', () => copy(linkTo('app', state()), 'Link to this plan copied'));
    $('#a-send').addEventListener('click', () => openSend(brief(last || compute()), 'Send your app plan'));
    $$('[data-app]').forEach(btn => btn.addEventListener('click', () => {
      let ex;
      try { ex = JSON.parse(btn.dataset.app); } catch (e) { return; }
      $$('[data-app]').forEach(x => x.classList.toggle('on', x === btn));
      idea.value = ex.say || '';
      apply(ex);
      const target = window.innerWidth < 920 ? $('#appq .est-out') : appq;
      target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }));
    /* the device stage and the "runs on" row follow the chosen platform */
    const syncDevices = () => {
      const on = ((pick('plat') || {}).dataset || {}).runs || '';
      $$('[data-dev]').forEach(d => d.classList.toggle('on', on.split(' ').includes(d.dataset.dev)));
    };
    appq.addEventListener('change', syncDevices);
    $$('.stage-dev').forEach(b => b.addEventListener('click', () => {
      const r = $('input[name="plat"][value="' + b.dataset.plat + '"]', appq);
      if (r) { r.checked = true; render(); syncDevices(); }
      $('#plan').scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
    }));
    const shared = readHash('app');
    if (shared) {
      if (shared.say && !idea.value) idea.value = shared.say;
      apply(shared);
      setTimeout(() => $('#plan').scrollIntoView({ behavior: 'auto', block: 'start' }), 60);
    } else render();
    syncDevices();
  }

  /* ---------- phones: a floating price bar while the form is long ---------- */
  $$('form.est').forEach(form => {
    const out = $('.est-out', form), total = $('.est-total', out);
    if (!out || !total || !('IntersectionObserver' in window)) return;
    const pill = document.createElement('button');
    pill.type = 'button';
    pill.className = 'est-pill';
    pill.setAttribute('aria-label', 'Show the estimate');
    const v = document.createElement('b'), k = document.createElement('span');
    k.textContent = 'See the estimate';
    pill.append(v, k);
    document.body.appendChild(pill);
    const sync = () => { v.textContent = total.textContent; };
    new MutationObserver(sync).observe(total, { childList: true, characterData: true, subtree: true });
    sync();
    let formIn = false, outIn = false;
    const show = () => { const on = formIn && !outIn; pill.classList.toggle('show', on); document.body.classList.toggle('pill-on', on && getComputedStyle(pill).display !== 'none'); };
    new IntersectionObserver(es => es.forEach(e => { if (e.target === form) formIn = e.isIntersecting; else outIn = e.isIntersecting; show(); }), { threshold: 0 })
      .observe(form);
    new IntersectionObserver(es => es.forEach(e => { outIn = e.isIntersecting; show(); }), { threshold: 0.25 }).observe(out);
    pill.addEventListener('click', () => out.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }));
  });

  /* ---------- launch list: save an email for app launch updates ---------- */
  $$('form[data-signup]').forEach(f => {
    const status = $('.su-status', f), btn = $('button[type="submit"]', f), email = $('input[name="email"]', f);
    const say = (msg, ok) => { status.className = 'su-status ' + (ok ? 'su-ok' : 'su-err'); status.textContent = msg; };
    f.addEventListener('submit', async e => {
      e.preventDefault();
      const v = email.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { say('Please check your email address.', false); email.focus(); return; }
      const data = Object.fromEntries(new FormData(f));
      data.page = location.pathname;
      btn.disabled = true;
      try {
        const r = await fetch(f.action, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error(j.error || 'failed');
        f.classList.add('done');
        say(j.already ? 'You are already on the list. We will be in touch.' : 'You are on the list. We will email you at launch.', true);
      } catch (err) {
        btn.disabled = false;
        status.className = 'su-status su-err';
        status.innerHTML = 'That did not save. <a href="mailto:' + EMAIL + '?subject=' + encodeURIComponent('Launch list: ' + (data.app || 'apps')) + '&body=' + encodeURIComponent('Please add ' + v + ' to the launch list.') + '">Email us instead</a> and we will add you.';
      }
    });
  });

  /* ---------- home: quick picks fill the prompt; the email form opens a ready-made quote request ---------- */
  $$('[data-fill]').forEach(b => b.addEventListener('click', () => {
    const f = $('form[data-ask]'); if (!f) return;
    const box = $('textarea', f); box.value = b.dataset.fill; box.dispatchEvent(new Event('input'));
    $$('[data-fill]').forEach(x => x.classList.toggle('on', x === b)); box.focus();
  }));
  $$('form[data-quote]').forEach(f => f.addEventListener('submit', e => {
    e.preventDefault();
    const mail = $('input', f), v = mail.value.trim();
    if (!/^\S+@\S+\.\S+$/.test(v)) { mail.focus(); mail.classList.add('bad'); return; }
    mail.classList.remove('bad');
    const brief = ($('form[data-ask] textarea') || {}).value || '';
    if (!sendDlg) { location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Quote request') + '&body=' + encodeURIComponent((brief || 'I would like a quote.') + '\n\nReply to: ' + v); return; }
    openSend('Hi Startline Labs, I would like a free quote.\n\nWhat I need: ' + (brief.trim() || '') + '\n\nReply to: ' + v + '\n', 'Get your free quote', { order: true, subject: 'Quote request', label: 'What you need' });
    const em = $('#sf-email'); if (em) { em.value = v; em.dispatchEvent(new Event('input')); }
  }));

  /* ---------- home prompt bar: carry the description to the estimator ---------- */
  $$('form[data-ask]').forEach(f => {
    const box = $('textarea', f);
    const send = () => {
      const said = box.value.trim();
      if (!said) { box.focus(); return; }
      try { sessionStorage.setItem('startline-brief', said); location.href = f.dataset.target; }
      catch (e) { location.href = f.getAttribute('action') + '?brief=' + encodeURIComponent(said) + '#estimate'; }
    };
    f.addEventListener('submit', e => { e.preventDefault(); send(); });
    box.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } });
  });

  /* ---------- placeholders that type out example requests ---------- */
  const EXAMPLES = ['An online store for about 40 products with card payments…', 'Update my existing website and add a quote form…',
    'A booking system for my salon…', 'A five-page website for my plumbing business, with a logo…', 'An Android app for my delivery drivers…'];
  if (!reduced) $$('textarea[data-cycle]').forEach(box => {
    const base = box.getAttribute('placeholder');
    let i = 0, c = 0, dir = 1, wait = 0, stop = false;
    const halt = () => { stop = true; box.setAttribute('placeholder', base); };
    box.addEventListener('focus', halt);
    box.addEventListener('input', halt);
    const tick = () => {
      if (stop) return;
      const w = EXAMPLES[i];
      if (wait > 0) wait -= 1;
      else if (dir > 0) { c += 1; if (c >= w.length) { dir = -1; wait = 38; } }
      else { c -= 2; if (c <= 0) { c = 0; dir = 1; i = (i + 1) % EXAMPLES.length; wait = 6; } }
      box.setAttribute('placeholder', w.slice(0, Math.max(0, c)) || base);
      setTimeout(tick, dir > 0 ? 42 : 18);
    };
    setTimeout(tick, 1400);
  });

  /* ---------- contact composer ---------- */
  const cf = $('#compose');
  if (cf) {
    const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const bubble = $('#c-bubble'), wa = $('#c-wa'), mail = $('#c-mail'), to = cf.dataset.email;
    const build = () => {
      const name = val('c-name'), biz = val('c-biz'), need = val('c-need') || 'a website', budget = val('c-budget'), msg = val('c-msg');
      let t = 'Hi Startline Labs' + (name ? ", it's " + name : '') + (biz ? ' from ' + biz : '') + '.\n';
      t += "I'm looking for " + need + '.';
      if (budget) t += '\nBudget: ' + budget + '.';
      if (msg) t += '\n\n' + msg;
      return t;
    };
    const render = () => {
      const t = build(), biz = val('c-biz');
      bubble.textContent = t;
      wa.href = WA + '?text=' + encodeURIComponent(t);
      mail.href = 'mailto:' + to + '?subject=' + encodeURIComponent('Project enquiry' + (biz ? ' from ' + biz : '')) + '&body=' + encodeURIComponent(t);
    };
    cf.addEventListener('input', render);
    cf.addEventListener('change', render);
    cf.addEventListener('submit', e => { e.preventDefault(); go(wa.href, true); });
    render();
  }

  /* ---------- services scroll-spy ---------- */
  const aside = $('.svc-aside');
  if (aside && 'IntersectionObserver' in window) {
    const links = $$('a', aside);
    const byId = new Map(links.map(a => [a.getAttribute('href').split('#')[1], a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.remove('on'));
      const a = byId.get(e.target.id);
      if (a) a.classList.add('on');
    }), { rootMargin: '-35% 0px -60% 0px' });
    $$('.svc[id]').forEach(s => io.observe(s));
  }

  /* ---------- footer: giant wordmark fits the width, honest load time ---------- */
  const giant = $('.giant > span');
  if (giant) {
    const fit = () => {
      giant.style.fontSize = '100px';
      const w = giant.getBoundingClientRect().width, W = giant.parentElement.clientWidth;
      if (w && W) giant.style.fontSize = (100 * W * 0.98 / w).toFixed(2) + 'px';
    };
    fit();
    window.addEventListener('resize', fit);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  }
  const lt = $$('[data-loadtime]');
  if (lt.length) requestAnimationFrame(() => requestAnimationFrame(() => {
    const ms = Math.round(performance.now());
    lt.forEach(el => { el.textContent = ms + ' ms'; });
  }));

  /* ---------- free website check (Google PageSpeed Insights, run in the visitor's browser) ---------- */
  const chk = $('#chk');
  if (chk) {
    const PSI_KEY = '';   // optional: a Google API key restricted to startlinelab.com raises the free quota
    const urlIn = $('#chk-url'), go = $('#chk-go'), wait = $('#chk-wait'), err = $('#chk-err'), out = $('#chk-out');
    let report = '', ticker = null;
    const norm = v => { v = (v || '').trim(); if (!v) return ''; if (!/^https?:\/\//i.test(v)) v = 'https://' + v; try { const u = new URL(v); return u.hostname.includes('.') ? u.href : ''; } catch (e) { return ''; } };
    const grade = sc => sc >= 0.9 ? ['good', 'Good'] : sc >= 0.5 ? ['mid', 'Needs work'] : ['bad', 'Poor'];
    const PLAIN = {
      'is-on-https': ['Uses HTTPS, the padlock in the address bar', 'Not fully on HTTPS, so browsers may warn visitors'],
      'viewport': ['Set up for phone screens', 'Not set up for phone screens'],
      'document-title': ['Has a page title for Google', 'Missing a page title for Google'],
      'meta-description': ['Has a search description', 'No search description, so Google guesses one'],
      'is-crawlable': ['Google is allowed to list it', 'Blocked from appearing on Google'],
      'http-status-code': ['The address works, with no broken page', 'The page returns an error code'],
      'image-alt': ['Images are described for Google and screen readers', 'Some images have no description'],
      'link-text': ['Links say where they lead', 'Some links say "click here" instead of where they lead'],
      'color-contrast': ['Text is easy to read', 'Some text is hard to read against its background'],
      'target-size': ['Buttons are easy to tap', 'Some buttons or links are too small to tap easily'],
      'errors-in-console': ['No errors in the browser', 'The page shows errors in the browser'],
      'render-blocking-resources': ['Nothing holds up the first view', 'Some files hold up the page before it shows'],
      'modern-image-formats': ['Images use modern formats', 'Images could be smaller and load faster'],
      'uses-optimized-images': ['Images are compressed', 'Some images are larger than they need to be'],
      'unused-javascript': ['Little unused code', 'The page loads code it does not use'],
    };
    const li = (cls, t) => `<li class="${cls}">${t}</li>`;
    const steps = $$('.chk-steps li', wait);
    const showStep = i => steps.forEach((s, k) => { s.classList.toggle('on', k === i); s.classList.toggle('done', k < i); });
    const stop = () => { clearInterval(ticker); go.disabled = false; go.classList.remove('busy'); };
    chk.addEventListener('submit', async e => {
      e.preventDefault();
      const url = norm(urlIn.value);
      err.hidden = true; out.hidden = true;
      if (!url) { err.hidden = false; err.textContent = 'Enter a website address, such as yourbusiness.co.za.'; urlIn.focus(); return; }
      go.disabled = true; go.classList.add('busy'); wait.hidden = false;
      let step = 0; showStep(0); ticker = setInterval(() => showStep(Math.min(++step, steps.length - 1)), 6000);
      const q = new URLSearchParams({ url, strategy: 'MOBILE', locale: 'en' });
      ['PERFORMANCE', 'ACCESSIBILITY', 'BEST_PRACTICES', 'SEO'].forEach(c => q.append('category', c));
      if (PSI_KEY) q.set('key', PSI_KEY);
      const ctl = new AbortController(); const to = setTimeout(() => ctl.abort(), 90000);
      try {
        const res = await fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?' + q, { signal: ctl.signal });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const busy = res.status === 429;
          throw new Error(busy ? 'The free checker is busy right now. Try again in a minute, or send us your link on WhatsApp and we will check it for you.'
            : 'We could not test that address. Check it opens in your browser, then try again.');
        }
        const lh = data.lighthouseResult || {};
        if (lh.runtimeError && lh.runtimeError.code && lh.runtimeError.code !== 'NO_ERROR') throw new Error('Google could not load that website. Check the address opens in your browser, then try again.');
        const C = lh.categories || {}, A = lh.audits || {};
        const cats = [['performance', 'Speed'], ['accessibility', 'Mobile and accessibility'], ['seo', 'Search'], ['best-practices', 'Security and best practice']];
        const scores = {};
        $('#chk-scores').innerHTML = cats.map(([k, label]) => {
          const sc = C[k] && typeof C[k].score === 'number' ? C[k].score : null; scores[k] = sc;
          if (sc === null) return '';
          const [cls, word] = grade(sc), n = Math.round(sc * 100);
          return `<div class="chk-score ${cls}"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15.5" class="t"/><circle cx="18" cy="18" r="15.5" class="v" style="stroke-dasharray:${(n * 97.4 / 100).toFixed(1)} 97.4"/></svg><b>${n}</b><span>${label}</span><em>${word}</em></div>`;
        }).join('');
        const fix = [], ok = [];
        const lcp = A['largest-contentful-paint'];
        if (lcp && typeof lcp.numericValue === 'number') {
          const sec = (lcp.numericValue / 1000).toFixed(1);
          (lcp.numericValue > 2500 ? fix : ok).push(lcp.numericValue > 2500 ? `The main content takes ${sec} s to appear on a phone. Aim for under 2.5 s.` : `The main content appears in ${sec} s on a phone.`);
        }
        Object.keys(PLAIN).forEach(id => {
          const a = A[id]; if (!a || a.score === null || a.score === undefined || a.scoreDisplayMode === 'notApplicable') return;
          (a.score >= 0.9 ? ok : fix).push(PLAIN[id][a.score >= 0.9 ? 0 : 1]);
        });
        $('#chk-fix').innerHTML = (fix.length ? fix.slice(0, 8) : ['Nothing urgent. Nice work.']).map(t => li('', t)).join('');
        $('#chk-ok').innerHTML = ok.slice(0, 8).map(t => li('', t)).join('');
        const host = new URL(lh.finalDisplayedUrl || lh.finalUrl || url).hostname.replace(/^www\./, '');
        $('#chk-site').textContent = host;
        $('#chk-time').textContent = new Date().toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' });
        report = `Hi Startline Labs, I ran the free website check on ${host}.\n\n` + cats.filter(([k]) => scores[k] !== null).map(([k, l]) => `${l}: ${Math.round(scores[k] * 100)}/100`).join('\n')
          + (fix.length ? `\n\nTo fix:\n- ${fix.slice(0, 8).join('\n- ')}` : '') + `\n\nPlease send me a fixed-price fix list.`;
        wait.hidden = true; out.hidden = false;
        out.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      } catch (x) {
        wait.hidden = true; err.hidden = false;
        err.textContent = x.name === 'AbortError' ? 'That took too long. The site may be very slow or offline. Try again, or send us the link on WhatsApp.' : (x.message || 'Something went wrong. Try again in a minute.');
      } finally { clearTimeout(to); stop(); }
    });
    const biz = $('#chk-biz'), maps = $('#chk-maps');
    if (biz) biz.addEventListener('input', () => { maps.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(biz.value.trim()); });
    const sendBtn = $('#chk-send');
    if (sendBtn) sendBtn.addEventListener('click', () => {
      const lab = $('label[for="sf-msg"]'); if (lab) lab.textContent = 'Your report';
      openSend(report, 'Send your report');
    });
  }

  /* ---------- book a free 20-minute call: pick a slot, request it on WhatsApp or email ---------- */
  const bdays = $('#book-days');
  if (bdays) {
    const HOLIDAYS = ['2026-12-16', '2026-12-25', '2027-01-01', '2027-03-22', '2027-03-26', '2027-03-29', '2027-04-27', '2027-05-01', '2027-06-16', '2027-08-09'];
    const SLOTS = ['09:00', '10:30', '12:00', '14:00', '15:30'];
    const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const sast = () => new Date(Date.now() + 2 * 3600e3);              // read with UTC getters = South African time
    const iso = d => d.toISOString().slice(0, 10);
    const now = sast(), nowMin = now.getUTCHours() * 60 + now.getUTCMinutes();
    const days = []; const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    while (days.length < 10) {
      const wd = d.getUTCDay(), key = iso(d), today = key === iso(now);
      const open = SLOTS.filter(t => !today || (+t.slice(0, 2) * 60 + +t.slice(3)) > nowMin + 120);
      if (wd > 0 && wd < 6 && !HOLIDAYS.includes(key) && open.length) days.push({ key, wd, date: d.getUTCDate(), m: d.getUTCMonth(), open });
      d.setUTCDate(d.getUTCDate() + 1);
    }
    let pick = { day: null, time: null };
    const slotsBox = $('#book-slots'), pickBox = $('#book-pick'), wa = $('#bk-wa'), mail = $('#bk-mail');
    const label = () => pick.day && pick.time ? `${DAYS[pick.day.wd]} ${pick.day.date} ${MONTHS[pick.day.m]} at ${pick.time}` : '';
    const renderSlots = () => {
      slotsBox.innerHTML = pick.day ? pick.day.open.map(t => `<button type="button" class="book-slot${t === pick.time ? ' on' : ''}" role="option" aria-selected="${t === pick.time}" data-t="${t}">${t}</button>`).join('')
        : '<p class="chk-hint">Choose a day first.</p>';
    };
    const update = () => {
      const when = label(); pickBox.textContent = when ? when + ' (SAST)' : 'Choose a day and a time'; pickBox.classList.toggle('set', !!when);
      const v = id => ($('#' + id).value || '').trim();
      const msg = `Hi Startline Labs, I'd like to book a free 20-minute call.\n\nWhen: ${when || '(time to be agreed)'}\nHow: ${v('bk-way')}\nAbout: ${v('bk-topic')}`
        + (v('bk-name') ? `\nName: ${v('bk-name')}` : '') + (v('bk-biz') ? `\nBusiness: ${v('bk-biz')}` : '')
        + (v('bk-phone') ? `\nPhone: ${v('bk-phone')}` : '') + (v('bk-email') ? `\nEmail: ${v('bk-email')}` : '') + (v('bk-note') ? `\n\n${v('bk-note')}` : '');
      wa.href = WA + '?text=' + encodeURIComponent(msg);
      mail.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Free call request' + (when ? ': ' + when : ''))}&body=${encodeURIComponent(msg)}`;
      [wa, mail].forEach(a => a.setAttribute('aria-disabled', when ? 'false' : 'true'));
    };
    bdays.innerHTML = days.map((x, i) => `<button type="button" class="book-day" role="option" aria-selected="false" data-i="${i}"><small>${DAYS[x.wd].slice(0, 3)}</small><b>${x.date}</b><small>${MONTHS[x.m].slice(0, 3)}</small></button>`).join('');
    bdays.addEventListener('click', e => {
      const b = e.target.closest('.book-day'); if (!b) return;
      pick = { day: days[+b.dataset.i], time: null };
      $$('.book-day', bdays).forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
      renderSlots(); update();
    });
    slotsBox.addEventListener('click', e => { const b = e.target.closest('.book-slot'); if (!b) return; pick.time = b.dataset.t; renderSlots(); update(); });
    $('#book-form').addEventListener('input', update);
    $('#book-form').addEventListener('submit', e => e.preventDefault());
    [wa, mail].forEach(a => a.addEventListener('click', e => { if (a.getAttribute('aria-disabled') === 'true') { e.preventDefault(); pickBox.classList.add('nudge'); setTimeout(() => pickBox.classList.remove('nudge'), 700); } }));
    renderSlots(); update();
  }


  /* ---------- project brief: answers composed into one message for WhatsApp, email or the clipboard ---------- */
  const bform = $('#brief-form');
  if (bform) {
    const pre = new URLSearchParams(location.search).get('need');
    if (pre) $$('input[name="need"]', bform).forEach(i => { if (i.dataset.v === pre) i.checked = true; });
    const ticked = n => $$(`input[name="${n}"]:checked`, bform).map(i => i.value);
    const build = () => {
      const lines = ['Hi Startline Labs, here is my project brief.', ''];
      $$('[data-q]', bform).slice(0, 6).forEach(f => f.value.trim() && lines.push(`${f.dataset.q}: ${f.value.trim()}`));
      const add = (label, xs) => xs.length && lines.push('', `${label}: ${xs.join(', ')}`);
      add('I need', ticked('need')); add('Goals', ticked('goal'));
      ['br-cust', 'br-like'].forEach(id => { const f = $('#' + id); f.value.trim() && lines.push(`${f.dataset.q}: ${f.value.trim()}`); });
      add('Features', ticked('feat'));
      const pg = $('#br-pages'); pg.value.trim() && lines.push(`Pages: ${pg.value.trim()}`);
      add('I already have', ticked('have'));
      const u = $('#br-url'); u.value.trim() && lines.push(`Current site: ${u.value.trim()}`);
      lines.push('', `Budget: ${$('#br-budget').value}`, `Timing: ${$('#br-when').value}`);
      const n = $('#br-note'); n.value.trim() && lines.push('', n.value.trim());
      return lines.join('\n');
    };
    const update = () => {
      const msg = build(), biz = $('#br-biz').value.trim();
      $('#br-wa').href = WA + '?text=' + encodeURIComponent(msg);
      $('#br-mail').href = `mailto:${EMAIL}?subject=${encodeURIComponent('Project brief' + (biz ? ': ' + biz : ''))}&body=${encodeURIComponent(msg)}`;
    };
    bform.addEventListener('input', update); bform.addEventListener('change', update);
    bform.addEventListener('submit', e => e.preventDefault());
    $('#br-copy').addEventListener('click', async e => {
      const b = e.currentTarget;
      try { await navigator.clipboard.writeText(build()); b.textContent = 'Copied'; } catch (_) { b.textContent = 'Copy failed'; }
      setTimeout(() => { b.textContent = 'Copy answers'; }, 1800);
    });
    update();
  }




  /* ---------- Startline Engine: live diagram ---------- */
  const ev = $('#eng-viz');
  if (ev) {
    const NS = 'http://www.w3.org/2000/svg', svg = $('svg', ev), still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sc = $('.ev-scroll', ev); if (sc && sc.scrollWidth > sc.clientWidth) sc.scrollLeft = (sc.scrollWidth - sc.clientWidth) / 2;
    const mk = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const ins = [...svg.querySelectorAll('.ev-wire.in')], outs = [...svg.querySelectorAll('.ev-wire.out')];
    const nodes = [...svg.querySelectorAll('.ev-node')], webs = [...svg.querySelectorAll('.ev-web')], ios = [...svg.querySelectorAll('.ev-io')];
    const layer = mk('g', {}); svg.insertBefore(layer, svg.querySelector('.ev-spin'));
    const dots = [];
    const spawn = (path, out) => {
      const g = mk('g', {}), a = mk('circle', { r: 5, class: 'ev-dot' + (out ? ' o' : '') }), b = mk('circle', { r: 1.8, class: 'ev-dotc' });
      g.append(a, b); layer.append(g);
      dots.push({ g, path, len: path.getTotalLength(), t: 0, v: 0.0035 + Math.random() * 0.004 });
    };
    // the block: weekly load in phases, built week by week
    const W = [.42, .47, .52, .36, .56, .61, .66, .46, .70, .76, .82, .58, .88, .92, .55, .34], PH = ['BASE', 'BASE', 'BASE', 'LIGHTER WEEK', 'BASE', 'BUILD', 'BUILD', 'LIGHTER WEEK', 'BUILD', 'BUILD', 'BUILD', 'LIGHTER WEEK', 'PEAK', 'PEAK', 'TAPER', 'TAPER'];
    const bars = [...svg.querySelectorAll('.ev-bar')], phase = $('#evPhase', svg);
    const setBar = (i, v) => { const h = Math.max(2, v * 78); bars[i].setAttribute('y', 112 - h); bars[i].setAttribute('height', h); bars[i].classList.toggle('r', PH[i] === 'LIGHTER WEEK'); bars[i].classList.toggle('t', PH[i] === 'TAPER'); };
    const trace = $('#evTrace', svg), ready = $('#evReady', svg), band = $('#evBand', svg), gval = svg.querySelector('.ev-gval'), mpb = $('#evMpb', svg), cyc = svg.querySelector('.ev-cyc'), log = $('#evLog', svg);
    const EVD = [["ATHLETE", [["Daniels, 2014", "Training paces set from a real recent race"], ["Maunder et al., 2021", "Durability: how well fitness holds after hours of work"]]], ["PACE", [["Riegel, 1981", "Race times predicted across distances"], ["Minetti et al., 2002", "The energy cost of running up and down slopes"]]], ["LOAD", [["Gabbett, 2016", "Sudden load spikes, not hard training, drive injury risk"], ["Foster et al., 2001", "Session effort × minutes tracks training load"]]], ["READINESS", [["Kiviniemi et al., 2007", "HRV-guided training beat a fixed plan"], ["Plews et al., 2013", "Weekly HRV averages track adaptation"], ["Mah et al., 2011", "Extra sleep made athletes faster and sharper"]]], ["M/BEAT", [["Buchheit, 2014", "Heart-rate measures reveal training status"], ["Holloszy, 1967", "Endurance training builds new mitochondria"]]], ["DURABILITY", [["Smyth et al., 2022", "Durability in 82,303 marathon runners"], ["Blagrove et al., 2018", "Strength training improves running economy"]]], ["PLAN", [["Seiler, 2010", "Elite endurance athletes train about 80% easy"], ["Bosquet et al., 2007", "A two-week taper, volume down, intensity kept"], ["Nielsen et al., 2014", "Weekly jumps over 30% linked to injury"], ["Frandsen et al., 2025", "Single runs far past the 30-day longest raise injury risk"], ["Helgerud et al., 2007", "4 × 4 intervals lift VO2max more than steady work"]]], ["RACE", [["Jeukendrup, 2014", "Up to 90 g of mixed carbohydrate an hour in long races"], ["Ely et al., 2007", "Marathon times slow as the temperature rises"], ["Zurawlew et al., 2016", "Hot baths after training build heat acclimation"]]], ["CONSISTENCY", [["Halson, 2014", "Monitoring load spots fatigue early"], ["Afremow, 2014", "Be brilliant with the basics, every week"]]]];
    const act = $('#evAct', svg), cite = $('#evCite', svg), find = $('#evFind', svg), lib = $('#evLib', svg), seen = {};
    const LOG = ['Session in: 14.2 km easy run · load updated', 'HRV inside baseline band · readiness 81', 'Long run 24 km · durability drift 3.1%', 'Lighter week placed · week 8 of 16',
                 'Easy run held under the HR cap · habit ticked', 'B race in 3 weeks · used as a hard session', 'Fuel plan: 60 g carbohydrate an hour', 'Taper set · volume down, intensity kept'];
    let ph = 0, hrv = [];
    const drawTrace = () => {
      if (hrv.length < 40) for (let i = 0; i < 40; i++) hrv.push(0);
      hrv.shift(); ph += 0.35; hrv.push(Math.sin(ph) * 9 + Math.sin(ph * 2.7) * 4 + (Math.random() - .5) * 6);
      trace.setAttribute('d', hrv.map((v, i) => (i ? 'L' : 'M') + (166 + i * 3.1).toFixed(1) + ' ' + (86 + v).toFixed(1)).join(' '));
    };
    if (still) {
      W.forEach((v, i) => setBar(i, v)); phase.textContent = 'RACE READY'; for (let i = 0; i < 40; i++) drawTrace();
      nodes[3].classList.add('hot'); webs.filter(w => w.dataset.k === '3').forEach(w => w.classList.add('hot'));
    } else {
      ins.forEach(p => { spawn(p); spawn(p); }); outs.forEach(p => spawn(p, true));
      if (lib) for (let q = 0; q < 3; q++) { const g = mk('g', {}), r = mk('rect', { x: -5, y: -6.5, width: 10, height: 13, rx: 1.5, class: 'ev-paper' }); g.append(r, mk('path', { d: 'M-2.5 -2h5M-2.5 1h5M-2.5 4h3', class: 'ev-paperl' })); layer.append(g); dots.push({ g, path: lib, len: lib.getTotalLength(), t: q / 3, v: 0.004 }); }
      dots.forEach(d => { d.t = Math.random(); });
      let on = false, last = 0, tick = 0, wk = 0, cycle = 1, li = 0, r = 81;
      const io = new IntersectionObserver(es => { on = es[0].isIntersecting; if (on) requestAnimationFrame(loop); }, { threshold: 0.05 });
      io.observe(ev);
      const loop = ts => {
        if (!on) return;
        for (const d of dots) {
          d.t += d.v; if (d.t > 1) { d.t = 0; const i = ins.indexOf(d.path); if (i > -1 && ios[i]) { ios[i].classList.add('hot'); setTimeout(() => ios[i].classList.remove('hot'), 300); } }
          const p = d.path.getPointAtLength(d.t * d.len); d.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
        }
        if (ts - last > 420) {
          last = ts; tick++;
          const k = tick % nodes.length; nodes[k].classList.add('hot');
          if (act) { const e = EVD[k], n = seen[k] = ((seen[k] || 0) + 1) % e[1].length, it = e[1][n]; act.textContent = 'ACTIVE · ' + String(k + 1).padStart(2, '0') + ' ' + e[0]; cite.textContent = it[0]; find.textContent = it[1]; }
          const hot = webs.filter(w => w.dataset.k === String(k)); hot.forEach(w => w.classList.add('hot'));
          setTimeout(() => { nodes[k].classList.remove('hot'); hot.forEach(w => w.classList.remove('hot')); }, 900);
          drawTrace();
          if (tick % 2 === 0) {
            if (wk < 16) { setBar(wk, W[wk]); phase.textContent = PH[wk]; wk++; }
            else if (wk < 22) { wk++; phase.textContent = 'RACE READY'; }
            else { wk = 0; bars.forEach((b, i) => { b.setAttribute('y', 110); b.setAttribute('height', 2); }); }
          }
          if (tick % 3 === 0) {
            cycle++; cyc.textContent = 'CYCLE ' + String(cycle).padStart(4, '0');
            r = Math.max(58, Math.min(92, r + Math.round((Math.random() - .5) * 8)));
            ready.textContent = r; band.textContent = r >= 80 ? 'PRIMED' : r >= 60 ? 'GOOD' : 'TAKE CARE';
            gval.setAttribute('stroke-dasharray', r + ' 100');
            mpb.textContent = '▲ ' + (1.38 + Math.random() * .06).toFixed(2);
          }
          if (tick % 7 === 0) { li = (li + 1) % LOG.length; log.textContent = LOG[li]; }
        }
        requestAnimationFrame(loop);
      };
    }
  }

})();

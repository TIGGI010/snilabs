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
    const items = $$('.cmdk-item', dlg);
    const empty = $('.cmdk-empty', dlg);
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
      items.forEach(i => { i.hidden = !!q && !(i.textContent + ' ' + (i.dataset.k || '')).toLowerCase().includes(q); });
      $$('.cmdk-sep', dlg).forEach(s => { s.hidden = !!q; });
      empty.hidden = visible().length > 0;
      setActive(0);
    };
    const run = el => {
      if (!el) return;
      const act = el.dataset.action, href = el.dataset.href;
      dlg.close();
      if (act === 'theme') toggleTheme(null);
      else if (act === 'copy-phone') copy(PHONE, 'Number copied');
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
    f.referrerPolicy = 'no-referrer-when-downgrade'; f.allowFullscreen = true;
    box.classList.add('live'); box.appendChild(f);
  }));

  /* ---------- the send form: fills itself from an estimate or app plan ---------- */
  const sendDlg = $('#sendform');
  const openSend = (text, title) => {
    if (!sendDlg) { location.href = WA + '?text=' + encodeURIComponent(text); return; }
    const msg = $('#sf-msg'), name = $('#sf-name'), biz = $('#sf-biz'), phone = $('#sf-phone'), email = $('#sf-email');
    $('#sf-title').firstChild.textContent = title;
    msg.value = text;
    const sync = () => {
      let head = 'Hi Startline Labs' + (name.value.trim() ? ", it's " + name.value.trim() : '') + (biz.value.trim() ? ' from ' + biz.value.trim() : '') + '.\n';
      const contact = [phone.value.trim() && 'Phone: ' + phone.value.trim(), email.value.trim() && 'Email: ' + email.value.trim()].filter(Boolean).join('\n');
      const body = head + (contact ? contact + '\n' : '') + '\n' + msg.value.replace(/^Hi Startline Labs,?\s*/, '');
      $('#sf-wa').href = WA + '?text=' + encodeURIComponent(body);
      $('#sf-mail').href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent((/app/.test(title) ? 'App plan' : 'Project estimate') + (biz.value.trim() ? ' for ' + biz.value.trim() : '')) + '&body=' + encodeURIComponent(body);
    };
    [msg, name, biz, phone, email].forEach(el => { el.oninput = sync; });
    sync();
    if (sendDlg.showModal) sendDlg.showModal(); else sendDlg.setAttribute('open', '');
    setTimeout(() => name.focus(), 50);
  };

  /* ---------- estimator ---------- */
  const est = $('#est');
  if (est) {
    const BOT_RUN = 450;
    const WEB = ['landing', 'starter', 'business', 'advanced', 'update'];
    const kindOf = b => WEB.includes(b) ? 'web' : (b === 'system' || b === 'mobile') ? 'app' : b;
    const P = n => ({ person: 'people', 'user type': 'user types' }[n] || n + 's');
    /* each build type has its own sliders: what they count, what is included, what each extra costs */
    const SIZE = {
      landing: { weeks: 1, legend: 'How long is the page?', r1: { label: 'Sections on the page', min: 3, max: 12, step: 1, value: 5, inc: 5, unit: 200, per: 1, noun: 'section' } },
      starter: { weeks: 1, legend: 'How many pages?', r1: { label: 'Pages', min: 1, max: 8, step: 1, value: 3, inc: 3, unit: 450, per: 1, noun: 'page' } },
      business: { weeks: 2, legend: 'How many pages?', r1: { label: 'Pages', min: 1, max: 15, step: 1, value: 6, inc: 8, unit: 450, per: 1, noun: 'page' } },
      advanced: { weeks: 4, legend: 'How many pages?', r1: { label: 'Pages', min: 10, max: 40, step: 1, value: 16, inc: 20, unit: 450, per: 1, noun: 'page' } },
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
      adds.forEach(cb => {
        if (cb.dataset.key === 'pay') {
          const tag = cb.closest('.switch').querySelector('.add');
          if (store) {
            if (!cb.disabled) cb.dataset.prev = cb.checked ? '1' : '';
            cb.checked = true; cb.disabled = true;
            if (tag) tag.textContent = 'Included';
          } else if (cb.disabled) {
            cb.disabled = false; cb.checked = cb.dataset.prev === '1';
            if (tag) tag.textContent = '+' + fmt(+cb.dataset.add);
          }
        }
        if (!cb.checked || cb.closest('.switch').hidden) return;
        picked.push(cb.dataset.label);
        if (cb.dataset.key === 'pay' && store) { lines.push([cb.dataset.label, 'Included']); return; }
        if (cb.dataset.key === 'bot') run += BOT_RUN;
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
    };

    /* put the estimator in a given state: used by ideas, shared links and the brief reader */
    const apply = s => {
      const r = $('input[name="base"][value="' + s.b + '"]', est);
      if (!r) return;
      r.checked = true;
      setBase(s.b, s);
      adds.forEach(cb => { if (!cb.closest('.switch').hidden && !cb.disabled) cb.checked = (s.a || []).includes(cb.dataset.key); });
      if (s.c != null) { const c = $('input[name="care"][value="' + s.c + '"]', est); if (c) c.checked = true; }
      render();
    };

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
      ['brand', /\b(logo|brand|branding)\b/],
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
      else if (has(/\b(online store|store|shop|webshop|e ?commerce|sell (products|online|my products|stock)|checkout|cart)\b/) || (has(/\b(sell|selling|sells)\b/) && has(/\bonline\b/)) || p.products) p.base = 'store';
      else if (has(/\b(mobile app|phone app|android|ios|iphone|play store|app store)\b/)) p.base = 'mobile';
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
      apply(Object.assign({ c: 0 }, shared));
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
    const show = () => pill.classList.toggle('show', formIn && !outIn);
    new IntersectionObserver(es => es.forEach(e => { if (e.target === form) formIn = e.isIntersecting; else outIn = e.isIntersecting; show(); }), { threshold: 0 })
      .observe(form);
    new IntersectionObserver(es => es.forEach(e => { outIn = e.isIntersecting; show(); }), { threshold: 0.25 }).observe(out);
    pill.addEventListener('click', () => out.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }));
  });

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
})();

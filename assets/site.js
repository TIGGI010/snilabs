/* Startline Labs: site behaviour. Everything degrades gracefully without it. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const root = document.documentElement;
  const mq = q => (window.matchMedia ? window.matchMedia(q) : { matches: false });
  const reduced = mq('(prefers-reduced-motion: reduce)').matches;
  const canHover = mq('(hover: hover)').matches;
  const PHONE = '076 610 8159';
  const WA = 'https://wa.me/27766108159';

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

  /* ---------- estimator ---------- */
  const est = $('#est');
  if (est) {
    const fmt = n => 'R' + Math.round(n).toLocaleString('en-US');
    const EXTRA_PAGE = 350, PER_10 = 180;
    const pages = $('#e-pages'), products = $('#e-products');
    const pagesOut = $('#e-pages-out'), prodOut = $('#e-products-out');
    const adds = $$('input[data-add]', est);
    const outTotal = $('#e-total'), outDep = $('#e-deposit'), outLines = $('#e-lines'), outMonthly = $('#e-monthly');
    const wa = $('#e-wa'), copyBtn = $('#e-copy'), careNote = $('#e-care-note');
    const fill = r => r.style.setProperty('--p', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    let shown = null, raf = 0, last = null;

    const compute = () => {
      const b = $('input[name="base"]:checked', est);
      let lo = +b.dataset.lo, hi = +b.dataset.hi;
      const inc = +b.dataset.inc, store = b.value === 'store';
      const lines = [[b.dataset.label, fmt(lo) + ' – ' + fmt(hi)]];
      const np = +pages.value, over = Math.max(0, np - inc);
      if (over) { const c = over * EXTRA_PAGE; lo += c; hi += c; lines.push([over + ' extra page' + (over > 1 ? 's' : ''), '+' + fmt(c)]); }
      const npr = +products.value;
      if (npr) { const c = Math.ceil(npr / 10) * PER_10; lo += c; hi += c; lines.push(['Loading ' + npr + ' products', '+' + fmt(c)]); }
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
        if (!cb.checked) return;
        picked.push(cb.dataset.label);
        if (cb.dataset.key === 'pay' && store) { lines.push([cb.dataset.label, 'Included']); return; }
        const a = +cb.dataset.add; lo += a; hi += a;
        lines.push([cb.dataset.label, '+' + fmt(a)]);
      });
      const c = $('input[name="care"]:checked', est);
      return { lo, hi, lines, picked, care: +c.value, careLabel: c.dataset.label, careNote: c.dataset.note, np, npr, base: b.dataset.label };
    };

    const brief = q => {
      let t = 'Hi Tiago, I used the estimator on your site.\n\n';
      t += 'Build: ' + q.base + '\nPages: ' + q.np + '\n';
      if (q.npr) t += 'Products to load: ' + q.npr + '\n';
      if (q.picked.length) t += 'Add-ons: ' + q.picked.join(', ') + '\n';
      t += 'Care plan: ' + q.careLabel + '\n\n';
      t += 'Estimate: ' + fmt(q.lo) + ' – ' + fmt(q.hi) + ' once-off';
      if (q.care) t += ', plus ' + fmt(q.care) + ' a month';
      t += '\n\nCould we set up a quick call?';
      return t;
    };

    const paint = (lo, hi) => {
      outTotal.textContent = Math.round(lo) === Math.round(hi) ? fmt(lo) : fmt(lo) + ' – ' + fmt(hi);
    };

    const render = () => {
      fill(pages); fill(products);
      pagesOut.textContent = pages.value;
      prodOut.textContent = products.value;
      const q = compute();
      last = q;
      if (!shown || reduced) { shown = { lo: q.lo, hi: q.hi }; paint(q.lo, q.hi); }
      else {
        const from = { lo: shown.lo, hi: shown.hi }, t0 = performance.now();
        cancelAnimationFrame(raf);
        const tick = now => {
          const k = Math.min(1, (now - t0) / 480), e = 1 - Math.pow(1 - k, 3);
          shown = { lo: from.lo + (q.lo - from.lo) * e, hi: from.hi + (q.hi - from.hi) * e };
          paint(shown.lo, shown.hi);
          if (k < 1) raf = requestAnimationFrame(tick); else shown = { lo: q.lo, hi: q.hi };
        };
        raf = requestAnimationFrame(tick);
      }
      outDep.textContent = fmt(q.lo / 2) + ' deposit to start';
      outMonthly.textContent = q.care ? fmt(q.care) + ' / month' : 'None';
      if (careNote) careNote.textContent = q.careNote || '';
      outLines.textContent = '';
      q.lines.forEach(([k, v]) => {
        const li = document.createElement('li');
        const a = document.createElement('span'); a.textContent = k;
        const b = document.createElement('b'); b.textContent = v;
        li.append(a, b);
        outLines.appendChild(li);
      });
      wa.href = WA + '?text=' + encodeURIComponent(brief(q));
    };

    est.addEventListener('input', render);
    est.addEventListener('change', render);
    est.addEventListener('submit', e => e.preventDefault());
    if (copyBtn) copyBtn.addEventListener('click', () => copy(brief(last || compute()), 'Brief copied'));
    render();
  }

  /* ---------- contact composer ---------- */
  const cf = $('#compose');
  if (cf) {
    const val = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
    const bubble = $('#c-bubble'), wa = $('#c-wa'), mail = $('#c-mail'), to = cf.dataset.email;
    const build = () => {
      const name = val('c-name'), biz = val('c-biz'), need = val('c-need') || 'a website', budget = val('c-budget'), msg = val('c-msg');
      let t = 'Hi Tiago' + (name ? ", it's " + name : '') + (biz ? ' from ' + biz : '') + '.\n';
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

(() => {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- header: solid on scroll + active nav ---------- */
  const header = $('.site-header');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 24);
  onScroll();
  addEventListener('scroll', onScroll, { passive: true });

  const burger = $('#burger');
  const nav = $('#nav');
  const closeNav = () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); };
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', String(open));
  });
  $$('a', nav).forEach((a) => a.addEventListener('click', closeNav));
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('open')) { closeNav(); burger.focus(); }
  });

  const navLinks = $$('.nav a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  $$('main section[id]').forEach((s) => spy.observe(s));

  /* ---------- reveal on scroll ---------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  $$('.rv, .draw, .sys-row, .map-wrap').forEach((el) => revealIO.observe(el));

  /* ---------- stats count-up ---------- */
  const fmt = (n) => n.toLocaleString('en-US').replace(/,/g, '\u202F');
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target;
      const to = +el.dataset.count;
      const suffix = el.dataset.suffix || '';
      if (reduce) { el.textContent = fmt(to) + suffix; return; }
      const t0 = performance.now();
      const dur = 1600;
      const step = (t) => {
        const p = Math.min((t - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(to * eased)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  $$('[data-count]').forEach((el) => countIO.observe(el));

  /* ---------- hero parallax ---------- */
  const heroImg = $('#heroImg');
  if (heroImg && !reduce) {
    let ticking = false;
    addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = Math.min(scrollY, innerHeight);
        heroImg.style.transform = `translate3d(0, ${y * 0.18}px, 0) scale(${1 + y * 0.00008})`;
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- product panels (accordion) ---------- */
  const panels = $$('.panel');
  const activate = (p) => {
    panels.forEach((x) => x.classList.toggle('is-active', x === p));
  };
  const canHover = matchMedia('(hover: hover) and (min-width: 961px)').matches;
  panels.forEach((p) => {
    if (canHover) p.addEventListener('mouseenter', () => activate(p));
    p.addEventListener('click', () => activate(p));
    p.addEventListener('focus', () => activate(p));
  });

  /* ---------- systems: fire class filter ---------- */
  const rows = $$('.sys-row');
  const list = $('#sysList');
  const result = $('#selResult');
  const chips = $$('.sel-chips .chip');
  const names = (arr) => arr.map((r) => $('h3', r).textContent);
  const applyClass = (min) => {
    list.classList.toggle('filtering', min > 0);
    const matched = [];
    rows.forEach((r) => {
      const ok = min === 0 || (+r.dataset.from <= min && min <= +r.dataset.to);
      r.classList.toggle('match', min > 0 && ok);
      r.classList.toggle('dimmed', min > 0 && !ok);
      $('.mark', r).style.setProperty('--m', (min / 180) * 100 + '%');
      if (ok) matched.push(r);
    });
    if (min === 0) {
      result.innerHTML = '<b>5 systems</b> available. Select a fire class to filter.';
    } else if (matched.length === 1) {
      result.innerHTML = `<b>EI${min}</b> — only <b>${names(matched)[0]}</b> covers this class. We’ll confirm the exact assembly for your project.`;
    } else {
      result.innerHTML = `<b>EI${min}</b> — covered by <b>${matched.length} systems</b>: ${names(matched).join(', ')}.`;
    }
  };
  chips.forEach((c) => c.addEventListener('click', () => {
    chips.forEach((x) => x.setAttribute('aria-pressed', String(x === c)));
    applyClass(+c.dataset.min);
  }));

  /* ---------- projects: hover preview ---------- */
  const projs = $$('.proj');
  const frame = $('.pv-frame');
  const imgA = $('#pvA');
  const imgB = $('#pvB');
  const cap = $('#pvCap');
  const num = $('#pvNum');
  let current = 0;
  const pad = (n) => String(n).padStart(2, '0');
  const preload = (src) => { const i = new Image(); i.src = src; };
  projs.forEach((p) => preload(p.dataset.img));

  let swapTimer = 0;
  const showProject = (i) => {
    if (i === current) return;
    current = i;
    const p = projs[i];
    projs.forEach((x) => x.classList.toggle('is-active', x === p));
    // rapid hovering: cancel the previous swap and always land on the latest project
    clearTimeout(swapTimer);
    imgB.src = p.dataset.img;
    frame.classList.add('swap');
    swapTimer = setTimeout(() => {
      imgA.src = projs[current].dataset.img;
      frame.classList.remove('swap');
    }, 620);
    cap.textContent = p.dataset.cap;
    num.textContent = `${pad(i + 1)} / ${pad(projs.length)}`;
  };
  projs.forEach((p, i) => {
    p.addEventListener('mouseenter', () => showProject(i));
    $('a', p).addEventListener('focus', () => showProject(i));
  });
  num.textContent = `01 / ${pad(projs.length)}`;

  /* ---------- map ---------- */
  const mapEl = $('#map');
  fetch('assets/europe.svg')
    .then((r) => r.text())
    .then((svg) => {
      mapEl.innerHTML = svg;
      const countryLis = $$('#countries li');
      const paths = $$('.map-svg .c', mapEl);
      const byName = (n) => paths.find((p) => p.dataset.name === n);
      countryLis.forEach((li) => {
        const p = byName(li.dataset.c);
        if (!p) return;
        const on = () => { p.classList.add('hot'); li.classList.add('hot'); };
        const off = () => { p.classList.remove('hot'); li.classList.remove('hot'); };
        li.addEventListener('mouseenter', on);
        li.addEventListener('mouseleave', off);
        p.addEventListener('mouseenter', on);
        p.addEventListener('mouseleave', off);
      });
    })
    .catch(() => { mapEl.innerHTML = '<p style="padding:24px;color:var(--muted)">Map unavailable.</p>'; });

  /* ---------- RFQ form -> mailto (no backend needed for the concept) ---------- */
  const form = $('#rfq');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const name = (fd.get('name') || '').toString().trim();
    const email = (fd.get('email') || '').toString().trim();
    let firstBad = null;
    [['name', name], ['email', /.+@.+\..+/.test(email) ? email : '']].forEach(([k, v]) => {
      const input = form.elements[k];
      input.classList.toggle('invalid', !v);
      input.setAttribute('aria-invalid', String(!v));
      input.setAttribute('aria-describedby', 'fnote');
      if (!v && !firstBad) firstBad = input;
    });
    if (firstBad) {
      $('#fnote').textContent = 'Please add your name and a valid email so we can reply.';
      firstBad.focus();
      return;
    }
    const types = fd.getAll('type').join(', ') || '—';
    const body = [
      `Name: ${name}`,
      `Company: ${fd.get('company') || '—'}`,
      `Email: ${email}`,
      `Phone: ${fd.get('phone') || '—'}`,
      `Needs: ${types}`,
      '',
      (fd.get('msg') || '').toString(),
      '',
      '(Drawings attached separately)'
    ].join('\n');
    location.href = `mailto:export@aldens.lv?subject=${encodeURIComponent('Quote request — ' + name)}&body=${encodeURIComponent(body)}`;
    $('#fnote').textContent = 'Opening your email app… attach drawings there.';
  });
  $$('input, textarea', form).forEach((el) => el.addEventListener('input', () => { el.classList.remove('invalid'); el.removeAttribute('aria-invalid'); }));

  $('#yr').textContent = new Date().getFullYear();
})();

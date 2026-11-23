{
  const d = document;
  const WA = d.body.dataset.wa;
  window.dataLayer = window.dataLayer || [];

  /* --- появление блоков при прокрутке (с задержкой по очереди) --- */
  d.querySelectorAll('[data-stagger]').forEach(g => {
    [...g.children].forEach((c, i) => { c.classList.add('rv'); c.style.setProperty('--d', (i % 6) * 0.08 + 's'); });
  });
  const revealObs = 'IntersectionObserver' in window ? new IntersectionObserver(es => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); revealObs.unobserve(e.target); }
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }) : null;
  d.querySelectorAll('.rv').forEach(el => revealObs ? revealObs.observe(el) : el.classList.add('in'));

  /* --- счётчики --- */
  const countObs = revealObs && new IntersectionObserver(es => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      const el = e.target, to = +el.dataset.to, t0 = performance.now(), dur = 1400;
      const tick = t => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(to * (1 - (1 - k) ** 3));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      countObs.unobserve(el);
    }
  }, { threshold: 0.6 });
  d.querySelectorAll('[data-to]').forEach(el => { if (countObs) { el.textContent = '0'; countObs.observe(el); } });

  /* --- шапка с тенью + труба в шагах заполняется водой --- */
  const top = d.querySelector('.top');
  const steps = d.querySelector('.steps');
  const items = steps ? [...steps.querySelectorAll('.step')] : [];
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    top && top.classList.toggle('scrolled', scrollY > 8);
    if (!steps) return;
    const r = steps.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.72 - r.top) / r.height));
    steps.style.setProperty('--p', p.toFixed(3));
    items.forEach((s, i) => s.classList.toggle('on', p > 0 && p >= i / (items.length - 1) - 0.02));
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* --- ползунок «до / после» + подсказка движением --- */
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  d.querySelectorAll('.ba').forEach(b => {
    const r = b.querySelector('input');
    const set = v => b.style.setProperty('--x', v + '%');
    let touched = false;
    r.addEventListener('input', () => { touched = true; set(r.value); });
    if (reduce || !revealObs) return;
    const hint = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return;
      hint.disconnect();
      const keys = [50, 28, 72, 50], t0 = performance.now(), seg = 550;
      const run = t => {
        if (touched) return;
        const k = (t - t0) / seg, i = Math.floor(k);
        if (i >= keys.length - 1) { set(50); return; }
        const f = k - i, e = f < .5 ? 2 * f * f : 1 - (-2 * f + 2) ** 2 / 2;
        set(keys[i] + (keys[i + 1] - keys[i]) * e);
        requestAnimationFrame(run);
      };
      setTimeout(() => requestAnimationFrame(run), 300);
    }, { threshold: 0.7 });
    hint.observe(b);
  });

  /* --- плавающие кнопки выезжают через 1 секунду --- */
  setTimeout(() => d.querySelectorAll('.fbar,.wa-float').forEach(e => e.classList.add('show')), 1000);

  /* --- пузырьки в блоке заявки --- */
  d.querySelectorAll('.bubbles').forEach(box => {
    let h = '';
    for (let i = 0; i < 14; i++) {
      const s = 8 + Math.random() * 26;
      h += `<i style="left:${Math.random() * 100}%;width:${s}px;height:${s}px;animation-duration:${9 + Math.random() * 10}s;animation-delay:${-Math.random() * 15}s"></i>`;
    }
    box.innerHTML = h;
  });

  /* --- события для Google Ads / GA4 --- */
  d.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a) return;
    const h = a.getAttribute('href') || '';
    const place = a.dataset.place || '';
    if (h.startsWith('tel:')) dataLayer.push({ event: 'call_click', place });
    else if (h.includes('wa.me')) dataLayer.push({ event: 'whatsapp_click', place });
  });

  /* --- форма → готовое сообщение в WhatsApp --- */
  const f = d.getElementById('lead');
  if (f) f.addEventListener('submit', e => {
    e.preventDefault();
    const v = n => (f.elements[n].value || '').trim();
    if (!v('phone')) { f.elements.phone.focus(); return; }
    const text = [
      'Здравствуйте! Нужен сантехник.',
      v('name') && 'Меня зовут ' + v('name') + '.',
      'Услуга: ' + v('service'),
      v('msg') && 'Проблема: ' + v('msg'),
      v('district') && 'Район: ' + v('district'),
      'Мой телефон: ' + v('phone')
    ].filter(Boolean).join('\n');
    const url = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
    dataLayer.push({ event: 'form_submit', service: v('service') });
    const ok = f.querySelector('.form-ok');
    ok.querySelector('a').href = url;
    ok.hidden = false;
    const w = window.open(url, '_blank');
    if (!w) location.href = url;
  });

  /* --- карточка шагов синхронно с видео в первом экране --- */
  const card = d.querySelector('.status');
  const vid = d.querySelector('.hero-video');
  if (card) {
    const T = card.querySelector('.st-t'), S = card.querySelector('.st-s');
    const use = card.querySelector('use'), dots = [...card.querySelectorAll('.st-dots i')];
    const stages = [
      { at: 0,   t: 'Система в норме',     s: 'вода идёт по стоякам',    ic: 'drop',   n: 0 },
      { at: 1.0, t: 'Протечка в квартире', s: 'клиент звонит мастеру',   ic: 'phone',  n: 1, st: 'alert' },
      { at: 2.6, t: 'Мастер выехал',       s: 'приезд за 30 минут',      ic: 'car',    n: 2, st: 'alert' },
      { at: 3.6, t: 'Осмотр на месте',     s: 'цена — до начала работ',  ic: 'search', n: 3, st: 'alert' },
      { at: 4.6, t: 'Ремонт',              s: 'устраняю протечку',       ic: 'wrench', n: 4, st: 'alert' },
      { at: 5.8, t: 'Готово · гарантия',   s: 'течи нет, всё проверено', ic: 'shield', n: 5, st: 'ok' },
      { at: 8.0, t: 'Система в норме',     s: 'вода идёт по стоякам',    ic: 'drop',   n: 0 },
    ];
    let cur = -1;
    const show = i => {
      if (i === cur) return;
      cur = i;
      const g = stages[i];
      card.classList.add('swap');
      setTimeout(() => {
        T.textContent = g.t; S.textContent = g.s;
        use.setAttribute('href', '#i-' + g.ic);
        card.classList.toggle('alert', g.st === 'alert');
        card.classList.toggle('ok', g.st === 'ok');
        dots.forEach((x, k) => x.classList.toggle('on', k < g.n));
        card.classList.remove('swap');
      }, 200);
    };
    const at = t => { let i = 0; stages.forEach((g, k) => { if (t >= g.at) i = k; }); return i; };
    if (vid) {
      if (reduce) { vid.removeAttribute('autoplay'); vid.pause(); show(5); }
      else {
        const sync = () => { show(at(vid.currentTime)); requestAnimationFrame(sync); };
        requestAnimationFrame(sync);
        const p = vid.play(); if (p && p.catch) p.catch(() => show(5));
      }
    } else {
      show(0);
    }
  }
}

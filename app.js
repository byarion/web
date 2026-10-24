(function () {
  const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
  const base = lang === 'en' ? '../' : '';
  const T = {
    es: { loading: 'Cargando…', none: 'Aún no hay noticias.', updated: 'Actualizado', total: 'Al final tendrías', contrib: 'Aportado por ti', gain: 'Intereses ganados', locale: 'es-ES' },
    en: { loading: 'Loading…', none: 'No news yet.', updated: 'Updated', total: 'You would end up with', contrib: 'Contributed by you', gain: 'Interest earned', locale: 'en-GB' }
  }[lang];

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const getJSON = url => fetch(url, { cache: 'no-cache' }).then(r => r.json());

  // Noticias
  const newsEl = document.getElementById('news-list');
  if (newsEl) {
    getJSON(base + 'data/news.json').then(d => {
      const items = (d.items || []).filter(i => i.lang === lang).slice(0, 12);
      newsEl.innerHTML = items.length ? items.map(i =>
        '<li>' +
        (i.image ? '<a class="thumb" href="' + esc(i.link) + '" target="_blank" rel="noopener nofollow" tabindex="-1" aria-hidden="true">' +
          '<img src="' + esc(i.image) + '" alt="" loading="lazy" referrerpolicy="no-referrer"></a>' : '') +
        '<div class="body"><a href="' + esc(i.link) + '" target="_blank" rel="noopener nofollow">' + esc(i.title) + '</a>' +
        '<div class="meta">' + esc(i.source) + ' · ' + new Date(i.date).toLocaleDateString(T.locale) + '</div></div></li>'
      ).join('') : '<li>' + T.none + '</li>';
      // Si una imagen no carga, se quita para que no quede un hueco roto
      newsEl.querySelectorAll('.thumb img').forEach(im => im.addEventListener('error', () => im.parentNode.remove()));
      const u = document.getElementById('updated');
      if (u && d.updated) u.textContent = T.updated + ': ' + new Date(d.updated).toLocaleString(T.locale);
    }).catch(() => { newsEl.innerHTML = '<li>' + T.none + '</li>'; });
  }

  // Mercados: cinta que se desplaza de derecha a izquierda, un valor tras otro
  const mEl = document.getElementById('markets');
  if (mEl) {
    getJSON(base + 'data/markets.json').then(d => {
      const items = d.items || [];
      if (!items.length) { mEl.innerHTML = ''; return; }
      const one = items.map(m => {
        const ch = m.change;
        const price = Number(m.price);
        const dec = Math.abs(price) < 10 ? 4 : 2;
        const name = lang === 'en' && m.name_en ? m.name_en : m.name;
        const chg = (ch === null || ch === undefined) ? '' :
          '<span class="tk-chg ' + (ch >= 0 ? 'up' : 'down') + '">' + (ch >= 0 ? '▲' : '▼') + ' ' + Math.abs(ch).toFixed(2) + '%</span>';
        return '<span class="tk"><span class="tk-name">' + esc(name) + '</span><span class="tk-val">' +
          price.toLocaleString(T.locale, { minimumFractionDigits: dec === 4 ? 4 : 0, maximumFractionDigits: dec }) + '</span>' + chg + '</span>';
      }).join('');
      mEl.style.setProperty('--dur', Math.max(40, items.length * 6) + 's');
      mEl.innerHTML = '<div class="track"><div class="seg">' + one + '</div><div class="seg" aria-hidden="true">' + one + '</div></div>';
      if (!mEl.nextElementSibling || !mEl.nextElementSibling.classList.contains('tk-toggle')) {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'tk-toggle';
        const lbl = { es: ['Pausar', 'Reanudar'], en: ['Pause', 'Resume'] }[lang];
        btn.textContent = '⏸ ' + lbl[0];
        btn.addEventListener('click', () => {
          const p = mEl.classList.toggle('paused');
          btn.textContent = (p ? '▶ ' + lbl[1] : '⏸ ' + lbl[0]);
          btn.setAttribute('aria-pressed', p ? 'true' : 'false');
        });
        mEl.insertAdjacentElement('afterend', btn);
      }
    }).catch(() => { mEl.innerHTML = ''; });
  }

  // Calculadora de ahorro
  const form = document.getElementById('calc');
  if (form) {
    const run = () => {
      const ini = parseFloat(form.ini.value) || 0;
      const mon = parseFloat(form.mon.value) || 0;
      const rate = (parseFloat(form.rate.value) || 0) / 100 / 12;
      const months = Math.round((parseFloat(form.years.value) || 0) * 12);
      let bal = ini;
      for (let i = 0; i < months; i++) bal = bal * (1 + rate) + mon;
      const put = ini + mon * months;
      const f = n => n.toLocaleString(T.locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
      document.getElementById('result').innerHTML =
        T.total + ': <b>' + f(bal) + '</b><br><span class="note">' + T.contrib + ': ' + f(put) + ' · ' + T.gain + ': ' + f(bal - put) + '</span>';
    };
    form.addEventListener('submit', e => { e.preventDefault(); run(); });
    run();
  }
})();

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
        '<li><a href="' + esc(i.link) + '" target="_blank" rel="noopener nofollow">' + esc(i.title) + '</a>' +
        '<div class="meta">' + esc(i.source) + ' · ' + new Date(i.date).toLocaleDateString(T.locale) + '</div></li>'
      ).join('') : '<li>' + T.none + '</li>';
      const u = document.getElementById('updated');
      if (u && d.updated) u.textContent = T.updated + ': ' + new Date(d.updated).toLocaleString(T.locale);
    }).catch(() => { newsEl.innerHTML = '<li>' + T.none + '</li>'; });
  }

  // Mercados
  const mEl = document.getElementById('markets');
  if (mEl) {
    getJSON(base + 'data/markets.json').then(d => {
      mEl.innerHTML = (d.items || []).map(m => {
        const ch = m.change;
        const cls = ch >= 0 ? 'up' : 'down';
        const arrow = ch >= 0 ? '▲' : '▼';
        return '<div class="card market"><div class="name">' + esc(m.name) + '</div><div class="val">' +
          Number(m.price).toLocaleString(T.locale, { maximumFractionDigits: 2 }) + '</div>' +
          (ch === null || ch === undefined ? '' : '<div class="' + cls + '">' + arrow + ' ' + Math.abs(ch).toFixed(2) + '%</div>') + '</div>';
      }).join('');
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

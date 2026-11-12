(() => {
  const $ = (id) => document.getElementById(id);
  const pad = (n) => String(n).padStart(2, '0');
  const clock = (s) => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;
  const video = $('video'), bg = $('bgVideo'), body = document.body;
  const allPhotos = (window.SITE?.photo || []).flatMap((s) => s.items.map((it, k) => ({
    ...it, section: s.section, id: s.id, name: s.title, where: s.place, year: s.year, first: k === 0,
  })));
  let photos = [];

  /* dil: tr / en / es. Site İngilizce açılır; ziyaretçinin seçtiği dil tarayıcıda saklanır. */
  const LANGS = Object.keys(window.I18N);
  let lang = 'tr', routeName = '';
  const T = (k) => window.I18N[lang][k] ?? window.I18N.tr[k] ?? k;
  const seriesName = (p) => window.I18N[lang].series[p.id] || p.name;
  const placeOf = (p) => [window.I18N[lang].places[p.where] || p.where, p.year].filter(Boolean).join(', ');
  const setTitle = () => {
    const key = { fotograf: 'photo', hakkinda: 'about', iletisim: 'contact' }[routeName];
    document.title = (key ? T(key) + ' — ' : '') + 'Alper İşmen';
  };
  function applyLang(l, save) {
    lang = LANGS.includes(l) ? l : 'en';
    if (save) { try { localStorage.setItem('lang', lang); } catch (e) { /* saklanamadıysa sorun değil */ } }
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.innerHTML = T(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-aria]').forEach((el) => el.setAttribute('aria-label', T(el.dataset.i18nAria)));
    document.querySelector('meta[name=description]').content = T('desc');
    document.querySelectorAll('#lang button').forEach((b) => {
      b.classList.toggle('on', b.dataset.lang === lang);
      b.setAttribute('aria-pressed', String(b.dataset.lang === lang));
    });
    $('btnSound').textContent = T(video.muted ? 'unmute' : 'mute');
    $('btnPlay').textContent = T(video.paused ? 'play' : 'pause');
    caption();
    setTitle();
    placeTabs();
  }
  function caption() {
    const p = photos[G.i];
    if (!p) return;
    $('gTitle').textContent = seriesName(p);
    $('gPlace').textContent = placeOf(p);
    document.querySelector('.g-img.on')?.setAttribute('alt', `${seriesName(p)} ${G.i + 1}`);
  }
  $('lang').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) applyLang(b.dataset.lang, true); });

  /* film greni: yalnızca arka planın üstünde; 256 piksellik desen saniyede ~12 kez kaydırılır */
  (() => {
    const grain = document.querySelector('.grain');
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d'), im = ctx.createImageData(256, 256);
    for (let i = 0; i < im.data.length; i += 4) {
      const v = Math.random() < 0.5 ? 0 : 255;
      im.data[i] = im.data[i + 1] = im.data[i + 2] = v;
      im.data[i + 3] = Math.random() * 17;
    }
    ctx.putImageData(im, 0, 0);
    grain.style.backgroundImage = `url(${c.toDataURL()})`;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setInterval(() => {
      if (document.hidden) return;
      grain.style.backgroundPosition = `${(Math.random() * 256) | 0}px ${(Math.random() * 256) | 0}px`;
    }, 84);
  })();

  /* showreel: çerçevedeki video ile arkadaki kopya birlikte yürür */
  const syncBg = (force) => {
    if (force || Math.abs(bg.currentTime - video.currentTime) > 0.35) {
      try { bg.currentTime = video.currentTime; } catch (e) { /* henüz hazır değil */ }
    }
  };
  video.addEventListener('play', () => { bg.play().catch(() => {}); $('btnPlay').textContent = T('pause'); });
  video.addEventListener('pause', () => { bg.pause(); $('btnPlay').textContent = T('play'); });
  video.addEventListener('seeked', () => syncBg(true));
  const onMeta = () => {
    const d = video.duration;
    if (!d) return;
    $('tDur').textContent = clock(d);
    $('tAll').textContent = `${pad(Math.floor(d / 60))}′ ${pad(Math.floor(d % 60))}″`;
  };
  video.addEventListener('loadedmetadata', onMeta);
  video.addEventListener('durationchange', onMeta);
  onMeta();
  video.addEventListener('timeupdate', () => {
    const p = video.duration ? video.currentTime / video.duration : 0;
    $('railFill').style.height = p * 100 + '%';
    $('progressFill').style.width = p * 100 + '%';
    $('progress').setAttribute('aria-valuenow', Math.round(p * 100));
    $('tNow').textContent = clock(video.currentTime);
    syncBg(false);
  });

  const setSound = (on) => {
    video.muted = !on;
    $('btnSound').textContent = T(on ? 'mute' : 'unmute');
  };
  const openPlayer = () => { body.classList.add('play'); setSound(true); video.play().catch(() => {}); };
  const closePlayer = () => { body.classList.remove('play'); setSound(false); video.play().catch(() => {}); };
  const togglePlay = () => { video.paused ? video.play() : video.pause(); };
  /* Showreel'e tıklayınca: tam ekran, sesli, baştan; tam ekrandan çıkınca çerçevede sessiz döngüye döner */
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  const leaveFull = () => { video.controls = false; setSound(false); video.play().catch(() => {}); };
  const openFull = () => {
    video.currentTime = 0;
    setSound(true);
    video.controls = true;
    video.play().catch(() => {});
    const req = video.requestFullscreen || video.webkitRequestFullscreen;
    const fallback = () => { if (!fsEl() && !body.classList.contains('play')) { video.controls = false; openPlayer(); } };
    if (req) {
      // bazı gömülü tarayıcılarda istek ne kabul ne ret olur: 1 sn içinde açılmazsa sayfada büyüt
      setTimeout(fallback, 1000);
      return Promise.resolve(req.call(video)).catch(fallback);
    }
    if (video.webkitEnterFullscreen) return video.webkitEnterFullscreen(); // iPhone Safari
    video.controls = false;
    openPlayer();
  };
  document.addEventListener('fullscreenchange', () => { if (!fsEl()) leaveFull(); });
  document.addEventListener('webkitfullscreenchange', () => { if (!fsEl()) leaveFull(); });
  video.addEventListener('webkitendfullscreen', leaveFull);
  $('frame').addEventListener('click', () => {
    if (fsEl()) return;
    body.classList.contains('play') ? togglePlay() : openFull();
  });
  $('frame').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('frame').click(); });
  $('btnSound').addEventListener('click', () => setSound(video.muted));
  $('btnPlay').addEventListener('click', togglePlay);
  $('btnClose').addEventListener('click', closePlayer);
  $('progress').addEventListener('click', (e) => {
    const r = $('progress').getBoundingClientRect();
    if (video.duration) video.currentTime = ((e.clientX - r.left) / r.width) * video.duration;
  });
  $('progress').addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') video.currentTime += 5;
    if (e.key === 'ArrowLeft') video.currentTime -= 5;
  });

  /* fotoğraf: tek kare, ekrana sığar; arkada aynı karenin odak dışı hali */
  const G = { i: -1, layer: 0, bgLayer: 0, lock: 0, built: null };
  const gImgs = [...document.querySelectorAll('.g-img')];
  const gBgs = [...document.querySelectorAll('.bg-photo')];
  const ticks = $('gTicks');

  function buildGallery(section) {
    document.querySelectorAll('.g-tabs a').forEach((el) => el.classList.toggle('on', el.dataset.sec === section));
    if (G.built === section) return;
    G.built = section;
    G.i = -1;
    photos = allPhotos.filter((p) => p.section === section);
    ticks.innerHTML = '';
    photos.forEach((p, n) => {
      const t = document.createElement('i');
      if (p.first && n > 0) t.className = 'gap';
      t.dataset.n = n;
      ticks.appendChild(t);
    });
    $('gAll').textContent = pad(photos.length);
    ticks.setAttribute('aria-valuemax', photos.length);
    show(0);
  }

  function show(n) {
    const len = photos.length;
    n = ((n % len) + len) % len;
    if (n === G.i) return;
    G.i = n;
    const p = photos[n], src = p.f + '_l.jpg';
    const next = gImgs[(G.layer = 1 - G.layer)], prev = gImgs[1 - G.layer];
    const swap = () => { next.classList.add('on'); prev.classList.remove('on'); placeTabs(); };
    next.onload = null;
    next.alt = `${seriesName(p)} ${n + 1}`;
    next.src = src;
    if (next.complete && next.naturalWidth) swap(); else next.onload = swap;

    const nb = gBgs[(G.bgLayer = 1 - G.bgLayer)];
    nb.style.backgroundImage = `url("${p.f}_m.jpg")`;
    nb.classList.add('on');
    gBgs[1 - G.bgLayer].classList.remove('on');

    placeTabs();
    $('gNow').textContent = pad(n + 1);
    $('gTitle').textContent = seriesName(p);
    $('gPlace').textContent = placeOf(p);
    ticks.setAttribute('aria-valuenow', n + 1);
    [...ticks.children].forEach((t, k) => t.classList.toggle('on', k === n));
    [1, -1].forEach((d) => { new Image().src = photos[(((n + d) % len) + len) % len].f + '_l.jpg'; });
  }
  const stepPhoto = (d) => show(G.i + d);

  /* Editorial / Documentary yazılarını açık fotoğrafın sol üst köşesine hizalar */
  function placeTabs() {
    const p = photos[G.i], tabs = document.querySelector('.g-tabs');
    if (!p || $('gallery').hidden) return;
    const s = $('gStage').getBoundingClientRect(), im = gImgs[G.layer];
    const loaded = im.complete && im.naturalWidth && im.src.includes(p.f);
    const ratio = loaded ? im.naturalWidth / im.naturalHeight : p.w / p.h;
    // her kare kaynak boyutundan bağımsız olarak sahneye aynı ölçüde sığar
    const w = Math.min(s.width, s.height * ratio), h = w / ratio;
    im.style.width = Math.round(w) + 'px';
    im.style.height = Math.round(h) + 'px';
    const gap = Math.max(16, Math.round(tabs.offsetHeight * 1.1));
    tabs.style.left = Math.round(s.left + (s.width - w) / 2) + 'px';
    tabs.style.top = Math.round(s.top + (s.height - h) / 2 - tabs.offsetHeight - gap) + 'px';
  }
  addEventListener('resize', placeTabs);

  $('gStage').addEventListener('mousemove', (e) => {
    const r = $('gStage').getBoundingClientRect();
    $('gStage').classList.toggle('left', e.clientX < r.left + r.width / 2);
  });
  $('gStage').addEventListener('click', (e) => {
    const r = $('gStage').getBoundingClientRect();
    stepPhoto(e.clientX < r.left + r.width / 2 ? -1 : 1);
  });
  $('gallery').addEventListener('wheel', (e) => {
    const d = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (Math.abs(d) < 12) return;
    const now = Date.now();
    if (now < G.lock) return;
    G.lock = now + 420;
    stepPhoto(d > 0 ? 1 : -1);
  }, { passive: true });
  let tx = null;
  $('gallery').addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  $('gallery').addEventListener('touchend', (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) stepPhoto(dx < 0 ? 1 : -1);
    tx = null;
  }, { passive: true });
  const tickAt = (e) => {
    const r = ticks.getBoundingClientRect();
    return Math.max(0, Math.min(photos.length - 1, Math.floor(((e.clientX - r.left) / r.width) * photos.length)));
  };
  ticks.addEventListener('click', (e) => show(tickAt(e)));
  ticks.addEventListener('mousemove', (e) => {
    const n = tickAt(e), peek = $('gPeek');
    const want = photos[n].f + '_m.jpg';
    if (peek.dataset.src !== want) { peek.dataset.src = want; peek.src = want; }
    peek.style.left = Math.max(80, Math.min(innerWidth - 80, e.clientX)) + 'px';
    peek.classList.add('on');
  });
  ticks.addEventListener('mouseleave', () => $('gPeek').classList.remove('on'));

  /* yönlendirme */
  const TITLES = { '': '', fotograf: 'Fotoğraf — ', hakkinda: 'Hakkında — ', iletisim: 'İletişim — ' };
  function route() {
    let [a = '', sec] = location.hash.replace(/^#\/?/, '').split('/');
    if (!(a in TITLES)) a = '';
    if (sec !== 'documentary') sec = 'editorial';
    if (a !== '' && body.classList.contains('play')) { body.classList.remove('play'); setSound(false); }
    $('gallery').hidden = a !== 'fotograf';
    $('about').hidden = a !== 'hakkinda';
    $('contact').hidden = a !== 'iletisim';
    body.classList.toggle('sub', a !== '');
    body.classList.toggle('photo', a === 'fotograf');
    document.querySelectorAll('.nav a').forEach((el) => el.classList.toggle('on', el.dataset.nav === a));
    routeName = a;
    setTitle();
    if (a === 'fotograf') { buildGallery(sec); placeTabs(); video.pause(); }
    else video.play().catch(() => {});
  }
  addEventListener('hashchange', route);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (body.classList.contains('play')) closePlayer();
      else if (body.classList.contains('sub')) location.hash = '#/';
    }
    if (body.classList.contains('play') && e.key === ' ') { e.preventDefault(); togglePlay(); }
    if (!$('gallery').hidden) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') stepPhoto(1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') stepPhoto(-1);
    }
  });
  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) { /* özel pencere vb. */ }
  setSound(false);
  applyLang(saved || 'en', false);
  route();
})();

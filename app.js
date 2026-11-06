import * as DB from './data.js';
import { t, getLang, setLang, applyDir, hasLangPref, pick } from './i18n.js';
import { $, $$, esc, ms, fmtDate, safeUrl, img, hydrateImages, toast, startTicker, tickNow, cdBig, cdInline, debounce, ICON } from './util.js';

const THEMES = ['gold', 'crimson', 'light'];
const SKIN_TYPES = ['clothes', 'weapons', 'characters', 'backpacks', 'parachutes', 'accessories', 'vehicles', 'other'];
const METHODS = ['official_events', 'missions', 'rewards', 'login', 'game_events', 'seasonal', 'other'];
const NEWS_CATS = ['updates', 'events', 'announcements', 'maintenance', 'servers', 'general'];
const LEAK_CATS = ['skins', 'events', 'royalepass', 'updates', 'future'];
const KINDS = ['developer', 'publisher', 'creator', 'community'];
const COL_OF = { skin: 'skins', news: 'news', leak: 'leaks', event: 'events' };

const S = {
  server: 'MENA', servers: [{ id: 'MENA', name: 'MENA' }], settings: {}, theme: 'gold',
  notifs: [], soon: [], firstSnap: true,
  skinF: { q: '', type: '', av: '', sort: 'new' }, newsCat: '', leakCat: '', leakConf: '', devKind: '',
  cal: { y: new Date().getFullYear(), m: new Date().getMonth(), day: null }, eventsData: [], pastOpen: false
};
const store = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { /* storage blocked */ } return null; };

/* ============ helpers ============ */
const inServer = (it) => !it.server || it.server === 'GLOBAL' || it.server === S.server;
const nm = (o) => pick(o, 'name') || pick(o, 'title');
const trunc = (s, n) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
function derivedAv(s) {
  if (s.availability === 'unconfirmed') return 'unconfirmed';
  const now = Date.now();
  if (s.endsAt && ms(s.endsAt) < now) return 'ended';
  if (s.startsAt && ms(s.startsAt) > now) return 'soon';
  return s.availability || 'unconfirmed';
}
const state = (msg, retry) => `<div class="state"><p>${esc(msg)}</p>${retry ? `<button class="btn" data-act="retry">${esc(t('retry'))}</button>` : ''}</div>`;
const errBox = (e) => `<div class="state err"><p>${esc(t('error_load'))}</p><p class="muted">${esc(t('perm_hint'))}</p><p class="muted tiny" dir="ltr">${esc(e && (e.code || e.message) || '')}</p><button class="btn" data-act="retry">${esc(t('retry'))}</button></div>`;
const loader = () => `<div class="state"><div class="spin"></div><p class="muted">${esc(t('loading'))}</p></div>`;
const sourceLink = (o) => { const u = safeUrl(o.sourceUrl); const n = esc(o.sourceName || (u ? new URL(u).hostname : t('source_none'))); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer nofollow">${n} ${ICON.link}</a>` : n; };
const counts = (type, id) => `<span class="cnt" data-cnt="${type}:${id}"><span>${ICON.heart}<i data-l>·</i></span><span>${ICON.chat}<i data-c>·</i></span></span>`;
function hydrateCounts(root) {
  $$('[data-cnt]', root).forEach((el) => {
    const [type, id] = el.dataset.cnt.split(':'); delete el.dataset.cnt;
    DB.countLikes(type, id).then((n) => { el.querySelector('[data-l]').textContent = n; });
    DB.countComments(type, id).then((n) => { el.querySelector('[data-c]').textContent = n; });
  });
}
const sec = (title, link, inner) => `<section class="sec"><div class="sec-h"><h2>${esc(title)}</h2>${link ? `<a class="more" href="${link}">${esc(t('viewAll'))}</a>` : ''}</div>${inner}</section>`;
const grid = (inner, cls = '') => `<div class="grid ${cls}">${inner}</div>`;
const chip = (act, val, label, on) => `<button class="chip${on ? ' on' : ''}" data-act="${act}" data-v="${esc(val)}">${esc(label)}</button>`;

/* ============ cards ============ */
function skinCard(s) {
  const av = derivedAv(s);
  return `<article class="card skin" tabindex="0" role="button" data-open="skin:${s.id}">
    <div class="thumb">${img(s.imageUrl, nm(s))}<span class="badge av-${av}">${esc(t('av_' + av))}</span></div>
    <div class="card-b"><h3>${esc(nm(s))}</h3><p class="meta">${esc(t('type_' + (s.type || 'other')))} · ${esc(s.server || '')}</p>
    <p class="muted clamp">${esc(trunc(pick(s, 'desc'), 110))}</p><div class="foot">${counts('skin', s.id)}<span class="tiny muted">${esc(fmtDate(s.updatedAt || s.createdAt))}</span></div></div></article>`;
}
function newsCard(n) {
  return `<article class="card news" tabindex="0" role="button" data-open="news:${n.id}">
    <div class="thumb">${img(n.imageUrl, pick(n, 'title'))}${n.pinned ? `<span class="badge pin">📌 ${esc(t('pinned'))}</span>` : ''}</div>
    <div class="card-b"><p class="meta"><span class="tag">${esc(t('cat_' + (n.category || 'general')))}</span> ${esc(fmtDate(n.publishedAt || n.createdAt))}</p>
    <h3>${esc(pick(n, 'title'))}</h3><p class="muted clamp">${esc(trunc(pick(n, 'body'), 120))}</p><div class="foot">${counts('news', n.id)}</div></div></article>`;
}
function confOf(l) { return l.confidence === 'official' && l.sourceType !== 'official' ? 'expected' : (l.confidence || 'unconfirmed'); }
function leakCard(l) {
  const c = confOf(l);
  return `<article class="card leak" tabindex="0" role="button" data-open="leak:${l.id}">
    <div class="thumb">${img(l.imageUrl, pick(l, 'title'))}<span class="badge conf-${c}">${esc(t('conf_' + c))}</span></div>
    <div class="card-b"><p class="meta"><span class="tag">${esc(t('lcat_' + (l.category || 'future')))}</span> ${esc(l.server || '')}</p>
    <h3>${esc(pick(l, 'title'))}</h3><p class="muted clamp">${esc(trunc(pick(l, 'details'), 110))}</p>
    <p class="tiny muted">${esc(t('expected_date'))}: ${esc(fmtDate(l.expectedAt))}</p></div></article>`;
}
function eventStatus(e) { const now = Date.now(); if (ms(e.endsAt) && ms(e.endsAt) < now) return 'ended'; if (ms(e.startsAt) > now) return 'upcoming'; return 'ongoing'; }
function eventCard(e) {
  const st = eventStatus(e);
  const cd = st === 'upcoming' ? `${esc(t('starts_in'))} ${cdInline(ms(e.startsAt))}` : st === 'ongoing' ? `<b class="ok">${esc(t('ongoing'))}</b> · ${esc(t('ends_in'))} ${cdInline(ms(e.endsAt))}` : esc(t('event_ended'));
  return `<article class="card event" tabindex="0" role="button" data-open="event:${e.id}">
    <div class="thumb">${img(e.imageUrl, pick(e, 'title'))}</div>
    <div class="card-b"><p class="meta">${esc(e.server || '')} · ${esc(fmtDate(e.startsAt))} → ${esc(fmtDate(e.endsAt))}</p><h3>${esc(pick(e, 'title'))}</h3>
    <p class="muted clamp">${esc(trunc(pick(e, 'desc'), 100))}</p><p class="cd-line">${cd}</p></div></article>`;
}
function devCard(d) {
  return `<a class="card dev" href="#/developer/${d.id}">
    <div class="thumb sq">${img(d.imageUrl, d.name)}</div>
    <div class="card-b"><span class="tag">${esc(t('kind_' + (d.kind || 'developer')))}</span><h3>${esc(d.name)}</h3><p class="muted clamp">${esc(pick(d, 'role'))}</p></div></a>`;
}

/* ============ shell ============ */
function renderShell() {
  const links = [['/', 'home'], ['/skins', 'skins'], ['/methods', 'methods'], ['/news', 'news'], ['/leaks', 'leaks'], ['/events', 'events'], ['/developers', 'developers']];
  const cur = location.hash.slice(1).split('?')[0] || '/';
  const nav = links.map(([h, k]) => `<a href="#${h}" ${(h === '/' ? cur === '/' : cur.startsWith(h)) ? 'aria-current="page"' : ''}>${esc(t(k))}</a>`).join('');
  const lang = getLang();
  $('#shell').innerHTML = `
  ${S.settings.siteNote ? `<div class="note-bar">${esc(S.settings.siteNote)}</div>` : ''}
  <header class="hdr"><div class="wrap hdr-in">
    <a class="brand" href="#/" aria-label="FREE FIRE LAB"><img src="assets/img/logo.png" alt="" width="44" height="44"><span class="wm"><b>FREE FIRE</b><i>LAB</i></span></a>
    <nav class="nav" id="nav" aria-label="main">${nav}</nav>
    <div class="ctl">
      <select id="srv" aria-label="${esc(t('server'))}">${S.servers.map((s) => `<option value="${esc(s.id)}" ${s.id === S.server ? 'selected' : ''}>${esc(s.name || s.id)}</option>`).join('')}</select>
      <button class="ib" data-act="lang" aria-label="${esc(t('language'))}">${lang === 'ar' ? 'FR' : 'عربي'}</button>
      <button class="ib" data-act="theme" aria-label="${esc(t('theme'))}" title="${esc(t('theme_' + S.theme))}">${ICON.theme}</button>
      <button class="ib bell" data-act="bell" aria-label="${esc(t('notifications'))}">${ICON.bell}<span class="dot" id="bellDot" hidden></span></button>
      <button class="ib burger" data-act="menu" aria-label="${esc(t('menu'))}">${ICON.menu}</button>
    </div></div>
    <div id="bellPanel" class="panel" hidden></div>
  </header>
  <main id="view" class="wrap"></main>
  <footer class="ftr"><div class="wrap"><p>${esc(t('disclaimer'))}</p><p class="tiny"><a href="#/seasons">${esc(t('seasons'))}</a> · <a href="#/admin">${esc(t('admin'))}</a></p></div></footer>`;
  $('#srv').addEventListener('change', (e) => { S.server = e.target.value; store('ffl_server', S.server); S.skinF = { q: '', type: '', av: '', sort: 'new' }; refreshAll(); });
  refreshBell();
}
function refreshAll() { renderShell(); route(); }
function applyTheme() { document.documentElement.dataset.theme = S.theme; const m = $('meta[name=theme-color]'); if (m) m.content = S.theme === 'light' ? '#f6f1e3' : '#0a0a0b'; }

/* ============ views ============ */
let routeToken = 0;
const view = () => $('#view');
async function setView(html, after) { view().innerHTML = html; hydrateImages(view(), DB.getImageData); hydrateCounts(view()); startTicker(); tickNow(); after && after(); }
const safe = (p, bag) => p.catch((e) => { bag.err = e; return []; });

async function viewHome() {
  const bag = {};
  const [news, leaks, skins, events, devs, seasons] = await Promise.all([
    safe(DB.published('news'), bag), safe(DB.published('leaks'), bag), safe(DB.published('skins'), bag),
    safe(DB.published('events'), bag), safe(DB.published('developers'), bag), safe(DB.getSeasons(), bag)]);
  const season = seasons.find((s) => s.isActive) || null;
  const seasonHtml = season
    ? `<div class="season"><div class="season-h"><span class="tag">${esc(t('season_word'))} ${esc(season.number ?? '')}</span><h2>${esc(season.name || '')}</h2><p class="muted">${esc(t('ends_on'))} ${esc(fmtDate(season.endsAt, true))}</p></div>${cdBig(ms(season.endsAt))}</div>`
    : `<div class="season"><div class="season-h"><h2>${esc(t('sec_season'))}</h2><p class="muted">${esc(t('season_none'))}</p></div></div>`;
  const nw = news.filter(inServer).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || ms(b.publishedAt || b.createdAt) - ms(a.publishedAt || a.createdAt)).slice(0, 3);
  const lk = leaks.filter(inServer).slice(0, 3);
  const sk = skins.filter(inServer).filter((s) => derivedAv(s) !== 'ended').slice(0, 4);
  const ev = events.filter(inServer).filter((e) => eventStatus(e) !== 'ended').sort((a, b) => ms(a.startsAt) - ms(b.startsAt)).slice(0, 3);
  const dv = devs.filter(inServer).slice(0, 4);
  const quick = [['/skins', 'skins', 'q_skins', '🎁'], ['/methods', 'methods', 'q_methods', '🧭'], ['/news', 'news', 'q_news', '📰'], ['/leaks', 'leaks', 'q_leaks', '🕵️'], ['/events', 'events', 'q_events', '📅'], ['/developers', 'developers', 'q_dev', '🛠️']]
    .map(([h, k, d, i]) => `<a class="quick" href="#${h}"><span class="qi">${i}</span><b>${esc(t(k))}</b><small>${esc(t(d))}</small></a>`).join('');
  await setView(`
    <section class="hero"><img class="hero-logo" src="assets/img/logo.png" alt="CHOUAIB" width="160" height="160"><h1 class="wordmark"><span>FREE FIRE</span> <em>LAB</em></h1><p class="tagline">${esc(t('tagline'))}</p></section>
    ${bag.err ? errBox(bag.err) : ''}
    ${seasonHtml}
    ${sec(t('latest_news'), '#/news', nw.length ? grid(nw.map(newsCard).join('')) : state(t('empty_news')))}
    ${sec(t('latest_leaks'), '#/leaks', lk.length ? grid(lk.map(leakCard).join('')) : state(t('empty_leaks')))}
    ${sec(t('new_skins'), '#/skins', sk.length ? grid(sk.map(skinCard).join(''), 'g4') : state(t('empty_skins')))}
    ${sec(t('upcoming_events'), '#/events', ev.length ? grid(ev.map(eventCard).join('')) : state(t('empty_events')))}
    ${sec(t('dev_section'), '#/developers', dv.length ? grid(dv.map(devCard).join(''), 'g4') : state(t('empty_devs')))}
    ${sec(t('quick_links'), '', `<div class="quicks">${quick}</div>`)}`);
}

/* ----- skins ----- */
async function viewSkins() {
  let skins; try { skins = (await DB.published('skins')).filter(inServer); } catch (e) { return setView(errBox(e)); }
  const f = S.skinF;
  await setView(`<h1 class="ph">${esc(t('skins'))}</h1>
    <div class="filters">
      <input type="search" id="skQ" placeholder="${esc(t('search_name'))}" value="${esc(f.q)}" aria-label="${esc(t('search_name'))}">
      <select id="skType"><option value="">${esc(t('f_type_lbl'))}: ${esc(t('all'))}</option>${SKIN_TYPES.map((k) => `<option value="${k}" ${f.type === k ? 'selected' : ''}>${esc(t('type_' + k))}</option>`).join('')}</select>
      <select id="skAv"><option value="">${esc(t('f_av_lbl'))}: ${esc(t('all'))}</option>${['available', 'soon', 'ended', 'unconfirmed'].map((k) => `<option value="${k}" ${f.av === k ? 'selected' : ''}>${esc(t('av_' + k))}</option>`).join('')}</select>
      <select id="skSort">${['new', 'old', 'name'].map((k) => `<option value="${k}" ${f.sort === k ? 'selected' : ''}>${esc(t('sort'))}: ${esc(t('sort_' + k))}</option>`).join('')}</select>
    </div><div id="skGrid"></div>`);
  const draw = () => {
    let list = skins.filter((s) => {
      const q = f.q.trim().toLowerCase();
      if (q && !`${s.name_ar || ''} ${s.name_fr || ''}`.toLowerCase().includes(q)) return false;
      if (f.type && s.type !== f.type) return false;
      if (f.av && derivedAv(s) !== f.av) return false;
      return true;
    });
    list.sort(f.sort === 'name' ? (a, b) => nm(a).localeCompare(nm(b)) : f.sort === 'old' ? (a, b) => ms(a.createdAt) - ms(b.createdAt) : (a, b) => ms(b.updatedAt || b.createdAt) - ms(a.updatedAt || a.createdAt));
    $('#skGrid').innerHTML = list.length ? grid(list.map(skinCard).join('')) : state(skins.length ? t('no_results') : t('empty_skins'));
    hydrateImages($('#skGrid'), DB.getImageData); hydrateCounts($('#skGrid'));
  };
  draw();
  $('#skQ').addEventListener('input', debounce((e) => { f.q = e.target.value; draw(); }, 150));
  $('#skType').addEventListener('change', (e) => { f.type = e.target.value; draw(); });
  $('#skAv').addEventListener('change', (e) => { f.av = e.target.value; draw(); });
  $('#skSort').addEventListener('change', (e) => { f.sort = e.target.value; draw(); });
}

/* ----- methods ----- */
async function viewMethods() {
  let skins = []; try { skins = (await DB.published('skins')).filter(inServer); } catch { /* informational page still works */ }
  const cards = METHODS.map((m) => {
    const linked = skins.filter((s) => s.method === m && derivedAv(s) !== 'ended');
    return `<article class="card mth"><div class="card-b"><h3>${esc(t('method_' + m))}</h3><p class="muted">${esc(t('md_' + m))}</p>
      <p class="tiny muted">${esc(t('linked_skins'))}</p>${linked.length ? `<div class="chips">${linked.slice(0, 8).map((s) => `<button class="chip" data-open="skin:${s.id}">${esc(nm(s))}</button>`).join('')}</div>` : `<p class="tiny muted">${esc(t('no_linked'))}</p>`}</div></article>`;
  }).join('');
  await setView(`<h1 class="ph">${esc(t('methods'))}</h1><p class="muted">${esc(t('methods_intro'))}</p><div class="warn">⚠️ ${esc(t('warn_unofficial'))}</div>${grid(cards)}`);
}

/* ----- news ----- */
async function viewNews() {
  let list; try { list = (await DB.published('news')).filter(inServer); } catch (e) { return setView(errBox(e)); }
  const draw = () => {
    const l = list.filter((n) => !S.newsCat || n.category === S.newsCat)
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || ms(b.publishedAt || b.createdAt) - ms(a.publishedAt || a.createdAt));
    $('#nwGrid').innerHTML = l.length ? grid(l.map(newsCard).join('')) : state(list.length ? t('no_results') : t('empty_news'));
    $$('#nwChips .chip').forEach((c) => c.classList.toggle('on', c.dataset.v === S.newsCat));
    hydrateImages($('#nwGrid'), DB.getImageData); hydrateCounts($('#nwGrid'));
  };
  await setView(`<h1 class="ph">${esc(t('news'))}</h1><div class="chips" id="nwChips">${chip('newsCat', '', t('all'), true)}${NEWS_CATS.map((c) => chip('newsCat', c, t('cat_' + c))).join('')}</div><div id="nwGrid"></div>`);
  window.__drawNews = draw; draw();
}

/* ----- leaks ----- */
async function viewLeaks() {
  let list; try { list = (await DB.published('leaks')).filter(inServer); } catch (e) { return setView(errBox(e)); }
  const draw = () => {
    const l = list.filter((x) => (!S.leakCat || x.category === S.leakCat) && (!S.leakConf || confOf(x) === S.leakConf));
    $('#lkGrid').innerHTML = l.length ? grid(l.map(leakCard).join('')) : state(list.length ? t('no_results') : t('empty_leaks'));
    $$('#lkCats .chip').forEach((c) => c.classList.toggle('on', c.dataset.v === S.leakCat));
    $$('#lkConf .chip').forEach((c) => c.classList.toggle('on', c.dataset.v === S.leakConf));
    hydrateImages($('#lkGrid'), DB.getImageData);
  };
  await setView(`<h1 class="ph">${esc(t('leaks'))}</h1><div class="warn">⚠️ ${esc(t('leak_warn'))}</div>
    <div class="chips" id="lkCats">${chip('leakCat', '', t('all'), true)}${LEAK_CATS.map((c) => chip('leakCat', c, t('lcat_' + c))).join('')}</div>
    <div class="chips" id="lkConf">${chip('leakConf', '', t('confidence') + ': ' + t('all'), true)}${['unconfirmed', 'expected', 'official'].map((c) => chip('leakConf', c, t('conf_' + c))).join('')}</div><div id="lkGrid"></div>`);
  window.__drawLeaks = draw; draw();
}

/* ----- events + calendar ----- */
function calendarHtml(events) {
  const { y, m, day } = S.cal;
  const loc = getLang() === 'ar' ? 'ar-u-nu-latn' : 'fr-FR';
  const title = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' }).format(new Date(y, m, 1));
  const first = new Date(y, m, 1).getDay(); const days = new Date(y, m + 1, 0).getDate();
  const wd = Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(loc, { weekday: 'short' }).format(new Date(2023, 0, 1 + i)));
  const on = (d) => events.filter((e) => { const s = new Date(ms(e.startsAt)).setHours(0, 0, 0, 0); const en = new Date(ms(e.endsAt) || ms(e.startsAt)).setHours(23, 59, 59, 999); const t0 = new Date(y, m, d).getTime(); return t0 >= s && t0 <= en; });
  let cells = '';
  for (let i = 0; i < first; i++) cells += '<span class="day empty"></span>';
  const today = new Date();
  for (let d = 1; d <= days; d++) {
    const n = on(d).length; const isT = today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
    cells += `<button class="day${n ? ' has' : ''}${isT ? ' today' : ''}${day === d ? ' sel' : ''}" data-act="calDay" data-v="${d}">${d}${n ? `<i>${n}</i>` : ''}</button>`;
  }
  return `<div class="cal"><div class="cal-h"><button class="ib" data-act="calPrev" aria-label="prev">‹</button><b>${esc(title)}</b><button class="ib" data-act="calNext" aria-label="next">›</button></div>
    <div class="cal-w">${wd.map((w) => `<span>${esc(w)}</span>`).join('')}</div><div class="cal-g">${cells}</div></div>`;
}
function drawEvents() {
  const evs = S.eventsData; const now = Date.now();
  const sel = S.cal.day ? evs.filter((e) => { const s = new Date(ms(e.startsAt)).setHours(0, 0, 0, 0); const en = new Date(ms(e.endsAt) || ms(e.startsAt)).setHours(23, 59, 59, 999); const d0 = new Date(S.cal.y, S.cal.m, S.cal.day).getTime(); return d0 >= s && d0 <= en; }) : null;
  const up = evs.filter((e) => eventStatus(e) !== 'ended').sort((a, b) => ms(a.startsAt) - ms(b.startsAt));
  const past = evs.filter((e) => eventStatus(e) === 'ended').sort((a, b) => ms(b.endsAt) - ms(a.endsAt));
  $('#evBody').innerHTML = `${calendarHtml(evs)}
    ${sel ? `<h2 class="sh">${esc(fmtDate(new Date(S.cal.y, S.cal.m, S.cal.day)))}</h2>${sel.length ? grid(sel.map(eventCard).join('')) : `<p class="muted">${esc(t('no_events_day'))}</p>`}` : ''}
    <h2 class="sh">${esc(t('upcoming'))}</h2>${up.length ? grid(up.map(eventCard).join('')) : state(t('empty_events'))}
    ${past.length ? `<button class="chip" data-act="pastToggle">${esc(t('past_events'))} (${past.length})</button>${S.pastOpen ? grid(past.map(eventCard).join('')) : ''}` : ''}`;
  hydrateImages($('#evBody'), DB.getImageData); startTicker(); tickNow();
}
async function viewEvents() {
  try { S.eventsData = (await DB.published('events')).filter(inServer); } catch (e) { return setView(errBox(e)); }
  await setView(`<h1 class="ph">${esc(t('events'))}</h1><div id="evBody"></div>`);
  drawEvents();
}

/* ----- developers ----- */
async function viewDevs() {
  let list; try { list = (await DB.published('developers')).filter(inServer); } catch (e) { return setView(errBox(e)); }
  const draw = () => {
    const l = list.filter((d) => !S.devKind || d.kind === S.devKind);
    $('#dvGrid').innerHTML = l.length ? grid(l.map(devCard).join(''), 'g4') : state(list.length ? t('no_results') : t('empty_devs'));
    $$('#dvChips .chip').forEach((c) => c.classList.toggle('on', c.dataset.v === S.devKind));
    hydrateImages($('#dvGrid'), DB.getImageData);
  };
  await setView(`<h1 class="ph">${esc(t('developers'))}</h1><p class="muted">${esc(t('dev_note'))}</p><div class="chips" id="dvChips">${chip('devKind', '', t('all'), true)}${KINDS.map((k) => chip('devKind', k, t('kind_' + k))).join('')}</div><div id="dvGrid"></div>`);
  window.__drawDevs = draw; draw();
}
async function viewDev(id) {
  let list; try { list = await DB.published('developers'); } catch (e) { return setView(errBox(e)); }
  const d = list.find((x) => x.id === id);
  if (!d) return setView(`<a class="btn" href="#/developers">← ${esc(t('back'))}</a>${state(t('not_found'))}`);
  const row = (k, v) => (v ? `<div class="kv"><h3>${esc(t(k))}</h3><p>${esc(v).replace(/\n/g, '<br>')}</p></div>` : '');
  await setView(`<a class="btn" href="#/developers">← ${esc(t('back'))}</a>
    <article class="devpage"><div class="thumb sq big">${img(d.imageUrl, d.name)}</div><div><span class="tag">${esc(t('kind_' + (d.kind || 'developer')))}</span><h1>${esc(d.name)}</h1><p class="muted">${esc(pick(d, 'role'))} · ${esc(d.server || '')}</p>
    ${row('bio_lbl', pick(d, 'bio'))}${row('role_in_lbl', pick(d, 'roleIn'))}${row('contrib_lbl', pick(d, 'contrib'))}
    ${d.sourceUrl ? `<p class="tiny">${esc(t('source'))}: ${sourceLink(d)}</p>` : ''}</div></article>`);
  document.title = `${d.name} · FREE FIRE LAB`;
}

/* ----- seasons archive ----- */
async function viewSeasons() {
  let list; try { list = await DB.getSeasons(); } catch (e) { return setView(errBox(e)); }
  const row = (s) => `<article class="card row"><div class="card-b"><span class="tag">${esc(t('season_word'))} ${esc(s.number ?? '')}</span>${s.isActive ? `<span class="badge av-available">${esc(t('active'))}</span>` : ''}<h3>${esc(s.name || '')}</h3>
    <p class="muted">${s.startsAt ? `${esc(t('started'))}: ${esc(fmtDate(s.startsAt))} · ` : ''}${esc(t('ends_on'))} ${esc(fmtDate(s.endsAt))}</p></div></article>`;
  await setView(`<h1 class="ph">${esc(t('season_archive'))}</h1>${list.length ? `<div class="stack">${list.map(row).join('')}</div>` : state(t('season_none'))}`);
}

/* ----- admin (lazy) ----- */
async function viewAdmin() {
  await setView(loader());
  try {
    const m = await import('./admin.js');
    await m.mountAdmin(view(), { previewItem, refreshPublic: () => { DB.invalidate(); } });
  } catch (e) { console.error(e); view().innerHTML = errBox(e); }
}

/* ============ modals / detail ============ */
function openModal(html, after) {
  const m = $('#modal');
  m.innerHTML = `<div class="mbg" data-act="close"></div><div class="mbox" role="dialog" aria-modal="true"><button class="mx" data-act="close" aria-label="${esc(t('close'))}">✕</button>${html}</div>`;
  m.classList.add('open'); document.body.classList.add('noscroll');
  hydrateImages(m, DB.getImageData); startTicker(); tickNow(); after && after(m);
}
function closeModal() { const m = $('#modal'); m.classList.remove('open'); m.innerHTML = ''; document.body.classList.remove('noscroll'); }
const metaRow = (k, v) => (v ? `<div class="kv"><h4>${esc(t(k))}</h4><p>${v}</p></div>` : '');
const para = (s) => esc(s).replace(/\n/g, '<br>');

function detailHtml(type, it) {
  const big = (u, a) => `<div class="thumb big">${img(u, a)}</div>`;
  if (type === 'skin') {
    const av = derivedAv(it);
    return `${big(it.imageUrl, nm(it))}<div class="mb"><span class="badge av-${av}">${esc(t('av_' + av))}</span><h2>${esc(nm(it))}</h2><p class="meta">${esc(t('type_' + (it.type || 'other')))} · ${esc(it.server || '')}</p>
      ${metaRow('description', para(pick(it, 'desc')))}${metaRow('how_free', para(pick(it, 'howto')))}${it.method ? metaRow('method', esc(t('method_' + it.method))) : ''}
      ${metaRow('offer_start', esc(fmtDate(it.startsAt, true)))}${metaRow('offer_end', esc(fmtDate(it.endsAt, true)))}${metaRow('source', sourceLink(it))}${metaRow('last_update', esc(fmtDate(it.updatedAt || it.createdAt, true)))}</div>`;
  }
  if (type === 'news') {
    return `${big(it.imageUrl, pick(it, 'title'))}<div class="mb">${it.pinned ? `<span class="badge pin">📌 ${esc(t('pinned'))}</span>` : ''}<p class="meta"><span class="tag">${esc(t('cat_' + (it.category || 'general')))}</span> ${esc(fmtDate(it.publishedAt || it.createdAt, true))}${it.server ? ' · ' + esc(it.server) : ''}</p>
      <h2>${esc(pick(it, 'title'))}</h2><div class="prose">${para(pick(it, 'body'))}</div>${metaRow('source', sourceLink(it))}</div>`;
  }
  if (type === 'leak') {
    const c = confOf(it);
    return `${big(it.imageUrl, pick(it, 'title'))}<div class="mb"><span class="badge conf-${c}">${esc(t('conf_' + c))}</span><p class="meta"><span class="tag">${esc(t('lcat_' + (it.category || 'future')))}</span> ${esc(it.server || '')}</p>
      <h2>${esc(pick(it, 'title'))}</h2><div class="prose">${para(pick(it, 'details'))}</div>${metaRow('published_on', esc(fmtDate(it.publishedAt || it.createdAt, true)))}${metaRow('expected_date', esc(fmtDate(it.expectedAt)))}${metaRow('source', sourceLink(it))}
      <p class="warn tiny">⚠️ ${esc(t('leak_warn'))}</p></div>`;
  }
  const st = eventStatus(it);
  return `${big(it.imageUrl, pick(it, 'title'))}<div class="mb"><p class="meta">${esc(it.server || '')}</p><h2>${esc(pick(it, 'title'))}</h2>
    <p class="cd-line">${st === 'upcoming' ? `${esc(t('starts_in'))} ${cdInline(ms(it.startsAt))}` : st === 'ongoing' ? `<b class="ok">${esc(t('ongoing'))}</b> · ${esc(t('ends_in'))} ${cdInline(ms(it.endsAt))}` : esc(t('event_ended'))}</p>
    <div class="prose">${para(pick(it, 'desc'))}</div>${metaRow('event_start', esc(fmtDate(it.startsAt, true)))}${metaRow('event_end', esc(fmtDate(it.endsAt, true)))}</div>`;
}
const interactionsHtml = (type, id) => `<div class="inter" data-type="${type}" data-id="${id}">
  <div class="inter-bar"><button class="btn like" data-act="like" aria-pressed="false">${ICON.heart}<span data-ln>·</span></button><span class="muted">${ICON.chat} <span data-cn>·</span> ${esc(t('comments'))}</span></div>
  <form class="cform" data-act-submit="comment" autocomplete="off"><input name="name" maxlength="30" required placeholder="${esc(t('your_name'))}" value="${esc(store('ffl_name') || '')}">
  <input name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true"><textarea name="text" maxlength="500" rows="3" required placeholder="${esc(t('comment_ph'))}"></textarea>
  <button class="btn gold" type="submit">${esc(t('send'))}</button></form><div class="clist"><div class="spin sm"></div></div></div>`;

async function wireInteractions(m, type, id) {
  const box = $('.inter', m); if (!box) return;
  const refresh = async () => {
    DB.countLikes(type, id).then((n) => { const e = $('[data-ln]', box); if (e) e.textContent = n; });
    DB.hasLiked(type, id).then((l) => { const b = $('.like', box); if (b) { b.classList.toggle('on', l); b.setAttribute('aria-pressed', l); } });
    try {
      const list = await DB.listComments(type, id);
      $('[data-cn]', box).textContent = list.length;
      $('.clist', box).innerHTML = list.length ? list.map((c) => `<div class="cm"><b>${esc(c.name)}</b> <span class="tiny muted">${esc(fmtDate(c.createdAt, true))}</span><p>${esc(c.text)}</p></div>`).join('') : `<p class="muted">${esc(t('no_comments'))}</p>`;
    } catch { $('.clist', box).innerHTML = `<p class="muted">${esc(t('error_load'))}</p>`; }
  };
  box.__refresh = refresh;
  DB.ensureUser().catch(() => {}).finally(refresh);
}

async function openItem(type, id, direct) {
  let it = direct;
  if (!it) { try { it = (await DB.published(COL_OF[type])).find((x) => x.id === id); } catch (e) { return toast(t('error_load'), 'err'); } }
  if (!it) return toast(t('not_found'), 'err');
  openModal(detailHtml(type, it) + (direct && direct.__preview ? '' : interactionsHtml(type, it.id)), (m) => { if (!(direct && direct.__preview)) wireInteractions(m, type, it.id); });
}
export function previewItem(type, item) { openItem(type, item.id, { ...item, __preview: true }); }

/* ============ comments (spam / abuse guard) ============ */
function checkComment(name, text, form) {
  if (form.website.value) return 'bad_content'; // honeypot
  const last = +(store('ffl_lastc') || 0); if (Date.now() - last < 30000) return 'cooldown';
  if (text.trim().length < 2) return 'too_short';
  if (/(https?:\/\/|www\.|\.[a-z]{2,}\/)/i.test(text)) return 'links_blocked';
  if (/[<>]/.test(text) || /(.)\1{9,}/.test(text)) return 'bad_content';
  const bad = String(S.settings.badWords || '').split(',').map((w) => w.trim().toLowerCase()).filter(Boolean);
  const low = (name + ' ' + text).toLowerCase(); if (bad.some((w) => low.includes(w))) return 'bad_content';
  if (store('ffl_lasttext') === low) return 'dup_comment';
  return null;
}

/* ============ notifications ============ */
const seen = () => +(store('ffl_seen') || 0);
function visibleNotifs() { return S.notifs.filter((n) => !n.server || n.server === 'GLOBAL' || n.server === S.server); }
async function loadSoon() {
  try { const evs = (await DB.published('events')).filter(inServer); const now = Date.now(); S.soon = evs.filter((e) => ms(e.startsAt) > now && ms(e.startsAt) - now < 864e5); } catch { S.soon = []; }
  refreshBell();
}
function refreshBell() {
  const dot = $('#bellDot'); if (!dot) return;
  const unread = visibleNotifs().filter((n) => ms(n.createdAt) > seen()).length + S.soon.length;
  dot.hidden = !unread; dot.textContent = unread > 9 ? '9+' : unread;
  const p = $('#bellPanel'); if (p && !p.hidden) drawBell();
}
function drawBell() {
  const p = $('#bellPanel');
  const soon = S.soon.map((e) => `<button class="nt" data-open="event:${e.id}"><b>⏰ ${esc(t('soon_label'))}</b> ${esc(pick(e, 'title'))}<small>${cdInline(ms(e.startsAt))}</small></button>`).join('');
  const lst = visibleNotifs().map((n) => `<button class="nt" data-open="${esc(n.targetType)}:${esc(n.targetId)}"><b>${esc(t('n_' + n.targetType))}</b> ${esc(pick(n, 'title'))}<small>${esc(fmtDate(n.createdAt, true))}</small></button>`).join('');
  p.innerHTML = `<div class="panel-h"><b>${esc(t('notifications'))}</b></div><div class="panel-b">${soon + lst || `<p class="muted pad">${esc(t('no_notifs'))}</p>`}</div>
    <div class="panel-f"><button class="btn sm" data-act="push">${esc(t('enable_push'))}</button></div>`;
  startTicker(); tickNow();
}
function toggleBell() {
  const p = $('#bellPanel'); p.hidden = !p.hidden;
  if (!p.hidden) { drawBell(); store('ffl_seen', String(Date.now())); refreshBell(); }
}
function startNotifs() {
  try {
    DB.subscribeNotifs((list) => {
      const old = new Set(S.notifs.map((n) => n.id)); S.notifs = list;
      if (!S.firstSnap) list.filter((n) => !old.has(n.id) && (!n.server || n.server === S.server)).slice(0, 2).forEach((n) => toast(`${t('n_' + n.targetType)}: ${pick(n, 'title')}`, 'info'));
      S.firstSnap = false; refreshBell();
    }, () => {});
  } catch { /* notifications are optional */ }
}
async function doPush() {
  try {
    const r = await DB.enablePush(S.settings.vapidKey, getLang(), S.server);
    const map = { ok: 'push_enabled', denied: 'push_denied', unsupported: 'push_unsupported', not_configured: 'push_not_configured', fail: 'push_fail' };
    toast(t(map[r] || 'push_fail'), r === 'ok' ? 'ok' : 'err');
  } catch { toast(t('push_fail'), 'err'); }
}

/* ============ router ============ */
const routes = [[/^\/?$/, viewHome, 'home'], [/^\/skins$/, viewSkins, 'skins'], [/^\/methods$/, viewMethods, 'methods'], [/^\/news$/, viewNews, 'news'], [/^\/leaks$/, viewLeaks, 'leaks'],
  [/^\/events$/, viewEvents, 'events'], [/^\/developers$/, viewDevs, 'developers'], [/^\/developer\/([^/]+)$/, viewDev, 'developers'], [/^\/seasons$/, viewSeasons, 'seasons'], [/^\/admin$/, viewAdmin, 'admin']];
async function route() {
  const path = location.hash.slice(1).split('?')[0] || '/';
  const tok = ++routeToken; closeModal();
  const hit = routes.find(([re]) => re.test(path)) || routes[0];
  const m = path.match(hit[0]) || [];
  document.title = `${t(hit[2])} · FREE FIRE LAB`;
  $$('#nav a').forEach((a) => a.removeAttribute('aria-current'));
  $$('#nav a').forEach((a) => { const h = a.getAttribute('href').slice(1); if (h === '/' ? path === '/' : path.startsWith(h)) a.setAttribute('aria-current', 'page'); });
  $('#nav')?.classList.remove('open'); window.scrollTo(0, 0);
  view().innerHTML = loader();
  try { await hit[1](m[1] ? decodeURIComponent(m[1]) : undefined); } catch (e) { console.error(e); if (tok === routeToken) view().innerHTML = errBox(e); }
}

/* ============ events (delegated) ============ */
document.addEventListener('click', (e) => {
  const o = e.target.closest('[data-open]');
  if (o) { const [type, id] = o.dataset.open.split(':'); const p = $('#bellPanel'); if (p) p.hidden = true; openItem(type, id); return; }
  const a = e.target.closest('[data-act]'); if (!a) { const p = $('#bellPanel'); if (p && !p.hidden && !e.target.closest('#bellPanel')) p.hidden = true; return; }
  const v = a.dataset.v;
  switch (a.dataset.act) {
    case 'close': closeModal(); break;
    case 'retry': DB.invalidate(); route(); break;
    case 'lang': setLang(getLang() === 'ar' ? 'fr' : 'ar'); refreshAll(); break;
    case 'theme': S.theme = THEMES[(THEMES.indexOf(S.theme) + 1) % THEMES.length]; store('ffl_theme', S.theme); applyTheme(); renderShell(); toast(t('theme') + ': ' + t('theme_' + S.theme), 'info'); break;
    case 'menu': $('#nav').classList.toggle('open'); break;
    case 'bell': toggleBell(); break;
    case 'push': doPush(); break;
    case 'newsCat': S.newsCat = v; window.__drawNews?.(); break;
    case 'leakCat': S.leakCat = v; window.__drawLeaks?.(); break;
    case 'leakConf': S.leakConf = v; window.__drawLeaks?.(); break;
    case 'devKind': S.devKind = v; window.__drawDevs?.(); break;
    case 'calPrev': S.cal.m--; if (S.cal.m < 0) { S.cal.m = 11; S.cal.y--; } S.cal.day = null; drawEvents(); break;
    case 'calNext': S.cal.m++; if (S.cal.m > 11) { S.cal.m = 0; S.cal.y++; } S.cal.day = null; drawEvents(); break;
    case 'calDay': S.cal.day = S.cal.day === +v ? null : +v; drawEvents(); break;
    case 'pastToggle': S.pastOpen = !S.pastOpen; drawEvents(); break;
    case 'like': {
      const box = a.closest('.inter');
      DB.toggleLike(box.dataset.type, box.dataset.id).then(() => box.__refresh?.()).catch(() => toast(t('auth_needed'), 'err'));
      break;
    }
    default: break;
  }
});
document.addEventListener('submit', async (e) => {
  const f = e.target.closest('form[data-act-submit="comment"]'); if (!f) return;
  e.preventDefault();
  const box = f.closest('.inter'); const name = f.name.value.trim().slice(0, 30); const text = f.text.value.trim().slice(0, 500);
  const err = checkComment(name, text, f); if (err) return toast(t(err), 'err');
  const btn = $('button[type=submit]', f); btn.disabled = true;
  try {
    await DB.addComment(box.dataset.type, box.dataset.id, name, text);
    store('ffl_lastc', String(Date.now())); store('ffl_lasttext', (name + ' ' + text).toLowerCase()); store('ffl_name', name);
    f.text.value = ''; toast(t('comment_sent')); box.__refresh?.();
  } catch { toast(t('auth_needed'), 'err'); } finally { btn.disabled = false; }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { closeModal(); const p = $('#bellPanel'); if (p) p.hidden = true; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[data-open]') && e.target.tagName !== 'BUTTON') { e.preventDefault(); e.target.click(); }
});
window.addEventListener('hashchange', () => { renderShell(); route(); });

/* ============ boot ============ */
(async function boot() {
  applyDir();
  S.theme = THEMES.includes(store('ffl_theme')) ? store('ffl_theme') : 'gold';
  applyTheme();
  renderShell(); view().innerHTML = loader();
  try { S.settings = await DB.getSettings(); } catch { S.settings = {}; }
  if (!store('ffl_theme') && THEMES.includes(S.settings.defaultTheme)) S.theme = S.settings.defaultTheme;
  if (!hasLangPref() && ['ar', 'fr'].includes(S.settings.defaultLang)) setLang(S.settings.defaultLang, false);
  try { S.servers = await DB.getServers(); } catch { /* keep MENA */ }
  const saved = store('ffl_server'); const want = saved || S.settings.defaultServer || 'MENA';
  S.server = S.servers.some((s) => s.id === want) ? want : 'MENA';
  applyTheme(); renderShell(); route();
  DB.trackVisit(); startNotifs(); loadSoon();
})();

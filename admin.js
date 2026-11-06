// Admin panel — loaded lazily. Access is enforced by Firestore rules (admins/{uid} document), NOT by this UI.
import { app, db, auth, FS, AU, ADMIN_DOMAIN, FIREBASE_SDK } from './firebase.js';
import { t, pick } from './i18n.js';
import { $, $$, esc, ms, fmtDate, toInputDT, toast, img, hydrateImages, safeUrl } from './util.js';
import * as DB from './data.js';

const { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc, query, where, orderBy, limit, serverTimestamp, writeBatch, getCountFromServer, Timestamp } = FS;

const SKIN_TYPES = ['clothes', 'weapons', 'characters', 'backpacks', 'parachutes', 'accessories', 'vehicles', 'other'];
const METHODS = ['official_events', 'missions', 'rewards', 'login', 'game_events', 'seasonal', 'other'];

/* ---------- schema (drives forms, validation and lists) ---------- */
const bi = (base, type = 'text') => [{ k: base + '_ar', type }, { k: base + '_fr', type }];
const SCHEMA = {
  skins: {
    icon: '🎁', item: 'skin', notify: 'skin', title: (r) => r.name_ar || r.name_fr, statuses: ['pending', 'published', 'rejected'],
    defaults: { status: 'pending', type: 'clothes', availability: 'unconfirmed', server: 'MENA' },
    fields: [...bi('name'), { k: 'type', type: 'select', opts: SKIN_TYPES, pre: 'type_', req: 1 }, { k: 'server', type: 'server', req: 1 }, ...bi('desc', 'textarea'), { k: 'method', type: 'select', opts: ['', ...METHODS], pre: 'method_' },
      ...bi('howto', 'textarea'), { k: 'imageUrl', type: 'image' }, { k: 'startsAt', type: 'datetime' }, { k: 'endsAt', type: 'datetime' },
      { k: 'availability', type: 'select', opts: ['available', 'soon', 'ended', 'unconfirmed'], pre: 'av_', req: 1 }, { k: 'sourceName', type: 'text' }, { k: 'sourceUrl', type: 'url', req: 1 },
      { k: 'status', type: 'select', opts: ['pending', 'published', 'rejected'], pre: 'status_', req: 1 }],
    validate: (d) => (!d.name_ar && !d.name_fr ? 'a_err_name' : !safeUrl(d.sourceUrl) ? 'a_err_skin_src' : d.startsAt && d.endsAt && ms(d.endsAt) < ms(d.startsAt) ? 'a_err_dates' : null)
  },
  news: {
    icon: '📰', item: 'news', notify: 'news', title: (r) => r.title_ar || r.title_fr, statuses: ['published', 'draft'], defaults: { status: 'published', category: 'general', server: '' },
    fields: [...bi('title'), ...bi('body', 'textarea'), { k: 'category', type: 'select', opts: ['updates', 'events', 'announcements', 'maintenance', 'servers', 'general'], pre: 'cat_', req: 1 }, { k: 'imageUrl', type: 'image' },
      { k: 'server', type: 'server', global: 1 }, { k: 'sourceName', type: 'text' }, { k: 'sourceUrl', type: 'url' }, { k: 'publishedAt', type: 'datetime' }, { k: 'pinned', type: 'bool' },
      { k: 'status', type: 'select', opts: ['published', 'draft'], pre: 'status_', req: 1 }],
    validate: (d) => (!d.title_ar && !d.title_fr ? 'a_err_name' : null)
  },
  leaks: {
    icon: '🕵️', item: 'leak', notify: 'leak', title: (r) => r.title_ar || r.title_fr, statuses: ['published', 'draft'], defaults: { status: 'published', category: 'skins', confidence: 'unconfirmed', sourceType: 'unofficial', server: 'MENA' },
    fields: [...bi('title'), ...bi('details', 'textarea'), { k: 'category', type: 'select', opts: ['skins', 'events', 'royalepass', 'updates', 'future'], pre: 'lcat_', req: 1 }, { k: 'imageUrl', type: 'image' },
      { k: 'server', type: 'server', req: 1 }, { k: 'publishedAt', type: 'datetime' }, { k: 'expectedAt', type: 'datetime' }, { k: 'sourceName', type: 'text' }, { k: 'sourceUrl', type: 'url' },
      { k: 'sourceType', type: 'select', opts: ['unofficial', 'official'], pre: 'st_', req: 1 }, { k: 'confidence', type: 'select', opts: ['unconfirmed', 'expected', 'official'], pre: 'conf_', req: 1 },
      { k: 'status', type: 'select', opts: ['published', 'draft'], pre: 'status_', req: 1 }],
    validate: (d) => (!d.title_ar && !d.title_fr ? 'a_err_name' : d.confidence === 'official' && !(d.sourceType === 'official' && safeUrl(d.sourceUrl)) ? 'a_err_official' : null)
  },
  events: {
    icon: '📅', item: 'event', notify: 'event', title: (r) => r.title_ar || r.title_fr, statuses: ['published', 'draft'], defaults: { status: 'published', server: 'MENA' },
    fields: [...bi('title'), ...bi('desc', 'textarea'), { k: 'imageUrl', type: 'image' }, { k: 'server', type: 'server', req: 1 }, { k: 'startsAt', type: 'datetime', req: 1 }, { k: 'endsAt', type: 'datetime', req: 1 },
      { k: 'status', type: 'select', opts: ['published', 'draft'], pre: 'status_', req: 1 }],
    validate: (d) => (!d.title_ar && !d.title_fr ? 'a_err_name' : ms(d.endsAt) < ms(d.startsAt) ? 'a_err_dates' : null)
  },
  developers: {
    icon: '🛠️', title: (r) => r.name, statuses: ['published', 'draft'], defaults: { status: 'published', kind: 'developer', server: 'MENA' },
    fields: [{ k: 'name', type: 'text', req: 1 }, { k: 'kind', type: 'select', opts: ['developer', 'publisher', 'creator', 'community'], pre: 'kind_', req: 1 }, ...bi('role'), ...bi('bio', 'textarea'), ...bi('roleIn', 'textarea'), ...bi('contrib', 'textarea'),
      { k: 'imageUrl', type: 'image' }, { k: 'server', type: 'server', req: 1, global: 1 }, { k: 'sourceName', type: 'text' }, { k: 'sourceUrl', type: 'url' }, { k: 'status', type: 'select', opts: ['published', 'draft'], pre: 'status_', req: 1 }],
    validate: () => null
  },
  seasons: {
    icon: '⏳', title: (r) => `${t('season_word')} ${r.number ?? ''} — ${r.name || ''}`, statuses: [], defaults: { isActive: true },
    fields: [{ k: 'name', type: 'text', req: 1 }, { k: 'number', type: 'number' }, { k: 'startsAt', type: 'datetime' }, { k: 'endsAt', type: 'datetime', req: 1 }, { k: 'isActive', type: 'bool' }],
    validate: (d) => (d.startsAt && ms(d.endsAt) < ms(d.startsAt) ? 'a_err_dates' : null)
  }
};
const TABS = ['dashboard', 'skins', 'news', 'leaks', 'events', 'developers', 'seasons', 'comments', 'images', 'servers', 'settings'];
const TAB_LABEL = { dashboard: 'a_dashboard', skins: 'skins', news: 'news', leaks: 'leaks', events: 'events', developers: 'developers', seasons: 'seasons', comments: 'a_comments_tab', images: 'a_images', servers: 'a_servers', settings: 'a_settings' };

let R; let CTX; let tab = 'dashboard'; let items = []; let servers = [{ id: 'MENA', name: 'MENA' }];
const body = () => $('#abody', R);
const asRows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const fail = (e) => { console.error(e); toast(`${t('a_err')} ${e.code || e.message}`, 'err'); };

/* ---------- auth gate ---------- */
export async function mountAdmin(root, ctx) {
  R = root; CTX = ctx;
  await new Promise((res) => { const un = AU.onAuthStateChanged(auth, () => { un(); res(); }); });
  return gate();
}
async function gate() {
  const u = auth.currentUser;
  if (!u || u.isAnonymous) return loginView();
  let ok = false;
  try { ok = (await getDoc(doc(db, 'admins', u.uid))).exists(); } catch { ok = false; }
  if (!ok) return notAdminView(u);
  try { servers = await DB.getServers(); } catch { /* default */ }
  panel();
}
function loginView(msg, user = '') {
  R.innerHTML = `<div class="login card"><div class="card-b"><h1>${esc(t('a_login'))}</h1>
    <form id="lf" autocomplete="on"><label>${esc(t('a_username'))}<input name="u" autocomplete="username" autocapitalize="none" required dir="ltr" value="${esc(user)}"></label>
    <label>${esc(t('a_password'))}<input name="p" type="password" autocomplete="current-password" required dir="ltr"></label>
    ${msg ? `<p class="err">${esc(msg)}</p>` : ''}<button class="btn gold" type="submit">${esc(t('a_signin'))}</button></form></div></div>`;
  $('#lf', R).addEventListener('submit', async (e) => {
    e.preventDefault();
    const u = e.target.u.value.trim(); const email = u.includes('@') ? u : `${u.toLowerCase()}@${ADMIN_DOMAIN}`;
    try { await AU.signInWithEmailAndPassword(auth, email, e.target.p.value); gate(); } catch { loginView(t('a_bad_login'), u); }
  });
}
function notAdminView(u) {
  R.innerHTML = `<div class="login card"><div class="card-b"><h1>${esc(t('a_not_admin'))}</h1><p class="muted">${esc(t('a_uid_hint'))}</p><code class="uid" dir="ltr">${esc(u.uid)}</code>
    <button class="btn" id="so">${esc(t('a_signout'))}</button></div></div>`;
  $('#so', R).addEventListener('click', async () => { await AU.signOut(auth); loginView(); });
}

/* ---------- panel shell ---------- */
function panel() {
  R.innerHTML = `<div class="adm"><div class="adm-top"><h1 class="ph">${esc(t('admin'))}</h1><button class="btn sm" id="so">${esc(t('a_signout'))}</button></div>
    <div class="tabs" id="tabs">${TABS.map((k) => `<button class="tab${k === tab ? ' on' : ''}" data-tab="${k}">${SCHEMA[k] ? SCHEMA[k].icon + ' ' : ''}${esc(t(TAB_LABEL[k]))}</button>`).join('')}</div><div id="abody"></div></div>`;
  $('#so', R).addEventListener('click', async () => { await AU.signOut(auth); loginView(); });
  $('#tabs', R).addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (b) { tab = b.dataset.tab; panel(); } });
  body().addEventListener('click', onClick);
  body().addEventListener('change', onChange);
  body().addEventListener('input', onInput);
  body().addEventListener('submit', onSubmit);
  show();
}
function show() {
  if (tab === 'dashboard') return dashboard();
  if (SCHEMA[tab]) return list(tab);
  if (tab === 'comments') return commentsTab();
  if (tab === 'images') return imagesTab();
  if (tab === 'servers') return serversTab();
  if (tab === 'settings') return settingsTab();
}
const busy = () => { body().innerHTML = `<div class="state"><div class="spin"></div></div>`; };

/* ---------- dashboard ---------- */
async function dashboard() {
  busy();
  const cnt = async (q) => { try { return (await getCountFromServer(q)).data().count; } catch { return '—'; } };
  const day = (o) => new Date(Date.now() - o * 864e5).toISOString().slice(0, 10);
  const stat = async (id) => { try { const s = await getDoc(doc(db, 'stats', id)); return s.exists() ? s.data().count : 0; } catch { return 0; } };
  const days = Array.from({ length: 7 }, (_, i) => day(6 - i));
  const [total, likes, comments, pending, ...rest] = await Promise.all([stat('total'), cnt(collection(db, 'likes')), cnt(query(collection(db, 'comments'), where('hidden', '==', false))),
    cnt(query(collection(db, 'skins'), where('status', '==', 'pending'))), ...days.map((d) => stat('d_' + d)), ...['skins', 'news', 'leaks', 'events', 'developers'].map((c) => cnt(collection(db, c)))]);
  const series = rest.slice(0, 7); const colCounts = rest.slice(7); const mx = Math.max(1, ...series);
  const card = (l, v) => `<div class="stat"><b>${esc(v)}</b><span>${esc(l)}</span></div>`;
  body().innerHTML = `<div class="stats">${card(t('a_visits'), total)}${card(t('a_visits_today'), series[6])}${card(t('a_likes'), likes)}${card(t('a_comments_n'), comments)}${card(t('a_pending'), pending)}</div>
    <h3>${esc(t('a_last7'))}</h3><div class="bars">${series.map((v, i) => `<div class="bar"><i style="height:${Math.round((v / mx) * 100)}%"></i><small>${v}</small><small class="tiny">${days[i].slice(5)}</small></div>`).join('')}</div>
    <div class="stats">${['skins', 'news', 'leaks', 'events', 'developers'].map((c, i) => card(t(c), colCounts[i])).join('')}</div>`;
}

/* ---------- generic CRUD list ---------- */
async function list(col) {
  busy(); const S = SCHEMA[col];
  try { items = asRows(await getDocs(collection(db, col))).sort((a, b) => ms(b.createdAt) - ms(a.createdAt)); } catch (e) { fail(e); items = []; }
  const row = (r) => `<div class="arow"><div class="athumb">${S.fields.some((f) => f.k === 'imageUrl') ? img(r.imageUrl, '') : ''}</div>
    <div class="ainfo"><b>${esc(S.title(r) || r.id)}</b><small>${r.status ? `<span class="badge st-${esc(r.status)}">${esc(t('status_' + r.status))}</span> ` : ''}${r.isActive ? `<span class="badge av-available">${esc(t('active'))}</span> ` : ''}${esc(r.server || '')} · ${esc(fmtDate(r.updatedAt || r.createdAt))}</small></div>
    <div class="abtns">${col === 'skins' && r.status !== 'published' ? `<button class="btn sm gold" data-a="approve" data-id="${r.id}">${esc(t('a_approve'))}</button>` : ''}${col === 'skins' && r.status === 'pending' ? `<button class="btn sm" data-a="reject" data-id="${r.id}">${esc(t('a_reject'))}</button>` : ''}
    ${S.item ? `<button class="btn sm" data-a="preview" data-id="${r.id}">${esc(t('a_preview'))}</button>` : ''}<button class="btn sm" data-a="edit" data-id="${r.id}">${esc(t('a_edit'))}</button><button class="btn sm danger" data-a="del" data-id="${r.id}">${esc(t('a_delete'))}</button></div></div>`;
  body().innerHTML = `${col === 'skins' ? `<p class="warn tiny">ℹ️ ${esc(t('a_note_pending'))}</p>` : ''}<button class="btn gold" data-a="new">＋ ${esc(col === 'seasons' ? t('a_new_season') : t('a_new'))}</button>
    <div id="aform"></div><div class="alist">${items.length ? items.map(row).join('') : `<p class="muted">${esc(t('a_empty'))}</p>`}</div>`;
  hydrateImages(body(), DB.getImageData);
}

/* ---------- form builder ---------- */
function serverOpts(global) { return (global ? [{ id: '', name: t('global') }] : []).concat(servers.map((s) => ({ id: s.id, name: s.name || s.id }))); }
function fieldHtml(f, v, col) {
  const id = 'f_' + f.k; const label = `${esc(t('f_' + f.k))}${f.req ? ' *' : ''}`;
  let inner;
  if (f.type === 'textarea') inner = `<textarea id="${id}" rows="4">${esc(v || '')}</textarea>`;
  else if (f.type === 'select') inner = `<select id="${id}">${f.opts.map((o) => `<option value="${esc(o)}" ${String(v ?? '') === o ? 'selected' : ''}>${esc(o === '' ? '—' : t(f.pre + o))}</option>`).join('')}</select>`;
  else if (f.type === 'server') inner = `<select id="${id}">${serverOpts(f.global).map((s) => `<option value="${esc(s.id)}" ${String(v ?? '') === s.id ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select>`;
  else if (f.type === 'bool') return `<label class="chk"><input type="checkbox" id="${id}" ${v ? 'checked' : ''}> ${label}</label>`;
  else if (f.type === 'datetime') inner = `<input type="datetime-local" id="${id}" value="${esc(toInputDT(v))}" dir="ltr">`;
  else if (f.type === 'number') inner = `<input type="number" id="${id}" value="${esc(v ?? '')}" dir="ltr">`;
  else if (f.type === 'url') inner = `<input type="url" id="${id}" value="${esc(v || '')}" dir="ltr" placeholder="https://">`;
  else if (f.type === 'image') inner = `<input id="${id}" value="${esc(v || '')}" dir="ltr" placeholder="https://… | fbimg:…" data-imgin="1"><div class="imgbtns"><label class="btn sm">${esc(t('a_upload'))}<input type="file" accept="image/*" hidden data-up="${id}"></label>
    <button type="button" class="btn sm" data-a="imgsearch" data-for="${id}">${esc(t('a_search_img'))}</button></div><div class="imgprev" data-prev="${id}">${v ? img(v, '') : ''}</div><div class="imgres" data-res="${id}"></div>`;
  else inner = `<input id="${id}" value="${esc(v || '')}" ${f.k === 'sourceName' || f.k === 'name' || f.k.endsWith('_ar') || f.k.endsWith('_fr') ? '' : 'dir="ltr"'}>`;
  return `<label class="fld">${label}${inner}</label>`;
}
function openForm(col, r) {
  const S = SCHEMA[col]; const v = r || { ...S.defaults };
  $('#aform', R).innerHTML = `<form class="aedit card" data-col="${col}" data-id="${r ? r.id : ''}"><div class="card-b"><div class="fgrid">${S.fields.map((f) => fieldHtml(f, v[f.k], col)).join('')}</div>
    <div class="fbtn"><button class="btn gold" type="submit">${esc(t('a_save'))}</button><button type="button" class="btn" data-a="cancel">${esc(t('a_cancel'))}</button></div></div></form>`;
  hydrateImages($('#aform', R), DB.getImageData);
  $('#aform', R).scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function collect(form, col) {
  const S = SCHEMA[col]; const d = {};
  for (const f of S.fields) {
    const el = form.querySelector('#f_' + f.k); if (!el) continue;
    if (f.type === 'bool') d[f.k] = el.checked;
    else if (f.type === 'datetime') d[f.k] = el.value ? Timestamp.fromDate(new Date(el.value)) : null;
    else if (f.type === 'number') d[f.k] = el.value === '' ? null : Number(el.value);
    else d[f.k] = el.value.trim();
  }
  return d;
}
async function save(form) {
  const col = form.dataset.col; const S = SCHEMA[col]; const id = form.dataset.id; const d = collect(form, col);
  for (const f of S.fields) { if (f.req && (d[f.k] === '' || d[f.k] == null) && !(f.type === 'server' && f.global)) return toast(`${t('a_required')} ${t('f_' + f.k)}`, 'err'); }
  const bad = S.validate(d); if (bad) return toast(t(bad), 'err');
  const prev = id ? items.find((x) => x.id === id) : null;
  const ref = id ? doc(db, col, id) : doc(collection(db, col));
  d.updatedAt = serverTimestamp(); if (!id) d.createdAt = serverTimestamp();
  if (col === 'news' || col === 'leaks') { if (!d.publishedAt && !(prev && prev.publishedAt)) d.publishedAt = Timestamp.now(); if (!d.publishedAt) delete d.publishedAt; }
  try {
    await setDoc(ref, d, { merge: true });
    if (S.notify && d.status === 'published' && (!prev || prev.status !== 'published')) await notify(S.notify, ref.id, d);
    if (col === 'seasons' && d.isActive) { const b = writeBatch(db); (await getDocs(query(collection(db, 'seasons'), where('isActive', '==', true)))).forEach((s) => { if (s.id !== ref.id) b.update(s.ref, { isActive: false }); }); await b.commit(); }
    DB.invalidate(); toast(t('a_saved')); list(col);
  } catch (e) { fail(e); }
}
async function notify(type, targetId, d) {
  try { await setDoc(doc(collection(db, 'notifications')), { targetType: type, targetId, title_ar: d.title_ar || d.name_ar || '', title_fr: d.title_fr || d.name_fr || '', server: d.server || '', createdAt: serverTimestamp() }); } catch (e) { console.warn('notify failed', e); }
}

/* ---------- comments ---------- */
async function commentsTab() {
  busy(); let rows = [];
  try { rows = asRows(await getDocs(query(collection(db, 'comments'), orderBy('createdAt', 'desc'), limit(100)))); } catch (e) { fail(e); }
  body().innerHTML = rows.length ? `<div class="alist">${rows.map((c) => `<div class="arow"><div class="ainfo"><b>${esc(c.name)}</b> <small>${esc(c.targetType)} · ${esc(fmtDate(c.createdAt, true))} ${c.hidden ? '· 🙈' : ''}</small><p>${esc(c.text)}</p></div>
    <div class="abtns"><button class="btn sm" data-a="chide" data-id="${c.id}" data-h="${c.hidden ? 0 : 1}">${esc(c.hidden ? t('a_show') : t('a_hide'))}</button><button class="btn sm danger" data-a="cdel" data-id="${c.id}">${esc(t('a_delete'))}</button></div></div>`).join('')}</div>` : `<p class="muted">${esc(t('a_empty'))}</p>`;
}

/* ---------- images ---------- */
async function loadImg(file) {
  const url = URL.createObjectURL(file);
  try { return await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; }); } finally { setTimeout(() => URL.revokeObjectURL(url), 5000); }
}
async function compress(file) {
  const im = await loadImg(file); let max = 1000;
  for (let pass = 0; pass < 5; pass++) {
    const sc = Math.min(1, max / Math.max(im.width, im.height)); const c = document.createElement('canvas'); c.width = Math.round(im.width * sc); c.height = Math.round(im.height * sc);
    c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
    for (const q of [0.82, 0.7, 0.58, 0.45]) { const data = c.toDataURL('image/jpeg', q); if (data.length < 420000) return { data, w: c.width, h: c.height, canvas: c, q }; }
    max = Math.round(max * 0.75);
  }
  throw new Error('image too large');
}
async function storeImage(file) {
  const out = await compress(file); const settings = await DB.getSettings().catch(() => ({}));
  if (settings.useStorage) {
    try {
      const { getStorage, ref, uploadBytes, getDownloadURL } = await import(`${FIREBASE_SDK}/firebase-storage.js`);
      const blob = await new Promise((r) => out.canvas.toBlob(r, 'image/jpeg', out.q));
      const sref = ref(getStorage(app), `images/${Date.now()}.jpg`);
      await Promise.race([uploadBytes(sref, blob), new Promise((_, rej) => setTimeout(() => rej(new Error('storage timeout')), 12000))]);
      return await getDownloadURL(sref);
    } catch (e) { console.warn('Storage failed, using Firestore fallback', e); }
  }
  const r = doc(collection(db, 'images'));
  await setDoc(r, { data: out.data, w: out.w, h: out.h, createdAt: serverTimestamp() });
  return 'fbimg:' + r.id;
}
async function imagesTab() {
  busy(); let rows = [];
  try { rows = asRows(await getDocs(query(collection(db, 'images'), orderBy('createdAt', 'desc'), limit(24)))); } catch (e) { fail(e); }
  body().innerHTML = `<label class="btn gold">${esc(t('a_upload'))}<input type="file" accept="image/*" hidden data-up="__lib"></label>
    <div class="imggrid">${rows.map((r) => `<div class="card"><img src="${esc(r.data)}" alt="" loading="lazy"><div class="card-b"><code dir="ltr" class="tiny">fbimg:${esc(r.id)}</code><button class="btn sm danger" data-a="idel" data-id="${r.id}">${esc(t('a_delete'))}</button></div></div>`).join('') || `<p class="muted">${esc(t('a_empty'))}</p>`}</div>`;
}
async function wikiSearch(q, box) {
  box.innerHTML = `<div class="spin sm"></div>`;
  try {
    const u = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(q)}&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=800&format=json&origin=*`;
    const j = await (await fetch(u)).json(); const pages = Object.values(j.query?.pages || {});
    box.innerHTML = `<p class="tiny muted">${esc(t('a_img_search_hint'))}</p>` + (pages.length ? `<div class="imgs">${pages.map((p) => { const ii = p.imageinfo?.[0]; if (!ii) return ''; const lic = ii.extmetadata?.LicenseShortName?.value || '?';
      return `<figure><img src="${esc(ii.thumburl)}" alt="" loading="lazy"><figcaption class="tiny">${esc(lic)}</figcaption><button type="button" class="btn sm" data-a="useimg" data-url="${esc(ii.thumburl)}">${esc(t('a_use'))}</button></figure>`; }).join('')}</div>` : `<p class="muted">${esc(t('a_no_img'))}</p>`);
  } catch { box.innerHTML = `<p class="muted">${esc(t('error_load'))}</p>`; }
}

/* ---------- servers ---------- */
async function serversTab() {
  busy(); let rows = [];
  try { rows = asRows(await getDocs(collection(db, 'servers'))); } catch (e) { fail(e); }
  body().innerHTML = `<form class="aedit card" data-srv="1"><div class="card-b"><div class="fgrid"><label class="fld">${esc(t('f_code'))} *<input name="code" required dir="ltr" maxlength="12"></label><label class="fld">${esc(t('f_name'))}<input name="name" dir="ltr"></label></div>
    <button class="btn gold" type="submit">${esc(t('a_save'))}</button></div></form>
    <div class="alist"><div class="arow"><div class="ainfo"><b>MENA</b><small>${esc(t('active'))} (default)</small></div></div>${rows.filter((r) => r.id !== 'MENA').map((r) => `<div class="arow"><div class="ainfo"><b>${esc(r.id)}</b><small>${esc(r.name || '')} ${r.enabled === false ? '· off' : ''}</small></div>
    <div class="abtns"><button class="btn sm danger" data-a="sdel" data-id="${r.id}">${esc(t('a_delete'))}</button></div></div>`).join('')}</div>`;
}

/* ---------- settings ---------- */
async function settingsTab() {
  busy(); const s = await DB.getSettings().catch(() => ({}));
  const sel = (id, opts, v, lbl) => `<label class="fld">${esc(t('f_' + id))}<select id="s_${id}">${opts.map((o) => `<option value="${o}" ${v === o ? 'selected' : ''}>${esc(lbl(o))}</option>`).join('')}</select></label>`;
  body().innerHTML = `<form class="aedit card" data-settings="1"><div class="card-b"><div class="fgrid">
    ${sel('defaultTheme', ['gold', 'crimson', 'light'], s.defaultTheme || 'gold', (o) => t('theme_' + o))}${sel('defaultLang', ['ar', 'fr'], s.defaultLang || 'ar', (o) => (o === 'ar' ? 'العربية' : 'Français'))}
    ${sel('defaultServer', servers.map((x) => x.id), s.defaultServer || 'MENA', (o) => o)}
    <label class="fld">${esc(t('f_siteNote'))}<input id="s_siteNote" value="${esc(s.siteNote || '')}"></label>
    <label class="fld">${esc(t('f_vapidKey'))}<input id="s_vapidKey" dir="ltr" value="${esc(s.vapidKey || '')}"></label>
    <label class="fld">${esc(t('f_badWords'))}<textarea id="s_badWords" rows="2">${esc(s.badWords || '')}</textarea></label>
    <label class="chk"><input type="checkbox" id="s_useStorage" ${s.useStorage ? 'checked' : ''}> ${esc(t('f_useStorage'))}</label></div>
    <button class="btn gold" type="submit">${esc(t('a_save'))}</button></div></form>`;
}

/* ---------- event handlers ---------- */
async function onClick(e) {
  const b = e.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a; const id = b.dataset.id; const col = tab; const S = SCHEMA[col];
  try {
    if (a === 'new') openForm(col, null);
    else if (a === 'cancel') $('#aform', R).innerHTML = '';
    else if (a === 'edit') openForm(col, items.find((x) => x.id === id));
    else if (a === 'preview') CTX.previewItem(S.item, items.find((x) => x.id === id));
    else if (a === 'del') { if (confirm(t('a_confirm_delete'))) { await deleteDoc(doc(db, col, id)); DB.invalidate(); toast(t('a_deleted')); list(col); } }
    else if (a === 'approve' || a === 'reject') {
      const st = a === 'approve' ? 'published' : 'rejected'; const r = items.find((x) => x.id === id);
      await updateDoc(doc(db, col, id), { status: st, updatedAt: serverTimestamp() });
      if (st === 'published') await notify('skin', id, { ...r, status: st });
      DB.invalidate(); toast(t(a === 'approve' ? 'a_approved' : 'a_rejected')); list(col);
    } else if (a === 'chide') { await updateDoc(doc(db, 'comments', id), { hidden: b.dataset.h === '1' }); DB.invalidate(); commentsTab(); }
    else if (a === 'cdel') { if (confirm(t('a_confirm_delete'))) { await deleteDoc(doc(db, 'comments', id)); commentsTab(); } }
    else if (a === 'idel') { if (confirm(t('a_confirm_delete'))) { await deleteDoc(doc(db, 'images', id)); imagesTab(); } }
    else if (a === 'sdel') { if (confirm(t('a_confirm_delete'))) { await deleteDoc(doc(db, 'servers', id)); DB.invalidate('servers'); servers = await DB.getServers(); serversTab(); } }
    else if (a === 'imgsearch') {
      const f = b.dataset.for; const form = b.closest('form'); const guess = (form.querySelector('#f_name_en') || form.querySelector('#f_name_fr') || form.querySelector('#f_title_fr') || form.querySelector('#f_name') || form.querySelector('#f_name_ar') || { value: '' }).value;
      const q = prompt(t('a_search_img'), guess ? guess + ' Free Fire' : 'Free Fire'); if (q) wikiSearch(q, form.querySelector(`[data-res="${f}"]`));
    } else if (a === 'useimg') {
      const wrap = b.closest('.imgres'); const f = wrap.dataset.res; const input = $('#' + f, R); input.value = b.dataset.url; input.dispatchEvent(new Event('input', { bubbles: true })); wrap.innerHTML = '';
    }
  } catch (err) { fail(err); }
}
function onInput(e) {
  const el = e.target; if (el.dataset && el.dataset.imgin) { const p = $(`[data-prev="${el.id}"]`, R); if (p) { p.innerHTML = el.value ? img(el.value, '') : ''; hydrateImages(p, DB.getImageData); } }
}
async function onChange(e) {
  const el = e.target; if (!el.dataset || !el.dataset.up || !el.files[0]) return;
  const file = el.files[0]; el.value = ''; toast(t('a_uploading'), 'info');
  try {
    const ref = await storeImage(file);
    if (el.dataset.up === '__lib') { imagesTab(); return; }
    const input = $('#' + el.dataset.up, R); input.value = ref; input.dispatchEvent(new Event('input', { bubbles: true })); toast(t('a_saved'));
  } catch (err) { fail(err); }
}
async function onSubmit(e) {
  e.preventDefault(); const f = e.target;
  try {
    if (f.dataset.col) return save(f);
    if (f.dataset.srv) {
      const code = f.code.value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, ''); if (!code) return;
      await setDoc(doc(db, 'servers', code), { name: f.name.value.trim() || code, enabled: true, updatedAt: serverTimestamp() }); DB.invalidate('servers'); servers = await DB.getServers(); toast(t('a_saved')); serversTab();
    } else if (f.dataset.settings) {
      const g = (id) => $('#s_' + id, f);
      const d = { defaultTheme: g('defaultTheme').value, defaultLang: g('defaultLang').value, defaultServer: g('defaultServer').value, siteNote: g('siteNote').value.trim(), vapidKey: g('vapidKey').value.trim(), badWords: g('badWords').value.trim(), useStorage: g('useStorage').checked };
      await setDoc(doc(db, 'settings', 'main'), d, { merge: true }); DB.invalidate('settings'); toast(t('a_saved'));
    }
  } catch (err) { fail(err); }
}

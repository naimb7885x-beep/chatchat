import { getLang, t } from './i18n.js';

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const debounce = (fn, ms = 200) => { let id; return (...a) => { clearTimeout(id); id = setTimeout(() => fn(...a), ms); }; };

export function toDate(v) {
  if (!v) return null;
  if (typeof v.toDate === 'function') return v.toDate();
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d) ? null : d;
}
export const ms = (v) => { const d = toDate(v); return d ? d.getTime() : 0; };
export function fmtDate(v, withTime = false) {
  const d = toDate(v);
  if (!d) return t('no_date');
  const loc = getLang() === 'ar' ? 'ar-u-nu-latn' : 'fr-FR';
  const o = withTime ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' };
  try { return new Intl.DateTimeFormat(loc, o).format(d); } catch { return d.toLocaleString(); }
}
export function safeUrl(u) {
  try { const x = new URL(String(u || ''), location.href); return ['http:', 'https:'].includes(x.protocol) ? x.href : ''; } catch { return ''; }
}
// datetime-local helpers
export const toInputDT = (v) => { const d = toDate(v); if (!d) return ''; const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

/* ---------- images ---------- */
export const PH = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#141418"/><g fill="none" stroke="#d4af37" stroke-opacity=".5" stroke-width="3"><rect x="120" y="85" width="160" height="130" rx="14"/><circle cx="165" cy="130" r="14"/><path d="M130 205l55-48 40 34 25-20 30 34"/></g></svg>');
export function img(url, alt = '', cls = '') {
  url = String(url || '');
  if (url.startsWith('fbimg:')) return `<img class="${cls}" alt="${esc(alt)}" src="${PH}" data-fbimg="${esc(url.slice(6))}">`;
  const u = safeUrl(url);
  return `<img class="${cls}" alt="${esc(alt)}" src="${u ? esc(u) : PH}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
}
// Broken external images -> placeholder
document.addEventListener('error', (e) => {
  const el = e.target;
  if (el && el.tagName === 'IMG' && el.src !== PH && !el.dataset.fbimg) { el.src = PH; el.classList.add('img-broken'); }
}, true);

let imgObserver;
export function hydrateImages(root, loader) {
  const els = $$('img[data-fbimg]', root);
  if (!els.length) return;
  const load = async (el) => {
    const id = el.dataset.fbimg; delete el.dataset.fbimg;
    try { const data = await loader(id); if (data) el.src = data; } catch { /* keep placeholder */ }
  };
  if (!('IntersectionObserver' in window)) { els.forEach(load); return; }
  imgObserver ||= new IntersectionObserver((entries) => entries.forEach((en) => { if (en.isIntersecting) { imgObserver.unobserve(en.target); load(en.target); } }), { rootMargin: '200px' });
  els.forEach((el) => { el.__load = load; imgObserver.observe(el); });
}

/* ---------- toast ---------- */
export function toast(msg, type = 'ok') {
  let box = $('#toasts');
  if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = `toast ${type}`; el.textContent = msg; el.setAttribute('role', 'status');
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, 4200);
}

/* ---------- countdown ---------- */
const pad = (n) => String(n).padStart(2, '0');
export function parts(diff) {
  const s = Math.max(0, Math.floor(diff / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}
export function cdBig(endMs) {
  const box = (u, k) => `<div class="cd-box"><b data-u="${u}">00</b><span>${esc(t(k))}</span></div>`;
  return `<div class="cd" data-cd="${endMs}" data-ended="${esc(t('season_ended'))}">${box('d', 'days')}${box('h', 'hours')}${box('m', 'minutes')}${box('s', 'seconds')}</div>`;
}
export function cdInline(targetMs, endedKey = 'event_ended') {
  return `<span class="cd-inline" data-cdi="${targetMs}" data-ended="${esc(t(endedKey))}">--</span>`;
}
function tick() {
  const now = Date.now();
  for (const el of document.querySelectorAll('[data-cd]')) {
    const diff = +el.dataset.cd - now;
    if (diff <= 0) { if (!el.dataset.done) { el.dataset.done = 1; el.innerHTML = `<div class="cd-ended">${el.dataset.ended}</div>`; } continue; }
    const p = parts(diff);
    for (const u of ['d', 'h', 'm', 's']) { const b = el.querySelector(`[data-u="${u}"]`); if (b) b.textContent = pad(p[u]); }
  }
  for (const el of document.querySelectorAll('[data-cdi]')) {
    const diff = +el.dataset.cdi - now;
    if (diff <= 0) { el.textContent = el.dataset.ended; continue; }
    const p = parts(diff);
    el.textContent = `${p.d ? p.d + (getLang() === 'ar' ? 'ي ' : 'j ') : ''}${pad(p.h)}:${pad(p.m)}:${pad(p.s)}`;
  }
}
let tickId;
export function startTicker() { if (tickId) return; tick(); tickId = setInterval(tick, 1000); }
export const tickNow = tick;

export const ICON = {
  heart: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.2C.9 8.4 2.7 5 6 5c2 0 3.3 1.1 4 2.2h4C14.7 6.1 16 5 18 5c3.3 0 5.1 3.4 3.6 6.8C19.5 16.4 12 21 12 21z"/></svg>',
  chat: '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path fill="currentColor" d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 22a2.5 2.5 0 0 0 2.4-2h-4.8A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5-6.7V3a2 2 0 0 0-4 0v1.3A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M3 6h18v2H3zm0 5h18v2H3zm0 5h18v2H3z"/></svg>',
  theme: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 3a9 9 0 1 0 0 18V3z"/><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  link: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M14 3h7v7h-2V6.4l-8.3 8.3-1.4-1.4L17.6 5H14zM5 5h6v2H5v12h12v-6h2v8H3V5z"/></svg>'
};

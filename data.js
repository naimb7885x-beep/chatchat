// Data layer: Firestore reads/writes used by the public site.
import { db, auth, FS, AU, FIREBASE_SDK, firebaseConfig } from './firebase.js';
import { ms } from './util.js';

const { collection, doc, getDocs, getDoc, setDoc, addDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp, getCountFromServer, increment, onSnapshot } = FS;

const cache = new Map();
export const invalidate = (c) => (c ? cache.delete(c) : cache.clear());
const rows = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() }));
const newest = (a, b) => ms(b.publishedAt || b.createdAt) - ms(a.publishedAt || a.createdAt);

function cached(key, fn) {
  if (!cache.has(key)) {
    const p = fn().catch((e) => { cache.delete(key); throw e; });
    cache.set(key, p);
  }
  return cache.get(key);
}

// Public visitors may only read documents with status == 'published' (enforced by Firestore rules).
export const published = (col) => cached(col, async () =>
  rows(await getDocs(query(collection(db, col), where('status', '==', 'published')))).sort(newest));

export const getSeasons = () => cached('seasons', async () =>
  rows(await getDocs(collection(db, 'seasons'))).sort((a, b) => ms(b.endsAt) - ms(a.endsAt)));

export const getServers = () => cached('servers', async () => {
  const list = rows(await getDocs(collection(db, 'servers'))).filter((s) => s.enabled !== false);
  if (!list.some((s) => s.id === 'MENA')) list.unshift({ id: 'MENA', name: 'MENA', enabled: true });
  return list.sort((a, b) => (a.id === 'MENA' ? -1 : b.id === 'MENA' ? 1 : a.id.localeCompare(b.id)));
});

export const getSettings = () => cached('settings', async () => {
  const s = await getDoc(doc(db, 'settings', 'main'));
  return s.exists() ? s.data() : {};
});

export async function getImageData(id) {
  return cached('img:' + id, async () => {
    const s = await getDoc(doc(db, 'images', id));
    return s.exists() ? s.data().data : '';
  });
}

/* ---------- auth for visitors (anonymous) ---------- */
let userP = null;
export function ensureUser() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  userP ||= AU.signInAnonymously(auth).then((c) => c.user).catch((e) => { userP = null; throw e; });
  return userP;
}

/* ---------- likes ---------- */
const likeId = (type, id, uid) => `${type}_${id}_${uid}`;
const countCache = new Map();
export function countLikes(type, id) {
  const k = `l:${type}:${id}`;
  if (!countCache.has(k)) {
    countCache.set(k, getCountFromServer(query(collection(db, 'likes'), where('targetType', '==', type), where('targetId', '==', id)))
      .then((s) => s.data().count).catch(() => { countCache.delete(k); return 0; }));
  }
  return countCache.get(k);
}
export function countComments(type, id) {
  const k = `c:${type}:${id}`;
  if (!countCache.has(k)) {
    countCache.set(k, getCountFromServer(query(collection(db, 'comments'), where('targetType', '==', type), where('targetId', '==', id), where('hidden', '==', false)))
      .then((s) => s.data().count).catch(() => { countCache.delete(k); return 0; }));
  }
  return countCache.get(k);
}
export const bustCounts = (type, id) => { countCache.delete(`l:${type}:${id}`); countCache.delete(`c:${type}:${id}`); };

export async function hasLiked(type, id) {
  const u = auth.currentUser;
  if (!u) return false;
  try { return (await getDoc(doc(db, 'likes', likeId(type, id, u.uid)))).exists(); } catch { return false; }
}
export async function toggleLike(type, id) {
  const u = await ensureUser();
  const ref = doc(db, 'likes', likeId(type, id, u.uid));
  const s = await getDoc(ref);
  if (s.exists()) { await deleteDoc(ref); bustCounts(type, id); return false; }
  await setDoc(ref, { uid: u.uid, targetType: type, targetId: id, createdAt: serverTimestamp() });
  bustCounts(type, id);
  return true;
}

/* ---------- comments ---------- */
export async function listComments(type, id) {
  const snap = await getDocs(query(collection(db, 'comments'), where('targetType', '==', type), where('targetId', '==', id), where('hidden', '==', false)));
  return rows(snap).sort((a, b) => ms(b.createdAt) - ms(a.createdAt)).slice(0, 100);
}
export async function addComment(type, id, name, text) {
  const u = await ensureUser();
  await addDoc(collection(db, 'comments'), { uid: u.uid, targetType: type, targetId: id, name, text, hidden: false, createdAt: serverTimestamp() });
  bustCounts(type, id);
}

/* ---------- visit statistics (counter docs, increment-by-one only) ---------- */
export async function trackVisit() {
  try {
    if (sessionStorage.getItem('ffl_visit')) return;
    sessionStorage.setItem('ffl_visit', '1');
    const day = new Date().toISOString().slice(0, 10);
    await setDoc(doc(db, 'stats', 'total'), { count: increment(1) }, { merge: true });
    await setDoc(doc(db, 'stats', 'd_' + day), { count: increment(1) }, { merge: true });
  } catch { /* statistics are best-effort */ }
}

/* ---------- in-site notifications ---------- */
export function subscribeNotifs(cb, onErr) {
  const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'), limit(25));
  return onSnapshot(q, (snap) => cb(rows(snap)), (e) => onErr && onErr(e));
}

/* ---------- browser push (FCM) — opt-in only, requires VAPID key + sender backend ---------- */
export async function enablePush(vapidKey, lang, server) {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported';
  if (!vapidKey) return 'not_configured';
  const perm = await Notification.requestPermission();
  if (perm !== 'granted') return 'denied';
  const { getMessaging, getToken } = await import(`${FIREBASE_SDK}/firebase-messaging.js`);
  const reg = await navigator.serviceWorker.register('firebase-messaging-sw.js');
  const token = await getToken(getMessaging(), { vapidKey, serviceWorkerRegistration: reg });
  if (!token) return 'fail';
  await setDoc(doc(db, 'pushTokens', token.slice(-40)), { token, lang, server, createdAt: serverTimestamp() });
  return 'ok';
}
export { firebaseConfig };

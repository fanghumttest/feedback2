import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set, remove } from 'firebase/database';

const app = initializeApp({
  apiKey: "AIzaSyB6ZeSz4x5vAuZPgLnHQUqEwYt_k7zUpmk",
  authDomain: "fanghumts-testing2.firebaseapp.com",
  databaseURL: "https://fanghumts-testing2-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "fanghumts-testing2",
  storageBucket: "fanghumts-testing2.firebasestorage.app",
  messagingSenderId: "376104891391",
  appId: "1:376104891391:web:793f5d65ad29aca4db2dca"
});

const db = getDatabase(app);

// ── 開發 / 正式 資料隔離 ───────────────────────────────────
// 本機開發 (npm run dev) → 資料寫到 kv/_dev/，跟線上正式資料完全分開。
// 正式建置 (npm run build，部署用) → 走 kv/，照常存正式資料。
// 自動切換，不用手動設定；kv/_dev 在 kv 底下，現有安全規則即可涵蓋。
const NS = import.meta.env.DEV ? 'kv/_dev' : 'kv';
const nsPath = (p) => (p === 'kv' || p.startsWith('kv/')) ? NS + p.slice(2) : p;

export const dbGet = async (path) => {
  try {
    const snap = await get(ref(db, nsPath(path)));
    return snap.exists() ? snap.val() : null;
  } catch { return null; }
};

export const dbSet = async (path, value) => {
  try {
    await set(ref(db, nsPath(path)), value);
    return true;
  } catch (e) {
    console.error('dbSet error:', e);
    return false;
  }
};

export const dbDel = async (path) => {
  try {
    await remove(ref(db, nsPath(path)));
    return true;
  } catch { return false; }
};


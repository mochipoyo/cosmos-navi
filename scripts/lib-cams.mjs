/*
 * 宇宙実測ナビ：ライブカメラ用の共通処理（取得・文字コード判定・検証・ログ・安全な書き込み）
 * update-livecams.mjs / discover-cams.mjs / check-stills.mjs / validate-data.mjs から使います。
 */
import { readFile, writeFile, rename } from 'node:fs/promises';

/* ---------- エラーの種類（ログと meta に記録して区別する） ---------- */
export const ERROR_KINDS = {
  http: 'HTTPエラー', network: '通信エラー', timeout: 'タイムアウト', parse: '解析エラー', schema: 'データ形式の不一致',
  empty: '取得件数0', anomaly: '件数の異常な減少', invalid: '検証エラー', write: '保存エラー', disabled: '停止中',
};
export class CamError extends Error {
  constructor(kind, detail) { super((ERROR_KINDS[kind] || kind) + (detail ? '（' + detail + '）' : '')); this.kind = kind; this.detail = detail || ''; }
}

/* ---------- 文字コード：BOM を見て UTF-8 / UTF-16LE / UTF-16BE を判定 ---------- */
export function decodeBody(buf) {
  const b = new Uint8Array(buf);
  if (b.length >= 2 && b[0] === 0xFF && b[1] === 0xFE) return { text: new TextDecoder('utf-16le').decode(b.subarray(2)), encoding: 'utf-16le' };
  if (b.length >= 2 && b[0] === 0xFE && b[1] === 0xFF) return { text: new TextDecoder('utf-16be').decode(b.subarray(2)), encoding: 'utf-16be' };
  if (b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF) return { text: new TextDecoder('utf-8').decode(b.subarray(3)), encoding: 'utf-8-bom' };
  // BOM なしの UTF-16LE（ASCII の後ろに 0x00 が並ぶ）
  if (b.length >= 4 && b[1] === 0 && b[3] === 0 && b[0] !== 0) return { text: new TextDecoder('utf-16le').decode(b), encoding: 'utf-16le(no-bom)' };
  return { text: new TextDecoder('utf-8').decode(b), encoding: 'utf-8' };
}

/* ---------- 取得：HTTP・通信・タイムアウトを区別 ---------- */
export async function fetchBody(url, { headers = {}, timeoutMs = 60000, method = 'GET' } = {}) {
  const ac = new AbortController(); const to = setTimeout(() => ac.abort(), timeoutMs);
  let r;
  try { r = await fetch(url, { method, headers: Object.assign({ 'Accept-Encoding': 'gzip' }, headers), signal: ac.signal, redirect: 'follow' }); }
  catch (e) { throw new CamError(e && e.name === 'AbortError' ? 'timeout' : 'network', e && e.name === 'AbortError' ? timeoutMs / 1000 + '秒' : String(e && (e.cause && e.cause.code || e.message))); }
  finally { clearTimeout(to); }
  if (!r.ok) throw new CamError('http', 'HTTP ' + r.status);
  const buf = method === 'HEAD' ? new ArrayBuffer(0) : await r.arrayBuffer();
  return Object.assign({ status: r.status, headers: r.headers, finalUrl: r.url }, decodeBody(buf));
}
export async function fetchJson(url, opts) {
  const b = await fetchBody(url, Object.assign({ headers: { Accept: 'application/json' } }, opts || {}));
  try { return JSON.parse(b.text); } catch (e) { throw new CamError('parse', 'JSONとして読めません（' + b.encoding + '）'); }
}

/* ---------- CSV / TSV（区切り文字を自動判定。引用符はフィールドの先頭のときだけ扱う） ---------- */
export function parseDelimited(text) {
  text = String(text || '').replace(/^﻿/, '');
  const nl = text.search(/\r?\n/); const first = nl < 0 ? text : text.slice(0, nl);
  const D = (first.match(/\t/g) || []).length > (first.match(/,/g) || []).length ? '\t' : ',';
  const rows = []; let row = [], f = '', q = false, atStart = true;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; continue; }
    if (ch === '"' && atStart) { q = true; atStart = false; continue; }
    if (ch === D) { row.push(f); f = ''; atStart = true; continue; }
    if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; atStart = true; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; continue; }
    f += ch; atStart = false;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  if (!rows.length) return { delimiter: D, header: [], rows: [] };
  const header = rows[0].map(h => h.trim());
  return { delimiter: D, header, rows: rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] || '').trim()]))) };
}
export function requireColumns(parsed, cols) {
  const miss = cols.filter(c => !parsed.header.includes(c));
  if (miss.length) throw new CamError('schema', '列がありません：' + miss.join(', ') + '（見つかった列：' + parsed.header.slice(0, 12).join(', ') + '）');
}

/* ---------- 検証 ---------- */
export const httpsUrl = u => typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u);
export const okLatLon = (lat, lon) => typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
export function checkStillCam(c) {
  const e = [];
  if (!c || typeof c.id !== 'string' || !/^[a-z]+-[A-Za-z0-9_.:-]+$/.test(c.id)) e.push('id');
  if (c && c.kind !== 'still' && c.kind !== 'direct') e.push('kind');
  if (!c || !okLatLon(c.lat, c.lon)) e.push('latlon');
  if (c && c.kind === 'still' && !(Array.isArray(c.images) && c.images.length && c.images.every(i => i && httpsUrl(i.url)))) e.push('images');
  if (c && c.kind === 'direct' && !httpsUrl(c.embedUrl)) e.push('embedUrl');
  if (!c || !c.name) e.push('name');
  return e;
}
export function validateWebcams(reg) {
  const errors = [];
  if (!reg || reg.schema !== 1 || !Array.isArray(reg.cams)) return { ok: false, errors: ['形式（schema/cams）が正しくありません'] };
  const ids = new Set();
  reg.cams.forEach((c, i) => { const e = checkStillCam(c); if (e.length) errors.push('#' + i + ' ' + (c && c.id) + '：' + e.join(',')); if (c && ids.has(c.id)) errors.push('重複ID：' + c.id); if (c) ids.add(c.id); });
  return { ok: errors.length === 0, errors, count: reg.cams.length };
}
export function validateLivecams(reg) {
  const errors = [];
  if (!reg || reg.schema !== 1 || !Array.isArray(reg.cams)) return { ok: false, errors: ['形式（schema/cams）が正しくありません'] };
  const ids = new Set(), vids = new Set();
  reg.cams.forEach((c, i) => {
    if (!c || !c.id) { errors.push('#' + i + ' id なし'); return; }
    if (ids.has(c.id)) errors.push('重複ID：' + c.id); ids.add(c.id);
    if (!/^[A-Za-z0-9_-]{11}$/.test(c.videoId || '')) errors.push(c.id + '：videoId');
    else { if (vids.has(c.videoId)) errors.push('重複videoId：' + c.videoId); vids.add(c.videoId); }
    if (c.channelId && !/^UC[A-Za-z0-9_-]{22}$/.test(c.channelId)) errors.push(c.id + '：channelId');
    if (!(c.lat == null && c.lon == null) && !okLatLon(c.lat, c.lon)) errors.push(c.id + '：latlon');
  });
  return { ok: errors.length === 0, errors, count: reg.cams.length };
}
export function validateStatus(st) {
  if (!st || st.schema !== 1 || !st.s || typeof st.s !== 'object') return { ok: false, errors: ['形式（schema/s）が正しくありません'] };
  return { ok: true, errors: [], count: Object.keys(st.s).length };
}

/* ---------- 読み書き ---------- */
export async function readJson(file, dflt) { try { return JSON.parse(await readFile(file, 'utf8')); } catch (e) { if (dflt !== undefined) return dflt; throw e; } }
/* 一時ファイルに書いてから置き換える（途中で失敗しても元のファイルは壊れない） */
export async function writeJsonSafe(file, obj, compact) {
  const text = compact ? JSON.stringify(obj).replace(/\},\{"id"/g, '},\n{"id"') + '\n' : JSON.stringify(obj, null, 1) + '\n';
  JSON.parse(text);
  const tmp = file + '.tmp';
  try { await writeFile(tmp, text); await rename(tmp, file); } catch (e) { throw new CamError('write', file + '：' + (e && e.message)); }
}
/* 更新ログ（cam-update-log.json に追記。最新300件まで） */
export async function appendLog(entry, file = 'cam-update-log.json') {
  const log = await readJson(file, { schema: 1, entries: [] });
  if (!Array.isArray(log.entries)) log.entries = [];
  log.entries.push(entry); if (log.entries.length > 300) log.entries = log.entries.slice(-300);
  try { await writeJsonSafe(file, log); } catch (e) { console.error('[log] 更新ログを保存できませんでした:', e.message); }
}
/* GitHub Actions の注釈（画面の Summary に出る） */
export const gh = {
  warn: m => console.log('::warning::' + String(m).replace(/\n/g, ' ')),
  error: m => console.log('::error::' + String(m).replace(/\n/g, ' ')),
};

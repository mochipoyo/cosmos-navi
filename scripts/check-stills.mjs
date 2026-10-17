#!/usr/bin/env node
/*
 * 宇宙実測ナビ：定期更新画像カメラの「更新状態」を確認します（2時間ごとのワークフローで実行）。
 *
 * 1台ごとに、次の3つを分けて記録します（確認できないものは null＝未確認）。
 *   act … 提供元が稼働状態としているか（提供元のAPIに状態がある場合のみ。例：Digitraffic の収集状態、TfL の available）
 *   ok  … 画像の取得に成功したか（HEAD、使えない場合は先頭1バイトだけの GET で確認。画像本体はダウンロードしません）
 *   cap … 撮影（更新）時刻（Digitraffic は measuredTime、ほかは画像の Last-Modified ヘッダー）
 * 判定（st）※確認した時点（c）での判定です。ブラウザは c が古い場合「未確認」として表示します：
 *   live    … 撮影時刻が新しい（更新間隔の4倍、最低30分以内）＝「更新を確認」。連続した動画という意味ではありません。
 *   stale   … 画像は取得できたが撮影時刻が古い＝「更新が止まっている可能性」
 *   offline … 画像を取得できない、または提供元が停止中としている
 *   unknown … 撮影時刻を確認できない（画像は取得できた場合を含む）＝「未確認」
 *
 * 提供元への負担を抑えるため、1回の実行で確認するのは最大 CHECK_MAX 台（既定4000）で、確認が古いものから順に回します。
 * 出力：webcams-status.json（ブラウザが読み込み、表示に使います）
 * 使い方： node scripts/check-stills.mjs [webcams.json] [webcams-status.json]
 * 終了コード： 0＝成功（一部の画像・提供元の失敗を含む） 1＝台帳が読めない・保存できないなどの致命的エラー
 */
import { pathToFileURL } from 'node:url';
import { CamError, fetchJson, validateWebcams, validateStatus, readJson, writeJsonSafe, appendLog, gh } from './lib-cams.mjs';

const REG = process.argv[2] || 'webcams.json';
const OUT = process.argv[3] || 'webcams-status.json';
const NOW = process.env.LIVECAM_NOW ? new Date(process.env.LIVECAM_NOW) : new Date();
const MAX = Number(process.env.CHECK_MAX || 4000);
const CONC = Number(process.env.CHECK_CONCURRENCY || 6);
const TIMEOUT = Number(process.env.CHECK_TIMEOUT_MS || 15000);
const BUDGET_MS = Number(process.env.CHECK_BUDGET_MS || 8 * 60 * 1000);   // 全体で最大8分
const DT_BASE = process.env.DIGITRAFFIC_BASE || 'https://tie.digitraffic.fi';
const log = (...a) => console.log('[check-stills]', ...a);
const UA = process.env.CHECK_USER_AGENT || 'cosmos-navi-status-check/1.0 (+https://github.com/mochipoyo/cosmos-navi)';   // 提供元が問い合わせ先を分かるように

export function freshLimitSec(interval) { return Math.max(4 * (Number(interval) || 600), 1800); }
/* 証拠から状態を決める（ブラウザ側も同じ考え方で表示します） */
export function judge({ act, ok, cap }, interval, now = NOW) {
  if (act === false) return 'offline';
  if (ok === false) return 'offline';
  if (!cap) return 'unknown';
  const age = (now - new Date(cap)) / 1000;
  if (!Number.isFinite(age)) return 'unknown';
  return age <= freshLimitSec(interval) ? 'live' : 'stale';
}

/* 画像1枚を HEAD（405/501 なら Range 付き GET）で確認する */
export async function probeImage(url) {
  const tryOnce = async (method) => {
    const ac = new AbortController(); const to = setTimeout(() => ac.abort(), TIMEOUT);
    try {
      const h = { 'User-Agent': UA }; if (method === 'GET') h.Range = 'bytes=0-0'; if (/digitraffic\.fi/.test(url)) h['Digitraffic-User'] = process.env.DIGITRAFFIC_USER || 'cosmos-navi/1.0';
      const r = await fetch(url, { method, headers: h, signal: ac.signal, redirect: 'follow' });
      if (method === 'GET' && r.body) { try { await r.body.cancel(); } catch { /* 無視 */ } }
      return r;
    } finally { clearTimeout(to); }
  };
  let r;
  const isImg = x => (x.headers.get('content-type') || '').toLowerCase().startsWith('image/');
  try {
    r = await tryOnce('HEAD');
    // HEAD に対応しない・自動アクセスに別の応答を返すサーバーがあるため、画像以外の応答は先頭1バイトの GET で確かめ直す
    if (r.status === 405 || r.status === 501 || r.status === 403 || ((r.status === 200 || r.status === 206) && !isImg(r))) r = await tryOnce('GET');
  } catch (e) { return { ok: false, d: e && e.name === 'AbortError' ? 'タイムアウト' : '通信エラー' }; }
  // 404/410（画像がない）と 5xx（サーバー障害）は「取得できない」。401/403/429 は自動確認が拒否されただけかもしれないので「未確認」
  if (r.status === 401 || r.status === 403 || r.status === 429) return { ok: null, d: '自動確認が拒否されました（HTTP ' + r.status + '）' };
  if (!(r.status === 200 || r.status === 206)) return { ok: false, d: 'HTTP ' + r.status };
  const ct = (r.headers.get('content-type') || '').toLowerCase();
  // 画像以外（HTMLなど）が返るのは、ボット対策や案内ページの可能性があり、カメラの停止とは断定できない
  if (ct && !ct.startsWith('image/')) return { ok: null, d: '自動確認では画像以外の応答（' + ct.split(';')[0] + '）。停止とは断定できません' };
  const lm = r.headers.get('last-modified'); const t = lm ? new Date(lm) : null;
  // 未来の時刻や不正な値は採用しない
  const cap = t && Number.isFinite(+t) && t <= new Date(+NOW + 10 * 60 * 1000) ? t.toISOString() : null;
  return { ok: true, cap, d: cap ? '' : '撮影時刻の情報がありません' };
}

async function digitrafficTimes() {
  const j = await fetchJson(DT_BASE + '/api/weathercam/v1/stations/data', { headers: { 'Digitraffic-User': process.env.DIGITRAFFIC_USER || 'cosmos-navi/1.0' } });
  if (!j || !Array.isArray(j.stations)) throw new CamError('schema', 'stations がありません');
  const m = new Map();
  for (const s of j.stations) { const ts = (s.presets || []).map(p => p && p.measuredTime).filter(Boolean).sort(); if (ts.length) m.set('dt-' + String(s.id).replace(/[^A-Za-z0-9_.-]/g, ''), ts[ts.length - 1]); }
  return m;
}

async function pool(items, n, fn, deadline) {
  let i = 0; const run = async () => { while (i < items.length && Date.now() < deadline) { const k = i++; await fn(items[k]); } };
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, run));
}

export async function check(reg, prevStatus) {
  const prev = prevStatus && prevStatus.schema === 1 && prevStatus.s ? prevStatus.s : {};
  const intervals = {}; for (const [k, v] of Object.entries((reg.meta && reg.meta.sources) || {})) intervals[k] = v.interval || 600;
  const stills = reg.cams.filter(c => c.kind === 'still');
  const s = {}; const stats = {}; const srcErr = {};
  const add = (src, st) => { const x = stats[src] = stats[src] || { total: 0, checked: 0, live: 0, stale: 0, offline: 0, unknown: 0 }; x[st]++; };
  // 1) Digitraffic：撮影時刻を一括取得（1リクエスト）
  let dt = null;
  if (stills.some(c => c.source === 'digitraffic')) {
    try { dt = await digitrafficTimes(); } catch (e) { srcErr.digitraffic = { kind: e.kind || 'network', message: e.message }; gh.warn('Digitraffic の撮影時刻を取得できません：' + e.message); }
  }
  // 2) 画像の取得確認：確認が古い順に最大 MAX 台
  const order = stills.slice().sort((a, b) => ((prev[a.id] && prev[a.id].c) || '').localeCompare((prev[b.id] && prev[b.id].c) || '')).slice(0, MAX);
  const probed = new Map(); const deadline = Date.now() + BUDGET_MS;
  await pool(order, CONC, async c => { probed.set(c.id, await probeImage(c.images[0].url)); }, deadline);
  // すべて通信エラー・タイムアウトなら実行環境側の障害とみなし、今回の結果は使わない（全カメラを「取得できない」にしない）
  let runnerTrouble = false;
  if (probed.size >= 20 && [...probed.values()].every(r => !r.ok && /通信エラー|タイムアウト/.test(r.d))) { runnerTrouble = true; probed.clear(); gh.warn('画像の確認がすべて通信エラーになりました。今回の確認結果は採用しません'); }
  for (const c of stills) {
    const p = prev[c.id] || {}; const pr = probed.get(c.id);
    const act = c.providerActive === true ? true : c.providerActive === false ? false : null;
    let ok = p.ok == null ? null : p.ok, cap = p.cap || null, d = p.d || '', checked = p.c || null;
    if (pr) { ok = pr.ok; d = pr.d; checked = NOW.toISOString(); cap = pr.ok ? (pr.cap || null) : null; }
    if (dt && dt.has(c.id)) { cap = dt.get(c.id); if (!pr) checked = NOW.toISOString(); if (d === '撮影時刻の情報がありません') d = ''; }
    const fresh = !!pr || !!(dt && dt.has(c.id));
    let st;
    if (fresh) st = judge({ act, ok, cap }, intervals[c.source], NOW);
    else if (checked && (NOW - new Date(checked)) <= 24 * 3600e3) st = act === false ? 'offline' : (p.st || 'unknown');   // 今回は未確認：前回の確認時点の判定をそのまま残す（時刻 c とともに表示）
    else { ok = null; cap = null; d = checked ? '確認が24時間以上前' : '未確認'; st = act === false ? 'offline' : 'unknown'; }
    s[c.id] = { st, cap, ok, act, c: checked, d: d || undefined };
    add(c.source, st); stats[c.source].total++; if (pr) stats[c.source].checked++;
  }
  for (const [k, e] of Object.entries(srcErr)) if (stats[k]) stats[k].error = e;
  return { schema: 1, meta: { updatedAt: NOW.toISOString(), checked: probed.size, runnerTrouble, limit: MAX, freshRule: '撮影時刻が更新間隔の4倍（最低30分）以内なら「更新を確認」', sources: stats }, s };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const t0 = Date.now(); let fatal = null; let out = null;
  try {
    const reg = await readJson(REG, null);
    if (!reg) throw new CamError('parse', REG + ' を読めません');
    const v = validateWebcams(reg); if (!v.ok) throw new CamError('invalid', REG + '：' + v.errors.slice(0, 3).join(' / '));
    out = await check(reg, await readJson(OUT, null));
    const vs = validateStatus(out); if (!vs.ok) throw new CamError('invalid', vs.errors.join(' / '));
    await writeJsonSafe(OUT, out);
    log('wrote', OUT, Object.keys(out.s).length, 'entries; probed', out.meta.checked, JSON.stringify(out.meta.sources));
  } catch (e) { fatal = e; gh.error('画像カメラの更新状態を確認できませんでした：' + (e && e.message)); }
  await appendLog({ at: NOW.toISOString(), job: 'check-stills', ok: !fatal, fatal: fatal ? fatal.message : null, probed: out ? out.meta.checked : null, sources: out ? out.meta.sources : null, ms: Date.now() - t0 });
  process.exit(fatal ? 1 : 0);
}

#!/usr/bin/env node
/*
 * 宇宙実測ナビ：ライブカメラの配信状態を YouTube Data API v3 で確認し、livecams.json を更新します。
 * - 実行環境：GitHub Actions（Node.js 20以上。追加パッケージは不要）
 * - APIキー：環境変数 YT_API_KEY（GitHub Secrets から渡す）。ファイルやログには書き出しません。
 * - APIキーがない・失敗した場合も終了コード0で終わり、サイトの公開は続けます（前回の結果を残します）。
 *
 * 使うAPIと上限（2026年10月時点の公式ドキュメント「Quota Calculator」による。変更されることがあります）
 *   videos.list  … 1回1ユニット（最大50本まとめて確認）。共通枠は既定で1日10,000ユニット
 *   search.list  … 専用枠。既定で1日100回まで（配信が終わったカメラの、同じチャンネルの新しいライブを探す）
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const FILE = process.argv[2] || 'livecams.json';
const KEY = process.env.YT_API_KEY || '';
const API = process.env.YT_API_BASE || 'https://www.googleapis.com/youtube/v3';
const DAILY_LIMIT = Number(process.env.LIVECAM_DAILY_UNITS || 8000);      // 共通枠 10,000 のうち 8,000 までに抑える
const DAILY_SEARCH = Number(process.env.LIVECAM_DAILY_SEARCH || 70);      // search.list 専用枠 100回 のうち 70回まで（残りは新規カメラの発見 discover-cams.mjs 用）
const MAX_SEARCH_PER_RUN = Number(process.env.LIVECAM_MAX_SEARCH || 6);   // 1回の実行で検索するチャンネル数の上限（2時間ごと×12回で最大72回/日）
const SEARCH_INTERVAL_H = Number(process.env.LIVECAM_SEARCH_INTERVAL_H || 12); // 同じカメラを再検索するまでの間隔
const ACCEPT_SIMILARITY = 0.6;                                            // 新しい配信のタイトルが元のタイトルとどれだけ似ていれば自動で差し替えるか
const NOW = process.env.LIVECAM_NOW ? new Date(process.env.LIVECAM_NOW) : new Date();

const log = (...a) => console.log('[livecams]', ...a);

/* YouTube のクォータは米国太平洋時間の0時にリセットされる */
function quotaDay(d) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

class QuotaError extends Error {}
class ApiError extends Error {}

export function tokens(s) {
  return String(s || '').normalize('NFKC').toLowerCase()
    .replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, ' ')
    .split(/[^\p{L}\p{N}]+/u).filter(t => t.length >= 2 && !/^(live|ライブ|cam|camera|webcam|stream|streaming|4k|hd|uhd|ultra|24|7|now|en|vivo|directo|the|of|from|in|and)$/.test(t));
}
export function similarity(a, b, ignore) {
  const skip = new Set(tokens(ignore));
  const A = new Set(tokens(a).filter(t => !skip.has(t))), B = new Set(tokens(b).filter(t => !skip.has(t)));
  if (!A.size || !B.size) return 0;
  let n = 0; for (const t of A) if (B.has(t)) n++;
  return n / Math.min(A.size, B.size);
}

export function makeClient(state) {
  async function call(endpoint, params, cost) {
    const isSearch = endpoint === 'search';
    if (isSearch ? state.quota.search + 1 > DAILY_SEARCH : state.quota.used + cost > DAILY_LIMIT) throw new QuotaError('daily budget reached');
    const u = new URL(API + '/' + endpoint);
    for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
    u.searchParams.set('key', KEY);
    let r;
    try { r = await fetch(u, { headers: { Accept: 'application/json' } }); }
    catch (e) { throw new ApiError('network: ' + (e && e.message)); }
    if (isSearch) state.quota.search += 1; else state.quota.used += cost;   // 失敗したリクエストも数える（安全側）
    let body = null; try { body = await r.json(); } catch { body = null; }
    if (!r.ok) {
      const reason = body && body.error && body.error.errors && body.error.errors[0] && body.error.errors[0].reason;
      if (r.status === 403 && /quotaExceeded|dailyLimitExceeded|rateLimitExceeded/.test(reason || '')) throw new QuotaError(reason);
      throw new ApiError('HTTP ' + r.status + (reason ? ' ' + reason : ''));   // URL（キーを含む）はログに出さない
    }
    return body || {};
  }
  return { call };
}

function judge(item) {
  if (!item) return { status: 'offline', detail: '動画が見つかりません（削除・非公開の可能性）' };
  const st = item.status || {}, sn = item.snippet || {}, ls = item.liveStreamingDetails || {};
  if (st.privacyStatus && st.privacyStatus !== 'public' && st.privacyStatus !== 'unlisted') return { status: 'offline', detail: '非公開になっています' };
  if (st.embeddable === false) return { status: 'offline', detail: '配信者が埋め込みを許可していません' };
  if (st.uploadStatus && st.uploadStatus === 'rejected') return { status: 'offline', detail: '動画が利用できません' };
  if (sn.liveBroadcastContent === 'live' && !ls.actualEndTime) return { status: 'live', detail: 'ライブ配信中', since: ls.actualStartTime || null };
  if (sn.liveBroadcastContent === 'upcoming') return { status: 'offline', detail: '配信予定（まだ始まっていません）' };
  return { status: 'offline', detail: ls.actualEndTime ? '配信は終了しました（' + ls.actualEndTime.slice(0, 16).replace('T', ' ') + ' UTC）' : 'ライブ配信ではありません' };
}

async function videosList(client, ids) {
  const out = new Map();
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const j = await client.call('videos', { part: 'snippet,status,liveStreamingDetails', id: chunk.join(','), maxResults: '50',
      fields: 'items(id,snippet(channelId,channelTitle,title,liveBroadcastContent),status(privacyStatus,embeddable,uploadStatus),liveStreamingDetails(actualStartTime,actualEndTime))' }, 1);
    for (const it of j.items || []) out.set(it.id, it);
  }
  return out;
}

export async function run(reg) {
  const meta = reg.meta = reg.meta || {};
  const today = quotaDay(NOW);
  meta.quota = meta.quota && meta.quota.day === today ? meta.quota : { day: today, used: 0, search: 0 };
  meta.quota.search = meta.quota.search || 0; meta.quota.limit = DAILY_LIMIT; meta.quota.searchLimit = DAILY_SEARCH;
  const iso = NOW.toISOString();
  if (!KEY) {
    meta.apiStatus = 'nokey'; meta.message = 'APIキー（YT_API_KEY）が設定されていないため、自動確認をしていません';
    log(meta.message); return reg;
  }
  const client = makeClient(meta);
  const cams = reg.cams || [];
  let phase = 'videos';
  try {
    /* 1) 登録中の動画IDを一括確認（ユニット消費：約2） */
    const ids = [...new Set(cams.map(c => c.videoId).filter(Boolean))];
    const found = await videosList(client, ids);
    for (const c of cams) {
      const it = found.get(c.videoId);
      const j = judge(it);
      if (it && it.snippet && it.snippet.channelId) { c.channelId = it.snippet.channelId; c.channelIdSource = 'api'; }
      if (it && it.snippet && it.snippet.title) c.title = it.snippet.title;
      if (it && it.snippet && it.snippet.channelTitle) c.author = it.snippet.channelTitle;
      c.status = j.status; c.statusDetail = j.detail; c.checkedAt = iso; c.liveSince = j.since || null;
    }
    /* 2) 配信が終わったカメラは、同じチャンネルの新しいライブを探す（search.list 専用枠を1回消費） */
    phase = 'search';
    const used = new Set(cams.map(c => c.videoId));
    const need = cams.filter(c => c.status !== 'live' && c.channelId && (!c.lastSearchAt || (NOW - new Date(c.lastSearchAt)) / 3600e3 >= SEARCH_INTERVAL_H))
      .sort((a, b) => String(a.lastSearchAt || '').localeCompare(String(b.lastSearchAt || '')));
    const byChannel = new Map();
    for (const c of need) { if (!byChannel.has(c.channelId)) byChannel.set(c.channelId, []); byChannel.get(c.channelId).push(c); }
    let searches = 0;
    for (const [ch, group] of byChannel) {
      if (searches >= MAX_SEARCH_PER_RUN) break;
      const j = await client.call('search', { part: 'snippet', channelId: ch, eventType: 'live', type: 'video', videoEmbeddable: 'true', maxResults: '25',
        fields: 'items(id(videoId),snippet(title,channelId))' }, 1);
      searches++;
      const cand = (j.items || []).filter(x => x.id && x.id.videoId && x.snippet && x.snippet.channelId === ch && !used.has(x.id.videoId));
      let confirmed = new Map();
      if (cand.length) confirmed = await videosList(client, cand.map(x => x.id.videoId));
      for (const c of group) {
        c.lastSearchAt = iso;
        const scored = cand.map(x => {
          const it = confirmed.get(x.id.videoId); const jj = judge(it);
          const t = (it && it.snippet && it.snippet.title) || x.snippet.title;
          const kw = (c.match || []).length && c.match.every(m => t.toLowerCase().includes(String(m).toLowerCase()));
          return { videoId: x.id.videoId, title: t, live: jj.status === 'live', score: kw ? 1 : similarity(t, c.title, c.author) };
        }).filter(x => x.live && !used.has(x.videoId)).sort((a, b) => b.score - a.score);
        const best = scored[0];
        if (best && best.score >= ACCEPT_SIMILARITY && !used.has(best.videoId)) {
          log('replace', c.id, c.videoId, '->', best.videoId, '(score ' + best.score.toFixed(2) + ')');
          used.add(best.videoId);
          c.previousVideoId = c.videoId; c.videoId = best.videoId; c.title = best.title;
          c.status = 'live'; c.statusDetail = '配信が切り替わったため、同じチャンネルの新しいライブに自動で更新しました'; c.replacedAt = iso; c.candidates = [];
        } else {
          c.candidates = scored.slice(0, 3).map(x => ({ videoId: x.videoId, title: x.title, score: Math.round(x.score * 100) / 100 }));
          if (c.candidates.length) c.statusDetail += '（同じチャンネルに別のライブがありますが、同じ場所か確認できないため自動では切り替えていません）';
        }
      }
    }
    meta.apiStatus = 'ok'; meta.message = '自動確認しました（検索 ' + searches + ' 件）';
  } catch (e) {
    if (e instanceof QuotaError) { meta.apiStatus = 'quota'; meta.message = 'APIの利用上限に達したため、一部の確認を見送りました（' + phase + '）。前回までの結果を表示します'; }
    else { meta.apiStatus = phase === 'videos' ? 'error' : 'partial'; meta.message = 'APIの取得に失敗しました（' + (e && e.message) + '）。前回までの結果を表示します'; }
    log(meta.message);
  }
  meta.updatedAt = iso;
  log('quota today: units', meta.quota.used, '/', DAILY_LIMIT, '· search', meta.quota.search, '/', DAILY_SEARCH, '·', (reg.cams || []).filter(c => c.status === 'live').length, 'live of', (reg.cams || []).length);
  return reg;
}

export function validate(reg) {
  if (!reg || reg.schema !== 1 || !Array.isArray(reg.cams)) throw new Error('livecams.json の形式が正しくありません');
  for (const c of reg.cams) {
    if (!c.id || !/^[A-Za-z0-9_-]{11}$/.test(c.videoId || '')) throw new Error('不正なカメラ：' + JSON.stringify(c.id));
    if (c.channelId && !/^UC[A-Za-z0-9_-]{22}$/.test(c.channelId)) throw new Error('不正なチャンネルID：' + c.id);
  }
  return reg;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const reg = validate(JSON.parse(await readFile(FILE, 'utf8')));
    await run(reg);
    await writeFile(FILE, JSON.stringify(reg, null, 1) + '\n');
    log('wrote', FILE);
  } catch (e) {
    console.error('[livecams] 更新を中止しました（ファイルは変更していません）:', e && e.message);
  }
  process.exit(0);
}

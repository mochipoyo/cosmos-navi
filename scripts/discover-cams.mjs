#!/usr/bin/env node
/*
 * 宇宙実測ナビ：新しいカメラの発見・登録（配信状態の確認 update-livecams.mjs とは独立）
 *
 * 1) 公開APIの「定期更新画像」カメラを、正式な提供元から取得して webcams.json に登録します。
 *    - 取得できたカメラだけを登録します。ダミーや推測の地点は作りません。
 *    - 提供元ごとに、ライセンス・出典表示・利用条件のURLを記録します。
 *    - ある提供元の取得に失敗した場合は、その提供元の前回の登録を残します（サイトが空になりません）。
 * 2) YouTube：登録済みの信頼できるチャンネル（livecams.json のチャンネル）で始まった新しいライブを探し、
 *    livecams-candidates.json に「候補」として書き出します。位置が確認できないため自動登録はしません。
 *
 * 環境変数（GitHub Secrets から渡す。ファイルやログには書き出しません）
 *   YT_API_KEY      … YouTube Data API v3（任意。ないときは YouTube の候補探しを省略）
 *   WINDY_API_KEY   … Windy Webcams API（任意。下の SOURCES.windy.enabled を true にした場合だけ使用）
 *   DIGITRAFFIC_USER… Digitraffic-User ヘッダーの値（任意。既定は "cosmos-navi/1.0"。個人情報は入れないこと）
 *
 * 使い方： node scripts/discover-cams.mjs [webcams.json] [livecams.json] [livecams-candidates.json]
 */
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const OUT = process.argv[2] || 'webcams.json';
const VIDEO = process.argv[3] || 'livecams.json';
const CAND = process.argv[4] || 'livecams-candidates.json';
const NOW = process.env.LIVECAM_NOW ? new Date(process.env.LIVECAM_NOW) : new Date();
const BASE = { digitraffic: process.env.DIGITRAFFIC_BASE || 'https://tie.digitraffic.fi', windy: process.env.WINDY_BASE || 'https://api.windy.com', yt: process.env.YT_API_BASE || 'https://www.googleapis.com/youtube/v3' };
const log = (...a) => console.log('[discover]', ...a);

/* ---------- 提供元の定義（ライセンスと利用条件は公式ページで確認した内容） ---------- */
export const SOURCES = {
  digitraffic: {
    enabled: true,
    name: 'Fintraffic Digitraffic（フィンランドの道路気象カメラ）',
    kind: 'still',
    license: { name: 'CC BY 4.0', url: 'https://creativecommons.org/licenses/by/4.0/', attribution: 'Source: Fintraffic / digitraffic.fi, license CC 4.0 BY' },
    termsUrl: 'https://www.digitraffic.fi/en/terms-of-service/',
    pageUrl: 'https://www.digitraffic.fi/en/road-traffic/',
    interval: 600, intervalNote: '提供元の公表値（約10分ごと）',
    operator: 'Fintraffic',
  },
  hongkong: {
    enabled: true,
    name: '香港特別行政区 運輸署（DATA.GOV.HK）',
    kind: 'still', operator: '香港特別行政区政府 運輸署',
    license: { name: 'DATA.GOV.HK 利用条件', url: 'https://data.gov.hk/en/terms-and-conditions', attribution: 'Source: Transport Department, HKSAR Government / DATA.GOV.HK' },
    termsUrl: 'https://data.gov.hk/en/terms-and-conditions',
    pageUrl: 'https://data.gov.hk/en-data/dataset/hk-td-tis_2-traffic-snapshot-images',
    interval: 120, intervalNote: '提供元の公表値（2分ごと）',
  },
  drivebc: {
    enabled: true,
    name: 'DriveBC（カナダ・ブリティッシュコロンビア州）',
    kind: 'still', operator: 'British Columbia Ministry of Transportation and Transit（DriveBC）',
    license: { name: 'Open Government Licence – British Columbia', url: 'https://www2.gov.bc.ca/gov/content/data/policy-standards/open-data/open-government-licence-bc', attribution: 'Contains information licensed under the Open Government Licence – British Columbia.' },
    termsUrl: 'https://www2.gov.bc.ca/gov/content/data/policy-standards/open-data/open-government-licence-bc',
    pageUrl: 'https://www.drivebc.ca/',
    interval: 900, intervalNote: '目安（カメラにより異なります）',
  },
  nsw: {
    enabled: true,
    name: 'Transport for NSW（オーストラリア）',
    kind: 'still', operator: 'Transport for NSW',
    license: { name: 'CC BY 4.0', url: 'https://opendata.transport.nsw.gov.au/datalicence', attribution: '© Transport for NSW, licensed under CC BY 4.0' },
    termsUrl: 'https://opendata.transport.nsw.gov.au/dataset/live-traffic-cameras',
    pageUrl: 'https://www.livetraffic.com/',
    interval: 600, intervalNote: '目安（公表値を確認できていません）',
  },
  tfl: {
    /* TfL の利用規約は登録を前提にしている（"This Licence shall apply from the date of registration."）。
       運営者が TfL API Portal に登録して TFL_APP_KEY を Secrets に入れた場合だけ自動で有効になる。 */
    enabled: !!process.env.TFL_APP_KEY,
    name: 'Transport for London JamCams（イギリス・ロンドン）',
    kind: 'still', operator: 'Transport for London',
    license: { name: 'TfL Transport Data Service 利用条件（Open Government Licence 2.0 ベース）', url: 'https://tfl.gov.uk/corporate/terms-and-conditions/transport-data-service', attribution: 'Powered by TfL Open Data. Contains OS data © Crown copyright and database rights 2016' },
    termsUrl: 'https://tfl.gov.uk/corporate/terms-and-conditions/transport-data-service',
    pageUrl: 'https://tfl.gov.uk/traffic/status/',
    interval: 300, intervalNote: '提供元の案内（通常5分ごと）',
    disabledMessage: 'TfL API Portal への登録（TFL_APP_KEY）が必要なため停止中',
  },
  caltrans: {
    /* 既定で停止：Caltrans の利用条件は「一般にパブリックドメイン」としつつ「著作権のあるデータ（写真など）を使う場合があり、追加の許可が必要なことがある」と書いており、カメラ画像の扱いを確定できないため。 */
    enabled: false,
    name: 'Caltrans CCTV（米国カリフォルニア州）', kind: 'still', operator: 'Caltrans',
    license: { name: 'Caltrans Conditions of Use', url: 'https://dot.ca.gov/conditions-of-use', attribution: 'Source: Caltrans' },
    termsUrl: 'https://dot.ca.gov/conditions-of-use', pageUrl: 'https://cwwp2.dot.ca.gov/', interval: 900,
    disabledMessage: '画像の権利（写真に第三者の著作権が含まれる可能性）を確認できないため停止中',
  },
  windy: {
    /* 既定で停止：Windy Webcams API 利用規約 第11.2条は「APIで得たデータの第三者への再配布」を禁じており、
       公開JSONとしてカメラ一覧を置くことが許されるか確認できていないため。運営者が Windy から書面で確認した場合のみ true にする。 */
    enabled: false,
    name: 'Windy Webcams',
    kind: 'direct',
    license: { name: 'Windy Webcams API Terms of Use', url: 'https://account.windy.com/agreements/windy-webcams-api-terms-of-use', attribution: 'Webcams provided by windy.com — add a webcam' },
    termsUrl: 'https://api.windy.com/webcams/terms',
    pageUrl: 'https://www.windy.com/webcams',
    maxCams: 200, operator: 'Windy.com',
    disabledMessage: '利用規約（第11.2条：データの再配布の禁止）との関係を Windy に確認できていないため停止中',
  },
};

class FetchError extends Error {}
async function getJson(url, headers, timeoutMs = 60000) {
  const ac = new AbortController(); const to = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, { headers: Object.assign({ Accept: 'application/json', 'Accept-Encoding': 'gzip' }, headers || {}), signal: ac.signal });
    if (!r.ok) throw new FetchError('HTTP ' + r.status);
    return await r.json();
  } catch (e) { if (e instanceof FetchError) throw e; throw new FetchError(e && e.name === 'AbortError' ? 'timeout' : 'network: ' + (e && e.message)); }
  finally { clearTimeout(to); }
}

/* ---------- Digitraffic weathercam ---------- */
export function niceFiName(raw) {
  // 例 "vt1_Espoo_Nupuri" → "vt1 Espoo Nupuri"（提供元の名前を読みやすくするだけで、内容は変えない）
  return String(raw || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}
export async function fetchDigitraffic(prev) {
  const S = SOURCES.digitraffic; const H = { 'Digitraffic-User': process.env.DIGITRAFFIC_USER || 'cosmos-navi/1.0' };
  const st = await getJson(BASE.digitraffic + '/api/weathercam/v1/stations', H);
  let data = null;
  try { data = await getJson(BASE.digitraffic + '/api/weathercam/v1/stations/data', H); } catch (e) { log('digitraffic data:', e.message); }
  const measured = new Map();
  for (const s of (data && data.stations) || []) for (const p of s.presets || []) if (p && p.id) measured.set(p.id, p.measuredTime || null);
  const feats = Array.isArray(st && st.features) ? st.features : [];
  const out = [];
  for (const f of feats) {
    const p = (f && f.properties) || {}; const g = f && f.geometry; const id = p.id || f.id;
    if (!id || !g || !Array.isArray(g.coordinates)) continue;
    const lon = Number(g.coordinates[0]), lat = Number(g.coordinates[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) continue;
    if (p.collectionStatus && p.collectionStatus !== 'GATHERING') continue;      // 収集中のカメラだけ
    if (p.state && p.state === 'REMOVED') continue;
    const presets = (p.presets || []).filter(x => x && x.id && x.inCollection !== false);
    if (!presets.length) continue;
    const times = presets.map(x => measured.get(x.id)).filter(Boolean).sort();
    const last = times.length ? times[times.length - 1] : null;
    const ageH = last ? (NOW - new Date(last)) / 3600e3 : null;
    const status = last == null ? 'unknown' : ageH <= 3 ? 'live' : 'offline';
    out.push({
      id: 'dt-' + String(id).replace(/[^A-Za-z0-9_-]/g, ''), kind: 'still', source: 'digitraffic',
      name: niceFiName(p.name) || String(id), nameEn: niceFiName(p.name) || String(id), country: 'フィンランド', city: '', area: 'ヨーロッパ',
      lat: Math.round(lat * 1e5) / 1e5, lon: Math.round(lon * 1e5) / 1e5, tz: 'Europe/Helsinki',
      images: presets.map((x, i) => ({ label: '方向' + (i + 1), url: 'https://weathercam.digitraffic.fi/' + encodeURIComponent(x.id) + '.jpg' })),
      imageTime: last, status,
      statusDetail: last == null ? '撮影時刻の情報を取得できませんでした' : status === 'live' ? undefined : '最新の画像が3時間以上前のものです（' + last.slice(0, 16).replace('T', ' ') + ' UTC）',
    });
  }
  return out;
}

/* ---------- 共通：CSV ---------- */
export function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  text = String(text || '').replace(/^\uFEFF/, '');
  const first = text.slice(0, text.search(/\r?\n/) >>> 0 || text.length);
  const D = first.includes('\t') && !first.includes(',') ? '\t' : ',';   // 香港の「CSV」はタブ区切り
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; }
    else if (ch === '"') q = true;
    else if (ch === D) { row.push(f); f = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else f += ch;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  if (!rows.length) return [];
  const head = rows[0].map(h => h.trim());
  return rows.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}
async function getText(url, headers, timeoutMs = 60000) {
  const ac = new AbortController(); const to = setTimeout(() => ac.abort(), timeoutMs);
  try { const r = await fetch(url, { headers: Object.assign({ 'Accept-Encoding': 'gzip' }, headers || {}), signal: ac.signal, redirect: 'follow' }); if (!r.ok) throw new FetchError('HTTP ' + r.status); return await r.text(); }
  catch (e) { if (e instanceof FetchError) throw e; throw new FetchError(e && e.name === 'AbortError' ? 'timeout' : 'network: ' + (e && e.message)); }
  finally { clearTimeout(to); }
}
const okLatLon = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180 && !(lat === 0 && lon === 0);
const httpsUrl = u => typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/.test(u);
const r5 = v => Math.round(v * 1e5) / 1e5;
const PREFIX = { digitraffic: 'dt', hongkong: 'hk', drivebc: 'bc', nsw: 'nsw', tfl: 'tfl', caltrans: 'ca', windy: 'wy' };
/* 取得先URL（テスト用に環境変数で差し替え可能） */
const U = (name, dflt) => process.env['DISCOVER_URL_' + name] || dflt;
const safeId = v => String(v).replace(/[^A-Za-z0-9_.-]/g, '');
function baseRec(src, id, name, lat, lon, extra) {
  return Object.assign({ id: PREFIX[src] + '-' + safeId(id), kind: 'still', source: src, name: String(name || id).replace(/\s+/g, ' ').trim(), lat: r5(lat), lon: r5(lon), status: 'live' }, extra);
}

/* ---------- 香港 運輸署 ---------- */
export async function fetchHongKong() {
  const rows = parseCSV(await getText(U('HONGKONG', 'https://static.data.gov.hk/td/traffic-snapshot-images/code/Traffic_Camera_Locations_En.csv')));
  const out = [];
  for (const r of rows) {
    const lat = Number(r.latitude), lon = Number(r.longitude);
    if (!r.key || !okLatLon(lat, lon) || !httpsUrl(r.url)) continue;
    out.push(baseRec('hongkong', r.key, (r.description || r.key).replace(/\s*\[[^\]]*\]\s*$/, ''), lat, lon,
      { nameEn: r.description || r.key, country: '香港', city: [r.district, r.region].filter(Boolean).join('・'), area: 'アジア', tz: 'Asia/Hong_Kong', images: [{ label: '画像', url: r.url }] }));
  }
  return out;
}

/* ---------- DriveBC ---------- */
export async function fetchDriveBC() {
  const rows = parseCSV(await getText(U('DRIVEBC', 'https://catalogue.data.gov.bc.ca/dataset/6b39a910-6c77-476f-ac96-7b4f18849b1c/resource/a9d52d85-8402-4ce7-b2ac-a2779837c48a/download/webcams.csv')));
  const out = [];
  for (const r of rows) {
    const lat = Number(r.latitude), lon = Number(r.longitude);
    if (!r.id || !okLatLon(lat, lon) || !httpsUrl(r.links_imageURL)) continue;
    if (r.credit && r.credit.trim()) continue;   // 第三者のクレジットがある画像は OGL-BC の対象外の可能性があるため除外
    out.push(baseRec('drivebc', r.id, r.camName, lat, lon,
      { nameEn: r.camName, country: 'カナダ', city: [r.highway_number ? 'Hwy ' + r.highway_number : '', r.region_name].filter(Boolean).join('・'), area: '南北アメリカ', tz: 'America/Vancouver',
        images: [{ label: r.orientation || '画像', url: r.links_imageURL }], viewNote: r.caption || '' }));
  }
  return out;
}

/* ---------- Transport for NSW ---------- */
export async function fetchNSW() {
  const j = JSON.parse(await getText(U('NSW', 'http://data.livetraffic.com/cameras/traffic-cam.json')));
  const out = [];
  for (const f of (j && j.features) || []) {
    const p = (f && f.properties) || {}; const c = f && f.geometry && f.geometry.coordinates;
    if (!f.id || !Array.isArray(c)) continue; const lon = Number(c[0]), lat = Number(c[1]);
    if (!okLatLon(lat, lon) || !httpsUrl(p.href)) continue;
    out.push(baseRec('nsw', f.id, p.title, lat, lon,
      { nameEn: p.title, country: 'オーストラリア', city: p.region ? String(p.region).replace(/_/g, ' ') : '', area: 'オセアニア・太平洋', tz: 'Australia/Sydney',
        images: [{ label: p.direction || '画像', url: p.href }], viewNote: p.view || '' }));
  }
  return out;
}

/* ---------- Transport for London JamCams（登録とキーがある場合のみ） ---------- */
export async function fetchTfL() {
  const key = process.env.TFL_APP_KEY || '';
  const j = await getJson(U('TFL', 'https://api.tfl.gov.uk/Place/Type/JamCam') + (key ? '?app_key=' + encodeURIComponent(key) : ''), {});
  const out = [];
  for (const p of Array.isArray(j) ? j : []) {
    const props = Object.fromEntries((p.additionalProperties || []).map(a => [a.key, a.value]));
    const lat = Number(p.lat), lon = Number(p.lon);
    if (!p.id || !okLatLon(lat, lon) || !httpsUrl(props.imageUrl)) continue;
    const avail = String(props.available).toLowerCase() !== 'false';
    out.push(baseRec('tfl', p.id, p.commonName, lat, lon,
      { nameEn: p.commonName, country: 'イギリス', city: 'ロンドン', area: 'ヨーロッパ', tz: 'Europe/London', images: [{ label: props.view || '画像', url: props.imageUrl }],
        status: avail ? 'live' : 'offline', statusDetail: avail ? undefined : '提供元の一覧で「利用不可」になっています' }));
  }
  return out;
}

/* ---------- Windy Webcams（既定で停止） ---------- */
export async function fetchWindy() {
  const S = SOURCES.windy; const key = process.env.WINDY_API_KEY || '';
  if (!key) throw new FetchError('WINDY_API_KEY が設定されていません');
  const out = []; const H = { 'x-windy-api-key': key };
  for (let offset = 0; offset < S.maxCams; offset += 50) {
    const j = await getJson(BASE.windy + '/webcams/api/v3/webcams?limit=50&offset=' + offset + '&sortKey=popularity&sortDirection=desc&include=location,player,urls', H);
    const list = (j && j.webcams) || [];
    for (const w of list) {
      const L = w.location || {}; const lat = Number(L.latitude), lon = Number(L.longitude);
      const embed = w.player && (w.player.live || w.player.day);
      if (!w.webcamId || !Number.isFinite(lat) || !Number.isFinite(lon) || typeof embed !== 'string' || !/^https:\/\//.test(embed)) continue;
      out.push({ id: 'wy-' + w.webcamId, kind: 'direct', source: 'windy', name: String(w.title || w.webcamId), country: String(L.country || ''), city: String(L.city || ''), area: '',
        lat, lon, tz: '', embedUrl: embed, status: w.status === 'active' ? 'live' : 'offline',
        pageUrl: (w.urls && w.urls.detail) || S.pageUrl });
    }
    if (list.length < 50) break;
  }
  return out;
}

/* ---------- YouTube：信頼済みチャンネルの新しいライブを「候補」として探す ---------- */
export async function discoverYouTube(videoReg, prevCand) {
  const key = process.env.YT_API_KEY || '';
  const cand = prevCand && Array.isArray(prevCand.candidates) ? prevCand : { schema: 1, meta: {}, candidates: [], channelCursor: 0 };
  if (!key) { cand.meta = { updatedAt: NOW.toISOString(), status: 'nokey', message: 'YT_API_KEY がないため候補探しを省略しました' }; return cand; }
  const MAX = Number(process.env.LIVECAM_DISCOVERY_SEARCH || 15);   // search.list 専用枠（1日100回）のうち、この処理で使う回数
  const channels = [...new Set((videoReg.cams || []).map(c => c.channelId).filter(Boolean))].sort();
  const known = new Set((videoReg.cams || []).flatMap(c => [c.videoId, c.originalVideoId, c.previousVideoId]).filter(Boolean));
  const dismissed = new Set((cand.candidates || []).filter(x => x.dismissed).map(x => x.videoId));
  let used = 0, i = cand.channelCursor || 0, found = 0;
  while (used < MAX && channels.length && used < channels.length) {
    const ch = channels[i % channels.length]; i++;
    const u = new URL(BASE.yt + '/search');
    for (const [k, v] of Object.entries({ part: 'snippet', channelId: ch, eventType: 'live', type: 'video', videoEmbeddable: 'true', maxResults: '25', fields: 'items(id(videoId),snippet(title,channelId,channelTitle))', key })) u.searchParams.set(k, v);
    let j; try { const r = await fetch(u); used++; j = await r.json(); if (!r.ok) { log('youtube search HTTP', r.status); break; } } catch (e) { log('youtube search failed'); break; }
    for (const it of j.items || []) {
      const v = it.id && it.id.videoId; if (!v || known.has(v) || dismissed.has(v)) continue;
      const ex = cand.candidates.find(x => x.videoId === v);
      if (ex) { ex.lastSeenAt = NOW.toISOString(); continue; }
      cand.candidates.push({ videoId: v, title: it.snippet.title, channelId: it.snippet.channelId, channelTitle: it.snippet.channelTitle, firstSeenAt: NOW.toISOString(), lastSeenAt: NOW.toISOString(),
        note: '位置が確認できないため自動登録していません。場所を確認できたら livecams.json に追加してください', dismissed: false });
      found++;
    }
  }
  cand.channelCursor = i % Math.max(1, channels.length);
  // 30日以上見かけない候補は整理
  cand.candidates = cand.candidates.filter(x => x.dismissed || (NOW - new Date(x.lastSeenAt)) / 864e5 < 30);
  cand.meta = { updatedAt: NOW.toISOString(), status: 'ok', message: 'チャンネル ' + used + ' 件を確認し、新しい候補 ' + found + ' 件', searchCalls: used };
  return cand;
}

/* ---------- まとめて実行 ---------- */
const ADAPTERS = { digitraffic: fetchDigitraffic, hongkong: fetchHongKong, drivebc: fetchDriveBC, nsw: fetchNSW, tfl: fetchTfL, caltrans: async () => { throw new FetchError('停止中'); }, windy: fetchWindy };
export async function run(prevReg) {
  const reg = prevReg && prevReg.schema === 1 && Array.isArray(prevReg.cams) ? prevReg : { schema: 1, meta: {}, cams: [] };
  reg.meta = reg.meta || {}; reg.meta.sources = reg.meta.sources || {};
  for (const [sid, S] of Object.entries(SOURCES)) {
    const info = { name: S.name, kind: S.kind, operator: S.operator || '', license: S.license.name, licenseUrl: S.license.url, attribution: S.license.attribution, termsUrl: S.termsUrl, pageUrl: S.pageUrl, interval: S.interval || null, intervalNote: S.intervalNote || '', enabled: S.enabled };
    if (!S.enabled) {
      reg.cams = reg.cams.filter(c => c.source !== sid);
      reg.meta.sources[sid] = Object.assign(info, { status: 'disabled', count: 0, message: (S.disabledMessage || '利用条件の確認が必要なため停止中') + '（通信しません）' });
      continue;
    }
    try {
      const got = await ADAPTERS[sid](reg.cams.filter(c => c.source === sid));
      if (!got.length) throw new FetchError('0件でした');
      reg.cams = reg.cams.filter(c => c.source !== sid).concat(got);
      reg.meta.sources[sid] = Object.assign(info, { status: 'ok', count: got.length, fetchedAt: NOW.toISOString(), message: got.length + '件を取得' });
      log(sid, 'ok', got.length);
    } catch (e) {
      const keep = reg.cams.filter(c => c.source === sid).length;
      reg.meta.sources[sid] = Object.assign({}, (reg.meta.sources[sid] || {}), info, { status: 'error', message: '取得に失敗しました（' + (e && e.message) + '）。前回の ' + keep + ' 件を残しています', errorAt: NOW.toISOString() });
      log(sid, 'error', e && e.message, '— kept', keep);
    }
  }
  // 重複IDの排除と並べ替え（提供元ごと・名前順）
  const seen = new Set(); reg.cams = reg.cams.filter(c => !seen.has(c.id) && seen.add(c.id)).sort((a, b) => a.source.localeCompare(b.source) || a.name.localeCompare(b.name));
  reg.meta.updatedAt = NOW.toISOString(); reg.meta.count = reg.cams.length;
  return reg;
}

async function readJson(f, dflt) { try { return JSON.parse(await readFile(f, 'utf8')); } catch { return dflt; } }

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const prev = await readJson(OUT, null);
    const reg = await run(prev);
    await writeFile(OUT, JSON.stringify(reg, null, 0).replace(/\},\{"id"/g, '},\n{"id"') + '\n');
    log('wrote', OUT, reg.cams.length, 'cameras');
  } catch (e) { console.error('[discover] 画像カメラの更新を中止しました（ファイルは変更していません）:', e && e.message); }
  try {
    const video = await readJson(VIDEO, { cams: [] });
    const cand = await discoverYouTube(video, await readJson(CAND, null));
    await writeFile(CAND, JSON.stringify(cand, null, 1) + '\n');
    log('wrote', CAND, cand.candidates.length, 'candidates ·', cand.meta.message);
  } catch (e) { console.error('[discover] YouTube候補の更新を中止しました:', e && e.message); }
  process.exit(0);
}

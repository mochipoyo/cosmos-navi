#!/usr/bin/env node
/*
 * 宇宙実測ナビ：新しいカメラの発見・登録（1日1回。配信状態の確認とは独立）
 *
 * 1) 公的機関の公開APIから「定期更新画像」カメラを取得し、webcams.json（カメラの台帳）に登録します。
 *    - 取得できた実在のカメラだけを登録し、ダミーや推測の地点は作りません。
 *    - 提供元ごとに「HTTPエラー／通信エラー／タイムアウト／解析エラー／データ形式の不一致／取得件数0／件数の異常な減少」を区別して記録します。
 *    - ある提供元が失敗・異常のときは、その提供元の前回の正常データを残します（ほかの提供元の更新は反映）。
 *    - 新しい台帳は検証してから保存します。検証に失敗した場合や、全体の件数が前回の70%未満に減った場合は保存せず（前回の台帳を維持）、
 *      終了コード1でワークフローを失敗にします。
 *    - 画像が今も更新されているかの確認は check-stills.mjs（2時間ごと）が行います。この台帳には「提供元の一覧に載っている」ことだけを記録します。
 * 2) YouTube：登録済みのチャンネルで始まった新しいライブを livecams-candidates.json に「候補」として書き出します（自動登録はしません）。
 *
 * 環境変数：YT_API_KEY / WINDY_API_KEY / TFL_APP_KEY（GitHub Secrets。ファイルやログには書きません）、DIGITRAFFIC_USER（既定 cosmos-navi/1.0）
 * 使い方： node scripts/discover-cams.mjs [webcams.json] [livecams.json] [livecams-candidates.json]
 * 終了コード： 0＝成功（一部の提供元の障害を含む） 1＝致命的なエラー（台帳は変更していません）
 */
import { pathToFileURL } from 'node:url';
import { CamError, fetchBody, fetchJson, parseDelimited, requireColumns, httpsUrl, okLatLon, checkStillCam, validateWebcams, readJson, writeJsonSafe, appendLog, gh } from './lib-cams.mjs';

const OUT = process.argv[2] || 'webcams.json';
const VIDEO = process.argv[3] || 'livecams.json';
const CAND = process.argv[4] || 'livecams-candidates.json';
const NOW = process.env.LIVECAM_NOW ? new Date(process.env.LIVECAM_NOW) : new Date();
const BASE = { digitraffic: process.env.DIGITRAFFIC_BASE || 'https://tie.digitraffic.fi', windy: process.env.WINDY_BASE || 'https://api.windy.com', yt: process.env.YT_API_BASE || 'https://www.googleapis.com/youtube/v3' };
const log = (...a) => console.log('[discover]', ...a);
const MIN_RATIO_SOURCE = 0.5;   // 提供元ごと：前回の50%未満に減ったら異常として前回分を残す
const MIN_RATIO_TOTAL = 0.7;    // 全体：前回の70%未満なら保存しない（致命的）

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
    xmlUrl: 'https://static.data.gov.hk/td/traffic-snapshot-images/code/Traffic_Camera_Locations_En.xml',
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

const PREFIX = { digitraffic: 'dt', hongkong: 'hk', drivebc: 'bc', nsw: 'nsw', tfl: 'tfl', caltrans: 'ca', windy: 'wy' };
const U = (name, dflt) => process.env['DISCOVER_URL_' + name] || dflt;   // テスト用に取得先を差し替え可能
const safeId = v => String(v).replace(/[^A-Za-z0-9_.-]/g, '');
const r5 = v => Math.round(v * 1e5) / 1e5;
/* 共通の台帳レコード。状態は「提供元の一覧に載っている」(listed) だけを記録し、更新の確認は check-stills.mjs に任せる */
function rec(src, id, name, lat, lon, extra) {
  return Object.assign({ id: PREFIX[src] + '-' + safeId(id), kind: 'still', source: src, name: String(name || id).replace(/\s+/g, ' ').trim(), lat: r5(lat), lon: r5(lon), listed: true }, extra);
}
/* 取得した行を検証し、不正な行の数を数える（不正な行は登録しない） */
function collect(rows, map, diag) {
  const out = []; let bad = 0;
  for (const r of rows) { let c = null; try { c = map(r); } catch { c = null; } if (!c) { bad++; continue; } if (checkStillCam(c).length) { bad++; continue; } out.push(c); }
  diag.rows = rows.length; diag.skipped = bad; return out;
}

/* ---------- Digitraffic weathercam ---------- */
export function niceFiName(raw) { return String(raw || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim(); }
export async function fetchDigitraffic(diag) {
  const H = { 'Digitraffic-User': process.env.DIGITRAFFIC_USER || 'cosmos-navi/1.0' };
  const st = await fetchJson(BASE.digitraffic + '/api/weathercam/v1/stations', { headers: H });
  if (!st || !Array.isArray(st.features)) throw new CamError('schema', 'features がありません');
  return collect(st.features, f => {
    const p = (f && f.properties) || {}; const g = f && f.geometry; const id = p.id || f.id;
    if (!id || !g || !Array.isArray(g.coordinates)) return null;
    const lon = Number(g.coordinates[0]), lat = Number(g.coordinates[1]); if (!okLatLon(lat, lon)) return null;
    if (p.collectionStatus && p.collectionStatus !== 'GATHERING') return null;   // 収集中のカメラだけ
    if (p.state === 'REMOVED') return null;
    const presets = (p.presets || []).filter(x => x && x.id && x.inCollection !== false); if (!presets.length) return null;
    return rec('digitraffic', id, niceFiName(p.name) || id, lat, lon, { country: 'フィンランド', city: '', area: 'ヨーロッパ', tz: 'Europe/Helsinki', providerActive: true,
      images: presets.map((x, i) => ({ label: '方向' + (i + 1), url: 'https://weathercam.digitraffic.fi/' + encodeURIComponent(x.id) + '.jpg', preset: x.id })) });
  }, diag);
}

/* ---------- 香港 運輸署（タブ区切り。文字コードは BOM で判定。CSV が読めないときは公式XMLで取得） ---------- */
export function parseHongKongXml(text) {
  const rows = [];
  for (const m of String(text).matchAll(/<image>([\s\S]*?)<\/image>/g)) {
    const o = {}; for (const t of m[1].matchAll(/<([a-z_]+)>([\s\S]*?)<\/\1>/g)) o[t[1]] = t[2].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").trim();
    rows.push(o);
  }
  return rows;
}
export async function fetchHongKong(diag) {
  const map = r => { const lat = Number(r.latitude), lon = Number(r.longitude); if (!r.key || !okLatLon(lat, lon) || !httpsUrl(r.url)) return null;
    return rec('hongkong', r.key, (r.description || r.key).replace(/\s*\[[^\]]*\]\s*$/, ''), lat, lon, { nameEn: r.description || r.key, country: '香港', city: [r.district, r.region].filter(Boolean).join('・'), area: 'アジア', tz: 'Asia/Hong_Kong', images: [{ label: '画像', url: r.url }] }); };
  let csvErr = null;
  try {
    const b = await fetchBody(U('HONGKONG', 'https://static.data.gov.hk/td/traffic-snapshot-images/code/Traffic_Camera_Locations_En.csv'));
    const p = parseDelimited(b.text); diag.encoding = b.encoding; diag.delimiter = p.delimiter === '\t' ? 'tab' : 'comma'; diag.header = p.header.slice(0, 10).join(',');
    requireColumns(p, ['key', 'latitude', 'longitude', 'url']);
    const out = collect(p.rows, map, diag); diag.format = 'csv';
    if (!out.length) throw new CamError('empty', 'CSV の有効な行が0件');
    return out;
  } catch (e) { csvErr = e; log('hongkong csv:', e.message, '→ XMLで再試行'); }
  const b = await fetchBody(U('HONGKONG_XML', SOURCES.hongkong.xmlUrl));
  const rows = parseHongKongXml(b.text); diag.format = 'xml'; diag.csvError = csvErr && csvErr.message; diag.encoding = b.encoding;
  if (!rows.length) throw new CamError(/<image-list[\s>]/.test(b.text) ? 'empty' : 'parse', 'XML に image 要素がありません（CSV：' + (csvErr && csvErr.message) + '）');
  return collect(rows, map, diag);
}

/* ---------- DriveBC ---------- */
export async function fetchDriveBC(diag) {
  const b = await fetchBody(U('DRIVEBC', 'https://catalogue.data.gov.bc.ca/dataset/6b39a910-6c77-476f-ac96-7b4f18849b1c/resource/a9d52d85-8402-4ce7-b2ac-a2779837c48a/download/webcams.csv'));
  const p = parseDelimited(b.text); diag.encoding = b.encoding; diag.header = p.header.slice(0, 13).join(',');
  requireColumns(p, ['id', 'camName', 'links_imageURL', 'latitude', 'longitude']);
  let credited = 0;
  const out = collect(p.rows, r => { const lat = Number(r.latitude), lon = Number(r.longitude);
    if (!r.id || !okLatLon(lat, lon) || !httpsUrl(r.links_imageURL)) return null;
    if (r.credit && r.credit.trim()) { credited++; return undefined; }   // 第三者クレジットの画像は OGL-BC の対象外の可能性があるため除外
    return rec('drivebc', r.id, r.camName, lat, lon, { country: 'カナダ', city: [r.highway_number ? 'Hwy ' + r.highway_number : '', r.region_name].filter(Boolean).join('・'), area: '南北アメリカ', tz: 'America/Vancouver',
      images: [{ label: r.orientation || '画像', url: r.links_imageURL }], viewNote: r.caption || '' }); }, diag);
  diag.excludedCredited = credited; diag.skipped -= credited; return out;
}

/* ---------- Transport for NSW ---------- */
export async function fetchNSW(diag) {
  const j = await fetchJson(U('NSW', 'http://data.livetraffic.com/cameras/traffic-cam.json'));
  if (!j || !Array.isArray(j.features)) throw new CamError('schema', 'features がありません');
  return collect(j.features, f => { const p = (f && f.properties) || {}; const c = f && f.geometry && f.geometry.coordinates;
    if (!f || !f.id || !Array.isArray(c)) return null; const lon = Number(c[0]), lat = Number(c[1]); if (!okLatLon(lat, lon) || !httpsUrl(p.href)) return null;
    return rec('nsw', f.id, p.title, lat, lon, { country: 'オーストラリア', city: p.region ? String(p.region).replace(/_/g, ' ') : '', area: 'オセアニア・太平洋', tz: 'Australia/Sydney',
      images: [{ label: p.direction || '画像', url: p.href }], viewNote: p.view || '' }); }, diag);
}

/* ---------- Transport for London JamCams（登録とキーがある場合のみ） ---------- */
export async function fetchTfL(diag) {
  const key = process.env.TFL_APP_KEY || '';
  const j = await fetchJson(U('TFL', 'https://api.tfl.gov.uk/Place/Type/JamCam') + (key ? '?app_key=' + encodeURIComponent(key) : ''));
  if (!Array.isArray(j)) throw new CamError('schema', '配列ではありません');
  return collect(j, p => { const props = Object.fromEntries((p.additionalProperties || []).map(a => [a.key, a.value])); const lat = Number(p.lat), lon = Number(p.lon);
    if (!p.id || !okLatLon(lat, lon) || !httpsUrl(props.imageUrl)) return null;
    return rec('tfl', p.id, p.commonName, lat, lon, { country: 'イギリス', city: 'ロンドン', area: 'ヨーロッパ', tz: 'Europe/London', images: [{ label: props.view || '画像', url: props.imageUrl }],
      providerActive: String(props.available).toLowerCase() !== 'false' }); }, diag);
}

/* ---------- Windy Webcams（既定で停止） ---------- */
export async function fetchWindy(diag) {
  const S = SOURCES.windy; const key = process.env.WINDY_API_KEY || ''; if (!key) throw new CamError('disabled', 'WINDY_API_KEY がありません');
  const out = [];
  for (let offset = 0; offset < S.maxCams; offset += 50) {
    const j = await fetchJson(BASE.windy + '/webcams/api/v3/webcams?limit=50&offset=' + offset + '&sortKey=popularity&sortDirection=desc&include=location,player,urls', { headers: { 'x-windy-api-key': key } });
    const list = (j && j.webcams) || [];
    out.push(...collect(list, w => { const L = w.location || {}; const lat = Number(L.latitude), lon = Number(L.longitude); const embed = w.player && (w.player.live || w.player.day);
      if (!w.webcamId || !okLatLon(lat, lon) || !httpsUrl(embed)) return null;
      return { id: 'wy-' + w.webcamId, kind: 'direct', source: 'windy', name: String(w.title || w.webcamId), country: String(L.country || ''), city: String(L.city || ''), area: '', lat, lon, tz: '', embedUrl: embed, listed: true, providerActive: w.status === 'active', pageUrl: (w.urls && w.urls.detail) || S.pageUrl }; }, {}));
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
const ADAPTERS = { digitraffic: fetchDigitraffic, hongkong: fetchHongKong, drivebc: fetchDriveBC, nsw: fetchNSW, tfl: fetchTfL, caltrans: async () => { throw new CamError('disabled'); }, windy: fetchWindy };
export async function run(prevReg) {
  const prev = prevReg && prevReg.schema === 1 && Array.isArray(prevReg.cams) ? prevReg : { schema: 1, meta: {}, cams: [] };
  const reg = { schema: 1, meta: { sources: Object.assign({}, (prev.meta && prev.meta.sources) || {}) }, cams: [] };
  const prevBySrc = {}; for (const c of prev.cams) (prevBySrc[c.source] = prevBySrc[c.source] || []).push(c);
  const prevById = new Map(prev.cams.map(c => [c.id, c]));
  const summary = {};
  for (const [sid, S] of Object.entries(SOURCES)) {
    const info = { name: S.name, kind: S.kind, operator: S.operator || '', license: S.license.name, licenseUrl: S.license.url, attribution: S.license.attribution, termsUrl: S.termsUrl, pageUrl: S.pageUrl, interval: S.interval || null, intervalNote: S.intervalNote || '', enabled: S.enabled };
    const before = (prevBySrc[sid] || []).length;
    if (!S.enabled) {
      reg.meta.sources[sid] = Object.assign(info, { status: 'disabled', count: 0, message: (S.disabledMessage || '利用条件の確認が必要なため停止中') + '（通信しません）' });
      summary[sid] = { status: 'disabled', count: 0 }; continue;
    }
    const diag = {};
    try {
      const got = await ADAPTERS[sid](diag);
      if (!got.length) throw new CamError('empty', diag.rows != null ? '元データ ' + diag.rows + ' 行のうち有効な行が0' : '');
      if (before >= 20 && got.length < before * MIN_RATIO_SOURCE) throw new CamError('anomaly', '前回 ' + before + ' 件 → 今回 ' + got.length + ' 件');
      // 初めて登録された日時（新着順の並べ替えに使う）を引き継ぐ
      for (const c of got) { const p = prevById.get(c.id); c.addedAt = (p && p.addedAt) || NOW.toISOString(); }
      reg.cams.push(...got);
      reg.meta.sources[sid] = Object.assign(info, { status: 'ok', count: got.length, fetchedAt: NOW.toISOString(), message: got.length + '件を取得' + (diag.skipped ? '（不正な行 ' + diag.skipped + ' 件を除外）' : '') + (diag.excludedCredited ? '（第三者クレジット ' + diag.excludedCredited + ' 件を除外）' : ''), diag });
      summary[sid] = { status: 'ok', count: got.length, skipped: diag.skipped || 0 };
      log(sid, 'ok', got.length, JSON.stringify(diag));
    } catch (e) {
      const kind = e instanceof CamError ? e.kind : 'parse';
      const keep = prevBySrc[sid] || [];
      reg.cams.push(...keep);
      const p = (prev.meta && prev.meta.sources && prev.meta.sources[sid]) || {};
      reg.meta.sources[sid] = Object.assign({}, info, { status: 'error', errorKind: kind, count: keep.length, fetchedAt: p.fetchedAt || null, errorAt: NOW.toISOString(),
        message: (e && e.message) + '。前回の ' + keep.length + ' 件を残しています', diag });
      summary[sid] = { status: 'error', errorKind: kind, count: keep.length, message: e && e.message };
      gh.warn(sid + '：' + (e && e.message) + '（前回の ' + keep.length + ' 件を維持）');
    }
  }
  const seen = new Set(); reg.cams = reg.cams.filter(c => !seen.has(c.id) && seen.add(c.id)).sort((a, b) => a.source.localeCompare(b.source) || a.name.localeCompare(b.name));
  reg.meta.updatedAt = NOW.toISOString(); reg.meta.count = reg.cams.length;
  const enabled = Object.values(summary).filter(x => x.status !== 'disabled');
  const allFailed = enabled.length > 0 && enabled.every(x => x.status === 'error');
  return { reg, prevCount: prev.cams.length, summary, allFailed };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let fatal = null; const t0 = Date.now(); let result = null; let wrote = false;
  try {
    const prev = await readJson(OUT, null);
    if (prev !== null) { const v = validateWebcams(prev); if (!v.ok) gh.warn('前回の ' + OUT + ' に検証エラーがあります（' + v.errors.slice(0, 3).join(' / ') + '）'); }
    result = await run(prev);
    const v = validateWebcams(result.reg);
    if (!v.ok) throw new CamError('invalid', v.errors.slice(0, 5).join(' / '));
    if (result.prevCount >= 50 && result.reg.cams.length < result.prevCount * MIN_RATIO_TOTAL) throw new CamError('anomaly', '全体の件数 ' + result.prevCount + ' → ' + result.reg.cams.length);
    await writeJsonSafe(OUT, result.reg, true);   // 失敗した提供元は前回のデータのまま、エラー内容だけ記録
    wrote = true;
    log('wrote', OUT, result.reg.cams.length, 'cameras');
    if (result.allFailed) throw new CamError('network', 'すべての提供元から取得できませんでした（前回のデータを維持）');
  } catch (e) { fatal = e; gh.error((wrote ? 'カメラは前回の登録のまま、エラー内容だけ記録しました：' : '画像カメラの台帳を更新しませんでした（前回の台帳を維持）：') + (e && e.message)); }
  let candMsg = '';
  try {
    const video = await readJson(VIDEO, { cams: [] });
    const cand = await discoverYouTube(video, await readJson(CAND, null));
    await writeJsonSafe(CAND, cand); candMsg = cand.meta.message; log('wrote', CAND, cand.candidates.length, 'candidates ·', cand.meta.message);
  } catch (e) { gh.warn('YouTube候補の更新に失敗：' + (e && e.message)); candMsg = 'error: ' + (e && e.message); }
  await appendLog({ at: NOW.toISOString(), job: 'discover', ok: !fatal, fatal: fatal ? fatal.message : null, total: result ? result.reg.cams.length : null, previous: result ? result.prevCount : null, sources: result ? result.summary : null, youtube: candMsg, ms: Date.now() - t0 });
  process.exit(fatal ? 1 : 0);
}

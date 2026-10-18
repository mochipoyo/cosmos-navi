#!/usr/bin/env node
/*
 * 宇宙実測ナビ：地名データの作成（地球ライブの地名ラベルと地名検索に使います）
 *
 * 入力（どちらも実在の地理データだけを使い、地名や位置を作り出すことはしません）
 *   - Natural Earth 10m（パブリックドメイン）… 大陸・海・国・州/県・主要都市・山脈・砂漠・島・湖・川・空港・港
 *       https://www.naturalearthdata.com/ （GeoJSON版：github.com/nvkelso/natural-earth-vector）
 *   - GeoNames（CC BY 4.0）… 人口1,000人以上の市町村、Wikipediaの記事がある地区・駅・空港・港・山・湖・島・名所など
 *       https://www.geonames.org/ （https://download.geonames.org/export/dump/）
 * 出力（geo/ フォルダ。ブラウザは必要な部分だけを読み込みます）
 *   geo/meta.json  … 出典・件数・国名と行政区画名の辞書
 *   geo/base.json  … 広域で表示する地名（Natural Earth）
 *   geo/d/<帯>/<緯度>_<経度>.json … 拡大したときに読み込む地名（GeoNames、ズーム帯と範囲で分割）
 *   geo/s/<先頭文字>.json … 地名検索の索引（先頭の文字で分割）
 *
 * 日本語名の優先順位：①確認された日本語名（GeoNames の言語コード ja の別名のうち「優先」、Natural Earth の name_ja）
 *   ②現地の正式名称（GeoNames の name）③英語名 ④その他の確認された表記。見つからない日本語名は作りません（空欄）。
 *
 * 使い方：
 *   node scripts/build-geo.mjs --ne <Natural Earth の geojson フォルダ> [--geonames <GeoNames のフォルダ>] [--out geo]
 *   GeoNames のフォルダには cities1000.zip / allCountries.zip / alternateNamesV2.zip / admin1CodesASCII.txt / countryInfo.txt を置きます
 *   （GitHub Actions の build-geo.yml が公式サイトから取得します）。
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => { if (v.startsWith('--')) a.push([v.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]); return a; }, []));
const log = (...a) => console.log('[geo]', ...a);

/* ---------- 共通 ---------- */
export const r4 = v => Math.round(v * 1e3) / 1e3;   // about 100 m: enough for a label position
export function normKey(s) {   // 検索用：全角半角・大文字小文字・ひらがな/カタカナの違いをそろえる
  return String(s || '').normalize('NFKC').toLowerCase().replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 0x60)).replace(/[\s'’`.\-‐－_・,()（）]/g, '');
}
export function shardKey(n) { if (!n) return ''; const c = n.codePointAt(0); return c >= 0x2e80 ? String.fromCodePoint(c) : n.slice(0, 2); }
export function shardFile(k) { return [...k].map(ch => ch.codePointAt(0).toString(16)).join('-'); }
function linesOf(file, member) {
  if (file.endsWith('.zip')) { const p = spawn('unzip', ['-p', file, member]); p.on('error', e => { throw e; }); return readline.createInterface({ input: p.stdout, crlfDelay: Infinity }); }
  return readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
}
function ringCentroid(ring) { let a = 0, x = 0, y = 0; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const f = ring[j][0] * ring[i][1] - ring[i][0] * ring[j][1]; a += f; x += (ring[j][0] + ring[i][0]) * f; y += (ring[j][1] + ring[i][1]) * f; } if (!a) return [ring[0][0], ring[0][1], 0]; return [x / (3 * a), y / (3 * a), Math.abs(a / 2)]; }
/* label point of a (multi)polygon: centroid of its largest ring (a common cartographic choice; marked as the label position, not a surveyed point) */
export function labelPoint(geom) {
  if (!geom || !geom.coordinates) return null;
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.type === 'MultiPolygon' ? geom.coordinates : null;
  if (!polys) { if (geom.type === 'Point') return geom.coordinates; if (geom.type === 'LineString') return geom.coordinates[Math.floor(geom.coordinates.length / 2)]; if (geom.type === 'MultiLineString' && geom.coordinates.length) { const L = geom.coordinates.reduce((a, b) => b.length > a.length ? b : a, []); return L.length ? L[Math.floor(L.length / 2)] : null; } return null; }
  let best = null; for (const p of polys) { const c = ringCentroid(p[0]); if (!best || c[2] > best[2]) best = c; }
  return best ? [best[0], best[1]] : null;
}
const okLL = (lat, lon) => Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

/* ---------- 種類（表示の色・検索結果の「種類」に使います） ---------- */
export const KINDS = { cont: '大陸', ocean: '大洋', sea: '海', bay: '湾', strait: '海峡', country: '国・地域', admin1: '州・県・省', capital: '首都', city: '都市', town: '町', village: '村・集落', district: '地区', island: '島', islands: '諸島', peninsula: '半島・岬', mountain: '山', range: '山脈', volcano: '火山', region: '地形', desert: '砂漠', lake: '湖', river: '川', waterfall: '滝', airport: '空港', port: '港', station: '駅', landmark: '名所', park: '公園・保護区' };

/* ---------- Natural Earth ---------- */
function neRead(dir, name) { const f = path.join(dir, name + '.geojson'); if (!fs.existsSync(f)) { log('なし', name); return []; } return JSON.parse(fs.readFileSync(f, 'utf8')).features; }
const P = (o, k) => o[k] != null ? o[k] : o[k.toUpperCase()] != null ? o[k.toUpperCase()] : o[k.toLowerCase()];
export function loadNE(dir) {
  const out = [];
  const add = (src, f, kind, minZ, extra) => { const p = f.properties; let lat, lon;
    if (extra && extra.ll) [lon, lat] = extra.ll; else { const lp = labelPoint(f.geometry || {}); if (!lp) return; [lon, lat] = lp; }
    if (!okLL(lat, lon)) return; const ja = String(P(p, 'name_ja') || '').trim(); const local = String(P(p, 'name') || '').trim(); const en = String(P(p, 'name_en') || '').trim();
    if (!ja && !local && !en) return;
    out.push(Object.assign({ id: 'n' + Number(P(p, 'ne_id') || out.length).toString(36), src: 'ne', lat: r4(lat), lon: r4(lon), kind, minZ, ja, local, en, cc: String(P(p, 'iso_a2') || '').replace('-99', ''), adm: '', pop: 0, wd: P(p, 'wikidataid') || '' }, extra && extra.o));
  };
  for (const f of neRead(dir, 'ne_10m_geography_regions_polys')) { const c = String(P(f.properties, 'featurecla') || ''); const ml = +P(f.properties, 'min_label') || 4;
    const kind = c === 'Continent' ? 'cont' : /Island group/.test(c) ? 'islands' : /Island/.test(c) ? 'island' : /Pen|cape|Isthmus/.test(c) ? 'peninsula' : /Range/.test(c) ? 'range' : /Desert/.test(c) ? 'desert' : c === 'Lake' ? 'lake' : 'region';
    add('ne', f, kind, kind === 'cont' ? 0 : Math.max(2, ml), kind === 'cont' ? { o: { maxZ: 3.5 } } : null); }
  for (const f of neRead(dir, 'ne_10m_geography_marine_polys')) { const c = String(P(f.properties, 'featurecla') || ''); const ml = +P(f.properties, 'min_label') || 4;
    const kind = c === 'ocean' ? 'ocean' : /bay|gulf|sound|fjord|inlet|lagoon/.test(c) ? 'bay' : /strait|channel/.test(c) ? 'strait' : 'sea';
    add('ne', f, kind, kind === 'ocean' ? 0 : Math.max(1.5, ml), kind === 'ocean' ? { o: { maxZ: 5 } } : null); }
  for (const f of neRead(dir, 'ne_10m_admin_0_countries')) { const p = f.properties;
    add('ne', f, 'country', Math.max(1, +P(p, 'min_label') || 3), { ll: [+P(p, 'label_x'), +P(p, 'label_y')], o: { cc: String(P(p, 'iso_a2') || '').replace('-99', '') } }); }
  for (const f of neRead(dir, 'ne_10m_admin_1_states_provinces')) { const p = f.properties; const lat = +P(p, 'latitude'), lon = +P(p, 'longitude');
    add('ne', f, 'admin1', Math.max(3, +P(p, 'min_label') || 5), okLL(lat, lon) ? { ll: [lon, lat] } : null); }
  for (const f of neRead(dir, 'ne_10m_populated_places')) { const p = f.properties; const c = String(P(p, 'featurecla') || '');
    const kind = /Admin-0 capital/.test(c) ? 'capital' : 'city'; const pop = +P(p, 'pop_max') || 0;
    add('ne', f, kind, Math.max(2, +P(p, 'min_zoom') || 5), { ll: [+P(p, 'longitude'), +P(p, 'latitude')], o: { pop, adm: P(p, 'adm1name') ? 'ne:' + P(p, 'adm1name') : '' } }); }
  for (const f of neRead(dir, 'ne_10m_geography_regions_elevation_points')) { const p = f.properties; const c = String(P(p, 'featurecla') || '');
    if (!/mountain|spot/.test(c)) continue; add('ne', f, 'mountain', Math.max(4, +P(p, 'min_zoom') || 6), { o: { elev: +P(p, 'elevation') || 0 } }); }
  for (const f of neRead(dir, 'ne_10m_geography_regions_points')) { const c = String(P(f.properties, 'featurecla') || '');
    const kind = /waterfall/.test(c) ? 'waterfall' : /island group/.test(c) ? 'islands' : /island/.test(c) ? 'island' : /cape/.test(c) ? 'peninsula' : 'region'; add('ne', f, kind, Math.max(4, +P(f.properties, 'min_zoom') || 5)); }
  for (const f of neRead(dir, 'ne_10m_lakes')) { const p = f.properties; if (!P(p, 'name')) continue; add('ne', f, 'lake', Math.max(3, +P(p, 'min_label') || 6)); }
  for (const f of neRead(dir, 'ne_10m_rivers_lake_centerlines')) { const p = f.properties; if (!P(p, 'name')) continue; add('ne', f, 'river', Math.max(4, +P(p, 'min_label') || 6)); }
  for (const f of neRead(dir, 'ne_10m_airports')) { const p = f.properties; const t = String(P(p, 'type') || ''); add('ne', f, 'airport', /major/.test(t) ? 6 : 7.5, { o: { iata: P(p, 'iata_code') || '' } }); }
  for (const f of neRead(dir, 'ne_10m_ports')) { add('ne', f, 'port', 7.5 + Math.min(2, (+P(f.properties, 'scalerank') || 0) / 4)); }
  /* the same river is drawn as several lines: keep one label per name */
  const seen = new Set(); return out.filter(e => { if (e.kind !== 'river') return true; const k = e.en || e.local; if (seen.has(k)) return false; seen.add(k); return true; });
}

/* ---------- GeoNames ---------- */
/* feature codes taken from allCountries.txt (only places that have a Wikipedia article in GeoNames' alternate names, to keep the data to notable places) */
export const GN_FEAT = { PPLX: 'district', RSTN: 'station', MTRO: 'station', AIRP: 'airport', PRT: 'port', HBR: 'port', MT: 'mountain', PK: 'mountain', MTS: 'range', VLC: 'volcano', ISL: 'island', ISLS: 'islands', PEN: 'peninsula', CAPE: 'peninsula',
  LK: 'lake', LKS: 'lake', RSV: 'lake', BAY: 'bay', STRT: 'strait', SEA: 'sea', GULF: 'bay', STM: 'river', FLLS: 'waterfall', MNMT: 'landmark', CSTL: 'landmark', TMPL: 'landmark', SHRN: 'landmark', MUS: 'landmark', HSTS: 'landmark', RUIN: 'landmark', TOWR: 'landmark', BDG: 'landmark', PAL: 'landmark', ZOO: 'park', PRK: 'park', RESN: 'park', AMUS: 'landmark' };
export function cityMinZ(pop, code) { if (code === 'PPLC') return 4; if (pop >= 1e6) return 4.5; if (pop >= 3e5) return 5.5; if (pop >= 1e5) return 6.5; if (pop >= 3e4) return 7.5; if (pop >= 1e4) return 8.5; if (pop >= 3e3) return 9.5; return 10.5; }
export function featMinZ(kind) { return { range: 7, volcano: 8, mountain: 8.5, island: 8, islands: 7.5, peninsula: 9, lake: 8.5, bay: 8, strait: 8, sea: 6, river: 8.5, waterfall: 10, airport: 8.5, port: 9.5, station: 11, district: 11, landmark: 11, park: 10 }[kind] || 10; }
export function cityKind(pop, code) { if (code === 'PPLC') return 'capital'; if (pop >= 1e5) return 'city'; if (pop >= 5e3) return 'town'; return 'village'; }

export async function loadGeoNames(dir) {
  const F = n => path.join(dir, n);
  const countries = {};   // cc → {gid, name}
  for await (const l of linesOf(F('countryInfo.txt'))) { if (!l || l[0] === '#') continue; const c = l.split('\t'); countries[c[0]] = { gid: c[16], name: c[4] }; }
  const admin1 = {};      // "CC.code" → {gid, name}
  for await (const l of linesOf(F('admin1CodesASCII.txt'))) { const c = l.split('\t'); if (c.length >= 4) admin1[c[0]] = { gid: c[3], name: c[1] }; }
  const places = new Map();
  const row = (c, kind, minZ) => ({ id: +c[0], src: 'gn', lat: r4(+c[4]), lon: r4(+c[5]), kind, minZ, ja: '', local: c[1], en: '', cc: c[8], adm: c[8] + '.' + c[10], pop: +c[14] || 0, fcode: c[7] });
  let nc = 0;
  for await (const l of linesOf(F('cities1000.zip'), 'cities1000.txt')) { const c = l.split('\t'); if (c.length < 15 || !okLL(+c[4], +c[5])) continue; const pop = +c[14] || 0;
    places.set(+c[0], row(c, cityKind(pop, c[7]), cityMinZ(pop, c[7]))); nc++; }
  log('GeoNames 市町村', nc);
  const cand = new Map(); let nf = 0;
  for await (const l of linesOf(F('allCountries.zip'), 'allCountries.txt')) { const c = l.split('\t', 15); const kind = GN_FEAT[c[7]]; if (!kind) continue; if (!okLL(+c[4], +c[5]) || places.has(+c[0])) continue;
    cand.set(+c[0], row(c, kind, featMinZ(kind))); nf++; }
  log('GeoNames 地物の候補', nf);
  /* alternate names: Japanese, English and Wikipedia links (the link marks a notable place) */
  const want = id => places.has(id) || cand.has(id);
  const extraIds = new Set([...Object.values(countries).map(v => +v.gid), ...Object.values(admin1).map(v => +v.gid)]);
  const alt = new Map(); // id → {ja, jaPref, en, enPref, link}
  for await (const l of linesOf(F('alternateNamesV2.zip'), 'alternateNamesV2.txt')) { const c = l.split('\t'); const lang = c[2]; if (lang !== 'ja' && lang !== 'en' && lang !== 'link') continue;
    const id = +c[1]; if (!want(id) && !extraIds.has(id)) continue; if (c[6] === '1' || c[7] === '1') continue; // colloquial / historic names are not used
    let a = alt.get(id); if (!a) { a = {}; alt.set(id, a); }
    if (lang === 'link') { if (/wikipedia\.org/.test(c[3])) a.link = 1; continue; }
    const pref = c[4] === '1'; if (lang === 'ja') { if (!a.ja || (pref && !a.jaPref)) { a.ja = c[3]; a.jaPref = pref; } } else { if (!a.en || (pref && !a.enPref)) { a.en = c[3]; a.enPref = pref; } } }
  for (const [id, e] of cand) { const a = alt.get(id); if (a && a.link) places.set(id, e); }
  for (const [id, e] of places) { const a = alt.get(id); if (a) { e.ja = a.ja || ''; e.en = a.en || ''; if (a.link) e.wiki = 1; } }
  const admins = {}; for (const [k, v] of Object.entries(admin1)) { const a = alt.get(+v.gid) || {}; admins[k] = [a.ja || '', v.name]; }
  const ctry = {}; for (const [k, v] of Object.entries(countries)) { const a = alt.get(+v.gid) || {}; ctry[k] = [a.ja || '', v.name]; }
  log('GeoNames 地名（市町村＋注目地物）', places.size);
  return { places: [...places.values()], admins, countries: ctry };
}

/* ---------- まとめて出力 ---------- */
export function importance(e) {   // 0..100：重なったときにどちらを残すか
  const base = { cont: 99, ocean: 98, country: 95, capital: 90, admin1: 70, sea: 72, range: 60, desert: 55, islands: 55, city: 60, lake: 55, island: 50, bay: 50, strait: 50, peninsula: 45, mountain: 45, volcano: 50, river: 45, airport: 40, town: 35, region: 40, port: 30, park: 30, waterfall: 30, landmark: 30, station: 25, village: 20, district: 20 }[e.kind] || 20;
  const p = e.pop ? Math.min(30, Math.log10(e.pop + 1) * 3.5) : 0; return Math.max(1, Math.round(base + p - e.minZ * 1.5));
}
const KCODE = Object.fromEntries(Object.keys(KINDS).map((k, i) => [k, i]));
export function pack(e) { const r = [e.id, e.lat, e.lon, KCODE[e.kind], Math.round(e.minZ * 10), importance(e), e.ja || '', e.local || '', e.en && e.en !== e.local ? e.en : '', e.cc || '', e.adm || '', e.pop || 0]; if (e.maxZ) r.push(Math.round(e.maxZ * 10)); return r; }
export const BASE_MAXZ = 5;   // labels from this zoom on are in tiles
export const BANDS = [{ name: 'a', min: 0, max: 7, cell: 30 }, { name: 'b', min: 7, max: 9, cell: 10 }, { name: 'c', min: 9, max: 10.5, cell: 4 }, { name: 'd', min: 10.5, max: 99, cell: 2 }];
export function bandOf(minZ) { return BANDS.find(b => minZ >= b.min && minZ < b.max); }
export function tileKey(b, lat, lon) { return Math.floor((lat + 90) / b.cell) + '_' + Math.floor((lon + 180) / b.cell); }

/* duplicates between Natural Earth and GeoNames (same place, within 15 km, same name in some language): keep Natural Earth's label settings, take GeoNames' Japanese name if Natural Earth has none */
export function dedupe(ne, gn) {
  const grid = new Map(); const gk = (la, lo) => Math.floor(la * 5) + ':' + Math.floor(lo * 5);
  for (const e of ne) { if (!/city|capital/.test(e.kind)) continue; const k = gk(e.lat, e.lon); (grid.get(k) || grid.set(k, []).get(k)).push(e); }
  const km = (a, b) => { const r = Math.PI / 180, d = Math.sin((b.lat - a.lat) * r / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin((b.lon - a.lon) * r / 2) ** 2; return 12742 * Math.asin(Math.sqrt(d)); };
  const names = e => new Set([e.ja, e.local, e.en].filter(Boolean).map(normKey));
  const out = []; let merged = 0;
  for (const g of gn) { if (!/city|capital|town|village/.test(g.kind)) { out.push(g); continue; } let hit = null; const gnN = names(g);
    for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1 && !hit; dx++) { const L = grid.get((Math.floor(g.lat * 5) + dy) + ':' + (Math.floor(g.lon * 5) + dx)); if (!L) continue;
      for (const n of L) { if (km(n, g) < 15 && [...names(n)].some(x => gnN.has(x))) { hit = n; break; } } }
    if (hit) { merged++; if (!hit.ja && g.ja) hit.ja = g.ja; if (!hit.pop && g.pop) hit.pop = g.pop; if (g.adm && !hit.adm.startsWith(g.cc)) hit.adm = g.adm; hit.gid = g.id; continue; }
    out.push(g); }
  log('重複をまとめた件数', merged); return out;
}

export function writeAll(outDir, ne, gn, dicts, sources) {
  fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
  const all = ne.concat(gn);
  /* base: Natural Earth (shown from far away); detail tiles: GeoNames, by zoom band and area */
  const baseRows = all.filter(e => e.minZ < BASE_MAXZ).map(pack).sort((a, b) => b[5] - a[5]);
  fs.writeFileSync(path.join(outDir, 'base.json'), JSON.stringify({ v: 1, rows: baseRows }));
  const tiles = new Map();
  for (const e of all) { if (e.minZ < BASE_MAXZ) continue; const b = bandOf(e.minZ); const k = b.name + '/' + tileKey(b, e.lat, e.lon); (tiles.get(k) || tiles.set(k, []).get(k)).push(pack(e)); }
  const index = {};
  for (const [k, rows] of tiles) { const [b, t] = k.split('/'); fs.mkdirSync(path.join(outDir, 'd', b), { recursive: true }); rows.sort((x, y) => y[5] - x[5]); fs.writeFileSync(path.join(outDir, 'd', b, t + '.json'), JSON.stringify(rows)); (index[b] = index[b] || []).push(t); }
  /* search index: every name variant, sharded by its first character (or first two letters) */
  const shards = new Map();
  for (const e of all) { const row = [e.ja || '', e.local || '', e.en && e.en !== e.local ? e.en : '', e.lat, e.lon, KCODE[e.kind], e.cc || '', e.adm || '', e.pop || 0, e.id, importance(e)];
    const keys = new Set(); for (const n of [e.ja, e.local, e.en]) { const k = shardKey(normKey(n)); if (k) keys.add(k); }
    for (const k of keys) (shards.get(k) || shards.set(k, []).get(k)).push(row); }
  fs.mkdirSync(path.join(outDir, 's'), { recursive: true });
  for (const [k, rows] of shards) { rows.sort((a, b) => b[10] - a[10]); fs.writeFileSync(path.join(outDir, 's', shardFile(k) + '.json'), JSON.stringify(rows)); }
  const meta = { v: 1, generatedAt: new Date().toISOString(), sources, kinds: Object.keys(KINDS).map(k => [k, KINDS[k]]), bands: BANDS, tiles: index,
    baseMaxZ: BASE_MAXZ, counts: { base: baseRows.length, ne: ne.length, geonames: gn.length, shards: shards.size, tiles: tiles.size }, countries: dicts.countries || {}, admins: dicts.admins || {} };
  fs.writeFileSync(path.join(outDir, 'meta.json'), JSON.stringify(meta));
  return meta.counts;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const neDir = args.ne || 'ne'; const out = args.out || 'geo';
  const sources = [{ name: 'Natural Earth（10m）', license: 'パブリックドメイン', url: 'https://www.naturalearthdata.com/', attribution: 'Made with Natural Earth. Free vector and raster map data @ naturalearthdata.com.' }];
  const ne = loadNE(neDir); log('Natural Earth', ne.length);
  /* country names in Japanese from Natural Earth (used when GeoNames is not present) */
  const dicts = { countries: {}, admins: {} };
  for (const e of ne) { if (e.kind === 'country' && e.cc) dicts.countries[e.cc] = [e.ja, e.en || e.local]; }
  let gn = [];
  if (args.geonames) {
    const g = await loadGeoNames(args.geonames);
    for (const [k, v] of Object.entries(g.countries)) { const c = dicts.countries[k]; dicts.countries[k] = [(c && c[0]) || v[0], v[1]]; }
    dicts.admins = g.admins; gn = dedupe(ne, g.places);
    sources.push({ name: 'GeoNames', license: 'CC BY 4.0', url: 'https://www.geonames.org/', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/', attribution: 'GeoNames（www.geonames.org）、CC BY 4.0', downloadedAt: args.geonamesDate || new Date().toISOString().slice(0, 10),
      note: '人口1,000人以上の市町村（cities1000）と、Wikipediaの記事がある地物（allCountries から抽出）。日本語名・英語名は alternateNamesV2（俗称・旧称は除外）。' });
  }
  const counts = writeAll(out, ne, gn, dicts, sources); log('出力', JSON.stringify(counts));
}

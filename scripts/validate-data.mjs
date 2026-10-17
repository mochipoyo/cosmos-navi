#!/usr/bin/env node
/*
 * 宇宙実測ナビ：公開前のデータ検証とロールバック
 * 公開フォルダ（_site）の livecams.json / webcams.json / webcams-status.json を検証し、
 * 壊れている・形式が違う・件数が異常に少ない場合は、git の履歴から「最後に検証を通った版」を探して置き換えます。
 * 置き換えた場合や置き換えられなかった場合は終了コード1（公開は前回正常データで続け、ワークフローは失敗として通知）。
 * 使い方： node scripts/validate-data.mjs [_site]
 */
import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { validateWebcams, validateLivecams, validateStatus, readJson, writeJsonSafe, appendLog, gh } from './lib-cams.mjs';

const DIR = process.argv[2] || '_site';
const FILES = {
  'livecams.json': { v: validateLivecams, min: Number(process.env.MIN_LIVECAMS || 20), required: true },
  'webcams.json': { v: validateWebcams, min: Number(process.env.MIN_WEBCAMS || 0), required: false },
  'webcams-status.json': { v: validateStatus, min: 0, required: false },
};
const git = args => execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });

export function verdict(name, obj) {
  const F = FILES[name]; if (!obj) return { ok: false, errors: ['JSONとして読めません'] };
  const r = F.v(obj); if (!r.ok) return r;
  if (r.count < F.min) return { ok: false, errors: ['件数が少なすぎます（' + r.count + ' < ' + F.min + '）'], count: r.count };
  return r;
}
export function headCount(name) { try { const j = JSON.parse(git(['show', 'HEAD:' + name])); return Array.isArray(j.cams) ? j.cams.length : 0; } catch { return 0; } }
export function findLastGood(name, depth = 30) {
  let hashes = [];
  try { hashes = git(['log', '-n', String(depth), '--format=%H', '--', name]).split('\n').filter(Boolean); } catch { return null; }
  for (const h of hashes) {
    let obj = null; try { obj = JSON.parse(git(['show', h + ':' + name])); } catch { continue; }
    if (verdict(name, obj).ok) return { hash: h, obj };
  }
  return null;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let failed = false; const report = {};
  for (const name of Object.keys(FILES)) {
    const path = DIR + '/' + name;
    if (!existsSync(path)) { report[name] = 'なし'; if (FILES[name].required) { failed = true; gh.error(name + ' がありません'); } continue; }
    const obj = await readJson(path, null); let r = verdict(name, obj);
    // 直前のコミットと比べて件数が大きく減っていないか（スクリプトの不具合などで消えるのを防ぐ）
    if (r.ok && name !== 'webcams-status.json') { const head = headCount(name); if (head >= 50 && r.count < head * 0.7) r = { ok: false, errors: ['件数が異常に減っています（直前 ' + head + ' 件 → ' + r.count + ' 件）'], count: r.count }; }
    if (r.ok) { report[name] = 'OK（' + r.count + '件）'; continue; }
    failed = true; gh.error(name + ' の検証に失敗：' + r.errors.slice(0, 3).join(' / '));
    const good = findLastGood(name);
    if (good) { await writeJsonSafe(path, good.obj); report[name] = '前回正常版に戻しました（' + good.hash.slice(0, 7) + '）'; gh.warn(name + '：' + report[name]); }
    else report[name] = '戻せる正常版が見つかりません';
  }
  console.log('[validate]', JSON.stringify(report));
  await appendLog({ at: new Date().toISOString(), job: 'validate', ok: !failed, report });
  process.exit(failed ? 1 : 0);
}

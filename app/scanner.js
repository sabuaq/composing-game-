// VSTフォルダとサンプルフォルダを読んで、お題に使う素材の一覧を作る
const fs = require('fs/promises');
const path = require('path');

const MAX_DEPTH = 4;

async function readDir(dir) {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

// VST3 の moduleinfo.json から「音源」か「エフェクト」かを判定する
// (JSONに末尾カンマがあることが多いので、正規表現で必要な所だけ拾う)
async function readVst3Info(bundleDir) {
  const file = path.join(bundleDir, 'Contents', 'Resources', 'moduleinfo.json');
  let text;
  try {
    text = await fs.readFile(file, 'utf8');
  } catch {
    return { type: 'unknown', vendor: '', cats: '' };
  }
  const cats = [];
  const re = /"Sub Categories"\s*:\s*\[([^\]]*)\]/g;
  let m;
  while ((m = re.exec(text))) cats.push(m[1]);
  const joined = cats.join(' ');
  let type = 'unknown';
  if (/Instrument|Synth|Sampler|Drum/i.test(joined)) type = 'instrument';
  else if (/Fx|Analyzer|Dynamics|EQ|Delay|Reverb|Distortion|Filter/i.test(joined)) type = 'effect';
  const vendorMatch = text.match(/"Vendor"\s*:\s*"([^"]*)"/);
  return { type, vendor: vendorMatch ? vendorMatch[1] : '', cats: joined.replace(/["\s]+/g, ' ').trim() };
}

// moduleinfo.json が無いプラグインは名前から推定する（違っていたらライブラリ画面で直せる）
const INSTRUMENT_WORDS = /synth|piano|keys|organ|string|flute|choir|vox|sampler|rompler|drum|kit|bass(?!room)|guitar|harp|bell|brass|orchestra|pad|lead|vital|serum|massive|sylenth|kontakt|omnisphere|spitfire|labs|workstation|instrument|tal-u-no|dexed|surge|odin|keyscape|ensemble|marimba|kalimba|celesta/i;

function guessType(name) {
  return INSTRUMENT_WORDS.test(name) ? 'instrument' : 'effect';
}

async function scanVst(roots) {
  const found = new Map();

  async function add(fullPath, format, info) {
    const name = path.basename(fullPath).replace(/\.(vst3|dll)$/i, '');
    const key = name.toLowerCase();
    // 同じプラグインがVST2とVST3の両方にある時はVST3を優先
    const prev = found.get(key);
    if (prev && prev.format === 'VST3') return;
    const guessed = info.type === 'unknown';
    const type = guessed ? guessType(name) : info.type;
    found.set(key, { key, name, format, path: fullPath, type, guessed, vendor: info.vendor, cats: info.cats || '' });
  }

  async function walk(dir, depth) {
    if (depth > MAX_DEPTH) return;
    for (const ent of await readDir(dir)) {
      const full = path.join(dir, ent.name);
      const lower = ent.name.toLowerCase();
      if (lower.endsWith('.vst3')) {
        const info = ent.isDirectory() ? await readVst3Info(full) : { type: 'unknown', vendor: '' };
        await add(full, 'VST3', info);
      } else if (lower.endsWith('.dll') && ent.isFile()) {
        await add(full, 'VST2', { type: 'unknown', vendor: '' });
      } else if (ent.isDirectory()) {
        await walk(full, depth + 1);
      }
    }
  }

  for (const root of roots) await walk(root, 0);
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

// サンプルフォルダの直下のフォルダを1パックとして扱う
async function scanSamples(roots) {
  const packs = [];
  for (const root of roots) {
    const subdirs = (await readDir(root)).filter((e) => e.isDirectory());
    if (subdirs.length === 0) {
      packs.push({ key: root.toLowerCase(), name: path.basename(root), path: root, root });
    } else {
      for (const d of subdirs) {
        const full = path.join(root, d.name);
        packs.push({ key: full.toLowerCase(), name: d.name, path: full, root });
      }
    }
  }
  return packs.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

async function scanAll({ vstRoots = [], sampleRoots = [] }) {
  const [plugins, packs] = await Promise.all([scanVst(vstRoots), scanSamples(sampleRoots)]);
  return { plugins, packs, scannedAt: new Date().toISOString() };
}

module.exports = { scanAll };

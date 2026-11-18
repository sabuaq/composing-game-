/* global DEFAULT_SETTINGS, LEVELS, GOALS, NOTE_NAMES, BASIC_MODES, EXTRA_MODES, FX_TYPES, FX_DETECT_ORDER, FX_KNOWN, fxKey */
'use strict';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let settings;
let library = { plugins: [], packs: [], scannedAt: null };
let history = [];

const game = {
  status: 'idle', // idle | drawn | running | paused
  challenge: null,
  rerollsLeft: Infinity,
  acc: 0,
  runStart: 0,
  timeUpNotified: false,
};

// ---------- 保存 ----------
let saveTimer;
function saveSettings() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => window.api.save('settings', settings), 300);
}

function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => (t.hidden = true), 2600);
}

// ---------- 素材の候補 ----------
function pluginType(p) {
  // 名前から「エフェクト」と推定していたけど、対応表で音源と分かっているもの
  const known = p.guessed && FX_KNOWN[fxKey(p.name)] === 'instrument' ? 'instrument' : null;
  return settings.pluginOverrides[p.key]?.type || known || p.type;
}
function pluginOn(p) {
  return settings.pluginOverrides[p.key]?.enabled !== false;
}
function packOn(p) {
  return settings.packOverrides[p.key] !== false;
}

// エフェクトの種類（ライブラリで直したもの → VST3の分類 → 名前から推定）
const FX_LABEL = Object.fromEntries(FX_TYPES.map((t) => [t.id, t.label]));
const FX_DETECT = FX_DETECT_ORDER.map((id) => FX_TYPES.find((t) => t.id === id));
function guessFx(name, cats = '') {
  const known = FX_KNOWN[fxKey(name)];
  if (known && known !== 'instrument') return known;
  for (const t of FX_DETECT) if (t.cat && cats && t.cat.test(cats)) return t.id;
  for (const t of FX_DETECT) if (t.words && t.words.test(name)) return t.id;
  return 'other';
}
function pluginFx(p) {
  return settings.pluginOverrides[p.key]?.fx || guessFx(p.name, p.cats);
}
function fxOfName(name) {
  const p = library.plugins.find((x) => x.name === name);
  return p ? pluginFx(p) : guessFx(name);
}
const byType = () => settings.effectMode === 'byType';
// 「全部からランダム」でもメーターなどのユーティリティは出さない
function drawPool(kind, p) {
  return kind === 'effect' ? p.effect.filter((e) => e.fxType !== 'utility') : p[kind];
}
function effectCount(cfg) {
  return byType() ? settings.effectTypes.length : cfg.effects;
}

function parseGenres() {
  return settings.genresText.split('\n').map((line) => {
    const [name, min, max] = line.split(/[,、，]/).map((s) => s.trim());
    if (!name) return null;
    const lo = parseInt(min, 10) || 120;
    const hi = parseInt(max, 10) || lo;
    return { name, min: Math.min(lo, hi), max: Math.max(lo, hi) };
  }).filter(Boolean);
}
function parseParts() {
  return settings.partsText.split('\n').map((s) => s.trim()).filter(Boolean);
}

function pools() {
  return {
    pack: library.packs.filter(packOn).map((p) => ({ name: p.name, path: p.path })),
    instrument: library.plugins.filter((p) => pluginOn(p) && pluginType(p) === 'instrument').map((p) => ({ name: p.name })),
    effect: library.plugins.filter((p) => pluginOn(p) && pluginType(p) === 'effect').map((p) => ({ name: p.name, fxType: pluginFx(p) })),
    part: parseParts().map((name) => ({ name })),
  };
}

const KIND_LABEL = {
  genre: 'ジャンル', bpm: 'BPM', key: 'キー', goal: '目標', time: '制限時間',
  pack: 'サンプルパック', instrument: '音源', effect: 'エフェクト', part: '使うパート',
};
const REROLLABLE = new Set(['genre', 'bpm', 'key', 'pack', 'instrument', 'effect', 'part']);

const rand = (n) => Math.floor(Math.random() * n);
const randInt = (lo, hi) => lo + rand(hi - lo + 1);
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function recentNames() {
  const set = new Set();
  history.slice(0, settings.avoidRecent).forEach((h) => h.items.forEach((it) => set.add(it.kind + ':' + it.name)));
  return set;
}

// 最近出たものは後回しにして n 個選ぶ
function pickFrom(kind, pool, n, exclude = new Set()) {
  const recent = recentNames();
  const cand = shuffle(pool.filter((x) => !exclude.has(x.name)));
  cand.sort((a, b) => recent.has(kind + ':' + a.name) - recent.has(kind + ':' + b.name));
  return cand.slice(0, n);
}

function currentConfig() {
  const r = settings.rules;
  if (r.level) {
    const L = LEVELS[settings.progress.level - 1];
    return { ...L, level: L.lv };
  }
  return { ...settings.manual, level: null, rerolls: Infinity };
}

// キーは音名とモードを別々に指定できる（片方だけ指定して、もう片方はランダムも可）
function randomKey(withModes) {
  const f = settings.fixed;
  const modes = withModes ? BASIC_MODES.concat(EXTRA_MODES) : BASIC_MODES;
  const note = f.keyNote || NOTE_NAMES[rand(12)];
  const mode = f.keyMode || modes[rand(modes.length)];
  return note + ' ' + mode;
}
const keyFullyFixed = () => !!(settings.fixed.keyNote && settings.fixed.keyMode);
const LIST_KINDS = ['pack', 'instrument', 'effect', 'part'];
const COUNT_KEY = { pack: 'packs', instrument: 'instruments', effect: 'effects', part: 'parts' };

function genreByName(name) {
  return parseGenres().find((g) => g.name === name) || { name, min: 80, max: 170 };
}

function drawChallenge() {
  const r = settings.rules;
  const f = settings.fixed;
  const cfg = currentConfig();
  const p = pools();
  const items = [];
  let genre = null;

  if (r.genre) {
    const gs = parseGenres();
    if (f.genre) {
      genre = genreByName(f.genre);
      items.push({ kind: 'genre', name: genre.name, meta: genre, fixed: true });
    } else if (gs.length) {
      genre = gs[rand(gs.length)];
      items.push({ kind: 'genre', name: genre.name, meta: genre });
    }
  }
  if (r.bpm) {
    if (f.bpm) {
      items.push({ kind: 'bpm', name: String(f.bpm), fixed: true });
    } else {
      const g = genre || (() => { const gs = parseGenres(); return gs.length ? gs[rand(gs.length)] : { min: 80, max: 170 }; })();
      items.push({ kind: 'bpm', name: String(randInt(g.min, g.max)) });
    }
  }
  if (r.key) items.push({ kind: 'key', name: randomKey(cfg.modes), fixed: keyFullyFixed() });
  if (cfg.goal && cfg.goal !== 'なし') items.push({ kind: 'goal', name: cfg.goal });

  const missing = [];
  for (const kind of LIST_KINDS) {
    if (kind === 'effect' && byType()) {
      // 種類ごと: 選んだ種類から1つずつ。指定したエフェクトはその種類の分として数える
      const fixedList = f.effect;
      const covered = new Set();
      fixedList.forEach((c) => {
        const t = fxOfName(c.name);
        covered.add(t);
        items.push({ kind, name: c.name, fxType: t, fixed: true });
      });
      const used = new Set(fixedList.map((c) => c.name));
      for (const t of settings.effectTypes) {
        if (covered.has(t)) continue;
        const [c] = pickFrom(kind, p.effect.filter((e) => e.fxType === t), 1, used);
        if (!c) { missing.push(FX_LABEL[t]); continue; }
        used.add(c.name);
        items.push({ kind, name: c.name, fxType: t });
      }
      continue;
    }
    const n = cfg[COUNT_KEY[kind]];
    // 指定したものを先に入れて、足りない分だけランダムで足す
    const fixedList = f[kind];
    fixedList.forEach((c) => items.push({ kind, name: c.name, path: c.path, fixed: true, ...(kind === 'effect' ? { fxType: fxOfName(c.name) } : {}) }));
    const need = Math.max(0, n - fixedList.length);
    if (!need) continue;
    const chosen = pickFrom(kind, drawPool(kind, p), need, new Set(fixedList.map((c) => c.name)));
    if (chosen.length < need) missing.push(KIND_LABEL[kind]);
    chosen.forEach((c) => items.push({ kind, name: c.name, path: c.path, fxType: c.fxType }));
  }
  if (missing.length) toast(`${missing.join('・')}の候補が足りません（ライブラリ・設定を確認）`);

  game.challenge = {
    level: cfg.level,
    minutes: r.time ? cfg.minutes : null,
    items,
  };
  game.rerollsLeft = cfg.rerolls;
  game.status = 'drawn';
  game.acc = 0;
  game.timeUpNotified = false;
  renderChallenge();
}

function rerollItem(index) {
  if (game.rerollsLeft <= 0) return;
  const it = game.challenge.items[index];
  if (it.fixed) return;
  const cfg = currentConfig();
  let next = null;
  if (it.kind === 'genre') {
    const gs = parseGenres().filter((g) => g.name !== it.name);
    if (gs.length) {
      const g = gs[rand(gs.length)];
      next = { kind: 'genre', name: g.name, meta: g };
      const bpm = game.challenge.items.find((x) => x.kind === 'bpm');
      if (bpm) bpm.name = String(randInt(g.min, g.max));
    }
  } else if (it.kind === 'bpm') {
    const g = game.challenge.items.find((x) => x.kind === 'genre')?.meta || { min: 80, max: 170 };
    next = { kind: 'bpm', name: String(randInt(g.min, g.max)) };
  } else if (it.kind === 'key') {
    next = { kind: 'key', name: randomKey(cfg.modes) };
  } else {
    const used = new Set(game.challenge.items.filter((x) => x.kind === it.kind).map((x) => x.name));
    // 種類ごとの時は同じ種類の中から引き直す
    const pool = it.kind === 'effect' && byType() && it.fxType
      ? pools().effect.filter((e) => e.fxType === it.fxType)
      : drawPool(it.kind, pools());
    const [c] = pickFrom(it.kind, pool, 1, used);
    if (c) next = { kind: it.kind, name: c.name, path: c.path, fxType: c.fxType };
  }
  if (!next) return toast('ほかの候補がありません');
  game.challenge.items[index] = next;
  game.rerollsLeft -= 1;
  renderChallenge();
}

// 引いたお題の項目を📌で「指定」に入れる／外す（次に引く時もそのまま出る）
function setFixedFromItem(it, on) {
  const f = settings.fixed;
  if (LIST_KINDS.includes(it.kind)) {
    f[it.kind] = f[it.kind].filter((c) => c.name !== it.name);
    if (on) f[it.kind].push({ name: it.name, path: it.path });
  } else if (it.kind === 'genre') {
    f.genre = on ? it.name : '';
  } else if (it.kind === 'bpm') {
    f.bpm = on ? +it.name : null;
  } else if (it.kind === 'key') {
    const [note, mode] = it.name.split(' ');
    f.keyNote = on ? note : '';
    f.keyMode = on ? mode : '';
  }
}
function pinItem(index) {
  const it = game.challenge.items[index];
  it.fixed = !it.fixed;
  setFixedFromItem(it, it.fixed);
  saveSettings();
  renderChallenge();
}

// ---------- タイマー ----------
function elapsedMs() {
  return game.acc + (game.status === 'running' ? Date.now() - game.runStart : 0);
}
function fmt(ms) {
  const s = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function startTimer() {
  game.status = 'running';
  game.runStart = Date.now();
  renderChallenge();
}
function pauseTimer() {
  if (game.status === 'running') {
    game.acc += Date.now() - game.runStart;
    game.status = 'paused';
  } else if (game.status === 'paused') {
    startTimer();
    return;
  }
  renderChallenge();
}

function beep() {
  if (!settings.sound) return;
  const ctx = new AudioContext();
  [0, 0.25, 0.5].forEach((t, i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = [880, 660, 990][i];
    g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + 0.22);
    o.connect(g).connect(ctx.destination);
    o.start(ctx.currentTime + t);
    o.stop(ctx.currentTime + t + 0.25);
  });
  setTimeout(() => ctx.close(), 1200);
}

function tick() {
  if (!game.challenge) return;
  const el = elapsedMs();
  const limit = game.challenge.minutes ? game.challenge.minutes * 60000 : null;
  let text;
  let sub;
  let over = false;
  if (limit) {
    const left = limit - el;
    over = left < 0;
    text = (over ? '+' : '') + fmt(left);
    sub = over ? '時間切れ（このまま続けてもOK）' : `残り時間 / 制限 ${game.challenge.minutes}分`;
    if (over && !game.timeUpNotified && game.status === 'running') {
      game.timeUpNotified = true;
      beep();
    }
  } else {
    text = fmt(el);
    sub = '経過時間';
  }
  if (game.status === 'drawn') sub = 'スタートを押すと計測が始まります';
  if (game.status === 'paused') sub = '一時停止中';
  $('timer').textContent = text;
  $('timer').classList.toggle('over', over);
  $('timerSub').textContent = sub;
  $('cTimer').textContent = text;
  $('cTimer').classList.toggle('over', over);
  $('cPause').textContent = game.status === 'paused' ? '再開' : '一時停止';
}
setInterval(tick, 250);

// ---------- 結果 ----------
let pendingResult = null;
let resumeAfterDialog = false;

function finish(kind) {
  if (!game.challenge || game.status === 'idle') return;
  resumeAfterDialog = game.status === 'running';
  if (game.status === 'running') pauseTimer();
  const el = elapsedMs();
  const limit = game.challenge.minutes ? game.challenge.minutes * 60000 : null;
  const result = kind === 'giveup' ? 'giveup' : limit && el > limit ? 'overtime' : 'clear';
  pendingResult = { result, elapsedSec: Math.round(el / 1000) };

  if (!settings.rules.record) {
    applyResult(null, '');
    return;
  }
  const titles = { clear: 'クリア！', overtime: '完成！（時間オーバー）', giveup: 'ギブアップ' };
  $('resultTitle').textContent = titles[result];
  $('resultSub').textContent = `かかった時間 ${fmt(el)}${limit ? ` / 制限 ${game.challenge.minutes}分` : ''}`;
  renderStars(result === 'giveup' ? 0 : 3);
  $('resultMemo').value = '';
  $('resultDialog').showModal();
}

let starValue = 3;
function renderStars(v) {
  starValue = v;
  $('stars').innerHTML = [1, 2, 3, 4, 5].map((n) =>
    `<button type="button" data-star="${n}" class="${n <= v ? 'on' : ''}" aria-label="${n}">★</button>`).join('') +
    `<span class="hint">${v ? '自己評価 ' + v : '評価なし'}</span>`;
}
$('stars').addEventListener('click', (e) => {
  const b = e.target.closest('[data-star]');
  if (b) renderStars(+b.dataset.star === starValue ? 0 : +b.dataset.star);
});

$('resultDialog').addEventListener('close', () => {
  if ($('resultDialog').returnValue === 'save') {
    applyResult(starValue, $('resultMemo').value.trim());
  } else if (resumeAfterDialog) {
    startTimer();
  }
});

function applyResult(stars, memo) {
  const { result, elapsedSec } = pendingResult;
  const ch = game.challenge;
  if (settings.rules.record) {
    history.unshift({
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      level: ch.level,
      result,
      stars,
      memo,
      elapsedSec,
      limitMin: ch.minutes,
      items: ch.items.map(({ kind, name, fixed, fxType }) => ({ kind, name, ...(fxType ? { fxType } : {}), ...(fixed ? { fixed: true } : {}) })),
    });
    window.api.save('history', history);
  }
  let msg = result === 'giveup' ? 'おつかれさま。次いこう' : 'おつかれさま！';
  if (settings.rules.level && result === 'clear') {
    const pr = settings.progress;
    pr.clears += 1;
    if (pr.clears >= settings.clearsToLevelUp && pr.level < LEVELS.length) {
      pr.level += 1;
      pr.clears = 0;
      msg = `レベルアップ！ Lv${pr.level}「${LEVELS[pr.level - 1].name}」`;
    }
    saveSettings();
  }
  toast(msg);
  if (document.body.classList.contains('compact')) setCompact(false);
  game.status = 'idle';
  game.challenge = null;
  renderAll();
}

// ---------- 小さい窓 ----------
async function setCompact(flag) {
  document.body.classList.toggle('compact', flag);
  $('compactView').hidden = !flag;
  await window.api.compact(flag);
  if (flag) {
    $('cItems').innerHTML = game.challenge.items
      .filter((it) => it.kind !== 'goal')
      .map((it) => `<span title="${esc(KIND_LABEL[it.kind])}">${esc(it.kind === 'bpm' ? it.name + ' BPM' : it.name)}</span>`).join('');
  }
}
$('cPause').onclick = pauseTimer;
$('cDone').onclick = () => { setCompact(false); finish('done'); };
$('cExpand').onclick = () => setCompact(false);

// ---------- 描画: お題 ----------
const RULES = [
  { id: 'time', label: '制限時間' },
  { id: 'genre', label: 'ジャンル' },
  { id: 'bpm', label: 'BPM' },
  { id: 'key', label: 'キー' },
  { id: 'level', label: '難易度' },
  { id: 'record', label: '履歴に記録' },
];

function renderRules() {
  const r = settings.rules;
  const m = settings.manual;
  const locked = game.status !== 'idle';
  $('ruleList').innerHTML = RULES.map((rule) => {
    let extra = '';
    if (rule.id === 'time' && r.time && !r.level) {
      extra = `<input type="number" min="1" max="600" data-manual="minutes" value="${m.minutes}"> 分`;
    }
    if (rule.id === 'level' && r.level) {
      extra = `<select id="levelSelect">${LEVELS.map((L) =>
        `<option value="${L.lv}" ${L.lv === settings.progress.level ? 'selected' : ''}>Lv${L.lv} ${esc(L.name)}</option>`).join('')}</select>`;
    }
    if (rule.id === 'key' && r.key && !r.level) {
      extra = `<label class="mini"><input type="checkbox" data-manual-check="modes" ${m.modes ? 'checked' : ''}> モードも出す</label>`;
    }
    return `<div class="rule ${r[rule.id] ? 'on' : ''}">
      <label class="switch"><input type="checkbox" data-rule="${rule.id}" ${r[rule.id] ? 'checked' : ''} ${locked ? 'disabled' : ''}><span></span>${rule.label}</label>
      <div class="rule-extra">${extra}</div>
    </div>`;
  }).join('');

  if (!r.level) {
    $('ruleList').insertAdjacentHTML('beforeend', `<div class="rule on"><span class="rule-name">目標</span>
      <div class="rule-extra"><select data-manual="goal">${GOALS.map((g) => `<option ${g === m.goal ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select></div></div>`);
  }

  const cfg = currentConfig();
  const counts = [['packs', 'サンプルパック'], ['instruments', '音源'], ['effects', 'エフェクト'], ['parts', '使うパート']];
  $('countList').innerHTML = counts.map(([k, label]) => {
    const fixedCount = k === 'effects' && byType();
    const off = r.level || locked || fixedCount;
    return `
    <div class="count">
      <span>${label}</span>
      <div class="stepper">
        <button data-step="${k}" data-d="-1" ${off ? 'disabled' : ''}>−</button>
        <b>${k === 'effects' ? effectCount(cfg) : cfg[k]}</b>
        <button data-step="${k}" data-d="1" ${off ? 'disabled' : ''}>＋</button>
      </div>
    </div>${k === 'effects' ? renderFxMode(locked) : ''}`;
  }).join('');

  if (r.level) {
    const L = LEVELS[settings.progress.level - 1];
    $('countHint').textContent = `Lv${L.lv}：${r.time ? L.minutes + '分・' : ''}目標「${L.goal}」・引き直し${L.rerolls}回${L.modes ? '・モードあり' : ''}`;
  } else {
    $('countHint').textContent = '難易度をオフにすると数や時間を自由に決められます。引き直しは無制限です。';
  }
  renderFixed();
  // 難易度オンの時は引き直し回数があるので、丸ごと引き直しはできない
  $('drawBtn').disabled = locked && !(game.status === 'drawn' && !r.level);
  $('drawBtn').textContent = game.status === 'drawn' ? 'もう一度引く' : 'お題を引く';
}

// エフェクトの出し方（全部からランダム / 種類ごと）
function renderFxMode(locked) {
  const dis = locked ? 'disabled' : '';
  let html = `<div class="fx-mode">
    <div class="seg">
      <button type="button" data-fxmode="random" class="${byType() ? '' : 'active'}" ${dis}>全部からランダム</button>
      <button type="button" data-fxmode="byType" class="${byType() ? 'active' : ''}" ${dis}>種類ごと</button>
    </div>`;
  if (byType()) {
    const pool = pools().effect;
    html += `<div class="fx-types">${FX_TYPES.map((t) => {
      const on = settings.effectTypes.includes(t.id);
      const n = pool.filter((e) => e.fxType === t.id).length;
      return `<label class="fx-type ${on ? 'on' : ''}" title="候補${n}個"><input type="checkbox" data-fxtype="${t.id}" ${on ? 'checked' : ''} ${dis}>${esc(t.label)}<small>${n}</small></label>`;
    }).join('')}</div>
    <p class="hint">選んだ種類から1つずつ出ます（数字は候補の数）。種類はライブラリで直せます。</p>`;
  }
  return html + '</div>';
}
$('countList').addEventListener('change', (e) => {
  const t = e.target.dataset.fxtype;
  if (!t) return;
  const set = new Set(settings.effectTypes);
  if (e.target.checked) set.add(t); else set.delete(t);
  // 表示の順番は FX_TYPES の並びにそろえる
  settings.effectTypes = FX_TYPES.map((x) => x.id).filter((id) => set.has(id));
  saveSettings();
  renderRules();
});

$('ruleList').addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.rule) settings.rules[t.dataset.rule] = t.checked;
  else if (t.dataset.manual) settings.manual[t.dataset.manual] = t.type === 'number' ? Math.max(1, +t.value || 1) : t.value;
  else if (t.dataset.manualCheck) settings.manual[t.dataset.manualCheck] = t.checked;
  else if (t.id === 'levelSelect') settings.progress = { level: +t.value, clears: 0 };
  saveSettings();
  renderRules();
  renderLevel();
});
$('countList').addEventListener('click', (e) => {
  const m = e.target.closest('[data-fxmode]');
  if (m) {
    settings.effectMode = m.dataset.fxmode;
    saveSettings();
    return renderRules();
  }
  const b = e.target.closest('[data-step]');
  if (!b) return;
  const k = b.dataset.step;
  settings.manual[k] = Math.min(6, Math.max(0, settings.manual[k] + +b.dataset.d));
  saveSettings();
  renderRules();
});
$('drawBtn').onclick = drawChallenge;

// ---------- 自分で指定 ----------
function renderFixed() {
  const f = settings.fixed;
  const cfg = currentConfig();
  const opt = (v, label, sel) => `<option value="${esc(v)}" ${sel ? 'selected' : ''}>${esc(label)}</option>`;
  const genres = parseGenres();
  if (f.genre && !genres.some((g) => g.name === f.genre)) genres.push({ name: f.genre });
  let html = `
    <div class="fx-row"><span>ジャンル</span>
      <select data-fx="genre">${opt('', 'ランダム', !f.genre)}${genres.map((g) => opt(g.name, g.name, g.name === f.genre)).join('')}</select></div>
    <div class="fx-row"><span>BPM</span>
      <input type="number" data-fx="bpm" min="40" max="300" placeholder="ランダム" value="${f.bpm ?? ''}"></div>
    <div class="fx-row"><span>キー</span>
      <div class="row">
        <select data-fx="keyNote">${opt('', '音名ランダム', !f.keyNote)}${NOTE_NAMES.map((n) => opt(n, n, n === f.keyNote)).join('')}</select>
        <select data-fx="keyMode">${opt('', 'ランダム', !f.keyMode)}${BASIC_MODES.concat(EXTRA_MODES).map((m) => opt(m, m, m === f.keyMode)).join('')}</select>
      </div></div>`;
  for (const kind of LIST_KINDS) {
    const list = f[kind];
    const n = kind === 'effect' ? effectCount(cfg) : cfg[COUNT_KEY[kind]];
    const rest = Math.max(0, n - list.length);
    html += `
    <div class="fx-row list"><span>${KIND_LABEL[kind]}</span>
      <div class="fx-chips">
        ${list.map((c, i) => `<span class="chip kind-${kind}">${esc(c.name)}<button type="button" class="x" data-fx-remove="${kind}:${i}" title="外す">×</button></span>`).join('')}
        <button type="button" class="ghost add" data-fx-pick="${kind}">＋選ぶ</button>
        <span class="hint">${list.length ? `指定${list.length}${rest ? `＋ランダム${rest}` : ''}` : `ランダム${n}`}</span>
      </div></div>`;
  }
  html += '<div class="row end"><button type="button" class="ghost" id="fxClear">すべてランダムに戻す</button></div>';
  $('fixedList').innerHTML = html;

  const count = (f.genre ? 1 : 0) + (f.bpm ? 1 : 0) + (f.keyNote || f.keyMode ? 1 : 0) + LIST_KINDS.reduce((s, k) => s + f[k].length, 0);
  $('fixedSummary').textContent = count ? `${count}項目を指定中` : '';
}

$('fixedList').addEventListener('change', (e) => {
  const key = e.target.dataset.fx;
  if (!key) return;
  const f = settings.fixed;
  const v = e.target.value.trim();
  if (key === 'bpm') f.bpm = v ? Math.min(300, Math.max(40, parseInt(v, 10) || 120)) : null;
  else f[key] = v;
  // 指定したら、その縛りは自動でオンにする
  if (v) settings.rules[key === 'keyNote' || key === 'keyMode' ? 'key' : key] = true;
  saveSettings();
  renderRules();
});
$('fixedList').addEventListener('click', (e) => {
  const rm = e.target.closest('[data-fx-remove]');
  if (rm) {
    const [kind, i] = rm.dataset.fxRemove.split(':');
    settings.fixed[kind].splice(+i, 1);
    saveSettings();
    return renderRules();
  }
  const pick = e.target.closest('[data-fx-pick]');
  if (pick) return openPicker(pick.dataset.fxPick);
  if (e.target.id === 'fxClear') {
    settings.fixed = structuredClone(DEFAULT_SETTINGS.fixed);
    saveSettings();
    renderRules();
  }
});

// 一覧から選ぶダイアログ
let pickKind = null;
let pickSelected = new Map();

function openPicker(kind) {
  pickKind = kind;
  pickSelected = new Map(settings.fixed[kind].map((c) => [c.name, c]));
  $('pickTitle').textContent = `${KIND_LABEL[kind]}を指定`;
  $('pickSearch').value = '';
  renderPicker();
  $('pickDialog').showModal();
  $('pickSearch').focus();
}

function renderPicker() {
  const q = $('pickSearch').value.trim();
  const ql = q.toLowerCase();
  const pool = pools()[pickKind];
  const all = [...pickSelected.values()].filter((c) => !pool.some((p) => p.name === c.name)).concat(pool);
  const rows = all.filter((c) => !ql || c.name.toLowerCase().includes(ql)).slice(0, 400);
  let html = '';
  if (q && !all.some((c) => c.name === q)) {
    html += `<button type="button" class="pick-add" data-add="${esc(q)}">＋「${esc(q)}」を追加して指定</button>`;
  }
  html += rows.map((c) => `
    <label class="pick-row"><input type="checkbox" data-pick="${esc(c.name)}" ${pickSelected.has(c.name) ? 'checked' : ''}>
      <span>${esc(c.name)}</span></label>`).join('');
  if (!rows.length && !q) html += '<p class="hint">候補がありません。ライブラリ・設定を確認してください。</p>';
  $('pickList').innerHTML = html;
  $('pickCount').textContent = `${pickSelected.size}件を選択中`;
}

$('pickSearch').oninput = renderPicker;
$('pickSearch').onkeydown = (e) => { if (e.key === 'Enter') e.preventDefault(); };
$('pickList').addEventListener('change', (e) => {
  const name = e.target.dataset.pick;
  if (name === undefined) return;
  if (e.target.checked) {
    const c = pools()[pickKind].find((p) => p.name === name) || { name };
    pickSelected.set(name, { name: c.name, ...(c.path ? { path: c.path } : {}) });
  } else {
    pickSelected.delete(name);
  }
  $('pickCount').textContent = `${pickSelected.size}件を選択中`;
});
$('pickList').addEventListener('click', (e) => {
  const add = e.target.closest('[data-add]');
  if (!add) return;
  pickSelected.set(add.dataset.add, { name: add.dataset.add });
  $('pickSearch').value = '';
  renderPicker();
});
$('pickDialog').addEventListener('close', () => {
  if ($('pickDialog').returnValue !== 'ok') return;
  settings.fixed[pickKind] = [...pickSelected.values()];
  saveSettings();
  renderRules();
});

const kindLabel = (it) => KIND_LABEL[it.kind] + (it.fxType ? '・' + (FX_LABEL[it.fxType] || '') : '');

function renderChallenge() {
  const ch = game.challenge;
  $('challengeEmpty').hidden = !!ch;
  $('challengeBody').hidden = !ch;
  renderRules();
  if (!ch) {
    const p = pools();
    const warn = [];
    if (!library.scannedAt) warn.push('まだスキャンしていません。');
    if (!settings.sampleRoots.length) warn.push('サンプルフォルダが未設定です（設定タブで追加）。');
    if (!p.instrument.length) warn.push('音源の候補が0件です。');
    $('libraryWarn').textContent = warn.join(' ');
    return;
  }
  const canReroll = game.status === 'drawn' || game.status === 'running' || game.status === 'paused';
  $('rerollInfo').textContent = game.rerollsLeft === Infinity ? '引き直し：無制限' : `引き直し：残り${game.rerollsLeft}回`;
  $('itemList').innerHTML = ch.items.map((it, i) => `
    <li class="item kind-${it.kind} ${it.fixed ? 'fixed' : ''}">
      <span class="kind">${kindLabel(it)}${it.fixed ? '<em>指定</em>' : ''}</span>
      <span class="name">${esc(it.name)}${it.kind === 'bpm' ? ' <small>BPM</small>' : ''}</span>
      ${it.path ? `<button class="ghost" data-open="${i}" title="フォルダを開く">開く</button>` : ''}
      ${REROLLABLE.has(it.kind) ? `
        <button class="ghost pin ${it.fixed ? 'on' : ''}" data-pin="${i}" title="${it.fixed ? '指定を外す' : '次からも固定する（指定に入れる）'}">📌</button>
        <button class="ghost reroll" data-reroll="${i}" ${!canReroll || game.rerollsLeft <= 0 || it.fixed ? 'disabled' : ''} title="これだけ引き直す">↻</button>` : ''}
    </li>`).join('') +
    (ch.minutes ? `<li class="item kind-time"><span class="kind">制限時間</span><span class="name">${ch.minutes}分</span></li>` : '');

  const a = $('actions');
  if (game.status === 'drawn') {
    a.innerHTML = '<button data-act="cancel">やめる</button><button class="primary big" data-act="start">スタート</button>';
  } else {
    a.innerHTML = `
      <button data-act="pause">${game.status === 'paused' ? '再開' : '一時停止'}</button>
      <button data-act="compact">小さく表示</button>
      <button data-act="giveup">ギブアップ</button>
      <button class="primary" data-act="done">できた</button>`;
  }
  tick();
}

$('itemList').addEventListener('click', (e) => {
  const r = e.target.closest('[data-reroll]');
  if (r) return rerollItem(+r.dataset.reroll);
  const pin = e.target.closest('[data-pin]');
  if (pin) return pinItem(+pin.dataset.pin);
  const o = e.target.closest('[data-open]');
  if (o) window.api.openPath(game.challenge.items[+o.dataset.open].path);
});
$('actions').addEventListener('click', (e) => {
  const act = e.target.closest('[data-act]')?.dataset.act;
  if (act === 'start') startTimer();
  else if (act === 'cancel') { game.status = 'idle'; game.challenge = null; renderChallenge(); }
  else if (act === 'pause') pauseTimer();
  else if (act === 'compact') setCompact(true);
  else if (act === 'giveup') { if (confirm('ギブアップしますか？')) finish('giveup'); }
  else if (act === 'done') finish('done');
});

function renderLevel() {
  const pr = settings.progress;
  const L = LEVELS[pr.level - 1];
  const rest = settings.clearsToLevelUp - pr.clears;
  $('levelBadge').innerHTML = settings.rules.level
    ? `<b>Lv${L.lv}</b> ${esc(L.name)} <span class="hint">${pr.level < LEVELS.length ? `次まであと${rest}回クリア` : '最高レベル'}</span>`
    : '<span class="hint">難易度オフ</span>';
}

// ---------- 描画: ライブラリ ----------
let libMode = 'plugins';

function filteredLib() {
  const q = $('libSearch').value.trim().toLowerCase();
  const f = $('libTypeFilter').value;
  if (libMode === 'packs') {
    return library.packs.filter((p) => (!q || p.name.toLowerCase().includes(q)) && (f !== 'off' || !packOn(p)));
  }
  return library.plugins.filter((p) => {
    if (q && !p.name.toLowerCase().includes(q) && !(p.vendor || '').toLowerCase().includes(q)) return false;
    if (f === 'instrument' || f === 'effect') return pluginType(p) === f;
    if (f.startsWith('fx:')) return pluginType(p) === 'effect' && pluginFx(p) === f.slice(3);
    if (f === 'guessed') return p.guessed && !settings.pluginOverrides[p.key]?.type;
    if (f === 'off') return !pluginOn(p);
    return true;
  });
}

function renderLibrary() {
  $('scanInfo').textContent = library.scannedAt
    ? `最終スキャン ${new Date(library.scannedAt).toLocaleString('ja-JP')}・プラグイン${library.plugins.length}・パック${library.packs.length}`
    : '未スキャン';
  document.querySelectorAll('[data-lib]').forEach((b) => b.classList.toggle('active', b.dataset.lib === libMode));
  if (!$('libTypeFilter').querySelector('[value^="fx:"]')) {
    $('libTypeFilter').querySelector('[value="effect"]').insertAdjacentHTML('afterend',
      FX_TYPES.map((x) => `<option value="fx:${x.id}">　エフェクト・${esc(x.label)}</option>`).join(''));
  }
  $('libTypeFilter').querySelectorAll('option').forEach((o) => {
    o.hidden = libMode === 'packs' && !['all', 'off'].includes(o.value);
  });
  const rows = filteredLib();
  $('libCount').textContent = `${rows.length}件`;
  if (libMode === 'packs') {
    $('libTable').innerHTML = `<thead><tr><th>使う</th><th>パック名</th><th>フォルダ</th><th></th></tr></thead><tbody>` +
      (rows.length ? rows.map((p) => `<tr class="${packOn(p) ? '' : 'off'}">
        <td><input type="checkbox" data-pack="${esc(p.key)}" ${packOn(p) ? 'checked' : ''}></td>
        <td>${esc(p.name)}</td><td class="hint">${esc(p.root)}</td>
        <td><button class="ghost" data-openpath="${esc(p.path)}">開く</button></td></tr>`).join('')
        : `<tr><td colspan="4" class="hint">サンプルパックがありません。設定タブでサンプルフォルダを追加して再スキャンしてください。</td></tr>`) + '</tbody>';
    return;
  }
  $('libTable').innerHTML = `<thead><tr><th>使う</th><th>名前</th><th>メーカー</th><th>形式</th><th>種類</th></tr></thead><tbody>` +
    rows.map((p) => {
      const t = pluginType(p);
      const guessed = p.guessed && !settings.pluginOverrides[p.key]?.type;
      return `<tr class="${pluginOn(p) ? '' : 'off'}">
        <td><input type="checkbox" data-plugin="${esc(p.key)}" ${pluginOn(p) ? 'checked' : ''}></td>
        <td>${esc(p.name)}</td><td class="hint">${esc(p.vendor)}</td><td class="hint">${p.format}</td>
        <td><select data-ptype="${esc(p.key)}">
          <option value="instrument" ${t === 'instrument' ? 'selected' : ''}>音源</option>
          <option value="effect" ${t === 'effect' ? 'selected' : ''}>エフェクト</option>
        </select>${t === 'effect' ? ` <select data-pfx="${esc(p.key)}">${FX_TYPES.map((x) =>
          `<option value="${x.id}" ${x.id === pluginFx(p) ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select>` : ''}${guessed ? ' <span class="badge">推定</span>' : ''}</td></tr>`;
    }).join('') + '</tbody>';
}

function setPluginOverride(key, patch) {
  settings.pluginOverrides[key] = { ...settings.pluginOverrides[key], ...patch };
}

$('libTable').addEventListener('change', (e) => {
  const t = e.target;
  if (t.dataset.plugin) setPluginOverride(t.dataset.plugin, { enabled: t.checked });
  else if (t.dataset.ptype) setPluginOverride(t.dataset.ptype, { type: t.value });
  else if (t.dataset.pfx) setPluginOverride(t.dataset.pfx, { fx: t.value });
  else if (t.dataset.pack) settings.packOverrides[t.dataset.pack] = t.checked;
  saveSettings();
  renderLibrary();
});
$('libTable').addEventListener('click', (e) => {
  const b = e.target.closest('[data-openpath]');
  if (b) window.api.openPath(b.dataset.openpath);
});
document.querySelectorAll('[data-lib]').forEach((b) => (b.onclick = () => {
  libMode = b.dataset.lib;
  $('libTypeFilter').value = 'all';
  renderLibrary();
}));
$('libSearch').oninput = renderLibrary;
$('libTypeFilter').onchange = renderLibrary;
function bulk(flag) {
  filteredLib().forEach((p) => {
    if (libMode === 'packs') settings.packOverrides[p.key] = flag;
    else setPluginOverride(p.key, { enabled: flag });
  });
  saveSettings();
  renderLibrary();
}
$('bulkOn').onclick = () => bulk(true);
$('bulkOff').onclick = () => bulk(false);

async function rescan() {
  $('rescanBtn').disabled = true;
  $('rescanBtn').textContent = 'スキャン中…';
  try {
    library = await window.api.scan({ vstRoots: settings.vstRoots, sampleRoots: settings.sampleRoots });
    await window.api.save('library', library);
    toast(`プラグイン${library.plugins.length}個・パック${library.packs.length}個を読み込みました`);
  } finally {
    $('rescanBtn').disabled = false;
    $('rescanBtn').textContent = '再スキャン';
    renderAll();
  }
}
$('rescanBtn').onclick = rescan;

// ---------- 描画: 履歴 ----------
const RESULT_LABEL = { clear: 'クリア', overtime: '時間オーバー', giveup: 'ギブアップ' };

function renderHistory() {
  const done = history.filter((h) => h.result !== 'giveup');
  const clears = history.filter((h) => h.result === 'clear').length;
  const rated = history.filter((h) => h.stars);
  const total = history.reduce((s, h) => s + h.elapsedSec, 0);
  $('stats').innerHTML = [
    ['挑戦', history.length + '回'],
    ['完成', done.length + '回'],
    ['時間内クリア', clears + '回'],
    ['平均★', rated.length ? (rated.reduce((s, h) => s + h.stars, 0) / rated.length).toFixed(1) : '-'],
    ['合計時間', fmt(total * 1000)],
  ].map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('');

  $('historyList').innerHTML = history.length ? history.map((h) => `
    <article class="hist res-${h.result}">
      <header>
        <span class="date">${new Date(h.date).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })}</span>
        <span class="tag">${RESULT_LABEL[h.result]}</span>
        ${h.level ? `<span class="hint">Lv${h.level}</span>` : ''}
        <span class="hint">${fmt(h.elapsedSec * 1000)}${h.limitMin ? ` / ${h.limitMin}分` : ''}</span>
        <span class="star-view">${h.stars ? '★'.repeat(h.stars) + '<i>' + '★'.repeat(5 - h.stars) + '</i>' : ''}</span>
        <span class="spacer"></span>
        <button class="ghost" data-del="${h.id}">削除</button>
      </header>
      <div class="chips">${h.items.map((it) => `<span class="chip kind-${it.kind}"><i>${kindLabel(it)}${it.fixed ? '📌' : ''}</i>${esc(it.name)}</span>`).join('')}</div>
      ${h.memo ? `<p class="memo">${esc(h.memo)}</p>` : ''}
    </article>`).join('') : '<p class="hint">まだ記録がありません。</p>';
}
$('historyList').addEventListener('click', (e) => {
  const b = e.target.closest('[data-del]');
  if (!b || !confirm('この記録を削除しますか？')) return;
  history = history.filter((h) => h.id !== b.dataset.del);
  window.api.save('history', history);
  renderHistory();
});

// ---------- 描画: 設定 ----------
function renderFolders(listId, key) {
  $(listId).innerHTML = settings[key].length ? settings[key].map((f, i) => `
    <li><span>${esc(f)}</span><button class="ghost" data-remove="${key}:${i}">外す</button></li>`).join('')
    : '<li class="hint">まだありません</li>';
}
function renderSettings() {
  renderFolders('vstFolders', 'vstRoots');
  renderFolders('sampleFolders', 'sampleRoots');
  $('genreText').value = settings.genresText;
  $('partText').value = settings.partsText;
  $('optSound').checked = settings.sound;
  $('optClears').value = settings.clearsToLevelUp;
  $('optAvoid').value = settings.avoidRecent;
}
async function addFolder(key) {
  const picked = await window.api.pickFolder();
  const added = picked.filter((p) => !settings[key].includes(p));
  if (!added.length) return;
  settings[key].push(...added);
  saveSettings();
  renderSettings();
  await rescan();
}
$('addVst').onclick = () => addFolder('vstRoots');
$('addSample').onclick = () => addFolder('sampleRoots');
document.querySelector('.settings-grid').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-remove]');
  if (!b) return;
  const [key, i] = b.dataset.remove.split(':');
  settings[key].splice(+i, 1);
  saveSettings();
  renderSettings();
  await rescan();
});
$('genreText').oninput = (e) => { settings.genresText = e.target.value; saveSettings(); };
$('partText').oninput = (e) => { settings.partsText = e.target.value; saveSettings(); };
$('optSound').onchange = (e) => { settings.sound = e.target.checked; saveSettings(); };
$('optClears').onchange = (e) => { settings.clearsToLevelUp = Math.max(1, +e.target.value || 3); saveSettings(); renderLevel(); };
$('optAvoid').onchange = (e) => { settings.avoidRecent = Math.max(0, +e.target.value || 0); saveSettings(); };

// ---------- タブ ----------
document.querySelectorAll('[data-tab]').forEach((b) => (b.onclick = () => {
  document.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('active', x === b));
  document.querySelectorAll('.tab').forEach((s) => s.classList.toggle('active', s.id === 'tab-' + b.dataset.tab));
  if (b.dataset.tab === 'library') renderLibrary();
  if (b.dataset.tab === 'history') renderHistory();
  if (b.dataset.tab === 'settings') renderSettings();
}));

function renderAll() {
  renderLevel();
  renderChallenge();
  renderLibrary();
  renderHistory();
  renderSettings();
}

// ---------- 起動 ----------
(async function init() {
  const saved = (await window.api.load('settings')) || {};
  settings = {
    ...structuredClone(DEFAULT_SETTINGS),
    ...saved,
    rules: { ...DEFAULT_SETTINGS.rules, ...saved.rules },
    manual: { ...DEFAULT_SETTINGS.manual, ...saved.manual },
    progress: { ...DEFAULT_SETTINGS.progress, ...saved.progress },
    fixed: { ...structuredClone(DEFAULT_SETTINGS.fixed), ...saved.fixed },
  };
  library = (await window.api.load('library')) || library;
  history = (await window.api.load('history')) || [];
  renderAll();
  if (!library.scannedAt) await rescan();
})();

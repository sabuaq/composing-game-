// 初期値とゲームのルール表
const DEFAULT_GENRES = [
  'テクノ, 125, 135',
  'ハードテクノ, 140, 155',
  'ミニマルテクノ, 124, 130',
  'ハウス, 120, 128',
  'ディープハウス, 118, 124',
  'テックハウス, 124, 128',
  'プログレッシブハウス, 122, 128',
  'トランス, 132, 140',
  'ドラムンベース, 170, 176',
  'ダブステップ, 140, 150',
  'フューチャーベース, 140, 160',
  'UKガラージ, 130, 136',
  'ブレイクビーツ, 125, 140',
  'エレクトロ, 125, 135',
  'トラップ, 130, 150',
  'アンビエント, 60, 100',
  'Lo-fi, 70, 90',
  'ハイパーポップ, 150, 170',
].join('\n');

const DEFAULT_PARTS = [
  'ピアノ', 'エレピ', 'オルガン', 'ベース', 'サブベース', 'リードシンセ', 'パッド', 'プラック',
  'アルペジオ', 'ストリングス', 'ブラス', 'ギター', 'ベル', 'ボーカルチョップ', 'クワイア',
  'パーカッション', 'ドローン', 'ライザー/FX', 'ノイズ', 'ワンショットのスタブ',
].join('\n');

// 英語の時の初期値（ジャンル名・パート名は設定タブで自由に書き換えられる）
const DEFAULT_GENRES_EN = [
  'Techno, 125, 135', 'Hard Techno, 140, 155', 'Minimal Techno, 124, 130', 'House, 120, 128',
  'Deep House, 118, 124', 'Tech House, 124, 128', 'Progressive House, 122, 128', 'Trance, 132, 140',
  'Drum & Bass, 170, 176', 'Dubstep, 140, 150', 'Future Bass, 140, 160', 'UK Garage, 130, 136',
  'Breakbeat, 125, 140', 'Electro, 125, 135', 'Trap, 130, 150', 'Ambient, 60, 100', 'Lo-fi, 70, 90', 'Hyperpop, 150, 170',
].join('\n');

const DEFAULT_PARTS_EN = [
  'Piano', 'Electric piano', 'Organ', 'Bass', 'Sub bass', 'Lead synth', 'Pad', 'Pluck',
  'Arpeggio', 'Strings', 'Brass', 'Guitar', 'Bells', 'Vocal chop', 'Choir',
  'Percussion', 'Drone', 'Riser / FX', 'Noise', 'One-shot stab',
].join('\n');

const NOTE_NAMES = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F#', 'G', 'A♭', 'A', 'B♭', 'B'];
// モードと目標は id で持ち、表示は i18n.js の文言を使う
const BASIC_MODES = ['major', 'minor'];
const EXTRA_MODES = ['dorian', 'phrygian', 'lydian', 'mixolydian'];

// 難易度ごとの設定
const LEVELS = [
  { lv: 1, minutes: 60, packs: 1, instruments: 1, effects: 1, parts: 2, rerolls: 3, goal: 'loop8', modes: false },
  { lv: 2, minutes: 45, packs: 1, instruments: 1, effects: 1, parts: 3, rerolls: 2, goal: 'loop16', modes: false },
  { lv: 3, minutes: 40, packs: 2, instruments: 1, effects: 2, parts: 3, rerolls: 2, goal: 'build', modes: false },
  { lv: 4, minutes: 30, packs: 2, instruments: 2, effects: 2, parts: 4, rerolls: 1, goal: 'intro', modes: true },
  { lv: 5, minutes: 20, packs: 3, instruments: 2, effects: 3, parts: 4, rerolls: 0, goal: 'oneMin', modes: true },
];

const GOALS = ['none', 'loop8', 'loop16', 'build', 'intro', 'oneMin'];

// エフェクトの種類（この並びで画面に出す）。cat = VST3の分類、words = 名前に入っている単語
const FX_TYPES = [
  { id: 'dynamics', cat: /Dynamics/i, words: /comp(?!ens)|limit|gate|expand|transient|dynamic|ott\b|squash|smash|loud|maxim|de-?ess|pump|duck|sidechain|volume ?shap|leveler|1176|la-?2a|master|punch|upward/i },
  { id: 'eq', cat: /EQ/i, words: /(^|[^a-z])eq|eq($|[^a-z])|equali|pultec|tilt|resonance|air\b/i },
  { id: 'reverb', cat: /Reverb/i, words: /reverb|verb|hall|plate|spring|ambien|shimmer|atmos|space|rev-?x|convol/i },
  { id: 'delay', cat: /Delay/i, words: /delay|deelay|echo|ping.?pong/i },
  { id: 'distortion', cat: /Distortion|Restoration/i, words: /distort|satur|drive|crush|fuzz|tape|tube|amp\b|amplif|warm|grit|dirt|lo-?fi|decimat|clip|bit ?(crush|fun)|wave ?(fold|shap)|vinyl|vhs|crunch/i },
  { id: 'filter', cat: /Filter/i, words: /filter|wah|formant|cutoff|vowel|band ?pass|comb|resonat/i },
  { id: 'modulation', cat: /Modulation|Pitch/i, words: /chorus|flang|phas|tremolo|vibrato|rotary|doubler|detun|pitch|shift|modulat|animate|ensemble|ring ?mod|tune|dimension/i },
  { id: 'stereo', cat: /Spatial|Surround/i, words: /stereo|wide|width|imager|haas|pann|\bpan\b|autopan|spatial|binaural|3d/i },
  { id: 'creative', cat: null, words: /glitch|stutter|revers|backmask|chop|slice|granul|random|vocoder|tape ?stop|gross|beat ?repeat/i },
  { id: 'mix', cat: null, words: /channel.?strip|chstrip|ozone ?\d+ ?elements|neutron|nectar|mixing suite/i },
  { id: 'utility', cat: /Analyzer|Tools/i, words: /meter|analy[sz]|scope|visuali|tuner|loudness|gain$|utility|metronome|noise ?gen|oscillat|recorder|arpegg|midi|chord|decoder|encoder|convert|rotator|compensat|directivity|matrix|bridge|insight|reference|channel ?check|tonal ?balance|toolbox/i },
  { id: 'other', cat: null, words: null },
];

// 判定する順番（先に当たったものになる）。ユーティリティを最初にして、メーター類が他に混ざらないようにする
const FX_DETECT_ORDER = ['utility', 'mix', 'creative', 'reverb', 'delay', 'eq', 'stereo', 'dynamics', 'filter', 'modulation', 'distortion'];

// 名前だけでは分からない有名どころの対応表（キーは英数字だけを小文字にしたもの）
// instrument は「エフェクトと推定されていたけど実は音源」のもの
const FX_KNOWN = {
  // 音源
  grooveagentse: 'instrument', halionsonic: 'instrument', retrologue: 'instrument', kompletekontrol: 'instrument',
  reaktor6: 'instrument', voisonasong: 'instrument', voisonasongaraplugin: 'instrument',
  delaylama: 'instrument', magical8bitplug2: 'instrument',
  // リバーブ
  aether: 'reverb', raum: 'reverb',
  // ディレイ
  replika: 'delay',
  // EQ
  barkofdog3: 'eq', bassroom: 'eq', mixroom: 'eq', reso: 'eq', deboom: 'eq', freshair: 'eq', tdrnova: 'eq',
  // コンプ
  supercharger: 'dynamics', puncher2: 'dynamics', zenupwd: 'dynamics',
  // フィルター
  fluxmini2: 'filter', pinktrombonefx: 'filter',
  // モジュレーション・ピッチ
  magicswitch: 'modulation', kerovee: 'modulation', traptunecore: 'modulation', khsshaper: 'modulation',
  // ステレオ・空間
  placeit: 'stereo', panipulator3: 'stereo', mcenter: 'stereo', mchannelmatrix: 'stereo', khschannelmixer: 'stereo', mspectralpan: 'stereo',
  // 歪み・ローファイ
  cymaticsdiablolite: 'distortion', mangl3r: 'distortion', pisstortion: 'distortion',
  dspgaclassicsclean: 'distortion', gaclassicsclean: 'distortion', vhsnoisegenerator: 'distortion',
  // グリッチ・飛び道具
  magicdice: 'creative', prisma: 'creative', mpaint: 'creative', cymaticsvoxity: 'creative',
  // ミックス・マスタリング系
  izvea: 'mix', vea: 'mix',
  // ユーティリティ・メーター
  bongocatband: 'utility', catjammer: 'utility', gifgroove: 'utility', orchid: 'utility', neuralnote: 'utility',
  genkhordbridge: 'utility', lua51: 'utility', plugdata: 'utility', plugdatafx: 'utility', levels: 'utility',
  refsend: 'utility', span: 'utility', spectralayers: 'utility', tdrprism: 'utility', mccgenerator: 'utility',
  khsgain: 'utility', zengain: 'utility', mutility: 'utility', midilens: 'utility', energyvisualizer: 'utility',
  syncroomvstbridgex64: 'utility', syncroomvstbridgesubmultioutx64: 'utility',
};
const fxKey = (name) => String(name).toLowerCase().replace(/[^a-z0-9]/g, '');

const DEFAULT_SETTINGS = {
  lang: null, // null = PCの言語に合わせる
  vstRoots: ['C:\\Program Files\\Common Files\\VST3', 'C:\\Program Files\\VSTPlugins'],
  sampleRoots: [],
  genresText: DEFAULT_GENRES,
  partsText: DEFAULT_PARTS,
  rules: { time: true, bpm: true, key: true, genre: true, level: true, record: true },
  manual: { minutes: 30, packs: 1, instruments: 1, effects: 1, parts: 2, goal: 'loop16', modes: false },
  progress: { level: 1, clears: 0 },
  clearsToLevelUp: 3,
  avoidRecent: 5,
  sound: true,
  // 自分で指定した項目（空ならランダム）
  fixed: { genre: '', bpm: null, keyNote: '', keyMode: '', pack: [], instrument: [], effect: [], part: [] },
  // エフェクトの出し方: random = 全部の中からランダム / byType = 選んだ種類から1つずつ
  effectMode: 'random',
  effectTypes: ['dynamics', 'eq', 'reverb'],
  pluginOverrides: {},
  packOverrides: {},
};

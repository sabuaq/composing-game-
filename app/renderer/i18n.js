// 画面の文言（日本語 / English）。t('キー', { 変数 }) で取り出す
const I18N = {
  ja: {
    'app.title': '作曲練習ゲーム',
    'tab.play': 'お題', 'tab.library': 'ライブラリ', 'tab.history': '履歴', 'tab.settings': '設定',
    'lang.label': '言語',

    'play.rules': '今回の縛り',
    'play.rulesHint': '使う縛りだけオンにしてください。',
    'play.counts': '出す素材の数',
    'play.fixed': '自分で指定する',
    'play.fixedHint': '指定した項目はそのまま出て、残りはランダムになります。お題の📌でも指定できます。',
    'play.draw': 'お題を引く', 'play.redraw': 'もう一度引く',
    'play.empty': '左で縛りを選んで「お題を引く」を押してください。',
    'play.challenge': 'お題',

    'rule.time': '制限時間', 'rule.genre': 'ジャンル', 'rule.bpm': 'BPM', 'rule.key': 'キー',
    'rule.level': '難易度', 'rule.record': '履歴に記録', 'rule.goal': '目標',
    'rule.minutes': '分', 'rule.modes': 'モードも出す',

    'kind.genre': 'ジャンル', 'kind.bpm': 'BPM', 'kind.key': 'キー', 'kind.goal': '目標', 'kind.time': '制限時間',
    'kind.pack': 'サンプルパック', 'kind.instrument': '音源', 'kind.effect': 'エフェクト', 'kind.part': '使うパート',
    'kind.sep': '・',

    'mode.major': 'メジャー', 'mode.minor': 'マイナー', 'mode.dorian': 'ドリアン', 'mode.phrygian': 'フリジアン',
    'mode.lydian': 'リディアン', 'mode.mixolydian': 'ミクソリディアン',

    'goal.none': 'なし', 'goal.loop8': '8小節のループ', 'goal.loop16': '16小節のループ',
    'goal.build': 'ビルドアップ→ドロップ', 'goal.intro': 'イントロ→ビルド→ドロップ', 'goal.oneMin': '1分の曲の骨組み',

    'level.1': 'はじめの一歩', 'level.2': 'ループ職人', 'level.3': '展開づくり', 'level.4': '縛りの達人', 'level.5': '即興の鬼',
    'level.hint': 'Lv{lv}：{time}目標「{goal}」・引き直し{rerolls}回{modes}',
    'level.hintTime': '{min}分・', 'level.hintModes': '・モードあり',
    'level.manualHint': '難易度をオフにすると数や時間を自由に決められます。引き直しは無制限です。',
    'level.next': '次まであと{n}回クリア', 'level.max': '最高レベル', 'level.off': '難易度オフ',
    'level.up': 'レベルアップ！ Lv{lv}「{name}」',

    'fx.dynamics': 'コンプ', 'fx.eq': 'EQ', 'fx.reverb': 'リバーブ', 'fx.delay': 'ディレイ',
    'fx.distortion': '歪み・ローファイ', 'fx.filter': 'フィルター', 'fx.modulation': 'モジュレーション・ピッチ',
    'fx.stereo': 'ステレオ・空間', 'fx.creative': 'グリッチ・飛び道具', 'fx.mix': 'ミックス・マスタリング系',
    'fx.utility': 'ユーティリティ・メーター', 'fx.other': 'その他',
    'fx.modeRandom': '全部からランダム', 'fx.modeByType': '種類ごと',
    'fx.typeTitle': '候補{n}個',
    'fx.byTypeHint': '選んだ種類から1つずつ出ます（数字は候補の数）。種類はライブラリで直せます。',

    'fixed.random': 'ランダム', 'fixed.noteRandom': '音名ランダム', 'fixed.remove': '外す', 'fixed.pick': '＋選ぶ',
    'fixed.countMixed': '指定{n}＋ランダム{rest}', 'fixed.countFixed': '指定{n}', 'fixed.countRandom': 'ランダム{n}',
    'fixed.clear': 'すべてランダムに戻す', 'fixed.summary': '{n}項目を指定中',

    'pick.title': '{kind}を指定', 'pick.search': '名前で絞り込み（一覧にない名前も追加できます）',
    'pick.add': '＋「{name}」を追加して指定', 'pick.none': '候補がありません。ライブラリ・設定を確認してください。',
    'pick.count': '{n}件を選択中', 'pick.cancel': 'キャンセル', 'pick.ok': '決定',

    'warn.missing': '{list}の候補が足りません（ライブラリ・設定を確認）', 'warn.listSep': '・',
    'warn.noOther': 'ほかの候補がありません',
    'warn.notScanned': 'まだスキャンしていません。', 'warn.noSamples': 'サンプルフォルダが未設定です（設定タブで追加）。',
    'warn.noInstruments': '音源の候補が0件です。',

    'item.fixed': '指定', 'item.open': '開く', 'item.openTitle': 'フォルダを開く',
    'item.unpin': '指定を外す', 'item.pin': '次からも固定する（指定に入れる）', 'item.reroll': 'これだけ引き直す',
    'item.minutes': '{n}分',
    'item.exclude': '今後出さない（ライブラリで外す）',
    'item.excluded': '「{name}」を今後出さないようにしました（ライブラリで戻せます）',
    'item.excludedNone': '「{name}」を外しました。ほかの候補がないので、この枠はなしになります',
    'reroll.unlimited': '引き直し：無制限', 'reroll.left': '引き直し：残り{n}回',

    'timer.over': '時間切れ（このまま続けてもOK）', 'timer.left': '残り時間 / 制限 {n}分', 'timer.elapsed': '経過時間',
    'timer.ready': 'スタートを押すと計測が始まります', 'timer.paused': '一時停止中',

    'act.cancel': 'やめる', 'act.start': 'スタート', 'act.pause': '一時停止', 'act.resume': '再開',
    'act.compact': '小さく表示', 'act.giveup': 'ギブアップ', 'act.done': 'できた', 'act.expand': '元に戻す',
    'act.giveupConfirm': 'ギブアップしますか？',

    'result.clear': 'クリア！', 'result.overtime': '完成！（時間オーバー）', 'result.giveup': 'ギブアップ',
    'result.time': 'かかった時間 {time}', 'result.limit': ' / 制限 {n}分',
    'result.rated': '自己評価 {n}', 'result.unrated': '評価なし',
    'result.memo': 'メモ（よかった所・反省・曲名など）', 'result.back': '戻る', 'result.save': '記録する',
    'result.thanks': 'おつかれさま！', 'result.thanksGiveup': 'おつかれさま。次いこう', 'result.default': 'おつかれさま',

    'lib.hint': 'お題に出したくないものはチェックを外してください。種類が「推定」のものは名前から判断しているので、違っていたら直してください。',
    'lib.rescan': '再スキャン', 'lib.scanning': 'スキャン中…',
    'lib.plugins': 'プラグイン', 'lib.packs': 'サンプルパック', 'lib.search': '名前で絞り込み',
    'lib.all': 'すべての種類', 'lib.instrument': '音源', 'lib.effect': 'エフェクト', 'lib.guessed': '推定のもの', 'lib.off': '使わないもの',
    'lib.effectOf': 'エフェクト・{type}',
    'lib.bulkOn': '表示中を全部使う', 'lib.bulkOff': '表示中を全部外す',
    'lib.scanned': '最終スキャン {date}・プラグイン{p}・パック{k}', 'lib.notScanned': '未スキャン',
    'lib.count': '{n}件',
    'lib.colUse': '使う', 'lib.colPack': 'パック名', 'lib.colFolder': 'フォルダ', 'lib.colName': '名前',
    'lib.colVendor': 'メーカー', 'lib.colFormat': '形式', 'lib.colType': '種類',
    'lib.noPacks': 'サンプルパックがありません。設定タブでサンプルフォルダを追加して再スキャンしてください。',
    'lib.guessBadge': '推定',
    'lib.loaded': 'プラグイン{p}個・パック{k}個を読み込みました',

    'hist.res.clear': 'クリア', 'hist.res.overtime': '時間オーバー', 'hist.res.giveup': 'ギブアップ',
    'hist.tries': '挑戦', 'hist.done': '完成', 'hist.clears': '時間内クリア', 'hist.avg': '平均★', 'hist.total': '合計時間',
    'hist.times': '{n}回', 'hist.limit': ' / {n}分', 'hist.delete': '削除', 'hist.empty': 'まだ記録がありません。',
    'hist.deleteConfirm': 'この記録を削除しますか？',

    'set.vst': 'VSTフォルダ', 'set.samples': 'サンプルフォルダ',
    'set.samplesHint': '追加したフォルダの直下にあるフォルダを1つのサンプルパックとして扱います。',
    'set.addFolder': 'フォルダを追加', 'set.remove': '外す', 'set.none': 'まだありません',
    'set.genres': 'ジャンルとBPM', 'set.genresHint': '1行に「ジャンル名, 最小BPM, 最大BPM」',
    'set.parts': '楽器パート', 'set.partsHint': '1行に1つ。お題の「使うパート」に出ます。',
    'set.other': 'その他', 'set.sound': '時間切れで音を鳴らす',
    'set.clears': 'レベルアップに必要なクリア回数', 'set.avoid': '最近出た素材を避ける（直近の回数）',
  },

  en: {
    'app.title': 'Composing Practice Game',
    'tab.play': 'Challenge', 'tab.library': 'Library', 'tab.history': 'History', 'tab.settings': 'Settings',
    'lang.label': 'Language',

    'play.rules': 'Rules',
    'play.rulesHint': 'Turn on only the rules you want to use.',
    'play.counts': 'How many of each',
    'play.fixed': 'Choose items yourself',
    'play.fixedHint': 'Items you choose always appear; the rest are random. You can also use 📌 on a challenge.',
    'play.draw': 'Draw a challenge', 'play.redraw': 'Draw again',
    'play.empty': 'Pick your rules on the left and press "Draw a challenge".',
    'play.challenge': 'Challenge',

    'rule.time': 'Time limit', 'rule.genre': 'Genre', 'rule.bpm': 'BPM', 'rule.key': 'Key',
    'rule.level': 'Difficulty', 'rule.record': 'Save to history', 'rule.goal': 'Goal',
    'rule.minutes': 'min', 'rule.modes': 'Include modes',

    'kind.genre': 'Genre', 'kind.bpm': 'BPM', 'kind.key': 'Key', 'kind.goal': 'Goal', 'kind.time': 'Time limit',
    'kind.pack': 'Sample pack', 'kind.instrument': 'Instrument', 'kind.effect': 'Effect', 'kind.part': 'Part',
    'kind.sep': ' · ',

    'mode.major': 'Major', 'mode.minor': 'Minor', 'mode.dorian': 'Dorian', 'mode.phrygian': 'Phrygian',
    'mode.lydian': 'Lydian', 'mode.mixolydian': 'Mixolydian',

    'goal.none': 'None', 'goal.loop8': '8-bar loop', 'goal.loop16': '16-bar loop',
    'goal.build': 'Build-up → drop', 'goal.intro': 'Intro → build → drop', 'goal.oneMin': 'Sketch of a 1-minute track',

    'level.1': 'First Steps', 'level.2': 'Loop Crafter', 'level.3': 'Arranger', 'level.4': 'Limit Master', 'level.5': 'Improv Demon',
    'level.hint': 'Lv{lv}: {time}goal "{goal}" · {rerolls} rerolls{modes}',
    'level.hintTime': '{min} min · ', 'level.hintModes': ' · modes',
    'level.manualHint': 'Turn difficulty off to set counts and time freely. Rerolls are unlimited.',
    'level.next': '{n} more clears to level up', 'level.max': 'Max level', 'level.off': 'Difficulty off',
    'level.up': 'Level up! Lv{lv} "{name}"',

    'fx.dynamics': 'Compressor', 'fx.eq': 'EQ', 'fx.reverb': 'Reverb', 'fx.delay': 'Delay',
    'fx.distortion': 'Distortion / Lo-fi', 'fx.filter': 'Filter', 'fx.modulation': 'Modulation / Pitch',
    'fx.stereo': 'Stereo / Space', 'fx.creative': 'Glitch / Creative', 'fx.mix': 'Mixing / Mastering',
    'fx.utility': 'Utility / Meter', 'fx.other': 'Other',
    'fx.modeRandom': 'Any effect', 'fx.modeByType': 'By type',
    'fx.typeTitle': '{n} candidates',
    'fx.byTypeHint': 'One effect from each checked type (numbers are candidates). Fix types in the Library.',

    'fixed.random': 'Random', 'fixed.noteRandom': 'Random note', 'fixed.remove': 'Remove', 'fixed.pick': '+ Choose',
    'fixed.countMixed': '{n} chosen + {rest} random', 'fixed.countFixed': '{n} chosen', 'fixed.countRandom': '{n} random',
    'fixed.clear': 'Reset all to random', 'fixed.summary': '{n} chosen',

    'pick.title': 'Choose {kind}', 'pick.search': 'Filter by name (you can also add a name not in the list)',
    'pick.add': '+ Add "{name}" and choose it', 'pick.none': 'No candidates. Check the Library and Settings.',
    'pick.count': '{n} selected', 'pick.cancel': 'Cancel', 'pick.ok': 'OK',

    'warn.missing': 'Not enough candidates for {list} (check Library / Settings)', 'warn.listSep': ', ',
    'warn.noOther': 'No other candidates',
    'warn.notScanned': 'Not scanned yet.', 'warn.noSamples': 'No sample folder set (add one in Settings).',
    'warn.noInstruments': 'No instruments found.',

    'item.fixed': 'chosen', 'item.open': 'Open', 'item.openTitle': 'Open folder',
    'item.unpin': 'Unpin', 'item.pin': 'Pin (keep it for next time)', 'item.reroll': 'Reroll this one',
    'item.minutes': '{n} min',
    'item.exclude': "Don't show again (exclude in Library)",
    'item.excluded': 'Excluded "{name}" (you can turn it back on in the Library)',
    'item.excludedNone': 'Excluded "{name}". No other candidates, so this slot was removed',
    'reroll.unlimited': 'Rerolls: unlimited', 'reroll.left': 'Rerolls left: {n}',

    'timer.over': "Time's up (you can keep going)", 'timer.left': 'Time left / limit {n} min', 'timer.elapsed': 'Elapsed',
    'timer.ready': 'Press Start to begin the timer', 'timer.paused': 'Paused',

    'act.cancel': 'Cancel', 'act.start': 'Start', 'act.pause': 'Pause', 'act.resume': 'Resume',
    'act.compact': 'Mini window', 'act.giveup': 'Give up', 'act.done': 'Done', 'act.expand': 'Expand',
    'act.giveupConfirm': 'Give up on this challenge?',

    'result.clear': 'Clear!', 'result.overtime': 'Finished! (over time)', 'result.giveup': 'Gave up',
    'result.time': 'Time taken {time}', 'result.limit': ' / limit {n} min',
    'result.rated': 'Self-rating {n}', 'result.unrated': 'No rating',
    'result.memo': 'Notes (what went well, what to improve, track title…)', 'result.back': 'Back', 'result.save': 'Save',
    'result.thanks': 'Nice work!', 'result.thanksGiveup': 'Good effort. On to the next one', 'result.default': 'Nice work',

    'lib.hint': 'Uncheck anything you don\'t want in challenges. Types marked "guessed" come from the name, so fix them if they\'re wrong.',
    'lib.rescan': 'Rescan', 'lib.scanning': 'Scanning…',
    'lib.plugins': 'Plugins', 'lib.packs': 'Sample packs', 'lib.search': 'Filter by name',
    'lib.all': 'All types', 'lib.instrument': 'Instruments', 'lib.effect': 'Effects', 'lib.guessed': 'Guessed', 'lib.off': 'Not used',
    'lib.effectOf': 'Effect · {type}',
    'lib.bulkOn': 'Use all shown', 'lib.bulkOff': 'Exclude all shown',
    'lib.scanned': 'Last scan {date} · {p} plugins · {k} packs', 'lib.notScanned': 'Not scanned',
    'lib.count': '{n} items',
    'lib.colUse': 'Use', 'lib.colPack': 'Pack', 'lib.colFolder': 'Folder', 'lib.colName': 'Name',
    'lib.colVendor': 'Vendor', 'lib.colFormat': 'Format', 'lib.colType': 'Type',
    'lib.noPacks': 'No sample packs. Add a sample folder in Settings and rescan.',
    'lib.guessBadge': 'guessed',
    'lib.loaded': 'Loaded {p} plugins and {k} packs',

    'hist.res.clear': 'Clear', 'hist.res.overtime': 'Over time', 'hist.res.giveup': 'Gave up',
    'hist.tries': 'Tries', 'hist.done': 'Finished', 'hist.clears': 'In time', 'hist.avg': 'Avg ★', 'hist.total': 'Total time',
    'hist.times': '{n}', 'hist.limit': ' / {n} min', 'hist.delete': 'Delete', 'hist.empty': 'No records yet.',
    'hist.deleteConfirm': 'Delete this record?',

    'set.vst': 'VST folders', 'set.samples': 'Sample folders',
    'set.samplesHint': 'Each folder directly inside an added folder counts as one sample pack.',
    'set.addFolder': 'Add folder', 'set.remove': 'Remove', 'set.none': 'None yet',
    'set.genres': 'Genres and BPM', 'set.genresHint': 'One per line: "Genre, min BPM, max BPM"',
    'set.parts': 'Parts', 'set.partsHint': 'One per line. Used for "Part" in challenges.',
    'set.other': 'Other', 'set.sound': "Play a sound when time's up",
    'set.clears': 'Clears needed to level up', 'set.avoid': 'Avoid recently used items (last N challenges)',
  },
};

let LANG = 'ja';

function t(key, vars) {
  let s = I18N[LANG][key] ?? I18N.ja[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] ?? m));
  return s;
}

// HTMLの data-i18n（文字）/ data-i18n-ph（placeholder）を今の言語にする
function applyStaticText() {
  document.documentElement.lang = LANG;
  document.title = t('app.title');
  document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach((el) => { el.placeholder = t(el.dataset.i18nPh); });
}

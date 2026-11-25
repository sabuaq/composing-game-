const { app, BrowserWindow, ipcMain, dialog, shell, screen } = require('electron');
const fs = require('fs/promises');
const path = require('path');
const { scanAll } = require('./scanner');

// 設定・履歴を保存する data フォルダ
// - 起動.vbs から動かす時：app フォルダの隣（Googleドライブなどで同期できる）
// - ポータブル版の exe：その exe と同じフォルダ（PORTABLE_EXECUTABLE_DIR は electron-builder が渡す）
// - インストール版：ユーザーごとのアプリ用フォルダ（%APPDATA% の下）
function dataDir() {
  if (process.env.SRG_DATA) return process.env.SRG_DATA;
  if (process.env.PORTABLE_EXECUTABLE_DIR) return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'data');
  if (app.isPackaged) return path.join(app.getPath('userData'), 'data');
  return path.join(__dirname, '..', 'data');
}
const DATA_DIR = dataDir();
const DATA_FILES = new Set(['settings', 'library', 'history']);
const saveQueues = new Map();

let win;
let normalBounds = null;
let wasMaximized = false;
let isCompact = false;

function createWindow() {
  win = new BrowserWindow({
    width: 1040,
    height: 760,
    minWidth: 320,
    minHeight: 180,
    backgroundColor: '#14171a',
    title: '作曲練習ゲーム',
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // 動作確認用: SRG_DEBUG=1 で画面のログを出す
  if (process.env.SRG_DEBUG) {
    win.webContents.on('console-message', (e) => console.log('[renderer]', e.message ?? e));
    win.webContents.on('preload-error', (_e, p, err) => console.log('[preload-error]', err));
  }
}

module.exports = { getWindow: () => win };

function dataPath(name) {
  if (!DATA_FILES.has(name)) throw new Error('unknown data file: ' + name);
  return path.join(DATA_DIR, name + '.json');
}

ipcMain.handle('data:load', async (_e, name) => {
  try {
    return JSON.parse(await fs.readFile(dataPath(name), 'utf8'));
  } catch {
    return null;
  }
});

ipcMain.handle('data:save', (_e, name, obj) => {
  const file = dataPath(name);
  const prev = saveQueues.get(file) || Promise.resolve();
  const next = prev.catch(() => {}).then(async () => {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = file + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(obj, null, 2), 'utf8');
    await fs.rename(tmp, file);
    return true;
  });
  saveQueues.set(file, next);
  return next;
});

ipcMain.handle('scan', async (_e, roots) => scanAll(roots));

ipcMain.handle('pick-folder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'multiSelections'] });
  return r.canceled ? [] : r.filePaths;
});

ipcMain.handle('open-path', async (_e, p) => {
  if (typeof p !== 'string' || !path.isAbsolute(p)) return '';
  try {
    const st = await fs.stat(p);
    if (!st.isDirectory()) return '';
    return await shell.openPath(p);
  } catch {
    return '';
  }
});

ipcMain.handle('always-on-top', (_e, flag) => {
  win.setAlwaysOnTop(!!flag, 'floating');
  return win.isAlwaysOnTop();
});

// 作業中はDAWの横に置ける小さな窓にする
const COMPACT_W = 340;
const COMPACT_H = 230;
ipcMain.handle('compact', (_e, flag) => {
  const next = !!flag;
  if (next === isCompact) return next;
  isCompact = next;
  if (next) {
    wasMaximized = win.isMaximized();
    if (wasMaximized) win.unmaximize();
    normalBounds = win.getBounds();
    const area = screen.getDisplayMatching(normalBounds).workArea;
    const x = Math.min(Math.max(normalBounds.x + normalBounds.width - COMPACT_W, area.x), area.x + area.width - COMPACT_W);
    const y = Math.min(Math.max(normalBounds.y, area.y), area.y + area.height - COMPACT_H);
    win.setAlwaysOnTop(true, 'floating');
    win.setBounds({ width: COMPACT_W, height: COMPACT_H, x, y });
  } else {
    win.setAlwaysOnTop(false);
    if (normalBounds) win.setBounds(normalBounds);
    if (wasMaximized) {
      win.maximize();
      wasMaximized = false;
    }
  }
  return next;
});

// 2つ目を起動しようとしたら、開いている窓を前に出す
if (!process.env.SRG_DATA && !app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!win) return;
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  });
  app.whenReady().then(createWindow);
}
app.on('window-all-closed', () => app.quit());

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
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

let win;
let normalBounds = null;

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

  // 動作確認用: SRG_DEBUG=1 で画面のログを出す、SRG_SHOT=フォルダ で画面を保存する
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

ipcMain.handle('data:save', async (_e, name, obj) => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const file = dataPath(name);
  const tmp = file + '.tmp';
  await fs.writeFile(tmp, JSON.stringify(obj, null, 2), 'utf8');
  await fs.rename(tmp, file);
  return true;
});

ipcMain.handle('scan', async (_e, roots) => scanAll(roots));

ipcMain.handle('pick-folder', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'multiSelections'] });
  return r.canceled ? [] : r.filePaths;
});

ipcMain.handle('open-path', async (_e, p) => {
  await shell.openPath(p);
});

ipcMain.handle('always-on-top', (_e, flag) => {
  win.setAlwaysOnTop(!!flag, 'floating');
  return win.isAlwaysOnTop();
});

// 作業中はDAWの横に置ける小さな窓にする
ipcMain.handle('compact', (_e, flag) => {
  if (flag) {
    normalBounds = win.getBounds();
    win.setAlwaysOnTop(true, 'floating');
    win.setBounds({ width: 340, height: 230, x: normalBounds.x + normalBounds.width - 340, y: normalBounds.y });
  } else {
    win.setAlwaysOnTop(false);
    if (normalBounds) win.setBounds(normalBounds);
  }
  return flag;
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

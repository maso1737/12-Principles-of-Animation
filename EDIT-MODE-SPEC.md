# EDIT MODE — 共通仕様 (02 / 12 ペア)

`02-anticipation.html` と `12-pose-to-pose.html` が持つ **編集モード** の共通実装まとめ。  
新しく編集モードを持つページを作る際の参照スキルとして使う。

---

## 1. UIトーン

| 項目 | 値 |
|---|---|
| 背景 | ダーク (`#0d051a` 系) |
| アクセント | magenta `var(--rouge, #FF4FA8)` / cyan `var(--acid, #5AE9FF)` |
| モノフォント | `var(--mono)` |
| ショートカットキーチップ `.kbd` | `border:1px solid rgba(255,79,168,0.2)` + `font-size:8px` |

---

## 2. 状態フラグ

```js
const editor = { active: false, /* ページ固有フィールドを追加 */ };
```

- `editor.active` が `true` / `false` で「編集モード中かどうか」を管理する。
- ページ固有の追加フィールド（02は `color`, `brush` / 12は `keyIdx`, `dirty` 等）は自由に追加。

---

## 3. toggleEditMode()

```js
function toggleEditMode() {
  editor.active = !editor.active;
  const btn = document.getElementById('edit-toggle');

  if (editor.active) {
    btn.textContent = '✕ EXIT EDIT MODE';
    btn.classList.add('active');
    // view-mode 非表示 / edit-mode 表示
    // 再生を止める (state.playing = false)
    // 関係する要素に .editing クラスを付与
    // document.getElementById('main').classList.add('editing-mode');
    // 初期化処理を呼ぶ
  } else {
    btn.textContent = '✏ EDIT MODE';
    btn.classList.remove('active');
    // view-mode 表示 / edit-mode 非表示
    // .editing クラスを除去
    // document.getElementById('main').classList.remove('editing-mode');
  }
  updateUI(); // 共通UI更新を必ず呼ぶ
}
```

**EDIT ボタン CSS のポイント (`.editing-mode` 中の見た目)**:
```css
/* EDIT toggle button — flagship */
#edit-toggle { /* width:100%; border:1px solid var(--acid); ... */ }
#edit-toggle.active { background: var(--acid); color: #000; }
```

---

## 4. ショートカットシステム

### 4-1. SHORTCUT_DEFS 配列

```js
const SHORTCUT_DEFS = [
  // ── 常時有効 ──────────────────────────────
  { id:'play',       group:'play', desc:'再生 / 停止',   key:' ',          action:()=>togglePlay() },
  { id:'prev-frame', group:'play', desc:'前コマ',         key:'ArrowLeft',  action:()=>stepFrame(-1) },
  { id:'next-frame', group:'play', desc:'次コマ',         key:'ArrowRight', action:()=>stepFrame(1) },
  { id:'edit-mode',  group:'edit', desc:'編集モード切替', key:'e',          action:()=>toggleEditMode() },
  // ── EDIT中のみ有効 ─────────────────────────
  { id:'undo',       group:'edit', desc:'UNDO',           key:'z', mod:'ctrl',       action:()=>undo() },
  { id:'redo',       group:'edit', desc:'REDO',           key:'Z', mod:'ctrl+shift', action:()=>redo() },
  // ... ページ固有の定義を追加
];
const keyMap = {};
SHORTCUT_DEFS.forEach(d => { keyMap[d.id] = { key: d.key, mod: d.mod || '' }; });
```

- `group` は `'play'` `'edit'` `'export'` 等のカテゴリラベル（ショートカットモーダルのグループ化に使う）。
- `mod` を持つ定義（`'ctrl'`, `'ctrl+shift'`, `'ctrl+shift+alt'`）は **キーのカスタマイズ不可**（モーダルのEDITボタンが無効化される）。
- `mod` なし定義のみ `startRecording()` でキーを変更できる。

### 4-2. キー記録システム

```js
let recordingId = null;

function startRecording(id) {
  if (recordingId) cancelRecording();
  recordingId = id;
  // sckey-{id} に '...' を表示 / scedit-{id} に .active を付ける
}
function cancelRecording() {
  if (!recordingId) return;
  // sckey-{id} をリセット / scedit-{id} から .active を除去
  recordingId = null;
}
```

`keydown` ハンドラ先頭で `recordingId` が非nullなら：

```js
const ignore = ['Escape','Tab','CapsLock','Meta','Control','Shift','Alt'];
if (ignore.includes(e.key)) { if (e.key==='Escape') cancelRecording(); return; }
keyMap[recordingId].key = e.key;
keyMap[recordingId].mod = '';
// ラベル更新 → recordingId = null
```

### 4-3. 統合 keydown ハンドラ 構造

```
keydown
 ├─ recordingId が非null → 記録処理 & return
 ├─ Escape
 │    ├─ ショートカットモーダルが開いていれば閉じる & return
 │    ├─ editor.active なら toggleEditMode() & return
 │    └─ それ以外 → window.location.href = 'index.html'
 ├─ Ctrl/Meta系
 │    ├─ Z → undo/redo（常時固定）
 │    └─ ページ固有の Ctrl 操作（editor.active 条件下）
 └─ それ以外（mod なし）
      ├─ play / prev-frame / next-frame / edit-mode → 常時有効
      └─ その他 → editor.active のときのみ有効
```

---

## 5. ショートカットモーダル

### HTML骨格

```html
<div id="shortcut-modal">
  <div id="shortcut-box">
    <!-- ヘッダー: タイトル + 閉じるボタン -->
    <!-- グループ別リスト: id="sc-list-play" / "sc-list-edit" / etc -->
    <!-- フッター: カスタマイズ説明文 -->
  </div>
</div>
```

- `#shortcut-modal` … `display:none` / `.open` 時 `display:flex` でオーバーレイ表示
- 背景クリック (`e.target.id === 'shortcut-modal'`) で閉じる

### buildShortcutModal()

```js
function buildShortcutModal() {
  // 各グループの .innerHTML = '' でリセット
  SHORTCUT_DEFS.forEach(def => {
    const km = keyMap[def.id];
    // mod部分を sc-key スパンで組み立て
    // row.innerHTML = `<sc-desc> <sc-key-wrap> <sc-edit-btn EDIT>`
    // mod付きのEDITボタンは disabled + opacity:0.3
  });
}
function openShortcuts()  { buildShortcutModal(); document.getElementById('shortcut-modal').classList.add('open'); }
function closeShortcuts() { cancelRecording();    document.getElementById('shortcut-modal').classList.remove('open'); }
```

### CSS ポイント

```css
#shortcut-modal { display:none; position:fixed; inset:0; z-index:9000;
  background:rgba(0,0,0,0.85); align-items:center; justify-content:center; }
#shortcut-modal.open { display:flex; }
#shortcut-box { background:#150927; border:1px solid var(--acid);
  width:min(540px,92vw); max-height:80vh; overflow-y:auto; }
#shortcut-box::-webkit-scrollbar { width:2px; }
#shortcut-box::-webkit-scrollbar-thumb { background:var(--acid); }

.sc-key { display:inline-block; min-width:22px; padding:2px 6px;
  background:#1a0835; border:1px solid var(--acid); border-radius:3px;
  font-family:var(--mono); font-size:10px; text-align:center; }
.sc-key.recording { background:var(--rouge); border-color:var(--rouge); color:#000; animation:blink 0.4s infinite; }
.sc-edit-btn { font-family:var(--mono); font-size:9px; letter-spacing:0.2em;
  background:transparent; border:1px solid var(--acid); color:var(--acid); cursor:pointer; }
.sc-edit-btn.active { background:var(--acid); color:#000; }
```

---

## 6. formatKeyLabel()

```js
function formatKeyLabel(key, mod) {
  if (key === ' ')           return 'Space';
  if (key === 'ArrowLeft')   return '←';
  if (key === 'ArrowRight')  return '→';
  if (key === 'ArrowUp')     return '↑';
  if (key === 'ArrowDown')   return '↓';
  return key.length === 1 ? key.toUpperCase() : key;
}
```

---

## 7. ボトムバー / SHORTCUTS チップ

ボトムバー右端に常設する「SHORTCUTSを開く」ボタン：

```html
<button onclick="openShortcuts()" class="shortcuts-chip">
  SHORTCUTS <span class="kbd">?</span>
</button>
```

```css
.shortcuts-chip { font-family:var(--mono); font-size:9px; letter-spacing:0.22em;
  background:transparent; border:1px solid rgba(255,79,168,0.2); color:rgba(255,79,168,0.5);
  padding:3px 9px; cursor:pointer; transition:all 0.15s; }
.shortcuts-chip:hover { border-color:var(--rouge); color:var(--rouge); }
```

`?` キーでも開く場合は keydown ハンドラに追加：
```js
if (e.key === '?') { openShortcuts(); return; }
```

---

## 8. ページ固有の差分（02 vs 12）

| 機能 | 02-anticipation | 12-pose-to-pose |
|---|---|---|
| 編集対象 | ドットアニメーション（12フレーム×グリッド） | スケルトン・ポーズ（キーフレームリスト） |
| EDIT中の追加ショートカット | 色選択 a/s/d/f/g/h、消しゴム x、筆サイズ ↑↓、コピー/貼付 Ctrl+C/V、全PNGエクスポート Ctrl+Shift+Alt+S | ポーズ保存 s、リセット R、キー追加 n、反転 h、コピー/貼付 Ctrl+C/V |
| サイドパネル (EDIT中) | フレーム情報・カラーパレット・筆サイズ | キーフレームリスト・ジョイント編集 |
| パレットキーラベル更新 | `updatePaletteKeyLabels()` でキーキャップを再描画 | なし |
| ドラッグ並び替え | フレームストリップ（全フレーム） | キーフレームリスト（KEYのみ） |
| export | JSON / 現フレームPNG / 全12コマPNG | JSON / 現フレームSVG |

---

## 9. 新規ページへの移植チェックリスト

- [ ] `editor = { active: false }` を定義
- [ ] `toggleEditMode()` を実装し `#edit-toggle` ボタンに紐づける
- [ ] `view-mode` / `edit-mode` の2ペインを用意
- [ ] `#main` に `.editing-mode` クラスで見た目切替
- [ ] `SHORTCUT_DEFS` を定義（グループ・id・初期キー）
- [ ] `keyMap` を生成
- [ ] `recordingId` + `startRecording` / `cancelRecording` を実装
- [ ] `buildShortcutModal` / `openShortcuts` / `closeShortcuts` を実装
- [ ] `#shortcut-modal` HTML＋CSS を追加
- [ ] 統合 `keydown` ハンドラを配置（ESC 優先順序に注意）
- [ ] ボトムバーに `SHORTCUTS` チップを配置

# 10-appeal.html — ページ個別 CLAUDE.md

`10-appeal.html` の構造・システム解説。このファイルをベースに派生物を作るとき、または変更・拡張をするときに参照する。

---

## 概要

**STARDUST ENGINE — APPEAL / VTUBER MV BACKGROUND LAB**

「音楽が光になった状態」を作るMV背景ジェネレーター。  
7つのグラフィックロールを持つ要素をキャンバスにクリック配置し、パターンレイヤー・カメラフロー・ドラマシステムが組み合わさって構成美（Appeal）を生む。  
リアルタイム Appeal 分析 FUI でフィードバックを表示する。

---

## デザイントーン

**Dark Cosmic（VTuber ステージ）** — このページ独自のトーン。

| 変数 | 値 |
|---|---|
| `--bg-0` | `#06061c`（最暗） |
| `--bg-1〜3` | `#0d0930` / `#1c1349` / `#2a1a6e` |
| `--ink` | `#f3eaff`（本文） |
| `--cyan` | `#7dd9ff` |
| `--magenta` | `#ff7be0` |
| `--gold` | `#ffd789` |
| `--lilac` | `#b59cff` |
| `--hot` | `#ff5a8a` |
| `--good` | `#a8ffd6` |
| フォント | Barlow Condensed（見出し）/ IBM Plex Mono（UI）/ Noto Sans JP / Cormorant Garamond（serif）|
| ローカルフォント | `fonts/bank-gothic-light-bt.ttf` → CSS 変数 `--disp: 'StageDisplay'` |

`body::before` / `::after` で宇宙的グラデーションとホログラムラインを常時表示。

---

## レイアウト構成

```
#app — grid-template-rows: 46px | 1fr | 38px
        grid-template-columns: 1fr | 336px
```

| エリア | ID | 役割 |
|---|---|---|
| トップバー | `#topbar` | ブランド・ESC・状態表示 (46px) |
| ステージ | `#stage` | キャンバス + HUD + FUI オーバーレイ |
| サイドパネル | `#panel` | セクション A〜O（スクロール可） |
| ボトムバー | `#bottombar` | 統計・ショートカット表示 (38px) |

キャンバスは `#canvas-wrap` / `#canvas-frame` 内に 16:9 比率で収まる。  
`VW` / `VH` はウィンドウリサイズで再計算（`resize()` 関数）。

---

## 主要システム

### 1. 要素（Element）システム

```js
let elements = [];  // 配置済み要素の配列

function makeElement(x, y, role, opts) { ... }
```

各要素は以下のプロパティを持つ：

| プロパティ | 意味 |
|---|---|
| `role` | hero / cloud / flow / rhythm / noise / frame / texture |
| `shape` | ロール内のシェイプ名（30種以上） |
| `color` | activePalette からランダム or opts 指定 |
| `depth` | 0=遠景 〜 1=前景（パララックス強度に使用） |
| `baseX, baseY` | 配置基準位置（layoutDensity 計算の基準） |
| `rotPhase, rotDir` | 独立回転の位相・方向 |
| `phase, floatAmt` | 浮遊アニメーション用 |
| `stripeRotOffset` | stripe-bar 系の個別回転ジッター |
| `count` | row/dashed 系の繰り返し数 |
| `pieces` | confetti 専用の破片配列 |
| `puffs` | cloud 系の膨らみ配列（`makeCloudPuffs()` で生成） |
| `dotGap, dotSize` | halftone-orb / halftone-patch のグリッドパラメータ |

### 2. 7つのグラフィックロール

| ロール | 代表シェイプ | サイズ範囲 | depth 基準 |
|---|---|---|---|
| hero | star / striped-circle / big-ring / sparkle-big | 80〜140 | 0.70 |
| cloud | cloud-cluster / cloud-puff / orb-trio | 180〜360 | 0.35 |
| flow | speed-line / stripe-bar / light-streak / dashed-line | 180〜320 | 0.55 |
| rhythm | dot-row / tick-line / hanging-stars-row | 120〜240 | 0.45 |
| noise | confetti / small-star / sparkle / cross | 10〜26 | 0.85 |
| frame | ring / dashed-ring / arc / glow-orb / corner-bracket | 80〜140 | 0.60 |
| texture | halftone-patch / dot-grid / checker-strip / halftone-orb | 120〜200 | 0.25 |

**flow-aligned シェイプ** （`FLOW_ALIGNED_SHAPES` セット）: `globalFlowAngle` に厳密に揃う。  
**独立回転シェイプ**: star / big-star-outline / striped-circle / small-star のみ `rotSpeed` でゆっくり自転。

### 3. 30種のプリミティブ関数

| 関数 | 対応シェイプ |
|---|---|
| `drawStar()` | star, small-star |
| `drawStarOutline()` | big-star-outline |
| `drawStripedCircle()` | striped-circle（body + クリップ内ストライプの2パス） |
| `drawRing()` | big-ring / ring / dashed-ring |
| `drawArc()` | arc |
| `drawCorner()` | corner-bracket |
| `drawSpeedLine()` | speed-line / thin-stripe |
| `drawStripeBar()` | stripe-bar（斜めハッチ6分割） |
| `drawDashedLine()` | dashed-line |
| `drawDotRow()` | dot-row / small-circle-row / tick-line |
| `drawHangingStarsRow()` | hanging-stars-row |
| `drawSparkle()` | sparkle / sparkle-big（4点輝き） |
| `drawCloudPuffs()` | cloud-cluster / cloud-puff / orb-trio |
| `drawGlowOrb()` | glow-orb（ラジアルグラデーション球） |
| `drawHalftoneOrb()` | halftone-orb（グリッドドット・放射縮小・縁小点） |
| `drawHalftoneSpot()` | halftone-patch（同作法、小型） |
| `drawLightStreak()` | light-streak（グラデーションフェード） |
| `drawDotGrid()` | dot-grid |
| `drawCheckerStrip()` | checker-strip |
| `drawConfettiPiece()` | confetti（個別小矩形） |
| `drawCross()` | cross |

### 4. パターンレイヤーシステム

```js
let patternLayers = [];  // 全キャンバスに広がる装飾レイヤー

function addPattern(type) { ... }
function drawPattern(p, t) { ... }
```

要素とは独立した「環境テクスチャ」。10種類：

| タイプ | 内容 |
|---|---|
| `star-rain` | 対角ストリーク＋星 |
| `sparkle-field` | 散布された4点輝き（twinkleアニメ） |
| `hanging-stars` | 糸吊り星 |
| `glow-orbs` | ソフト発光球 |
| `aurora-streaks` | オーロラ帯 |
| `halftone-band` | 対角ハーフトーン帯 |
| `radial-dots` | 放射状ドット |
| `speedline-burst` | 放射状スピードライン |
| `gradient-veil` | ラジアルカラーヴェール |
| `star-field` | 疎な星フィールド |

`depth:'deep'` を持つパターンは `parallaxX * 0.3` でゆっくり動き、それ以外は `* 0.85` で速く動く。

### 5. グローバルフローと描画順

```js
let globalFlowAngle = -25 * Math.PI / 180;  // 全要素の風向き
```

`drawAll(t)` の描画順：
1. 背景グラデーション + auto halftone
2. `depth:'deep'` パターンレイヤー（弱いパララックス）
3. 要素グロウパス（`globalCompositeOperation:'lighter'`、blur）
4. 要素メインパス（ロール順 texture → cloud → frame → rhythm → flow → noise → hero）
5. `depth:!deep` パターンレイヤー（強いパララックス）

グロウパスは `glowStrength > 0.02` のときのみ実行。texture / cloud はグロウをスキップ。

### 6. カメラフロー（6モード）

```js
function cameraOffset(el, t) { ... }
```

`cameraFlow` 変数で切り替え：

| モード | 動き |
|---|---|
| `diagonal` | flowAngle 方向への緩やかなドリフト |
| `scroll` | 水平 sin 波 |
| `orbit` | 要素ごとの小円軌道 |
| `rise` | 上昇ドリフト |
| `impact` | 中心から拍動的に放射 |
| `static` | 動かない |

### 7. ドラマシステム

```js
let dramaEnabled = false;
function dramaOffset(el, t) { ... }
```

DRAMA ON のとき、最近傍の hero に対して各ロールが動的に反応：
- `cloud` → hero に引き寄せられる
- `noise` → hero を避ける（200px 圏内で反発）
- `frame` → 静止（構図を支える）
- `rhythm` → hero 方向にビート同期で振動

### 8. コンポジションモード（5モード）

クリック位置を補正してレイアウトバイアスを作る：

| モード | 効果 |
|---|---|
| `free` | 補正なし |
| `center-burst` | 中心方向に引き寄せ |
| `edge-fade` | 端に押し出す |
| `tunnel` | 水平軸からの縦距離を1.4倍 |
| `diagonal-stream` | globalFlow 線に引き寄せ |

### 9. 背景プリセット（9種）

```js
const BG_PRESETS = [ ... ];  // 各要素: name, gradient/color, stops, halftone, halftoneOpacity
```

`autoHalftone: true` のとき、中央から縁に向かって小さくなるハーフトーンドットを背景上に描画。色・不透明度は各プリセット固有。

### 10. パレットとトーンヘルパー

```js
let activePalette = [...PALETTE_DEFAULT];  // 現在の有効色配列

function tone(hex, level)  // 'light' / 'dark' のトーン派生色を返す
function hexToHsl(hex)     // HSL変換
function hslToHex(h, s, l) // HEX変換
function hexToRgba(hex, alpha)  // rgba文字列
```

`tone()` は cloud の puff ハイライトなどで使用。  
`hexToRgba()` は全プリミティブのアルファ合成に使用（大量に呼ばれる）。

### 11. Hero Generator（5パーソナリティ）

```js
function generateHero(x, y, personality) { ... }
```

| パーソナリティ | 特徴 |
|---|---|
| `dominant` | 大きく強い（star or striped-circle, 150〜190px） |
| `shy` | 小さくアウトライン、端寄り（big-star-outline, 60〜85px） |
| `chaotic` | 傾いた big-star-outline、floatAmt 大 |
| `elegant` | big-ring or big-star-outline、控えめな動き |
| `mascot` | striped-circle、明るい色、中央寄り |

depth は常に `0.7`（parallax 計算で NaN にならないよう固定）。

### 12. Appeal 分析 FUI

```js
function computeAppealScore() { ... }  // 毎フレーム呼ばれる
```

5指標で構成美を数値化（要素が2個以上のとき）：

| 指標 | 計測内容 |
|---|---|
| HERO FOCUS | hero ロール要素のキャンバス中央への近さ |
| SILHOUETTE | hero のサイズ多様性（大小差）|
| RHYTHM | 要素のサイズ・配置の変化量 |
| DENSITY MIX | ロール種の多様性 |
| FLOW COHESION | flow-aligned 要素の flowAngle への揃い具合 |

総合スコアが `#fui-rail` の縦バーで表示。高評価時は `#verdict-flash` で "APPEAL" などのフラッシュ表示。

### 13. パララックス

```js
let parallaxX = 0, parallaxY = 0;
let parallaxTargetX = 0, parallaxTargetY = 0;
```

ホイール操作でターゲット値を±120px で設定。毎フレーム `* 0.12` でスムース補間し、`* 0.985` でゆっくり0に戻る。  
各要素の最終位置: `x = ... + parallaxX * el.depth`

### 14. スライダー一覧（セクション D / E）

| スライダー | 変数 | 範囲 |
|---|---|---|
| FLOW ANGLE | `globalFlowAngle` (rad) | -90° 〜 90° |
| ROTATION SPEED | `rotSpeed` | 0.00 〜 1.00 |
| STRIPE ROT JITTER | `stripeRotJitter` | 0.00 〜 2.00 |
| MOTION SPEED | `motionSpeed` | 0.00 〜 3.00 |
| GLITCH SPEED | `glitchSpeed` | 0.00 〜 1.00（0=完全静止） |
| GLOW STRENGTH | `glowStrength` | 0.00 〜 1.20 |
| PARALLAX | `parallaxTargetX` | 0 〜 120 px |
| DENSITY | `layoutDensity` | 0.40x 〜 2.00x（要素を中心に寄せ/広げ） |
| SCALE | `layoutScale` | 0.30x 〜 2.00x（全要素サイズを一括変更） |

`GLITCH SPEED` は `glitch-bars` パターンの更新頻度を制御（他パターン・要素には影響なし）。

### 15. Export

- `exportSVG('all')` : role ごとに `<g id="hero-layer">` などでグルーピングしたレイヤードSVG
- `exportPNG()` : 現在のキャンバスを PNG でダウンロード
- 後処理用（AE に持ち込んで個別に質感処理する想定）

---

## キーボードショートカット

| キー | 動作 |
|---|---|
| 1 〜 7 | ロール切り替え（hero / cloud / flow / rhythm / noise / frame / texture） |
| クリック | 現在ロールの要素を配置 |
| D | DRAMA トグル |
| M | MOTION トグル |
| U | FUI 表示トグル |
| E | SVG エクスポート |
| Z | 最後の要素を UNDO |
| R | 全クリア |
| ESC | index.html へ戻る（`← INDEX` リンクから） |

---

## 派生・拡張のヒント

- **新しいロールを追加**: `ROLE_SHAPES`・`ROLE_SIZE_RANGE`・`depthMap` に追記し、`renderElement()` に描画分岐を追加。
- **新しいシェイプを追加**: プリミティブ関数を書いてロールの shapes 配列に入れ、`renderElement()` に分岐追加。`FLOW_ALIGNED_SHAPES` に入れるか否かで挙動が変わる。
- **新しいパターンを追加**: `drawPattern()` に `type` 分岐追加、`addPattern()` にデフォルト opts 追記。
- **音連動への改造**: `motionSpeed`・`glowStrength`・`parallaxTargetX` は毎フレーム上書き可能なので、BPM や振幅をそのまま流せる。`addPattern()` を BPM 同期で呼ぶとビート産生が作れる。
- **静止画書き出しに特化**: `motionEnabled = false`・`cameraFlow = 'static'` にして `requestAnimationFrame` を止めれば静止構図として PNG 書き出し可能。
- **キャンバス比率の変更**: `resize()` の `ratio = 16/9` を書き換えるだけ。VW/VH が再計算される。
- **パレットを外から制御**: `activePalette` 配列を差し替えれば全要素の色選択プールが切り替わる。

---

## 注意点

- `el.depth` の初期化忘れ注意 → `parallaxX * el.depth` が NaN になる（過去バグあり）。  
  `generateHero()` 内で `depth: 0.7` を明示している（line 1143付近）。
- `drawCloudPuffs()` は `layoutScale` を内部で使うため、cloud 要素の再描画は毎フレーム正しい。  
  ただし `el.puffs` は生成時に作られた固定配列なので、`layoutScale` 変更時は見た目が変わるだけでデータは不変。
- `drawHalftoneOrb()` と `drawHalftoneSpot()` は `globalAlpha` を内部で変更するため `ctx.save()/restore()` が必須（実装済み）。
- `glitchSpeed = 0` で glitch-bars パターンは完全静止するが、他のアニメーション（sparkle-field の twinkle 等）は `motionEnabled` で制御。
- `tone()` は `l > 90`（ほぼ白）の場合は元の色をそのまま返す（変換後がさらに白くなるのを防ぐ）。

---

## 関連ファイル

- `fonts/bank-gothic-light-bt.ttf` — `--disp: 'StageDisplay'` のフォントソース（git 管理済み）
- `EDIT-MODE-SPEC.md` — 02 / 12 共通の編集モード仕様（10 は編集モード未実装）
- `CLAUDE.md`（プロジェクトルート）— 全ページ共通構造

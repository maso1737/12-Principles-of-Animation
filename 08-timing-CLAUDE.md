# 08-timing.html — ページ個別 CLAUDE.md

`08-timing.html` の構造・システム解説。このファイルをベースに派生物を作るとき、または変更・拡張をするときに参照する。

---

## 概要

**KINETIC GEOMETRY · 08 — TIMING & SPACING / INFINITE FOLLOW**

「同じボール・同じ距離・同じ時間。変わったのは間隔だけ。」を体感させるページ。  
被写体（ボール）は常に画面中央に固定され、背景世界がスクロールすることで"動いている"ように見せる。  
スペーシングエディタで12フレームの間隔を自分で編集でき、その曲線から「物体の質感」をリアルタイム推定する。

---

## デザイントーン

**tDR ライト系**（01 / 03 / 08 共通グループ）

| 変数 | 値 |
|---|---|
| `--bg` | `#ffffff` |
| `--ink` | `#0c0c0c` |
| `--pink` | `#FF2D87` |
| `--g2` | `#8b8b87`（補助テキスト） |
| `--g3` | `#cfcfcb`（グリッド・区切り） |
| `--g4` | `#efefec`（背景薄） |
| フォント | Inter Tight（見出し）/ JetBrains Mono（UI）/ IBM Plex Sans JP（日本語） |

ローカルフォント参照なし（全 Google Fonts CDN）。

---

## レイアウト構成

```
#app — grid-template-rows: 30px | minmax(108px,15.5vh) | 1fr | minmax(150px,172px) | 24px
```

| エリア | ID | 役割 |
|---|---|---|
| マストヘッド | `#mast` | ブランド・パンくず・ESC ボタン (30px) |
| タイトルバンド | `#tband` | 巨大な "SPACING&" タイポ + 赤スラブ |
| メインステージ | `#stagewrap` / `#stage` | アニメーションキャンバス |
| サイドパネル | `#panel` | 素材推定 FUI（336px 固定） |
| スペーシングエディタ | `#editor` | 12フレームドット操作 + プリセット |
| フッター | `#foot` | FPS / ショートカット表示 (24px) |

---

## 主要システム

### 1. Infinite Follow Engine

被写体（ボール）は画面中央に固定。`worldY` を積み上げることで背景をスクロールさせる。

```js
const N=12, DUR=2.4;   // 12フレーム固定デュレーション
let spacing=[];         // 0..1 の単調増加配列（ドットの横位置）
let worldY=0;           // 累積スクロール量 (px)
let scrollDir=1;        // +1=世界が下へ（被写体が上昇） / -1=反転
```

`posAt(ph)` : phase 0..1 → spacing曲線上の位置 0..1  
`absPos(t)` : 連続時間 t → ループを跨いだ絶対位置  
`velAt(ph)` : 位相での瞬間速度（セグメント傾き × N-1）

`worldY` は常にリアル値で積み上げ。2F/3F 描画時は `renderWorldY()` で量子化した値を一時的に使い、描画後に戻す（ボール物理は連続信号のまま）。

### 2. Spacing Editor

```js
// spc canvas — drag dot i horizontally
spacing[dragI] = clamp(newP, spacing[dragI-1]+0.006, spacing[dragI+1]-0.006);
resync();   // ← 変更後は必ず呼ぶ
computeMatch();
```

- 端点（i=0, i=N-1）は固定（0 と 1）
- ドラッグ中は `activePreset=''` でプリセット選択を解除
- `resync()` : フレームモードに合わせて prevQ・prevAbs・velSm・travelAbs を再同期

**プリセット (P01〜P06)**

| ID | 種別 |
|---|---|
| P01 | LINEAR |
| P02 | EASE-IN (pow 2.4) |
| P03 | EASE-OUT (pow 2.4) |
| P04 | SMOOTH STEP（デフォルト） |
| P05 | SLOW-FAST-SLOW（中速段） |
| P06 | EXTREME HOLD（端寄り） |

### 3. 素材推定（FEELS LIKE）

`computeMatch()` が spacing 配列から 5 つの特徴量を抽出し、6素材のガウスモデルと比較。

```js
const feat = [maxV/mean, aRel, jit, stall, asym];  // 最大速・加速比・揺れ・停滞・非対称
```

6素材：SOAP BUBBLE / BALLOON / LEAF / BIRD / BOWLING BALL / PLANET  
最上位素材がパネルに表示。 `scrambleTo()` で文字がランダムに入れ替わりながら書き換わる演出。

### 4. ボール物理

- **スケール（squash & stretch）** : `aSm`（平滑化加速度）と `hardBlend` から spring 積分
- **オフセット** : 加速方向にリード、減速時にラグ（`ballOff` / `ballOffVel`）
- **wobble rim** : jerkE（ジャーク蓄積）と hover poke で輪郭を歪ませる
- **剛体モード** : `hardBlend > 0.92` のとき scaleY = 1、変形なし（惑星・ボウリングボール）

### 5. 多層パラレックス世界

| レイヤー | ID | parallax p | チャンク高さ |
|---|---|---|---|
| FAR | 0 | 0.28 | 620px |
| MID | 1 | 0.60 | 700px |
| NEAR | 2 | 1.25 | 760px |
| OVR（バー群） | 3 | 1.55 | 540px |
| HERO（巨大矢印） | 4 | 2.20 | 1700px |

`chunk(layerId, k)` : mulberry32 PRNG でチャンク k のコンテンツを決定論的に生成。  
`chunkCache` : Map でキャッシュ（400エントリ上限）。スペーシング変更時はクリア不要。

`drawLayer(layerId, L, vpx)` : `worldY * L.p` でスクロール量を算出し可視チャンクだけ描画。

### 6. フレームドロップ（コマ打チ）

```js
let frameMode = 1;  // 1=24fps / 2=12fps / 3=8fps
```

- キー `1` / `2` / `3` でもトグル可
- `renderWorldY()` が "保持フレーム位置" を返すことで worldY を量子化
- 変更後は `resync()` を呼ぶ

### 7. Aperture（文字ストリーム）

ステージ左側の矩形クリップ内に `STREAM` 配列を縦スクロール表示。  
`worldY * APR.p`（p=1.7）でスクロール。"MASS" と日本語語句だけ PINK 色。

### 8. Overtakers（追い越し粒子）

`aSm < -2.2`（急減速）のとき `spawnOvertakers()` で縦線粒子を生成。  
被写体が減速 → 遅い物が相対的に上昇してくる視覚効果。`spawnCool` で連続スポーンを抑制。

### 9. 方向転換（クリック反転）

ステージ上下に chevron ボタン（`drawDirChevron()`）。クリックで `scrollDir` を切り替え。  
HERO（巨大矢印）が画面に存在する間は下ボタンがロック（`heroOnScreen` フラグ）。

### 10. Foley 音響

外部 `foley-core.js` を参照（`<script src="foley-core.js">`）。  
最初のポインタ/キー操作で `Foley.glideStart()` → 速度に応じて `Foley.glideSet(velSm * scrollDir / 1.8)` を毎フレーム呼ぶ。  
減速時は `squeak`、ボールホバー時は `wobble` を再生。

---

## キーボードショートカット

| キー | 動作 |
|---|---|
| Space | 再生 / 一時停止 |
| ← / → | 1フレーム手動ステップ（一時停止） |
| ↑ / ↓ | プリセット切り替え |
| 1 / 2 / 3 | フレームレートモード |
| R | worldY リセット（Y=0） |
| ESC | index.html へ戻る |

---

## 派生・拡張のヒント

- **スペーシング曲線を別パラメータに置き換える**: `spacing[]` を差し替えれば `velAt()` / `posAt()` はそのまま機能する。BPM同期やマウスドラッグ以外の入力源でも動く。
- **素材セットを変える**: `MATERIALS` 配列と特徴量ベクトル `c[]` / `s[]` を差し替えるだけで別系統の推定器になる。
- **レイヤーを増やす**: `chunk()` に `layerId` 分岐を追加し、`loop()` 内で `drawLayer(5, {...}, 0)` を呼ぶ。
- **ステージを差し替える**: `drawBall()` を別の被写体に変えてもエンジン部（`advanceMotion` / `worldY` / `spacing`）はそのまま使える。
- **パネルを別 FUI に変える**: `computeMatch()` の後段 `renderFUI()` の中身だけ入れ替えればサイドパネルは自由に差し替え可能。
- **音なし版にする**: `foley-core.js` の `<script>` タグを削除し、`if(window.Foley)` ガードがあるため他コードは変更不要。

---

## 注意点

- `resync()` 忘れは速度・加速度のラグや "位置ジャンプ" を引き起こす。  
  spacing 変更・frameMode 変更・scrollDir 変更のたびに必ず呼ぶ。
- `chunkCache` はスペーシング変更時にクリアしない（チャンクはジオメトリだけで physics 非依存）。  
  ただし `scrollDir` 変更後は視覚的に反転するため、必要なら `chunkCache.clear()` してよい。
- `SH`（ステージ高さ）は `sizeAll()` 後に確定する。`worldY=SH*1.2` の初期値は `sizeAll()` より後で設定すること。
- `foley-core.js` が存在しない環境では全 `Foley.*` 呼び出しが `if(window.Foley)` で保護されるため無害。

---

## 関連ファイル

- `foley-core.js` — Foley 音響エンジン（git 管理外、ローカルにあれば有効）
- `EDIT-MODE-SPEC.md` — 02 / 12 共通の編集モード仕様（08 は編集モード未実装）
- `CLAUDE.md`（プロジェクトルート）— 全ページ共通構造

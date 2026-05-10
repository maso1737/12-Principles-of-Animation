# 申し送り — 12 Principles of Animation（残ページ制作用）

## リポジトリ
https://github.com/maso1737/12-Principles-of-Animation  
ローカル: `C:\Users\so173\Documents\Claude\Projects\12-Principles-of-Animation\`

---

## 現状ファイル構成

```
index.html          ← 12原則一覧TOPページ（リンク済み）
01-squash.html      ✅ 完成
02-anticipation.html ✅ 完成
06-easing.html      ✅ 完成
assets/
  common.css        ← デザイントークン定義（参照用）
  frames/           ← JSON書き出し用（現在空）
```

**残り：** `03-staging.html` `04-arc.html` `05-follow-through.html`  
`07-secondary.html` `08-timing.html` `09-exaggeration.html`  
`10-appeal.html` `11-solid-drawing.html` `12-pose-to-pose.html`

---

## index.html との連携

`index.html` の `principles` 配列に `href` フィールドを追加するとリンク有効化。

```js
// 例（index.html 987行〜のprinciplesデータを編集）
{ num:'03', en:'STAGING', jp:'演出', href:'03-staging.html', ... }
```

`href` がないアイテムは自動で `opacity:0.45` + Coming soon 表示になる。

---

## デザインシステム

### カラー（全ページ共通）
```css
--acid:  #36FF00;   /* メインアクセント（緑）※01のみ #CCFF00 */
--neon:  #F9FF47;   /* サブアクセント（黄緑）*/
--black: #000;
--white: #fff;
--panel: #0C0C0C〜#0E0E0E;
--border: rgba(54,255,0,0.15);
```

### フォント
```
Barlow Condensed (wght 400/700/900, italic) — 数字・見出し
IBM Plex Mono (400/700) — HUD・ラベル・コード
Noto Sans JP (400/700) — 日本語テキスト
```
Google Fonts CDN で読み込み。

### レイアウト（3ページ共通のグリッド）
```css
#app {
  display: grid;
  grid-template-rows: 44px 1fr 44px;   /* topbar / main / bottombar */
  grid-template-columns: 1fr 320px;     /* ステージ / サイドパネル */
  height: 100vh;
}
```
`#topbar` と `#bottombar` は `grid-column: 1/-1` で全幅。

### 共通UIパーツ
- **コーナーマーカー** `.corner.tl/tr/bl/br` — acid色の十字
- **ステージグリッド** `.stage-grid` — acid色 3% の格子線 (48px)
- **背景ビッグナンバー** `.stage-bignum` — 原則番号を巨大に薄く表示
- **チェッカー装飾** `.checker` — repeating-conic-gradient
- **原則オーバーレイ** `.principle-overlay` (`.po-num / .po-en / .po-jp`) — 右上に原則番号・英名・日本語

---

## 各ページのクオリティ基準（01/02/06から抽出）

### ステージ（左ペイン）
- CSS アニメーション or requestAnimationFrame によるリアルタイムデモ
- デモは「原則の本質を視覚化」するもの（単なる飾りではない）
- ラベルやガイド線でアニメーションの「読み方」を補足
- 01: 比較パネル×2（正例/誤例）、フレームカウンター
- 02: フレーム単位のコマ描画（ピクセルアート）＋LOAライン＋重心線
- 06: 3レーン（EASE / LINEAR / CUSTOM）、ベジェハンドル編集UI

### サイドパネル（右ペイン 320px）
- 原則の理論解説（日本語 + 英語ラベル）
- インタラクティブなコントロール（スライダー、ボタン、チェックボックス等）
- 数値のリアルタイム表示（フレーム数、速度、パラメーター）
- スクロール可能、スクロールバーは細く (2px, acid色)

### ボトムバー
- 左: 原則メタ情報（`MASS_CONSERVATION: TRUE` など）
- 中: フレームカウンター `FRAME: 000 / 120`
- 右: ショートカット表示ボタン or ID文字列

### インタラクション
- 再生/一時停止（スペースキー）
- コマ送り（← →キー）
- Escキーでindex.htmlへ戻る想定
- モバイル非対応（PC専用、`overflow:hidden`）

---

## 各原則のアニメーション内容（12原則の解釈からわかりやすいビジュアライズする）

| # | en | jp | アニメ概要 | メタ文字列 |
|---|----|----|-----------|-----------|
| 03 | STAGING | 演出 | メイン要素にスポットライト、BG要素は暗く | `FOCUS_LOCK: TRUE // PSYCHOLOGICAL_ANCHOR: DEPLOYED` |
| 04 | THE ARC | 運動の弧 | 楕円軌道を移動するドット vs 直線移動 | `TRAJECTORY_CALC: ORGANIC // X_Y_DELTA: 0.045` |
| 05 | FOLLOW THROUGH | フォロースルー | リード→トレイルの時間差、オーバーシュート | `SETTLING_FACTOR: -0.3s // INERTIA: ENGAGED` |
| 07 | SECONDARY ACTION | セカンダリーアクション | 主動作に付随するアーム・頭の動き | `DATA_PACKET: 0.0034 // X:1293 Y:8742` |
| 08 | TIMING | タイミング | 同距離を速い球(29f) vs 遅い球(177f) | `FRAME_RATE: VARIABLE // MASS_FACTOR: ACTIVE` |
| 09 | EXAGGERATION | 誇張表現 | スケール 0.3→2.2 の爆発的変形 | `SYSTEM_GAIN: [110%] // OVERDRIVE: ACTIVE` |
| 10 | APPEAL | 魅力 | キャラクターのフロート＋まばたき | `CHARISMA_INDEX: MAX // IDENTITY: UNIQUE` |
| 11 | SOLID DRAWING | 立体感のある作画 | 2D上での疑似3Dボックス回転 | `DIMENSION: 3D→2D // DEPTH_MAP: ACTIVE` |
| 12 | POSE TO POSE | ポーズ・トゥ・ポーズ | キーポーズ切り替え＋ゴーストフレーム表示 | `KEY_FRAMES: LOCKED // IN_BETWEEN: CALCULATED` |

---

## ファイル命名規則
```
03-staging.html
04-arc.html
05-follow-through.html
07-secondary.html
08-timing.html
09-exaggeration.html
10-appeal.html
11-solid-drawing.html
12-pose-to-pose.html
```

## 作業フロー
1. 1ページ作成 → ローカル確認
2. `index.html` の該当principleに `href:'XX-name.html'` 追加
3. `git add XX-name.html index.html && git commit && git push`

---

## 参照ページのポイントメモ

**01-squash.html**（999行）
- SVG描画でボールをリアルタイム変形
- 「正例 vs 誤例」の2分割比較が核心
- 右パネルに「質量保存ゲージ」（体積変化の可視化）

**02-anticipation.html**（1990行、最大規模）
- 64×25グリッドのピクセルアートフレームデータを配列で持つ
- ライン・オブ・アクション(LOA)をSVGオーバーレイで可視化
- 「EDITモード」でフレームを手描き編集できる
- フェーズ（READY/WIND_UP/RELEASE/FOLLOW_THROUGH/SETTLE）をリアルタイム表示

**06-easing.html**（957行）
- 3レーン（EASE / LINEAR / CUSTOM）の並走比較
- ベジェ曲線ハンドルをドラッグ編集
- velocity graph（速度グラフ）のリアルタイム描画

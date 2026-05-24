# CLAUDE.md

このプロジェクトで作業する Claude 向けのコンテキストです。

## プロジェクト概要

**12 Principles of Animation** — アニメーション12原則をインタラクティブに学べる静的Webサイト。各原則ごとに1ページずつ用意し、リアルタイムアニメーションとサイドパネルの操作で原則を体感できる。

- **公開URL:** https://maso1737.github.io/12-Principles-of-Animation/
- **GitHub:** https://github.com/maso1737/12-Principles-of-Animation
- **ローカル:** `C:\Users\so173\Documents\Claude\Projects\12-Principles-of-Animation\`
- **デプロイ:** GitHub Pages (main branch / root, https有効)
- **ビルドツール:** なし。**素のHTML/CSS/JSのみ**。各ページは完全に自己完結（1ファイルにすべて埋め込み）

## ファイル構成

```
12-Principles-of-Animation/
├── index.html               ← TOPページ (12原則一覧 + roll-call)
├── 01-squash.html           ← Squash & Stretch
├── 02-anticipation.html     ← Anticipation
├── 03-staging.html          ← Staging (Light Performance System)
├── 04-arc.html              ← The Arc
├── 05-follow-through.html   ← Follow Through
├── 06-easing.html           ← Slow In / Slow Out
├── 07-secondary-action.html ← Secondary Action
├── 08-timing.html           ← Timing & Spacing
├── 09-exaggeration.html     ← Exaggeration
├── 10-appeal.html           ← Appeal (Stardust Engine)
├── 11-solid-drawing.html    ← Solid Drawing
├── 12-pose-to-pose.html     ← Pose to Pose
├── svg-export-test.html     ← (補助ツール、非公開)
│
├── assets/
│   ├── common.css           ← デザイントークン定義 (参照用、現状未使用)
│   └── frames/              ← JSON書き出し用 (空)
│
├── fonts/
│   └── bank-gothic-light-bt.ttf  ← 01/08/10 が参照
│
├── 03-staging/              ← 旧フォルダ版 (linkは現在root直置きを使用)
│
├── _済/                     ← 過去の作業フォルダ (git管理外)
│
├── HANDOFF.md               ← セッション間引き継ぎメモ
├── CLAUDE.md                ← このファイル
└── README.md / LICENSE
```

**git管理外（commit 不要）:**
- `_済/`, `.claude/`, `svg-export-test.html`, `run.svg`, `KINETIC GEOMETRY concept.txt`

## 全ページ共通の構造

各ページは原則ごとに**色とトーンが異なる**（統一は意図的に保留中）。ただし以下は概ね共通：

### レイアウト
```css
#app {
  display: grid;
  grid-template-rows: 44px 1fr 44px;   /* topbar / main / bottombar */
  grid-template-columns: 1fr 300〜340px; /* ステージ / サイドパネル */
  height: 100vh;
}
```

### サイドパネル (右ペイン)
- セクション分け: `A`, `B`, `C` … `M` などの `.sp` / `.psec` ブロック
- 各セクションラベルは `<span class="lt">A</span>SECTION NAME` 形式
- スクロール可、スクロールバーは細く (2px〜4px)

### back-to-index ボタン
- 全ページの topbar 右に `[ESC] INDEX` リンク（または同等）
- ESCキーで `index.html` に戻る（`window.location.href='index.html'`）
- 03-staging.html (root直置き) は同様。`03-staging/project/03-staging.html` (旧版) は `../../index.html` 参照

### ボトムバー
- 左: 原則メタ情報 (例: `MASS_CONSERVATION: TRUE`)
- 中: フレームカウンタや state
- 右: ID文字列 or SHORTCUTS ボタン

## index.html について

- 12原則カードのグリッド + roll-call サイドパネル
- `PRINCIPLES` 配列 (line 854〜) で各カードのメタを定義
- `href` を埋めるとカードがクリック可能になる（locked時は `href:null`）
- カード右上の `.mark` SVG アイコン: `top:34px right:12px width:20px` (LIVEバッジと重ならない位置)
- roll-call hover: 地アシッドグリーン + 文字黒

## トーン別グループ (現状)

各ページのデザイントーンは**意図的に分けている**（同一原則セットだけ揃える運用）。
| グループ | ページ | 特徴 |
|---|---|---|
| tDR ライト系 | 01 / 03 / 08 | 白背景・モノクロベース、tDR デザイン的アプローチ |
| 02 / 12 ペア | 02 / 12 | ダーク + magenta/cyan、編集モード+ショートカット同スタイル |
| 04 / 05 / 06 トリオ | 04 / 05 / 06 | 「うごきのまほう ♡」ライトテーマ、kawaii調 |
| その他 | 07 / 09 / 10 / 11 | 個別デザイン |

**新しく作業するページのトーンを揃えるよう自動的に統一しないこと。** ユーザーが意図的にバリエーションを持たせている。

## 開発時の注意点

### 編集ルール
- 各ページは1ファイル自己完結 (HTML+CSS+JS)。`assets/common.css` は現状実質未参照
- フォントは Google Fonts CDN がベース。ローカルフォント (`fonts/bank-gothic-light-bt.ttf`) は一部ページのみ
- LF/CRLF: Windows環境のため git は自動変換 (警告出るが無視可)

### git運用
```bash
git add <変更ファイル> && git commit -m "..." && git pull --rebase origin main && git push origin main
```
- 過去にリモート/ローカル分岐したことがあるため `pull --rebase` を挟むのが安全
- 不要ファイル (`_済/`, `.claude/` 等) は意図的に未トラックのままに

### よく使うパターン
- 新規ページ追加時: `index.html` の `PRINCIPLES` 配列で `href` と `status:'live'` に変更
- 申し送り更新: `HANDOFF.md` を都度更新

## 既知の注意点

- **GitHub Pages デプロイには数十秒〜数分のラグ**: push直後はキャッシュで古い版が見えることあり、Ctrl+F5 で更新
- **`generateHero` の depth プロパティ**: 10-appeal で `parallaxX * el.depth` が NaN になるバグがあった (修正済み、line 1143付近に `depth: 0.7` 追加)
- **フォントパス**: 10-appeal は `fonts/bank-gothic-light-bt.ttf` を参照 (以前 `assets/` 指定で404になっていた、修正済み)

## 関連ドキュメント

- `HANDOFF.md` — 最新の作業引き継ぎメモ (古い記述含む場合あり、CLAUDE.md を優先)

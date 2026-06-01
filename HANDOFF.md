# 申し送り — 12 Principles of Animation

> **このファイルはセッション間の引き継ぎメモ。プロジェクト全般の説明は `CLAUDE.md` 参照。**

---

## 現在の状態 (2026-05-24)

**全12原則ページ完成 + index リンク全て live ✅**

| # | ファイル | 行数 | デザイントーン |
|---|---|---|---|
| 01 | `01-squash.html` | 1508 | tDR ライト系 |
| 02 | `02-anticipation.html` | 2636 | ダーク magenta/cyan (12とペア) |
| 03 | `03-staging.html` | 769 | tDR ライト系 |
| 04 | `04-arc.html` | 1102 | うごきのまほう ♡ (05/06と同) |
| 05 | `05-follow-through.html` | 1043 | うごきのまほう ♡ |
| 06 | `06-easing.html` | 1014 | うごきのまほう ♡ |
| 07 | `07-secondary-action.html` | 1086 | ダーク個別 |
| 08 | `08-timing.html` | 1795 | tDR ライト系 |
| 09 | `09-exaggeration.html` | 1274 | ダーク個別 |
| 10 | `10-appeal.html` | 3468 | Stardust ネイビー |
| 11 | `11-solid-drawing.html` | 1077 | ダーク個別 |
| 12 | `12-pose-to-pose.html` | 2542 | ダーク magenta/cyan (02とペア) |

公開: https://maso1737.github.io/12-Principles-of-Animation/

---

## 直近のセッションでやったこと

### Round 1: index.html UI 修正
- B · ROLL_CALL hover: 地アシッドグリーン + 文字黒、枠線削除
- `.card.roll-focus`: inset 枠線削除、ハイライト色を強める
- `.card .mark` アイコン: 28px→20px、`top:34px right:12px` に移動して LIVE バッジと重なり解消

### Round 2: 06-easing
- C EDITOR のベジェ曲線色 `#FFB7DA` (pink) → `#9BE3FF` (blue) で CUSTOM レーン色と一致

### Round 3: 02/12 APPLY セクション
- 02 G APPLY: BUTTON / DOOR / JUMP / DELETE の4バナー追加 (既存 `.ba-*` CSS 使用)
- 12 I APPLY: UI ANIMATION / ACTING BEATS / CAMERA FRAMING / PRESENTATION の4バナー追加
- 12 の「応用例」→「応用パターン」に変更 (02と統一)

### Round 4: 10-appeal バグ修正
- **フォント404修正**: `assets/bank-gothic-light-bt.ttf` → `fonts/bank-gothic-light-bt.ttf`
- **ANALYSIS パネルと縦APPEALゲージの重なり修正**: `#fui-overlay` を `right:48px → 108px`
- **🔴 重要バグ**: `generateHero()` で `depth` プロパティ未設定 → `parallaxX * undefined = NaN` → ctx.translate(NaN,NaN) で hero が左上 (0,0) にスポーンしていた → `depth: 0.7` 追加で解決
- L PALETTE: ユーザー解釈が「ONの色だけで形が出る」だと判明、現状動作で OK

---

## 09 EXAGGERATION ブラッシュアップ（段階実装中）

`09 EXAGGERATION_Re.txt` の5要素追加を3ターンに分けて実装。

- ✅ **ターンA（完了）**: ①BELIEVABILITY METER（ステージ上部常設・SAFE→UNBELIEVABLE、♥スイートスポット表示）＋ ⑤APPEAL PRESERVATION（パネル H セクション・山型カーブで「壊れる直前=魅力ピーク」、PEAK_APPEAL記録）。算出は `appealOf()` / `believabilityZone()`、`SWEET=0.78`。`updateBelievability()` を `updateHUD()` から毎フレーム呼ぶ。
- ✅ **ターンB（完了）**: ③BELIEVABILITY FAILURE演出（`triggerFailure()`・3メッセージ循環 "YOU BROKE THE ILLUSION"/"AUDIENCE LOST TRUST"/"FORM NO LONGER READS"・`#main-zone.broken` で全体 saturate↓/contrast↑＋scanlineグリッチ・FORM BREAK big-status を置換）＋ ④STRETCH VISUALIZER（`drawStretchGhost()` カーソル位置に NORMAL/EXAGGERATED/OVERDRIVE の輪郭ゴースト・凡例 `#ghost-legend`・`[G]`キー/ボタンでトグル `showGhost`）
  - 🐛 **ついでに修正**: メインcanvasに DPR 変換が抜けていてカーソルとエフェクトがずれていた（左上一致・離れるほどズレ）。`draw()` 冒頭に `ctx.setTransform(DPR,0,0,DPR,0,0)` を追加して解決
- ✅ **ターンC（完了）**: ②COMPARISON MODE（`exaggMode` + `EXAGG{NORMAL:0.5/EXAGGERATED:1.0/OVERDRIVE:1.7}`・`exaggMult()` を believability の `ex`／fracture閾値／歪み量／STRETCHゴーストに反映・パネル I セクション3トグル＋`[1][2][3]`キー＋ステージ左上 `#mode-badge`）
  - 教材的整合: NORMAL は exEff 上限0.575でスイートスポット(0.78)に届かず崩壊もしない＝「地味で安全」、EXAGGERATED はスイートスポットに到達可能＝「理想」、OVERDRIVE は即 FORM BREAK＝「崩壊」。

**→ 09 EXAGGERATION ブラッシュアップ（txt 5要素）すべて完了。** UI改善方針（FXは主役にしない／Shape Readability優先）も維持。

## 既知の保留事項 / TODO

### デザイン統一
- 全12ページのデザインは**意図的にバラバラ**。統一は急がない方針。
- 似たトーンのページセット（01/03/08、02/12、04/05/06）の中でのみ統一感を保つ運用。

### 各ページ細かい改善案 (未着手)
- 07 SECONDARY ACTION: トーン未確定
- 09 EXAGGERATION: トーン未確定
- 11 SOLID DRAWING: トーン未確定
- index `.card .mark` SVG の色がトーン違いの場合の見え方

### 旧フォルダ整理
- `03-staging/project/03-staging.html` (folder版) と `03-staging.html` (root版) が両方存在
  - 現在 index からは root版にリンク
  - folder版は不要なら削除候補

---

## 次セッション開始時のチェック

1. `git status` で未push分の有無確認
2. `git pull origin main` で最新化
3. ユーザーが新フォルダを `_済/` 同様に置いた場合の手順:
   - 中身を root にコピー (ファイル名変換が必要なら確認)
   - 不要なら `_済/` へ移動
   - `index.html` の `PRINCIPLES` 配列で `href` / `status` 更新

---

## 作業フロー (定型)

```bash
# 修正後の典型コミット
git add <files> && git commit -m "..." \
  && git pull --rebase origin main \
  && git push origin main
```

- 過去に分岐が起きたことがあるので `pull --rebase` を挟むのが安全
- `_済/`, `.claude/`, `svg-export-test.html`, `run.svg`, `KINETIC GEOMETRY concept.txt` は意図的に未トラック

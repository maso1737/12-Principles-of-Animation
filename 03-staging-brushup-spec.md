# 03 STAGING — Brush-up 仕様書 (Opus実装用)

対象: `03-staging.html`（747行・単一HTML・canvas 2D）
発案元: `03 STAGING.md`（Diagonal Light System）
コンセプト: **ライトは固定。点灯順・強度・速度・色だけで、1つの対角線から100の可能性を感じさせる。画面そのものが主役。**

Opusへの指示: フェーズ順に実装すること。P0を終えて動作確認してからP1へ。各フェーズは独立コミット可能な粒度。既存の関数名・state構造は下記「現状構造メモ」を正とし、全面書き換えではなく差分編集で進めること。

---

## 現状構造メモ（Opusが最初に把握すべき点）

- state: `cues[]`（{pattern,color,int,spd,rot}×6固定）, `playhead`, `selected`, `loop`, `editorOpen`, `trans`
- 描画: `RENDER[pattern](cue, t, master)` 方式。`withRot()` で回転座標系、`beam()/source()/dot()` がプリミティブ。合成は `lighter`（加算）
- UI: `#editor`（max-height開閉）, `#stack`（CUEカード）, `#go`, `#tools`
- パターン: THIN / BAR / GRADATION / DOT / DEPTHBAR / WIDE

---

## P0 — バグ修正・基盤（「EDIT表示が不安定」の正体を含む）

### P0-1. EDIT開閉時にcanvasがリサイズされない【最重要・不安定の主因】
`resize()` は `window.resize` でしか呼ばれない。EDITを開閉すると `#console` の高さが変わり `#stage-wrap` が伸縮するのに、canvasの実サイズが古いまま → **ステージが歪む/ぼやける/座標がずれる**。

修正: `ResizeObserver` で `#stage-wrap` を監視し `resize()` を呼ぶ。max-heightのtransition中も追従するので開閉アニメ中の歪みも解消する。
```js
new ResizeObserver(()=>resize()).observe(document.getElementById('stage-wrap'));
```
`window.addEventListener('resize', resize)` は残してよい（重複呼び出しは無害）。

### P0-2. #editor の max-height 方式が脆い
`sizeEditor()` が `scrollHeight` を1回固定値で焼き付けるため、開いた後に行折返し（flex-wrap）やフォント遅延ロードで高さが変わると**下端が切れる/余白が跳ねる**。

修正: max-height方式をやめ、grid行アニメに置換。
```css
#editor{display:grid; grid-template-rows:0fr; opacity:0; transition:grid-template-rows .32s ease, opacity .25s ease;}
#editor.open{grid-template-rows:1fr; opacity:1;}
#editor > .editor-inner{overflow:hidden; display:grid; gap:12px;}
```
HTML側は `.edit-row`×3 を `<div class="editor-inner">` で1枚包む。`sizeEditor()` と関連リスナーは削除。

### P0-3. 閉状態でも #console の gap が余白を残す
`#console{gap:12px}` のため、高さ0の `#editor` の分の12pxが常に stack-row 上に空く。修正: `#console` の gap を0にし、`#editor.open .editor-inner{margin-bottom:12px}` 等で開時のみ間隔を出す（`#stack-row` と `#tools` の間は `#tools{margin-top:12px}`）。

### P0-4. トランジションがフレームレート依存
`trans.t += 16/trans.dur` は 120Hz で2倍速、30Hz で半分速。修正: `frame(now)` の now を使い `trans.start=now` からの経過時間で `k` を算出。

### P0-5. スライダーfocus中の矢印キー競合
range にフォーカスがあると ←→ で**スライダーとCUE移動が同時に発生**。修正: keydown 冒頭で
```js
const ae=document.activeElement;
if(ae && (ae.tagName==='INPUT')) return; // Space以外は無視、SpaceはpreventDefault+blur後にadvance
```

### P0-6. ESC規約（プロジェクト共通ルール）
CLAUDE.md の規約では ESC は `index.html` へ戻る。現状はエディタを閉じるだけで、topbarに `[ESC] INDEX` リンクも無い。

修正: ESCの優先順位 = ①エディタが開いていれば閉じる → ②閉じていれば `window.location.href='index.html'`。topbar右（#phaseの上か横）に `[ESC] INDEX` リンクを追加（pointer-events:auto を忘れずに。#top は pointer-events:none）。

### P0-7. タッチでCUE並べ替え不可
HTML5 drag&drop はタッチ非対応。PC先行方針なので優先度低だが、仕様書として記録: 将来 pointerdown 長押し→pointermove 方式に置換。

---

## P1 — コンセプトの核を立てる（点灯順・波・波動光線）

### P1-1. SEQ — 点灯順エディタ【最重要機能。MDの核なのに現状存在しない】
MDでは「ユーザーは**点灯順**・強度・速度・色だけ操作する」が、現状の点灯順はCUEカードの並べ替えのみで、**パターン内部の各灯体の点灯順は固定**。ここが「1本の対角線から100の可能性」の心臓部。

仕様:
- 各cueに `order` プロパティを追加: `'sweep' | 'reverse' | 'center' | 'edges' | 'random' | 'pingpong'`
- 各RENDERer内の位相計算 `(i*0.55)` 等を `phaseOf(i, N, cue.order)` に差し替える共通関数を作る:
  - sweep: `i/N`（現状動作）/ reverse: `1-i/N` / center: `abs(i-N/2)/(N/2)`（中央から外へ）/ edges: centerの逆 / random: cueごとの固定シード配列 / pingpong: 三角波
- EDITパネルに `ORDER` 行を追加（patbtnと同スタイルのボタン6個）
- 同じTHIN 1本でも breathe の位相起点が変わるよう、THINにも order を「明滅の起点（上端/下端/中央）」として適用

効果: 同一パターン×6 order×回転×色×速度で組合せが爆発し、「100の可能性」がUIとして体感できる。

### P1-2. DOT をMD仕様（全面グリッド）に修正
MDは「全面にグリッド上に配置」だが現状は**1列のみ**。

仕様: 回転座標系内に `cols×rows`（例 9×15、SPREADから自動算出）のドットグリッド。波は `phaseOf` を2D拡張し、**波面の方向**を選べる: 対角線に沿う / 直交する / 放射状（中央から円形波）。ドットのサイズ・輝度を波でうねらせる（ラインは曲げない、というMD原則を厳守）。放射状の円形波は平面のドットが球面に見える立体錯覚が強く出る — 3D錯覚のゴールに直結。

### P1-3. 波動光線 — BEAM GROW（発案元にある「伸びる」表現）
点灯の瞬間、ビームが**光源から先端へ伸びていく**演出。錯覚的に「光が飛ぶ」。

仕様:
- `beam(x, half, color, a, grow)` に grow(0..1) を追加。grow<1 のとき `fillRect` の縦範囲を `srcY()` から `srcY()+ (HALF*2)*grow` に制限し、先端に小さな `dot()`（ホットスポット）を置く
- 発動タイミング: ①CUE遷移時、入る側のパターン全灯体に order 順で grow を走らせる（1灯あたり150–300ms、orderのディレイ付き）②WIDE入場時は grow を速くして「波動砲」感
- `trans` に `growT` を持たせ、`RENDER` 呼び出し時に per-fixture の grow を渡す

### P1-4. ライブ操作系 — FLASH / BLACKOUT / MASTER
「ライブ照明さん体験」の即興レイヤー。CUE進行（構築）に対して、手癖の一発（busking）を足す。

仕様:
- **MASTER フェーダー**: 全体輝度 0–100%。`frame()` の master 乗数に掛ける。#tools 右側に縦or横スライダー
- **FLASH**: `F` キー押下中、現CUEの int を瞬間 100% ＋白コアを追加（押してる間だけ。keyup で戻す）
- **BLACKOUT**: `B` キーでトグル。master を 0 へ 120ms でフェード。もう一度で復帰
- Digit1–6 は現状「選択+ジャンプ」だが、**Shift+1–6 = そのCUEをFLASH的に一瞬重ね焼き**（加算合成なので現CUEの上に載せるだけで成立する）

### P1-5. アフターグロー（残光）
実際の照明+ヘイズの空気感。点灯順の軌跡が残ることで**順序が視覚化**され、P1-1の効果を増幅する。

仕様: offscreen canvas を1枚持ち、毎フレーム `globalAlpha=0.82〜0.94`（TRAILスライダーで可変）で自己コピー→新フレームを加算描画→メインへ転写。DPR対応を忘れない。OFF（=現状動作）も選べること。

---

## P2 — 演出の幅（P1完了後）

- **P2-1. TAP TEMPO / BPM同期**: `T` キー連打でBPM検出。spd をBPM基準に量子化するトグル。波・チェイスが拍に合う
- **P2-2. AUTO RUN**: cueごとに `hold`(ms) を持たせ自動進行。LOOPと組み合わせてインスタレーション表示モード（カーソル非表示、UIフェードアウト、`H`キーでUI隠す）
- **P2-3. COPY/PASTE PARAMS**: KINETIC STAGE 規約準拠。全cues+設定をJSONでクリップボードへ/から。プリセットバンク A–F（localStorage不可の環境注意 → file書き出し or クリップボードのみで良い）
- **P2-4. モアレ/視差レイヤー**: 現cueの複製を rot+1.5°・輝度20%で背面に1枚重ねるトグル（`GHOST`）。干渉縞と奥行きが同時に出る。実装は RENDER を2回呼ぶだけ
- **P2-5. CUE遷移カーブ**: cueごとに fade時間 `xf`(ms) と snap/fade 切替。「静→予兆」はロングフェード、「寄せ→解放」はスナップ、が作れる

---

## 非機能・受け入れ基準

1. EDIT開閉を10回連打してもステージが歪まない・editorの下端が切れない（P0-1,2）
2. 120Hzモニタと60Hzでcue遷移の体感速度が同じ（P0-4）
3. スライダー操作中に矢印キーでCUEが飛ばない（P0-5）
4. ESCで index.html に戻れる（editor開時は1回目=閉じる）（P0-6）
5. 単一HTML自己完結を維持。外部ライブラリ追加禁止。60fps維持（アフターグローON時も。重ければ offscreen を 0.5x 解像度に）
6. デフォルト6CUEの初期アーク（静→予兆→流れ→蓄積→寄せ→解放）は現状のまま壊さない
7. ROLES/配色/トーン（ダーク+pink/cyan）は現状踏襲。他ページとの統一はしない（意図的差別化）

## Opus運用メモ

- 1セッション1フェーズ推奨。P0だけで1コミット
- 編集は Edit（差分）で。全文再生成しない
- 各フェーズ後: ブラウザで開き、EDIT開閉・SPACE連打・リサイズを目視確認
- commit: `git add 03-staging.html && git commit -m "03: P0 fixes (canvas resize, editor layout, ESC)" && git pull --rebase origin main && git push origin main`

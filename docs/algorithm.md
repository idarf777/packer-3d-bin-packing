# 3D ビンパッキング アルゴリズム解説

本ドキュメントでは、`packer-3d-bin-packing` の詰め込みアルゴリズムの大まかな流れと、使用されているサブアルゴリズムを解説する。

各クラスの詳細なリファレンスは [クラスリファレンス (classes.md)](./classes.md) を参照。

---

## 目次

- [3D ビンパッキング アルゴリズム解説](#3d-ビンパッキング-アルゴリズム解説)
  - [目次](#目次)
  - [1. 全体概要](#1-全体概要)
  - [2. 処理の大まかな流れ](#2-処理の大まかな流れ)
    - [単一コンテナパッキングの流れ（WrapperGroup.optimize → Boxologic.pack）](#単一コンテナパッキングの流れwrappergroupoptimize--boxologicpack)
  - [3. サブアルゴリズム](#3-サブアルゴリズム)
    - [3.1 Air Force Bin Packing（レイヤーベースヒューリスティック）](#31-air-force-bin-packingレイヤーベースヒューリスティック)
      - [レイヤー構築 (`construct_layers`)](#レイヤー構築-construct_layers)
      - [レイヤー充填 (`pack_layer`)](#レイヤー充填-pack_layer)
      - [5つの配置状況 (Situations)](#5つの配置状況-situations)
      - [パレット向き (`iterate_orientations`)](#パレット向き-iterate_orientations)
    - [3.2 ビームサーチ強化貪欲法](#32-ビームサーチ強化貪欲法)
    - [3.3 遺伝的アルゴリズム（GA）によるWrapper選択最適化](#33-遺伝的アルゴリズムgaによるwrapper選択最適化)
    - [3.4 Repack（詰め替え最適化）](#34-repack詰め替え最適化)
    - [3.5 回転モードシステム](#35-回転モードシステム)
    - [3.6 安定モード（Stable Mode）](#36-安定モードstable-mode)
  - [4. データ構造](#4-データ構造)
    - [レイヤーマップ (`layer_map`: HashMap)](#レイヤーマップ-layer_map-hashmap)
    - [Scrapリスト (`scrap_list`: 双方向連結リスト)](#scrapリスト-scrap_list-双方向連結リスト)
    - [Boxアレイ (`box_array`: Vector)](#boxアレイ-box_array-vector)
  - [5. 座標系とパレット向き](#5-座標系とパレット向き)
    - [座標系](#座標系)
    - [パレットの6つの向き](#パレットの6つの向き)

---

## 1. 全体概要

本ライブラリは **3Dビンパッキング問題**（3D Bin Packing Problem）を解くソルバーである。具体的には：

> 複数の直方体荷物（Product）を、複数種類の直方体コンテナ（Wrapper）に、なるべく少ないコストで詰め込む

という問題を扱う。

核となるアルゴリズムは、米空軍の研究論文 **"Air Force Bin Packing"** に基づくレイヤーベースヒューリスティックであり、これに以下のサブアルゴリズムを組み合わせている：

| サブアルゴリズム | 目的 | 対応クラス/メソッド |
|------------------|------|---------------------|
| Air Force Bin Packing | 単一コンテナへの詰め込み | [`Boxologic`](./classes.md#boxologic) |
| ビームサーチ強化貪欲法 | 局所最適からの脱出 | [`Boxologic.enhancedGreedyWithBeamSearch()`](./classes.md#boxologic) |
| 遺伝的アルゴリズム (GA) | 複数Wrapper型への割当最適化 | [`GAWrapperArray`](./classes.md#gawrapperarray)、[`Packer.initGenes()`](./classes.md#packer) |
| Repack | 別のWrapper型への詰め替えによるコスト削減 | [`Packer.repack()`](./classes.md#packer) |
| 回転モードシステム | 荷物の回転制約の制御 | [`Product.setRotationMode()`](./classes.md#product) |
| 安定モード | 積み上げ時のはみ出し防止 | [`Boxologic.check_stability()`](./classes.md#boxologic) |

---

## 2. 処理の大まかな流れ

以下は `Packer.optimize()` を起点とした処理全体のフローである。

```
Packer.optimize()
│
├─ Wrapper型が1種類の場合 ─────────────────────────────┐
│   WrapperGroup に全インスタンスを割当                   │
│   └─ WrapperGroup.optimize()                          │
│       └─ (後述の「単一コンテナパッキング」を繰り返す)    │
│                                                        │
├─ Wrapper型が複数の場合 ──────────────────────────────┐ │
│   ① initGenes()                                      │ │
│   │  ├─ 各Wrapper型のWrapperGroupを生成               │ │
│   │  ├─ 各インスタンスを「単位体積あたりコスト最小」の  │ │
│   │  │  WrapperGroupに割当                            │ │
│   │  ├─ 各WrapperGroup.optimize() で最適化            │ │
│   │  ├─ repack() で別のWrapper型への詰め替えを試行     │ │
│   │  └─ 結果をGAWrapperArray（遺伝子配列）として返す   │ │
│   │                                                   │ │
│   ② 遺伝的アルゴリズム（※現在JS版では未実装）          │ │
│   │  └─ 初期個体＝最終解としてそのまま使用             │ │
│   │                                                   │ │
│   ③ repack() による最終詰め替え最適化                  │ │
│                                                        │ │
├─ 結果のWrapper内のアイテムを位置でソート ──────────────┘ │
└─ 各Wrapperの充填率を計算して返却 ──────────────────────┘
```

### 単一コンテナパッキングの流れ（WrapperGroup.optimize → Boxologic.pack）

```
WrapperGroup.optimize()
│
└─ while (残りインスタンスあり):
    └─ pack(instanceArray)
        └─ Boxologic.pack()
            │
            ├─ encode()  ← Packerのデータ → boxologic内部形式に変換
            │
            ├─ iterate_orientations()  ← パレットの全向き(最大6)を試行
            │   │
            │   └─ for orientation 1..6:
            │       ├─ construct_layers()  ← 候補レイヤー高さを生成
            │       │
            │       └─ for each layer_thickness:
            │           ├─ iterate_layer(thickness)
            │           │   ├─ enhancedGreedyWithBeamSearch()  ← ビームサーチ版
            │           │   │   ├─ simulatePlacement() × 3候補
            │           │   │   ├─ スコアリング → 最良候補を選択
            │           │   │   └─ applyPlacementSolution()
            │           │   │
            │           │   └─ (ビームサーチ失敗時) 標準アルゴリズム:
            │           │       └─ while (packing):
            │           │           ├─ pack_layer()  ← 1レイヤーの充填
            │           │           │   ├─ find_smallest_z()
            │           │           │   ├─ find_box() → analyze_box()
            │           │           │   ├─ check_found()
            │           │           │   └─ volume_check()
            │           │           └─ find_layer()  ← 次のレイヤー厚さ決定
            │           │
            │           └─ 最良体積なら best_solution として記録
            │
            ├─ report_results()  ← 最良解で再パッキング＋座標変換
            │
            └─ decode()  ← boxologic内部形式 → Packerのデータに逆変換
                └─ 各Wrapの supportRatio を計算
```

---

## 3. サブアルゴリズム

### 3.1 Air Force Bin Packing（レイヤーベースヒューリスティック）

**出典:** [Air Force Bin Packing — 3D pallet packing problem: A human intelligence-based heuristic approach](http://betterwaysystems.github.io/packer/reference/AirForceBinPacking.pdf)

**核となるアイデア:** 3次元の問題を「水平レイヤー（層）の積み重ね」に分解し、各レイヤーを2次元のギャップ充填問題として解く。

#### レイヤー構築 (`construct_layers`)

1. 全Boxの各軸寸法をレイヤー厚さの候補とする
2. 各候補に対して**評価値**を計算する：
   - 他の全Boxについて、その候補厚さとの最小寸法差の合計
   - **評価値が小さい＝多くのBoxがそのレイヤー厚さに近い寸法を持つ** → 効率的に詰められる可能性が高い
3. 候補を `layer_map` （HashMap）に格納する

#### レイヤー充填 (`pack_layer`)

Scrapリスト（連結リスト）を使って、レイヤー内の「前面からの空きスペース（ギャップ）」を管理する。

```
 パレット上面図（X-Z平面）
 ┌─────────────────────────────────┐
 │                                 │ ← cumx
 │   ┌───┐                        │
 │   │Box│  ← cumz (この上端)      │
 │   │ A │                        │
 │   └───┘         Scrap          │
 │  ↑ cumz=0       (最小Z)        │
 ├──┤                              │
 │  ← prev.cumx                   │
 └─────────────────────────────────┘
   Z=0 (前面)                Z=length
```

1. **`find_smallest_z()`**: Scrapリストから最小Z値のノードを発見（最も前面に近い空きスペース）
2. **`find_box()`**: その空きスペースに最適なBoxを検索
   - 各未パック Box について `analyze_box()` で全回転パターンを試行
   - 「余白が最小になる」Boxを最適フィットとして選択
3. **`check_found()`**: 見つかった場合は配置し Scrap リストを更新。見つからない場合はギャップを隣接ノードと統合
4. **`volume_check()`**: 100%充填が達成されたか確認

#### 5つの配置状況 (Situations)

`pack_layer()` は scrap_min_z ノードの左右の隣接ノードの有無に応じて、5つの配置状況に分岐する：

| 状況 | 条件 | 処理 |
|------|------|------|
| Situation 1 | 左右とも無し | 最初のBoxまたは1つだけのギャップ |
| Situation 2 | 左無し、右有り | レイヤー左端のギャップ |
| Situation 3 | 右無し、左有り | レイヤー右端のギャップ |
| Situation 4A | 左右同高 | 両側に囲まれたギャップ（同じ高さ） |
| Situation 4B | 左右異高 | 両側に囲まれたギャップ（異なる高さ） |

#### パレット向き (`iterate_orientations`)

パレット自体の向きを6通り試行し（yAxis回転のBoxがある場合は2通りに制限）、最も充填率の高い向きを採用する。

---

### 3.2 ビームサーチ強化貪欲法

**目的:** 標準の貪欲法が陥りやすい局所最適を回避する。

**動作:**

1. `layer_map` から上位3つのレイヤー厚さを候補として選択（ビーム幅=3）
2. 各候補について `simulatePlacement()` で仮想パッキングを実行：
   - 全Boxの状態を保存（ロールバック可能）
   - レイヤーを繰り返し充填し、パック数・効率・安定性を計測
   - 結果を記録して元の状態に復元
3. 多基準スコアリングで最良候補を選択：
   ```
   score = totalPacked × 1000      ← パック個数（最重要）
         + spaceEfficiency × 100   ← 空間効率
         + orientationBonus         ← Y軸回転の優先向き
         + stabilityScore × 200    ← 安定性（安定モード時のみ）
   ```
4. 最良候補の状態を適用する

**フォールバック:** 有効な候補が1つもない場合は標準のレイヤーベースアルゴリズムに委譲する。

---

### 3.3 遺伝的アルゴリズム（GA）によるWrapper選択最適化

**目的:** 複数種類のWrapperが存在するとき、各インスタンスをどのWrapper型に割り当てるかを最適化する。

**設計:**
- **遺伝子:** 各インスタンスに対するWrapper型の割り当て（[`GAWrapperArray`](./classes.md#gawrapperarray)）
- **適合度:** 全Wrapperの合計コスト（`price`）が低いほど適合度が高い
- **評価:** `constructResult()` で WrapperGroup 毎に最適化を実行し、合計コストを算出

**進化ループ:**

デフォルトで無効。`options.isUseGeneticAlgorithm = true` で有効化できる。

| パラメータ | 値 | 説明 |
|-----------|-----|------|
| 集団サイズ | 10 | 初期個体 + 変異で生成 |
| 世代数 | 20（最大） | 早期収束で打ち切り可能 |
| 突然変異率 | 0.15 | 各遺伝子が変異する確率 |
| トーナメントサイズ | 3 | 選択圧の制御 |
| 停滞打ち切り | 5世代 | 改善がなければ終了 |

**動作:**
1. `initGenes()` で初期個体（貪欲割当）を生成
2. 初期個体を変異率0.3で変異させ、集団サイズ分の初期集団を構築
3. 各世代で以下を繰り返す：
   - **エリート保存**: 最良個体を次世代にそのまま引き継ぐ
   - **トーナメント選択**: 集団からランダムに3個体を選び、最良を親とする
   - **一様交叉 (`crossover`)**: 各遺伝子位置で50%の確率で親A/Bの遺伝子を選択
   - **突然変異 (`mutate`)**: 各遺伝子位置で15%の確率で、収容可能な別のWrapper型にランダム変更
   - **評価**: `constructResult()` で各個体のコストを算出
4. 5世代連続で改善がなければ早期終了
5. 最良個体を最終解として採用

**初期個体の生成 (`initGenes`):**
1. 各Wrapper型のWrapperGroupを作成
2. 各インスタンスについて、収容可能なWrapper型の中で **単位体積あたりコスト (price / containableVolume)** が最小のグループに割当
3. 各グループで `optimize()` を実行
4. `repack()` で別のWrapper型への詰め替えを試行

---

### 3.4 Repack（詰め替え最適化）

**目的:** 一度パッキングされたWrapperの中身を、別のWrapper型に詰め替えてコスト削減を試みるポストプロセス。

**動作:**
1. パック済みの各Wrapperについて
2. そのWrapperに詰まっている全インスタンスを取り出す
3. 別のWrapper型のWrapperGroupを新規作成し、同じインスタンス群を割り当てて最適化
4. コストが下がれば、そのWrapper型に切り替える

**呼び出し箇所:** `initGenes()` の途中と `optimize()` の最後の2箇所で実行される。

---

### 3.5 回転モードシステム

荷物（Product）ごとに回転の許可範囲を指定できるシステム。

| モード | 試行する向き数 | 説明 | 用途例 |
|--------|---------------|------|--------|
| `"all"` | 6 | 全方向回転OK | 頑丈な荷物 |
| `"yAxis"` | 2 | 高さ方向固定、幅と奥行のみ入替 | 液体容器、壊れやすい物 |
| `"none"` | 1 | 回転禁止 | 天地無用の荷物 |

**アルゴリズムへの影響:**
- `construct_layers()`: 回転モードに応じて候補レイヤー厚さの軸を制限
- `find_box()` → `analyze_box()`: 回転モードに応じて試行する向きを制限
- `iterate_orientations()`: yAxisモードのBoxが1つでもあれば、パレット向きを1〜2に制限（Y軸を高さとして保持）
- `getValidOrientations()`: ビームサーチ時の有効な向きリストを生成

---

### 3.6 安定モード（Stable Mode）

**目的:** 実際の物流で重要な「上の荷物が下の荷物からはみ出さない」という制約を実現する。

**制約条件:**
- Y=0（底面）の配置は常に安定
- Y>0の配置は、底面（XZ面）の **70%以上** が下の荷物に支えられていなければならない

**支持率の計算 (`calculateSupportRatio`):**
```
                ┌─────────┐ ← 配置しようとしている箱
                │         │
          ┌─────┼───┐     │
          │  重なり  │     │ ← 下の箱とのXZ平面での重なり面積
          │  (支持)  │     │
          └─────┼───┘     │
                └─────────┘
支持率 = 重なり面積の合計 / 配置する箱のXZ面積
```

**アルゴリズムへの影響:**
- `analyze_box()`: 安定性チェックに不合格な配置を除外
- `simulateLayerPacking()`: ビームサーチ中も安定性を検証
- `encode()`: 安定モード時、`"all"` 回転を自動的に `"yAxis"` に制限（Y軸を固定しないと高さ方向の積み上げが不安定になるため）

---

## 4. データ構造

### レイヤーマップ (`layer_map`: HashMap)

```
キー: レイヤー厚さ (number)
値:   評価スコア (number) = 全Boxとの寸法差の合計（小さいほど良い）
```

候補レイヤー厚さをスコア順に格納し、良い順に試行する。

### Scrapリスト (`scrap_list`: 双方向連結リスト)

```
[Scrap(cumx=20, cumz=5)] ↔ [Scrap(cumx=40, cumz=0)] ↔ [Scrap(cumx=60, cumz=8)]

  X→
  ┌────────┬────────────────────┬────────────┐
  │ cumz=5 │     cumz=0         │  cumz=8    │  ← Z方向の「エッジ」
  │        │   (最小Z=ここから   │            │
  │ cumx=20│    充填開始)        │ cumx=60    │
  │        │     cumx=40        │            │
  └────────┴────────────────────┴────────────┘
  Z↑
```

レイヤー内の空きスペースの輪郭を管理する。Boxを配置するたびにノードの追加・結合・削除が行われる。

### Boxアレイ (`box_array`: Vector)

全インスタンスに対応するBoxオブジェクトの配列。パッキング中に `is_packed`、座標、レイアウト寸法が更新される。

---

## 5. 座標系とパレット向き

### 座標系

```
      Y (高さ)
      │
      │
      │
      └──────── X (幅)
     /
    /
   Z (奥行)
```

- **X軸:** 幅（水平・左右）
- **Y軸:** 高さ（垂直・上下）— レイヤーが積まれる方向
- **Z軸:** 奥行（水平・前後）— レイヤー内でギャップが追跡される方向

### パレットの6つの向き

`write_box_file()` がパレット向きに応じて座標を変換する：

| 向き | X方向 | Y方向 | Z方向 | 備考 |
|------|-------|-------|-------|------|
| 1 | W | H | L | 元の向き |
| 2 | L | H | W | X-Z入替 |
| 3 | H | L | W | — |
| 4 | H | W | L | X-Y入替 |
| 5 | W | L | H | Y-Z入替 |
| 6 | L | W | H | — |

yAxis回転のBoxがある場合は向き1〜2のみ使用（Y軸が高さのまま保持される向き）。

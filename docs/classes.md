# クラスリファレンス

本ドキュメントでは、`packer-3d-bin-packing` を構成する全クラスの役割と責務を解説する。

---

## 目次

- [公開APIクラス (`bws.packer`)](#公開apiクラス-bwspacker)
  - [Packer](#packer)
  - [Product](#product)
  - [Wrapper](#wrapper)
  - [WrapperArray](#wrapperarray)
  - [WrapperGroup](#wrappergroup)
  - [GAWrapperArray](#gawrapperarray)
  - [Wrap](#wrap)
  - [InstanceArray](#instancearray)
  - [PackerForm / InstanceForm / InstanceFormArray](#packerform--instanceform--instanceformarray)
- [内部アルゴリズムクラス (`boxologic`)](#内部アルゴリズムクラス-boxologic)
  - [Boxologic](#boxologic)
  - [Box](#box)
  - [Pallet](#pallet)
  - [Scrap](#scrap)
  - [Instance (boxologic)](#instance-boxologic)
- [基盤クラス (`protocol`)](#基盤クラス-protocol)
  - [Entity](#entity)
  - [EntityArray / EntityArrayCollection / EntityDeque](#entityarray--entityarraycollection--entitydeque)
- [ユーティリティ関数](#ユーティリティ関数)
  - [calculateSupportRatio](#calculatesupportratio)

---

## 公開APIクラス (`bws.packer`)

### Packer

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L2004〜L2238)

**役割:** 3Dビンパッキング問題のファサード（正面玄関）クラス。ユーザーが直接操作する唯一の最適化エントリポイント。

**抽象化しているもの:** 「複数種類のコンテナに複数の荷物を最適に詰め込む」という問題全体を1つの `optimize()` 呼び出しに集約する。

**主要メソッド:**
| メソッド | 説明 |
|----------|------|
| `optimize()` | 最適化を実行し、結果の `WrapperArray` を返す |
| `initGenes()` | 遺伝的アルゴリズムの初期遺伝子列（各インスタンスの割当先Wrapper）を生成する |
| `repack(wrappers)` | パック済みWrapperを別のWrapper型に詰め替えてコスト削減を試みる |

**内部動作:**
- Wrapper型が1種類のみの場合 → `WrapperGroup` に委譲して直接最適化
- Wrapper型が複数の場合 → `initGenes()` でコスト最小割当を行い、将来的には遺伝的アルゴリズムで進化させる（現在のJS版では未実装、C++版では実装済み）

---

### Product

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L2246〜L2383)

**役割:** パッキング対象の荷物（商品）を表現する。

**抽象化しているもの:** 名前・3辺寸法（幅×高さ×奥行）・回転モードを持つ直方体オブジェクト。

**主要プロパティ:**
| プロパティ | 型 | 説明 |
|------------|------|------|
| `name` | string | 商品名（識別キー） |
| `width` | number | X軸方向の長さ |
| `height` | number | Y軸方向の長さ |
| `length` | number | Z軸方向の長さ |
| `_rotationMode` | `"all"` \| `"yAxis"` \| `"none"` | 回転モード |

**回転モードの意味:**
- `"all"` — 6方向すべての回転を許可（デフォルト）
- `"yAxis"` — Y軸回転のみ（高さ方向は固定、幅と奥行のみ入替可能）
- `"none"` — 回転禁止（天地無用）

---

### Wrapper

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L2643〜L2930)

**役割:** 荷物を詰め込むコンテナ（箱）を表現する。`EntityDeque` を継承しており、内部に `Wrap` オブジェクトの列を保持する。

**抽象化しているもの:** 外寸・壁の厚み・価格・安定モードを持つ箱。厚みを考慮した**収容可能寸法**を自動計算する。

**主要プロパティ:**
| プロパティ | 型 | 説明 |
|------------|------|------|
| `name` | string | コンテナ名（型を識別するキー） |
| `price` | number | この箱を使うコスト |
| `width / height / length` | number | 外寸 |
| `thickness` | number | 壁の厚み（各軸で `2×thickness` 分だけ収容空間が縮小） |
| `stableMode` | boolean | 安定モード（上の荷物が下の荷物からはみ出さないよう制約） |

**主要メソッド:**
| メソッド | 説明 |
|----------|------|
| `getContainableWidth/Height/Length()` | 壁厚を差し引いた収容可能寸法 |
| `getContainableVolume()` | 壁厚を差し引いた収容可能体積 |
| `getUtilization()` | 体積利用率 |
| `containable(instance)` | あるインスタンスがこのWrapperに収まるかテスト |

**特記事項:** `Wrapper` 自体も `Instance` インターフェースを満たすため、Wrapper（箱）をさらに別のWrapperに詰め込むことが可能。

---

### WrapperArray

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L1857〜L1897)

**役割:** `Wrapper` のコレクション。`optimize()` の戻り値として使用される。

**抽象化しているもの:** 複数のWrapperに対する集約的な価格計算・利用率計算。

**主要メソッド:**
| メソッド | 説明 |
|----------|------|
| `getPrice()` | 全Wrapperの価格合計 |
| `getUtilization()` | 全Wrapperの体積利用率（加重平均） |

---

### WrapperGroup

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L2937〜L3069)

**役割:** 同一型の `Wrapper` をまとめて管理し、割り当てられたインスタンス群を繰り返しパッキングするグループ。

**抽象化しているもの:** 「1種類の箱を何個使ってもよいので、すべてのインスタンスを詰め込む」という部分問題。

**主要メソッド:**
| メソッド | 説明 |
|----------|------|
| `allocate(instance)` | インスタンスをこのグループに割当（サンプルWrapperに収まるかチェック） |
| `optimize()` | 割当済みインスタンスを `Boxologic` で繰り返しパッキング |
| `pack(instanceArray)` | 新しいWrapperに可能な限り詰め込み、残りを返す |

**動作フロー:**
1. `optimize()` が呼ばれる
2. サンプルWrapperのコピーを作成
3. `Boxologic.pack()` で可能な限り詰める
4. 詰め残りがあれば新しいWrapperを作って繰り返す
5. すべてのインスタンスが詰まるまでループ

---

### GAWrapperArray

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L1899〜L1964)

**役割:** 遺伝的アルゴリズムの「遺伝子」を表現する配列。各インスタンスとWrapper型の対応関係を保持する。

**抽象化しているもの:** 「どのインスタンスをどのWrapper型に割り当てるか」という解の1個体。

**主要メソッド:**
| メソッド | 説明 |
|----------|------|
| `constructResult()` | 遺伝子からWrapperGroupを構築し、最適化を実行してコストを計算 |
| `getResult()` | 最適化結果のマップを返す |
| `less(obj)` | 他の個体とのコスト比較（遺伝的アルゴリズムの適合度評価に使用） |

**備考:** 現在のJavaScript版では遺伝的アルゴリズムの進化ループは未実装。`initGenes()` で生成された初期個体がそのまま最終解として使用される。

---

### Wrap

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L2397〜L2636)

**役割:** 「あるインスタンスがあるWrapperの中のどこに、どの向きで配置されたか」を表現するBridge/Capsularパターンのオブジェクト。

**抽象化しているもの:** Wrapper-Instance間の配置関係（位置・向き・支持率）。

**主要プロパティ:**
| プロパティ | 型 | 説明 |
|------------|------|------|
| `wrapper` | Wrapper | 配置先のコンテナ |
| `instance` | Instance | 配置されたインスタンス |
| `x, y, z` | number | 配置座標 |
| `orientation` | 1〜6 | 向き（6通りの回転の中の1つ） |
| `supportRatio` | number | 支持率（底面がどれだけ下の荷物に支えられているか、0.0〜1.0） |

**向き (orientation) の定義:**
| 値 | width方向 | height方向 | length方向 |
|----|-----------|------------|------------|
| 1 | W | H | L |
| 2 | L | H | W |
| 3 | L | W | H |
| 4 | H | W | L |
| 5 | W | L | H |
| 6 | H | L | W |

---

### InstanceArray

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L1971〜L1983)

**役割:** `Product` や `Wrapper`（Instanceとして扱えるもの）のコレクション。

**抽象化しているもの:** パッキング対象のインスタンス集合。`EntityArray` を継承し、挿入・削除イベントを発火する。

---

### PackerForm / InstanceForm / InstanceFormArray

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L1735〜L1855)

**役割:** ネットワーク通信やUI入力で「同じ商品をN個」と表現するためのユーティリティクラス群。

| クラス | 説明 |
|--------|------|
| `PackerForm` | `InstanceFormArray` と `WrapperArray` を束ねてPackerに変換 |
| `InstanceForm` | 1種類のインスタンス + 繰り返し数のペア |
| `InstanceFormArray` | `InstanceForm` のコレクション → `InstanceArray` に展開可能 |

---

## 内部アルゴリズムクラス (`boxologic`)

### Boxologic

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L286〜L1652)

**役割:** Boxologicアルゴリズム（Air Force Bin Packing）のファサードかつ実装本体。パレット（Wrapper）への荷物詰め込みを実行する中核クラス。

**抽象化しているもの:** 「1つのコンテナに対してインスタンス群を最適配置する」という単一コンテナ問題の全解法ロジック。

**主要メソッド:**
| メソッド | 説明 |
|----------|------|
| `pack()` | エンコード → 最適化 → デコード を実行するアダプタメソッド |
| `encode()` | Packerのデータ構造を内部形式に変換 |
| `decode()` | 内部形式の結果をPackerのデータ構造に逆変換 |
| `iterate_orientations()` | パレットの全向き（最大6通り）で最適化を試行 |
| `iterate_layer(thickness)` | 指定厚さのレイヤーで繰り返しパッキング |
| `enhancedGreedyWithBeamSearch()` | ビームサーチによる強化貪欲法 |
| `simulatePlacement(thickness)` | 仮想パッキングのシミュレーション |
| `construct_layers()` | 候補レイヤー高さを生成・評価 |
| `pack_layer()` | 1レイヤーのパッキングを実行 |
| `find_smallest_z()` | scrapリスト内で最小Z値のギャップを発見 |
| `find_box(hmx, hy, hmy, hz, hmz)` | ギャップに最適な箱を検索 |
| `analyze_box(...)` | 箱の各向きでのフィットを評価 |
| `check_stability(x, z, w, l, y)` | 安定モードでの配置妥当性チェック |
| `check_found()` | 検索結果を反映し、scrapリストを更新 |
| `volume_check()` | 100%充填達成チェック |
| `find_layer(thickness)` | 残りスペースに対する次のレイヤー厚さを決定 |
| `report_results()` | 最良解で再パッキングし座標変換を適用 |
| `write_box_file()` | パレット向きに応じた座標変換 |

---

### Box

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L191〜L226)

**役割:** `Product` / `Wrapper` を boxologic 内部で扱うための内部表現。

**抽象化しているもの:** パッキング対象の直方体。座標・パック済みフラグ・回転モード・衝突判定を保持する。

**主要プロパティ:**
| プロパティ | 説明 |
|------------|------|
| `cox, coy, coz` | パック結果の座標 |
| `layout_width, layout_height, layout_length` | パック時の寸法（回転適用後） |
| `is_packed` | パック済みか否か |
| `rotationMode` | 元のProductから継承した回転モード |
| `overlapped_boxes` | 衝突テスト用のセット |

---

### Pallet

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L1661〜L1708)

**役割:** `Wrapper` を boxologic 内部で扱うための内部表現。

**抽象化しているもの:** パレット（荷台）。壁厚を差し引いた収容可能寸法を保持し、6通りの向き切り替えをサポートする。

**主要メソッド:**
| メソッド | 説明 |
|----------|------|
| `set_orientation(n)` | パレットのレイアウト寸法を向きnに応じて切り替える（1〜6） |

---

### Scrap

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L1718〜L1726)

**役割:** レイヤー内の「エッジ」を表現する構造体。

**抽象化しているもの:** レイヤー構築中の空きスペースの輪郭を表すノード。連結リスト（`std.List<Scrap>`）の要素として使用され、ギャップの検索・更新に使われる。

**プロパティ:**
| プロパティ | 説明 |
|------------|------|
| `cumx` | X方向の累積位置（エッジの右端X座標） |
| `cumz` | Z方向の累積位置（エッジのZ位置＝前面からの距離） |

---

### Instance (boxologic)

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L162〜L183)

**役割:** boxologic 名前空間の基底クラス。3次元の物理的オブジェクトを表す。

**プロパティ:** `width`, `height`, `length`, `volume`, `layout_width`, `layout_height`, `layout_length`

`Box` と `Pallet` の親クラス。

---

## 基盤クラス (`protocol`)

### Entity

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L11〜L13)

**役割:** 全エンティティの基底クラス。`key()` メソッドを提供する。

---

### EntityArray / EntityArrayCollection / EntityDeque

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L16〜L112)

**役割:** `tstl` のコレクション（`std.Vector` / `std.Deque`）を拡張し、挿入・削除時にイベントを発火するObservableコレクション。

| クラス | 基底 | 用途 |
|--------|------|------|
| `EntityArray` | `std.Vector` | `InstanceArray` の基底 |
| `EntityArrayCollection` | `std.Vector` | `WrapperArray`, `InstanceFormArray` の基底 |
| `EntityDeque` | `std.Deque` | `Wrapper` の基底 |

---

## ユーティリティ関数

### calculateSupportRatio

**ファイル:** `src/3d-bin-packing/3d-bin-packing.js` (L250〜L272)

**役割:** 指定座標にBoxを配置した場合の支持率（底面のうち下の箱に支えられている面積の割合）を計算する共有関数。

**パラメータ:**
| パラメータ | 説明 |
|------------|------|
| `x, z` | 配置座標 |
| `width, length` | 配置する箱のXZ平面の寸法 |
| `supportingBoxes` | 下にある箱の配列 `{x1, x2, z1, z2}` |

**戻り値:** 支持率（0.0〜1.0）

安定モードでのパッキング中（`Boxologic.check_stability`）とデコード後のWrap生成（`Boxologic.decode`）の両方で使用される。外部テストコードからも `packer.calculateSupportRatio` として利用可能。

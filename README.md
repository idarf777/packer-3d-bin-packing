# packer-3d-bin-packing

Forked from Packer https://github.com/betterway-tinyman/packer .

3d-bin-packing本体と単純なデモのみ含まれます。

## 主要機能

### 基本的な3Dビンパッキング
- 複数の箱（Wrapper）に複数の商品（Product/Instance）を最適配置
- 遺伝的アルゴリズム、貪欲法、バックトラッキング法を組み合わせた最適化
- ボリューム効率、コスト最適化

### 回転制御機能
- **"all"**: 6方向すべての回転を許可（デフォルト）
- **"yAxis"**: Y軸回転のみ許可（天地無用、height固定・width/length交換可）
- **"none"**: 回転禁止

```typescript
const product = new packer.Product("商品", 10, 20, 5);
product.setRotationMode("yAxis"); // Y軸回転のみ
```

## 変更点

- XML出力機能を削除しsamchonへの依存を廃止
- tstl 3.0.0に更新
- 回転軸固定(Y軸まわり回転のみ許可する)機能を追加
- **安定モード機能を追加**

## 安定モード (Stable Mode)

物理的に安定した梱包を実現するための新機能です。安定モードが有効な場合、箱の底面(Y=0)以外では、上に配置される商品の底面の70%以上が下の商品の上面に接触している状態となります。

### 特徴

- **厳密な支持面積計算**: 商品の底面積の70%以上が下の商品によって支持される
- **複数支持点対応**: 複数の下位商品による支持を正確に計算

### 使用方法

```typescript
import packer from "packer-3d-bin-packing";

// 安定モード有効のWrapper作成
const stableWrapper = new packer.Wrapper("安定箱", 1000, 50, 30, 40, 0, true);

// または既存のWrapperで安定モードを設定
const wrapper = new packer.Wrapper("通常箱", 1000, 50, 30, 40, 0);
wrapper.setStableMode(true);

// WrapperArrayに追加してパッキング実行
const wrappers = new packer.WrapperArray();
wrappers.push(stableWrapper);

const instances = new packer.InstanceArray();
instances.insert(instances.end(), 5, new packer.Product("商品", 10, 8, 15));

const result = new packer.Packer(wrappers, instances).optimize();
```

### 制約事項

1. **Y軸回転モードへの自動変換**: 安定モード有効時、回転モード "all" は無効となり "yAxis" が適用される（"none" の商品はそのまま）
2. **効率性との兼ね合い**: 物理的安定性を重視するため、通常モードより梱包効率が低下する場合がある
3. **商品サイズ要件**: 段階的なサイズの商品でより効果的に動作する（錐形に積み上がる）

### 適用例

- **壊れやすい商品の梱包**: 上に重いものが載ってもバランスが崩れない
- **積み重ね配送**: 輸送中の振動や傾きに対する安定性が必要
- **自動倉庫システム**: ロボットによる取り扱いで物理的制約が重要

## LICENSE

[BSD 3-Clause License](LICENSE)

/**
 * 3d-bin-packing デモプログラム
 *
 * 3D ビンパッキング問題を解くデモです。
 * 複数の箱（Wrapper）に複数の商品（Product）を効率よく梱包します。
 */

import packer from "../src";

// ─────────────────────────────────────
// ユーティリティ: コンソール出力ヘルパー
// ─────────────────────────────────────

function printHeader(title: string): void {
  const line = "=".repeat(60);
  console.log(`\n${line}`);
  console.log(` ${title}`);
  console.log(line);
}

function printSection(title: string): void {
  console.log(`\n--- ${title} ---`);
}

// ─────────────────────────────────────
// 1. 入力データの定義
// ─────────────────────────────────────

function buildWrapperArray(): packer.WrapperArray {
  const wrapperArray: packer.WrapperArray = new packer.WrapperArray();

  // Wrapper(名前, 価格, 幅W, 高さH, 奥行きD, 厚みthickness)
  wrapperArray.push(
    new packer.Wrapper("大箱 (Large)",  1000, 40, 40, 15, 0),
    new packer.Wrapper("中箱 (Medium)",  700, 20, 20, 10, 0),
    new packer.Wrapper("小箱 (Small)",   500, 15, 15,  8, 0),
  );

  return wrapperArray;
}

function buildInstanceArray(): packer.InstanceArray {
  const instanceArray: packer.InstanceArray = new packer.InstanceArray();

  // Product: 商品(名前, 幅W, 高さH, 奥行きD)  ×個数
  const items: Array<[packer.Instance, number]> = [
    [new packer.Product("消しゴム",    1,  2,  5),  15],
    [new packer.Product("本",         15, 30,  3),  15],
    [new packer.Product("飲み物",      3,  3, 10),  15],
    [new packer.Product("傘",          5,  5, 20),  15],
    // Wrapper 自体も梱包対象にできる (箱の中の箱)
    [new packer.Wrapper("ノートPC箱", 2000, 30, 40,  4, 2), 5],
    [new packer.Wrapper("タブレット箱", 2500, 20, 28, 2, 0), 5],
  ];

  for (const [instance, count] of items) {
    instanceArray.insert(instanceArray.end(), count, instance);
  }

  return instanceArray;
}

// ─────────────────────────────────────
// 2. 入力サマリーの表示
// ─────────────────────────────────────

function printInputSummary(
  wrapperArray: packer.WrapperArray,
  instanceArray: packer.InstanceArray
): void {
  printSection("利用可能な箱 (Wrappers)");
  console.log(
    "  名前".padEnd(20) +
    "価格".padStart(8) +
    "  W×H×D"
  );
  for (let i = 0; i < wrapperArray.size(); i++) {
    const w = wrapperArray.at(i) as packer.Wrapper;
    console.log(
      `  ${w.getName().padEnd(18)}` +
      `${String(w.getPrice()).padStart(8)}` +
      `  ${w.getWidth()}×${w.getHeight()}×${w.getLength()}`
    );
  }

  printSection("梱包する商品 (Instances)");
  console.log(`  合計アイテム数: ${instanceArray.size()}`);
}

// ─────────────────────────────────────
// 3. パッキング実行
// ─────────────────────────────────────

function pack(
  wrapperArray: packer.WrapperArray,
  instanceArray: packer.InstanceArray
): packer.WrapperArray {
  const myPacker: packer.Packer = new packer.Packer(wrapperArray, instanceArray);
  return myPacker.optimize();
}

// ─────────────────────────────────────
// 4. 結果の表示
// ─────────────────────────────────────

function printResult(result: packer.WrapperArray): void {
  printSection("パッキング結果");
  console.log(`  使用した箱の数: ${result.size()}`);

  let totalCost = 0;
  for (let i = 0; i < result.size(); i++) {
    const w = result.at(i) as packer.Wrapper;
    const instanceCount = w.size();
    totalCost += w.getPrice();
    console.log(
      `  [箱 ${i + 1}] ${w.getName()}` +
      ` (${w.getWidth()}×${w.getHeight()}×${w.getLength()})` +
      ` → ${instanceCount} 個収納`
    );
  }

  console.log(`\n  合計梱包コスト: ${totalCost}`);
}

// ─────────────────────────────────────
// メインエントリポイント
// ─────────────────────────────────────

function main(): void {
  printHeader("3D Bin Packing デモ");

  // --- 入力データ構築 ---
  const wrapperArray  = buildWrapperArray();
  const instanceArray = buildInstanceArray();
  printInputSummary(wrapperArray, instanceArray);

  // --- パッキング実行 ---
  console.log("\n最適化中...");
  const startTime = Date.now();
  const result = pack(wrapperArray, instanceArray);
  const elapsed = Date.now() - startTime;
  console.log(`最適化完了 (${elapsed} ms)`);

  // --- 結果表示 ---
  printResult(result);

  printHeader("完了");
}

main();

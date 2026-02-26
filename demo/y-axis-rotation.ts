/**
 * 3d-bin-packing デモ: y 軸回転のみ許可
 *
 * 商品の高さ (Y 軸方向) は固定し、水平面 (X-Z 面) 内での
 * 90° 回転（幅と奥行きの入れ替え）だけを許可したパッキングのデモです。
 *
 * 【商品】 名前 W×H×D (mm)
 *   深  139 × 40 × 110
 *   中  200 × 31 × 130
 *   浅  139 × 25 × 110
 *
 * 【箱】 名前 W×H×D (mm)
 *   大  290 × 225 × 230
 *   小  150 × 225 × 225
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

/**
 * y 軸回転のみ許可した Product を生成するヘルパー。
 * setRotationMode("yAxis") を設定することで:
 *   - 高さ (H) は常に固定
 *   - 幅 (W) と奥行き (D) のみ入れ替え可能
 */
function makeProduct(
  name: string,
  width: number,
  height: number,
  length: number
): packer.Product {
  const product = new packer.Product(name, width, height, length);
  product.setRotationMode("yAxis");
  return product;
}

function buildWrapperArray(): packer.WrapperArray {
  const wrapperArray: packer.WrapperArray = new packer.WrapperArray();

  // Wrapper(名前, 価格, 幅W, 高さH, 奥行きD, 厚みthickness)
  wrapperArray.push(
    new packer.Wrapper("大 (290×225×230)",  200, 290, 225, 230, 0),
    new packer.Wrapper("小 (150×225×225)",  100, 150, 225, 225, 0),
  );

  return wrapperArray;
}

function buildInstanceArray(): packer.InstanceArray {
  const instanceArray: packer.InstanceArray = new packer.InstanceArray();

  // 商品ごとに y 軸回転のみ許可して登録 (各10個)
  const items: Array<[packer.Instance, number]> = [
    [makeProduct("中 (200×31×130)",  200, 31, 130), 10],
    [makeProduct("深 (139×40×110)",  139, 40, 110), 10],
    [makeProduct("浅 (139×25×110)",  139, 25, 110), 10],
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
    "  名前".padEnd(26) +
    "価格".padStart(6) +
    "  体積 (mm³)"
  );
  for (let i = 0; i < wrapperArray.size(); i++) {
    const w = wrapperArray.at(i) as packer.Wrapper;
    const vol = w.getWidth() * w.getHeight() * w.getLength();
    console.log(
      `  ${w.getName().padEnd(24)}` +
      `${String(w.getPrice()).padStart(6)}` +
      `  ${vol.toLocaleString()}`
    );
  }

  printSection("梱包する商品 (Instances)  ※ 回転モード: yAxis (高さ固定)");
  console.log(
    "  名前".padEnd(26) +
    "  W×H×D (mm)".padEnd(20) +
    "体積 (mm³)"
  );
  for (let i = 0; i < instanceArray.size(); i++) {
    // 同じ商品が複数登録されているため最初の1件ずつ表示
    const inst = instanceArray.at(i) as packer.Product;
    // 先頭の代表アイテムだけ表示 (名前でグルーピング)
    if (i === 0 || inst.getName() !== (instanceArray.at(i - 1) as packer.Product).getName()) {
      const vol = inst.getWidth() * inst.getHeight() * inst.getLength();
      console.log(
        `  ${inst.getName().padEnd(24)}` +
        `  ${inst.getWidth()}×${inst.getHeight()}×${inst.getLength()}`.padEnd(20) +
        `${vol.toLocaleString()}`
      );
    }
  }
  console.log(`\n  合計アイテム数: ${instanceArray.size()}`);
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

  let totalPackedCount = 0;
  let totalCost = 0;

  for (let i = 0; i < result.size(); i++) {
    const w = result.at(i) as packer.Wrapper;
    const packedCount = w.size();
    totalPackedCount += packedCount;
    totalCost += w.getPrice();

    console.log(
      `\n  [箱 ${i + 1}] ${w.getName()}` +
      ` (W${w.getWidth()} × H${w.getHeight()} × D${w.getLength()})` +
      `  計 ${packedCount} 個`
    );

    // ヘッダー行
    console.log(
      "    " +
      "#".padEnd(5) +
      "商品名".padEnd(26) +
      "原寸 W×H×D".padEnd(18) +
      "配置 X, Y, Z".padEnd(18) +
      "配置後 W×H×D"
    );
    console.log("    " + "-".repeat(85));

    // 各 Wrap (配置情報) を表示
    for (let j = 0; j < w.size(); j++) {
      const wrap = w.at(j) as packer.Wrap;
      const inst = wrap.getInstance();
      const origSize = `${inst.getWidth()}×${inst.getHeight()}×${inst.getLength()}`;
      const pos      = `(${wrap.getX()}, ${wrap.getY()}, ${wrap.getZ()})`;
      const laySize  = `${wrap.getLayoutWidth()}×${wrap.getLayoutHeight()}×${wrap.getLength()}`;
      console.log(
        "    " +
        String(j + 1).padEnd(5) +
        inst.getName().padEnd(26) +
        origSize.padEnd(18) +
        pos.padEnd(18) +
        laySize
      );
    }
  }

  console.log(`\n  合計収納数  : ${totalPackedCount} / 30 個`);
  console.log(`  合計梱包コスト: ${totalCost}`);
}

// ─────────────────────────────────────
// メインエントリポイント
// ─────────────────────────────────────

function main(): void {
  printHeader("3D Bin Packing デモ — y 軸回転のみ許可");

  // --- 入力データ構築 ---
  const wrapperArray  = buildWrapperArray();
  const instanceArray = buildInstanceArray();
  printInputSummary(wrapperArray, instanceArray);

  // --- パッキング実行 ---
  console.log("\n最適化中 (y 軸回転モード: 高さ固定, W/D のみ交換可能)...");
  const startTime = Date.now();
  const result = pack(wrapperArray, instanceArray);
  const elapsed = Date.now() - startTime;
  console.log(`最適化完了 (${elapsed} ms)`);

  // --- 結果表示 ---
  printResult(result);

  printHeader("完了");
}

main();

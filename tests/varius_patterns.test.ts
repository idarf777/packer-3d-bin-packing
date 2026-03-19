import packer from "../src";

// ─────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────

/** optimize を実行し、全アイテムが梱包されたことを検証して結果を返す */
function packAndVerify(
  wrappers: packer.WrapperArray,
  instances: packer.InstanceArray,
  expectedTotal: number,
): packer.WrapperArray {
  const result = new packer.Packer(wrappers, instances).optimize();
  expect(result.size()).toBeGreaterThan(0);

  let totalPacked = 0;
  for (let i = 0; i < result.size(); i++) {
    totalPacked += (result.at(i) as packer.Wrapper).size();
  }
  expect(totalPacked).toBe(expectedTotal);
  return result;
}

/** 単一Wrapperでpackして検証 */
function singleBoxPack(
  boxW: number, boxH: number, boxL: number,
  products: Array<{ name: string; w: number; h: number; l: number; count: number }>,
  stable = false,
): packer.WrapperArray {
  const wrappers = new packer.WrapperArray();
  wrappers.push(new packer.Wrapper("箱", 1000, boxW, boxH, boxL, 0, stable));

  const instances = new packer.InstanceArray();
  let total = 0;
  for (const p of products) {
    instances.insert(instances.end(), p.count, new packer.Product(p.name, p.w, p.h, p.l));
    total += p.count;
  }
  return packAndVerify(wrappers, instances, total);
}

// =============================================
// enhancedGreedyWithBeamSearch 安定性検証テスト
// 多様かつ多数の product パターン
// =============================================

// ─────────────────────────────────────
// 1. 同一サイズ大量パターン
// ─────────────────────────────────────

describe("同一サイズ大量パターン", () => {
  it("立方体 10×10×10 を 27 個", () => {
    singleBoxPack(30, 30, 30, [
      { name: "立方体", w: 10, h: 10, l: 10, count: 27 },
    ]);
  });

  it("立方体 5×5×5 を 64 個", () => {
    singleBoxPack(20, 20, 20, [
      { name: "小立方体", w: 5, h: 5, l: 5, count: 64 },
    ]);
  });

  it("薄板 20×2×20 を 10 個", () => {
    singleBoxPack(20, 20, 20, [
      { name: "薄板", w: 20, h: 2, l: 20, count: 10 },
    ]);
  });

  it("細長棒 2×2×30 を 25 個", () => {
    singleBoxPack(10, 10, 30, [
      { name: "棒", w: 2, h: 2, l: 30, count: 25 },
    ]);
  });

  it("大量の極小品 2×2×2 を 125 個", () => {
    singleBoxPack(10, 10, 10, [
      { name: "極小", w: 2, h: 2, l: 2, count: 125 },
    ]);
  });
});

// ─────────────────────────────────────
// 2. 二種混合パターン
// ─────────────────────────────────────

describe("二種混合パターン", () => {
  it("大小二種 (15×15×15 + 5×5×5)", () => {
    singleBoxPack(30, 30, 30, [
      { name: "大", w: 15, h: 15, l: 15, count: 4 },
      { name: "小", w: 5, h: 5, l: 5, count: 20 },
    ]);
  });

  it("板と棒 (20×3×15 + 3×3×15)", () => {
    singleBoxPack(30, 15, 20, [
      { name: "板", w: 20, h: 3, l: 15, count: 3 },
      { name: "棒", w: 3, h: 3, l: 15, count: 10 },
    ]);
  });

  it("正方と長方 (10×10×10 + 20×10×5)", () => {
    singleBoxPack(40, 20, 20, [
      { name: "正方", w: 10, h: 10, l: 10, count: 6 },
      { name: "長方", w: 20, h: 10, l: 5, count: 4 },
    ]);
  });

  it("薄板と厚板 (15×1×15 + 15×5×15)", () => {
    singleBoxPack(15, 15, 15, [
      { name: "薄板", w: 15, h: 1, l: 15, count: 5 },
      { name: "厚板", w: 15, h: 5, l: 15, count: 2 },
    ]);
  });
});

// ─────────────────────────────────────
// 3. 多種混合パターン
// ─────────────────────────────────────

describe("多種混合パターン", () => {
  it("5 種類の異なるサイズ計 20 個", () => {
    singleBoxPack(40, 40, 40, [
      { name: "A", w: 20, h: 10, l: 15, count: 2 },
      { name: "B", w: 10, h: 10, l: 10, count: 5 },
      { name: "C", w: 8, h: 5, l: 12, count: 5 },
      { name: "D", w: 5, h: 5, l: 5, count: 5 },
      { name: "E", w: 3, h: 3, l: 3, count: 3 },
    ]);
  });

  it("8 種類の異なるサイズ計 30 個", () => {
    singleBoxPack(50, 50, 50, [
      { name: "A", w: 25, h: 10, l: 20, count: 2 },
      { name: "B", w: 20, h: 15, l: 10, count: 3 },
      { name: "C", w: 15, h: 10, l: 15, count: 3 },
      { name: "D", w: 12, h: 8, l: 10, count: 4 },
      { name: "E", w: 10, h: 10, l: 10, count: 5 },
      { name: "F", w: 8, h: 5, l: 8, count: 5 },
      { name: "G", w: 5, h: 5, l: 5, count: 4 },
      { name: "H", w: 3, h: 3, l: 3, count: 4 },
    ]);
  });

  it("10 種類を少量ずつ計 20 個", () => {
    singleBoxPack(50, 40, 50, [
      { name: "A", w: 25, h: 12, l: 20, count: 2 },
      { name: "B", w: 20, h: 10, l: 15, count: 2 },
      { name: "C", w: 18, h: 8, l: 12, count: 2 },
      { name: "D", w: 15, h: 10, l: 10, count: 2 },
      { name: "E", w: 12, h: 6, l: 12, count: 2 },
      { name: "F", w: 10, h: 8, l: 8, count: 2 },
      { name: "G", w: 8, h: 5, l: 10, count: 2 },
      { name: "H", w: 6, h: 6, l: 6, count: 2 },
      { name: "I", w: 4, h: 4, l: 8, count: 2 },
      { name: "J", w: 3, h: 3, l: 3, count: 2 },
    ]);
  });
});

// ─────────────────────────────────────
// 4. 極端な形状パターン
// ─────────────────────────────────────

describe("極端な形状パターン", () => {
  it("非常に薄い板 30×1×30 を 20 枚", () => {
    singleBoxPack(30, 20, 30, [
      { name: "極薄板", w: 30, h: 1, l: 30, count: 20 },
    ]);
  });

  it("非常に細い棒 1×1×40 を 100 本", () => {
    singleBoxPack(10, 10, 40, [
      { name: "細棒", w: 1, h: 1, l: 40, count: 100 },
    ]);
  });

  it("扁平 + 細長 混合", () => {
    singleBoxPack(30, 20, 30, [
      { name: "扁平", w: 20, h: 2, l: 20, count: 5 },
      { name: "細長", w: 2, h: 2, l: 25, count: 10 },
    ]);
  });

  it("ほぼ箱いっぱいの大サイズ 1 個 + 小品多数", () => {
    singleBoxPack(30, 30, 30, [
      { name: "大", w: 28, h: 15, l: 28, count: 1 },
      { name: "小", w: 3, h: 3, l: 3, count: 30 },
    ]);
  });

  it("箱にちょうど入る製品 1 個", () => {
    singleBoxPack(25, 20, 15, [
      { name: "ピッタリ", w: 20, h: 15, l: 10, count: 1 },
    ]);
  });
});

// ─────────────────────────────────────
// 5. 安定モード多様パターン
// ─────────────────────────────────────

describe("安定モード多様パターン", () => {
  it("安定: 同一立方体 8 個", () => {
    singleBoxPack(20, 20, 20, [
      { name: "立方体", w: 10, h: 10, l: 10, count: 8 },
    ], true);
  });

  it("安定: 薄板 10 枚積み重ね", () => {
    singleBoxPack(25, 25, 25, [
      { name: "薄板", w: 20, h: 2, l: 20, count: 10 },
    ], true);
  });

  it("安定: 大小混合 (大基盤 + 小品)", () => {
    singleBoxPack(30, 25, 30, [
      { name: "基盤", w: 25, h: 5, l: 25, count: 2 },
      { name: "小品", w: 8, h: 5, l: 8, count: 10 },
    ], true);
  });

  it("安定: 段階的サイズ", () => {
    singleBoxPack(30, 30, 30, [
      { name: "L", w: 20, h: 8, l: 20, count: 1 },
      { name: "M", w: 15, h: 8, l: 15, count: 2 },
      { name: "S", w: 10, h: 8, l: 10, count: 4 },
    ], true);
  });

  it("安定: 5 種 15 個", () => {
    singleBoxPack(40, 35, 40, [
      { name: "A", w: 18, h: 8, l: 18, count: 2 },
      { name: "B", w: 14, h: 8, l: 14, count: 3 },
      { name: "C", w: 10, h: 8, l: 10, count: 3 },
      { name: "D", w: 8, h: 8, l: 8, count: 4 },
      { name: "E", w: 5, h: 8, l: 5, count: 3 },
    ], true);
  });
});

// ─────────────────────────────────────
// 6. 複数 Wrapper 選択パターン
// ─────────────────────────────────────

describe("複数 Wrapper 選択パターン", () => {
  it("大中小 3 箱から最適な箱が選ばれる", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(
      new packer.Wrapper("大箱", 1500, 50, 50, 50, 0),
      new packer.Wrapper("中箱", 1000, 30, 30, 30, 0),
      new packer.Wrapper("小箱", 500, 15, 15, 15, 0),
    );
    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 5, new packer.Product("品", 10, 10, 10));

    const result = packAndVerify(wrappers, instances, 5);
    // コストが正であること
    let totalCost = 0;
    for (let i = 0; i < result.size(); i++) {
      totalCost += (result.at(i) as packer.Wrapper).getPrice();
    }
    expect(totalCost).toBeGreaterThan(0);
  });

  it("5 種類の箱から多種の製品を梱包", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(
      new packer.Wrapper("XL", 2000, 60, 60, 60, 0),
      new packer.Wrapper("L", 1500, 40, 40, 40, 0),
      new packer.Wrapper("M", 1000, 30, 30, 30, 0),
      new packer.Wrapper("S", 700, 20, 20, 20, 0),
      new packer.Wrapper("XS", 400, 10, 10, 10, 0),
    );
    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 3, new packer.Product("大品", 18, 15, 12));
    instances.insert(instances.end(), 5, new packer.Product("中品", 10, 10, 8));
    instances.insert(instances.end(), 10, new packer.Product("小品", 5, 5, 5));

    packAndVerify(wrappers, instances, 18);
  });

  it("安定モード付き箱で複数種品を梱包", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(
      new packer.Wrapper("安定大", 1500, 40, 40, 40, 0, true),
      new packer.Wrapper("安定小", 800, 20, 20, 20, 0, true),
    );
    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 4, new packer.Product("品A", 15, 10, 12));
    instances.insert(instances.end(), 8, new packer.Product("品B", 8, 8, 8));

    const result = packAndVerify(wrappers, instances, 12);
    for (let i = 0; i < result.size(); i++) {
      expect((result.at(i) as packer.Wrapper).getStableMode()).toBe(true);
    }
  });
});

// ─────────────────────────────────────
// 7. 回転モード混合パターン
// ─────────────────────────────────────

describe("回転モード混合パターン", () => {
  it("全回転可能品のみ 10 個", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("箱", 1000, 30, 30, 30, 0));
    const instances = new packer.InstanceArray();
    const p = new packer.Product("全回転", 12, 8, 6);
    p.setRotationMode("all");
    instances.insert(instances.end(), 10, p);
    packAndVerify(wrappers, instances, 10);
  });

  it("Y 軸回転のみ品 10 個", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("箱", 1000, 30, 30, 30, 0));
    const instances = new packer.InstanceArray();
    const p = new packer.Product("Y軸", 12, 8, 6);
    p.setRotationMode("yAxis");
    instances.insert(instances.end(), 10, p);
    packAndVerify(wrappers, instances, 10);
  });

  it("回転禁止品のみ 8 個", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("箱", 1000, 30, 30, 30, 0));
    const instances = new packer.InstanceArray();
    const p = new packer.Product("固定", 10, 8, 6);
    p.setRotationMode("none");
    instances.insert(instances.end(), 8, p);
    packAndVerify(wrappers, instances, 8);
  });

  it("3 種回転モード混合 各 5 個 計 15 個", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("箱", 1000, 40, 40, 40, 0));
    const instances = new packer.InstanceArray();

    const all = new packer.Product("全回転", 10, 8, 6);
    all.setRotationMode("all");
    instances.insert(instances.end(), 5, all);

    const yAxis = new packer.Product("Y軸", 10, 8, 6);
    yAxis.setRotationMode("yAxis");
    instances.insert(instances.end(), 5, yAxis);

    const none = new packer.Product("固定", 10, 8, 6);
    none.setRotationMode("none");
    instances.insert(instances.end(), 5, none);

    packAndVerify(wrappers, instances, 15);
  });

  it("安定モード + 回転モード混合 12 個", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("安定箱", 1500, 35, 30, 35, 0, true));
    const instances = new packer.InstanceArray();

    const a = new packer.Product("全回転", 12, 8, 10);
    a.setRotationMode("all");
    instances.insert(instances.end(), 4, a);

    const b = new packer.Product("Y軸", 10, 8, 12);
    b.setRotationMode("yAxis");
    instances.insert(instances.end(), 4, b);

    const c = new packer.Product("固定", 8, 8, 8);
    c.setRotationMode("none");
    instances.insert(instances.end(), 4, c);

    packAndVerify(wrappers, instances, 12);
  });
});

// ─────────────────────────────────────
// 8. 特定サイズ現実的パターン
// ─────────────────────────────────────

describe("特定サイズ現実的パターン", () => {
  it("200×31×130 製品を 14 個 (290×225×230 箱)", () => {
    singleBoxPack(290, 225, 230, [
      { name: "製品", w: 200, h: 31, l: 130, count: 14 },
    ]);
  });

  it("200×31×130 製品を 14 個 (安定モード)", () => {
    singleBoxPack(290, 225, 230, [
      { name: "製品", w: 200, h: 31, l: 130, count: 14 },
    ], true);
  });

  it("A4 サイズ書類 (21×1×30) を 50 枚", () => {
    singleBoxPack(25, 50, 35, [
      { name: "書類", w: 21, h: 1, l: 30, count: 50 },
    ]);
  });

  it("書籍 (15×22×3) を 20 冊", () => {
    singleBoxPack(35, 30, 25, [
      { name: "書籍", w: 15, h: 22, l: 3, count: 20 },
    ]);
  });

  it("スマートフォン箱 (8×16×3) を 24 個", () => {
    singleBoxPack(25, 20, 20, [
      { name: "スマホ箱", w: 8, h: 16, l: 3, count: 24 },
    ]);
  });

  it("飲料缶 (7×12×7) を 24 本", () => {
    singleBoxPack(30, 25, 30, [
      { name: "缶", w: 7, h: 12, l: 7, count: 24 },
    ]);
  });

  it("靴箱 (20×12×35) を 6 個", () => {
    singleBoxPack(45, 30, 40, [
      { name: "靴箱", w: 20, h: 12, l: 35, count: 6 },
    ]);
  });
});

// ─────────────────────────────────────
// 9. 大量アイテムストレステスト
// ─────────────────────────────────────

describe("大量アイテムストレステスト", () => {
  it("同一品 50 個", () => {
    singleBoxPack(50, 50, 50, [
      { name: "品", w: 10, h: 10, l: 10, count: 50 },
    ]);
  });

  it("同一品 100 個", () => {
    singleBoxPack(50, 50, 100, [
      { name: "品", w: 5, h: 5, l: 10, count: 100 },
    ]);
  });

  it("3 種 計 60 個", () => {
    singleBoxPack(50, 50, 50, [
      { name: "A", w: 12, h: 8, l: 10, count: 20 },
      { name: "B", w: 8, h: 8, l: 8, count: 20 },
      { name: "C", w: 5, h: 5, l: 5, count: 20 },
    ]);
  });

  it("5 種 計 75 個", () => {
    singleBoxPack(60, 60, 60, [
      { name: "A", w: 15, h: 10, l: 12, count: 10 },
      { name: "B", w: 12, h: 8, l: 10, count: 15 },
      { name: "C", w: 10, h: 8, l: 8, count: 15 },
      { name: "D", w: 8, h: 5, l: 6, count: 15 },
      { name: "E", w: 5, h: 5, l: 5, count: 20 },
    ]);
  });

  it("7 種 計 100 個", () => {
    singleBoxPack(80, 60, 80, [
      { name: "A", w: 20, h: 12, l: 15, count: 8 },
      { name: "B", w: 15, h: 10, l: 12, count: 12 },
      { name: "C", w: 12, h: 10, l: 10, count: 15 },
      { name: "D", w: 10, h: 8, l: 8, count: 15 },
      { name: "E", w: 8, h: 6, l: 8, count: 15 },
      { name: "F", w: 6, h: 5, l: 6, count: 15 },
      { name: "G", w: 4, h: 4, l: 4, count: 20 },
    ]);
  });
});

// ─────────────────────────────────────
// 10. 相似形状パターン
// ─────────────────────────────────────

describe("相似形状パターン", () => {
  it("1:2:3 比率の相似体 3 サイズ", () => {
    singleBoxPack(50, 40, 50, [
      { name: "大", w: 15, h: 30, l: 45, count: 1 },
      { name: "中", w: 10, h: 20, l: 30, count: 3 },
      { name: "小", w: 5, h: 10, l: 15, count: 10 },
    ]);
  });

  it("正方断面の柱 (5×5×H) 高さ違い", () => {
    singleBoxPack(25, 30, 25, [
      { name: "H30", w: 5, h: 30, l: 5, count: 5 },
      { name: "H20", w: 5, h: 20, l: 5, count: 5 },
      { name: "H10", w: 5, h: 10, l: 5, count: 10 },
    ]);
  });

  it("倍々サイズ (2×2×2, 4×4×4, 8×8×8, 16×16×16)", () => {
    singleBoxPack(40, 40, 40, [
      { name: "XL", w: 16, h: 16, l: 16, count: 1 },
      { name: "L", w: 8, h: 8, l: 8, count: 4 },
      { name: "M", w: 4, h: 4, l: 4, count: 16 },
      { name: "S", w: 2, h: 2, l: 2, count: 30 },
    ]);
  });
});

// ─────────────────────────────────────
// 11. Y 軸回転特化パターン
// ─────────────────────────────────────

describe("Y 軸回転特化パターン", () => {
  it("yAxis 品を余裕ある箱に 10 個", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("箱", 1000, 40, 30, 40, 0));
    const instances = new packer.InstanceArray();
    const p = new packer.Product("Y品", 15, 10, 8);
    p.setRotationMode("yAxis");
    instances.insert(instances.end(), 10, p);
    packAndVerify(wrappers, instances, 10);
  });

  it("yAxis 品を安定箱に 8 個", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("安定箱", 1000, 35, 25, 35, 0, true));
    const instances = new packer.InstanceArray();
    const p = new packer.Product("Y安定", 12, 8, 10);
    p.setRotationMode("yAxis");
    instances.insert(instances.end(), 8, p);
    packAndVerify(wrappers, instances, 8);
  });

  it("yAxis と none 混合 各 6 個 計 12 個 (安定)", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("安定箱", 1500, 40, 30, 40, 0, true));
    const instances = new packer.InstanceArray();

    const y = new packer.Product("Y品", 12, 8, 10);
    y.setRotationMode("yAxis");
    instances.insert(instances.end(), 6, y);

    const n = new packer.Product("固定品", 10, 8, 8);
    n.setRotationMode("none");
    instances.insert(instances.end(), 6, n);

    packAndVerify(wrappers, instances, 12);
  });
});

// ─────────────────────────────────────
// 12. thickness 付き Wrapper パターン
// ─────────────────────────────────────

describe("thickness 付き Wrapper パターン", () => {
  it("thickness=2 の箱に小品 8 個", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("厚箱", 1200, 30, 30, 30, 2));
    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 8, new packer.Product("品", 8, 8, 8));
    packAndVerify(wrappers, instances, 8);
  });

  it("thickness=3 の箱に 3 種 計 12 個", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("厚箱", 1500, 40, 40, 40, 3));
    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 4, new packer.Product("A", 12, 10, 8));
    instances.insert(instances.end(), 4, new packer.Product("B", 8, 8, 8));
    instances.insert(instances.end(), 4, new packer.Product("C", 5, 5, 5));
    packAndVerify(wrappers, instances, 12);
  });

  it("thickness=1 安定モード箱に 10 個", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("薄厚安定", 1000, 30, 25, 30, 1, true));
    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 10, new packer.Product("品", 8, 5, 8));
    packAndVerify(wrappers, instances, 10);
  });
});

// ─────────────────────────────────────
// 13. 疎充填パターン (箱に余裕あり)
// ─────────────────────────────────────

describe("疎充填パターン", () => {
  it("大きな箱に小品 3 個だけ", () => {
    singleBoxPack(50, 50, 50, [
      { name: "小品", w: 5, h: 5, l: 5, count: 3 },
    ]);
  });

  it("大きな箱に 1 個だけ", () => {
    singleBoxPack(100, 100, 100, [
      { name: "単品", w: 10, h: 10, l: 10, count: 1 },
    ]);
  });

  it("箱に対して少量の多種品", () => {
    singleBoxPack(60, 60, 60, [
      { name: "A", w: 15, h: 10, l: 12, count: 1 },
      { name: "B", w: 10, h: 8, l: 8, count: 1 },
      { name: "C", w: 5, h: 5, l: 5, count: 1 },
    ]);
  });
});

// ─────────────────────────────────────
// 14. 密充填パターン (ギリギリ入る)
// ─────────────────────────────────────

describe("密充填パターン", () => {
  it("2×2×2 格子で 8 個ピッタリ", () => {
    singleBoxPack(20, 20, 20, [
      { name: "品", w: 10, h: 10, l: 10, count: 8 },
    ]);
  });

  it("3×3 格子で 9 層 = 9 個ピッタリ", () => {
    singleBoxPack(30, 30, 10, [
      { name: "品", w: 10, h: 10, l: 10, count: 9 },
    ]);
  });

  it("2 種で隙間なく詰まる構成", () => {
    // 20×10×10 と 10×10×10 → 幅方向に 20+10=30
    singleBoxPack(30, 10, 10, [
      { name: "長", w: 20, h: 10, l: 10, count: 1 },
      { name: "短", w: 10, h: 10, l: 10, count: 1 },
    ]);
  });
});

// ─────────────────────────────────────
// 15. 繰り返し実行安定性テスト
// ─────────────────────────────────────

describe("繰り返し実行安定性テスト", () => {
  it("同一入力で 5 回実行して同じ結果", () => {
    const counts: number[] = [];
    for (let trial = 0; trial < 5; trial++) {
      const wrappers = new packer.WrapperArray();
      wrappers.push(new packer.Wrapper("箱", 1000, 40, 40, 40, 0));
      const instances = new packer.InstanceArray();
      instances.insert(instances.end(), 5, new packer.Product("A", 15, 10, 12));
      instances.insert(instances.end(), 10, new packer.Product("B", 8, 8, 8));

      const result = new packer.Packer(wrappers, instances).optimize();
      let packed = 0;
      for (let i = 0; i < result.size(); i++) {
        packed += (result.at(i) as packer.Wrapper).size();
      }
      counts.push(packed);
    }
    // すべての試行で梱包数が一致
    expect(new Set(counts).size).toBe(1);
    expect(counts[0]).toBe(15);
  });

  it("安定モードで 5 回実行して同じ結果", () => {
    const counts: number[] = [];
    for (let trial = 0; trial < 5; trial++) {
      const wrappers = new packer.WrapperArray();
      wrappers.push(new packer.Wrapper("安定箱", 1000, 35, 30, 35, 0, true));
      const instances = new packer.InstanceArray();
      instances.insert(instances.end(), 3, new packer.Product("A", 12, 8, 10));
      instances.insert(instances.end(), 6, new packer.Product("B", 8, 6, 8));

      const result = new packer.Packer(wrappers, instances).optimize();
      let packed = 0;
      for (let i = 0; i < result.size(); i++) {
        packed += (result.at(i) as packer.Wrapper).size();
      }
      counts.push(packed);
    }
    expect(new Set(counts).size).toBe(1);
    expect(counts[0]).toBe(9);
  });

  it("多種回転モード混合で 3 回実行して同じ結果", () => {
    const counts: number[] = [];
    for (let trial = 0; trial < 3; trial++) {
      const wrappers = new packer.WrapperArray();
      wrappers.push(new packer.Wrapper("箱", 1500, 50, 40, 50, 0));
      const instances = new packer.InstanceArray();

      const a = new packer.Product("全", 10, 8, 6);
      a.setRotationMode("all");
      instances.insert(instances.end(), 5, a);

      const b = new packer.Product("Y", 10, 8, 6);
      b.setRotationMode("yAxis");
      instances.insert(instances.end(), 5, b);

      const c = new packer.Product("無", 10, 8, 6);
      c.setRotationMode("none");
      instances.insert(instances.end(), 5, c);

      const result = new packer.Packer(wrappers, instances).optimize();
      let packed = 0;
      for (let i = 0; i < result.size(); i++) {
        packed += (result.at(i) as packer.Wrapper).size();
      }
      counts.push(packed);
    }
    expect(new Set(counts).size).toBe(1);
    expect(counts[0]).toBe(15);
  });
});

// ─────────────────────────────────────
// 16. Wrapper も Product も混在する InstanceArray
// ─────────────────────────────────────

describe("Product と Wrapper 混在 InstanceArray", () => {
  it("Product 20 個 + Wrapper 5 個の混在", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(
      new packer.Wrapper("大箱", 1500, 50, 50, 50, 0),
      new packer.Wrapper("中箱", 1000, 30, 30, 30, 0),
    );
    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 10, new packer.Product("消しゴム", 2, 3, 5));
    instances.insert(instances.end(), 10, new packer.Product("飲料", 4, 4, 12));
    instances.insert(instances.end(), 5, new packer.Wrapper("内箱", 500, 15, 15, 8, 0));

    packAndVerify(wrappers, instances, 25);
  });
});

// ─────────────────────────────────────
// 17. 正方形断面パターン
// ─────────────────────────────────────

describe("正方形断面パターン", () => {
  it("正方形断面品 (W=L) 各種", () => {
    singleBoxPack(40, 40, 40, [
      { name: "15sq", w: 15, h: 10, l: 15, count: 4 },
      { name: "10sq", w: 10, h: 10, l: 10, count: 6 },
      { name: "5sq", w: 5, h: 10, l: 5, count: 10 },
    ]);
  });

  it("完全立方体のみ 大中小", () => {
    singleBoxPack(40, 40, 40, [
      { name: "大立方", w: 20, h: 20, l: 20, count: 2 },
      { name: "中立方", w: 10, h: 10, l: 10, count: 8 },
      { name: "小立方", w: 5, h: 5, l: 5, count: 16 },
    ]);
  });
});

// ─────────────────────────────────────
// 18. 非対称形状パターン
// ─────────────────────────────────────

describe("非対称形状パターン", () => {
  it("3 辺すべて異なる品 5 種", () => {
    singleBoxPack(50, 50, 50, [
      { name: "A", w: 22, h: 15, l: 8, count: 3 },
      { name: "B", w: 18, h: 12, l: 6, count: 4 },
      { name: "C", w: 14, h: 9, l: 11, count: 5 },
      { name: "D", w: 10, h: 7, l: 13, count: 4 },
      { name: "E", w: 6, h: 4, l: 9, count: 6 },
    ]);
  });

  it("幅広薄型 + 細長高型の組み合わせ", () => {
    singleBoxPack(40, 40, 40, [
      { name: "幅広薄", w: 30, h: 3, l: 20, count: 4 },
      { name: "細長高", w: 5, h: 25, l: 5, count: 8 },
    ]);
  });
});

// ─────────────────────────────────────
// 19. 単一アイテムサイズバリエーション
// ─────────────────────────────────────

describe("単一アイテムサイズバリエーション", () => {
  const sizes: Array<{ w: number; h: number; l: number; count: number }> = [
    { w: 1, h: 1, l: 1, count: 8 },
    { w: 3, h: 7, l: 2, count: 10 },
    { w: 10, h: 5, l: 3, count: 12 },
    { w: 15, h: 2, l: 25, count: 4 },
    { w: 8, h: 8, l: 8, count: 15 },
    { w: 20, h: 10, l: 5, count: 6 },
    { w: 12, h: 3, l: 18, count: 8 },
    { w: 6, h: 14, l: 9, count: 5 },
  ];

  for (const { w, h, l, count } of sizes) {
    it(`${w}×${h}×${l} を ${count} 個`, () => {
      singleBoxPack(50, 50, 50, [
        { name: `品${w}x${h}x${l}`, w, h, l, count },
      ]);
    });
  }
});

// ─────────────────────────────────────
// 20. エッジケース
// ─────────────────────────────────────

describe("エッジケース", () => {
  it("箱に余裕を持って入る単品", () => {
    singleBoxPack(30, 25, 20, [
      { name: "単品", w: 20, h: 15, l: 10, count: 1 },
    ]);
  });

  it("同一品 1 個だけ", () => {
    singleBoxPack(20, 20, 20, [
      { name: "単品", w: 10, h: 10, l: 10, count: 1 },
    ]);
  });

  it("同一品 2 個だけ", () => {
    singleBoxPack(20, 20, 20, [
      { name: "品", w: 10, h: 10, l: 10, count: 2 },
    ]);
  });

  it("箱より大きいアイテムは例外", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("小箱", 500, 5, 5, 5, 0));
    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 1, new packer.Product("巨大", 20, 20, 20));

    expect(() => new packer.Packer(wrappers, instances).optimize()).toThrow();
  });

  it("非常に多種 (15 種) の少量品", () => {
    const products: Array<{ name: string; w: number; h: number; l: number; count: number }> = [];
    for (let i = 1; i <= 15; i++) {
      products.push({ name: `品${i}`, w: 3 + i, h: 2 + i, l: 4 + i, count: 1 });
    }
    singleBoxPack(80, 80, 80, products);
  });

  it("箱と同サイズの製品 1 個 (完全一致)", () => {
    singleBoxPack(20, 15, 10, [
      { name: "完全一致", w: 20, h: 15, l: 10, count: 1 },
    ]);
  });

  it("製品が箱にギリギリ入る (+1 マージン)", () => {
    singleBoxPack(21, 16, 11, [
      { name: "ギリギリ", w: 20, h: 15, l: 10, count: 1 },
    ]);
  });

  it("製品が箱にギリギリ入る (0 マージン)", () => {
    singleBoxPack(20, 15, 10, [
      { name: "ギリギリ", w: 20, h: 15, l: 10, count: 1 },
    ]);
  });

  it("製品が箱にギリギリ入らない (-1 マージン)", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("箱", 1000, 20, 15, 10, 0));
    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 1, new packer.Product("ギリギリNG", 21, 15, 10));

    expect(() => new packer.Packer(wrappers, instances).optimize()).toThrow();
  });

  it("箱の次元が製品と順序違い (回転必要)", () => {
    singleBoxPack(15, 10, 20, [
      { name: "回転必要", w: 20, h: 15, l: 10, count: 1 },
    ]);
  });

  it("箱の次元が製品と完全逆順 (回転必要)", () => {
    singleBoxPack(10, 20, 15, [
      { name: "逆順", w: 20, h: 15, l: 10, count: 1 },
    ]);
  });
});

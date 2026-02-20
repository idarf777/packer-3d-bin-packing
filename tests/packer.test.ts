import packer from "../src";

// ─────────────────────────────────────
// Wrapper
// ─────────────────────────────────────

describe("Wrapper", () => {
  it("コンストラクタで名前・価格・サイズが設定される", () => {
    const w = new packer.Wrapper("テスト箱", 800, 20, 30, 10, 0);
    expect(w.getName()).toBe("テスト箱");
    expect(w.getPrice()).toBe(800);
    expect(w.getWidth()).toBe(20);
    expect(w.getHeight()).toBe(30);
    expect(w.getLength()).toBe(10);
  });

  it("thickness 0 を設定できる（0=厚みなし）", () => {
    const w = new packer.Wrapper("大箱 (Large)", 1000, 40, 40, 15, 0);
    expect(w.getThickness()).toBe(0);
  });

  it("thickness を設定すると収容可能サイズが縮小される", () => {
    // thickness=2 なら containable = dimension - 2*thickness
    const w = new packer.Wrapper("ノートPC箱", 2000, 30, 40, 4, 2);
    expect(w.getThickness()).toBe(2);
    expect(w.getContainableWidth()).toBe(30 - 2 * 2);
    expect(w.getContainableHeight()).toBe(40 - 2 * 2);
    expect(w.getContainableLength()).toBe(4 - 2 * 2);
  });
});

// ─────────────────────────────────────
// WrapperArray
// ─────────────────────────────────────

describe("WrapperArray", () => {
  function buildWrapperArray(): packer.WrapperArray {
    const arr: packer.WrapperArray = new packer.WrapperArray();
    arr.push(
      new packer.Wrapper("大箱 (Large)",  1000, 40, 40, 15, 0),
      new packer.Wrapper("中箱 (Medium)",  700, 20, 20, 10, 0),
      new packer.Wrapper("小箱 (Small)",   500, 15, 15,  8, 0),
    );
    return arr;
  }

  it("push した数だけ size() が増える", () => {
    const arr = buildWrapperArray();
    expect(arr.size()).toBe(3);
  });

  it("at() で各 Wrapper を取得できる", () => {
    const arr = buildWrapperArray();
    const names = [0, 1, 2].map((i) => (arr.at(i) as packer.Wrapper).getName());
    expect(names).toEqual(["大箱 (Large)", "中箱 (Medium)", "小箱 (Small)"]);
  });

  it("空の WrapperArray は size() === 0", () => {
    const arr: packer.WrapperArray = new packer.WrapperArray();
    expect(arr.size()).toBe(0);
  });
});

// ─────────────────────────────────────
// Product
// ─────────────────────────────────────

describe("Product", () => {
  it("コンストラクタで名前・サイズが設定される", () => {
    const p = new packer.Product("消しゴム", 1, 2, 5);
    expect(p.getName()).toBe("消しゴム");
    expect(p.getWidth()).toBe(1);
    expect(p.getHeight()).toBe(2);
    expect(p.getLength()).toBe(5);
  });

  it("大きなサイズの Product を作成できる", () => {
    const p = new packer.Product("本", 15, 30, 3);
    expect(p.getWidth()).toBe(15);
    expect(p.getHeight()).toBe(30);
    expect(p.getLength()).toBe(3);
  });
});

// ─────────────────────────────────────
// InstanceArray
// ─────────────────────────────────────

describe("InstanceArray", () => {
  function buildInstanceArray(): packer.InstanceArray {
    const arr: packer.InstanceArray = new packer.InstanceArray();
    const items: Array<[packer.Instance, number]> = [
      [new packer.Product("消しゴム",     1,  2,  5), 15],
      [new packer.Product("本",          15, 30,  3), 15],
      [new packer.Product("飲み物",       3,  3, 10), 15],
      [new packer.Product("傘",           5,  5, 20), 15],
      [new packer.Wrapper("ノートPC箱",  2000, 30, 40,  4, 2),  5],
      [new packer.Wrapper("タブレット箱", 2500, 20, 28,  2, 0),  5],
    ];
    for (const [instance, count] of items) {
      arr.insert(arr.end(), count, instance);
    }
    return arr;
  }

  it("insert した合計数が size() に反映される", () => {
    // 15 × 4 + 5 × 2 = 70
    const arr = buildInstanceArray();
    expect(arr.size()).toBe(70);
  });

  it("空の InstanceArray は size() === 0", () => {
    const arr: packer.InstanceArray = new packer.InstanceArray();
    expect(arr.size()).toBe(0);
  });
});

// ─────────────────────────────────────
// Packer.optimize() – 統合テスト
// ─────────────────────────────────────

describe("Packer.optimize()", () => {
  /** demo/index.ts と同じ入力を再現 */
  function buildInputs(): { wrappers: packer.WrapperArray; instances: packer.InstanceArray } {
    const wrappers: packer.WrapperArray = new packer.WrapperArray();
    wrappers.push(
      new packer.Wrapper("大箱 (Large)",  1000, 40, 40, 15, 0),
      new packer.Wrapper("中箱 (Medium)",  700, 20, 20, 10, 0),
      new packer.Wrapper("小箱 (Small)",   500, 15, 15,  8, 0),
    );

    const instances: packer.InstanceArray = new packer.InstanceArray();
    const items: Array<[packer.Instance, number]> = [
      [new packer.Product("消しゴム",     1,  2,  5), 15],
      [new packer.Product("本",          15, 30,  3), 15],
      [new packer.Product("飲み物",       3,  3, 10), 15],
      [new packer.Product("傘",           5,  5, 20), 15],
      [new packer.Wrapper("ノートPC箱",  2000, 30, 40,  4, 2),  5],
      [new packer.Wrapper("タブレット箱", 2500, 20, 28,  2, 0),  5],
    ];
    for (const [instance, count] of items) {
      instances.insert(instances.end(), count, instance);
    }

    return { wrappers, instances };
  }

  it("戻り値が WrapperArray である", () => {
    const { wrappers, instances } = buildInputs();
    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result).toBeInstanceOf(packer.WrapperArray);
  });

  it("1 個以上の箱が使われる", () => {
    const { wrappers, instances } = buildInputs();
    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBeGreaterThan(0);
  });

  it("全 70 個のアイテムが梱包される", () => {
    const { wrappers, instances } = buildInputs();
    const result = new packer.Packer(wrappers, instances).optimize();
    let totalPacked = 0;
    for (let i = 0; i < result.size(); i++) {
      totalPacked += (result.at(i) as packer.Wrapper).size();
    }
    expect(totalPacked).toBe(70);
  });

  it("各箱の名前が元の WrapperArray の名前のいずれかである", () => {
    const { wrappers, instances } = buildInputs();
    const result = new packer.Packer(wrappers, instances).optimize();
    const validNames = new Set(["大箱 (Large)", "中箱 (Medium)", "小箱 (Small)"]);
    for (let i = 0; i < result.size(); i++) {
      const name = (result.at(i) as packer.Wrapper).getName();
      expect(validNames).toContain(name);
    }
  });

  it("合計コストが正の整数である", () => {
    const { wrappers, instances } = buildInputs();
    const result = new packer.Packer(wrappers, instances).optimize();
    let totalCost = 0;
    for (let i = 0; i < result.size(); i++) {
      totalCost += (result.at(i) as packer.Wrapper).getPrice();
    }
    expect(totalCost).toBeGreaterThan(0);
  });

  it("小さいアイテム 1 個だけを梱包できる", () => {
    const wrappers: packer.WrapperArray = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("小箱", 500, 15, 15, 8, 0));

    const instances: packer.InstanceArray = new packer.InstanceArray();
    instances.insert(instances.end(), 1, new packer.Product("消しゴム", 1, 2, 5));

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBe(1);
    expect((result.at(0) as packer.Wrapper).size()).toBe(1);
  });

  it("箱より大きいアイテムがある場合は例外がスローされる", () => {
    const wrappers: packer.WrapperArray = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("小箱", 500, 5, 5, 5, 0));

    const instances: packer.InstanceArray = new packer.InstanceArray();
    // 箱 (5×5×5) より大きい本 (15×30×3)
    instances.insert(instances.end(), 1, new packer.Product("本", 15, 30, 3));

    expect(() => new packer.Packer(wrappers, instances).optimize()).toThrow();
  });
});

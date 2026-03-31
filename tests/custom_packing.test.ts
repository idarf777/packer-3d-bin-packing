import packer from "../src";

// ─────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────

function packAndVerify(
  wrappers: packer.WrapperArray,
  instances: packer.InstanceArray,
  expectedTotal: number,
  options?: packer.PackerOptions,
): packer.WrapperArray {
  const result = new packer.Packer(wrappers, instances, options).optimize();
  expect(result.size()).toBeGreaterThan(0);

  let totalPacked = 0;
  for (let i = 0; i < result.size(); i++) {
    totalPacked += (result.at(i) as packer.Wrapper).size();
  }
  expect(totalPacked).toBe(expectedTotal);
  return result;
}

// ─────────────────────────────────────
// カスタム梱包テスト
// ─────────────────────────────────────

describe("カスタム梱包テスト", () => {
  it("安定モード: 290×205×230 の箱に 139×40×110 を5個・139×25×110 を5個 梱包できる（1箱）", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("大", 1000, 290, 205, 230, 0, true));

    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 5, new packer.Product("product-A", 139, 40, 110));
    instances.insert(instances.end(), 5, new packer.Product("product-B", 139, 25, 110));

    const result = packAndVerify(wrappers, instances, 10);
    expect(result.size()).toBe(1);
  });

  it("通常モード: 290×205×230 の箱に 139×40×110 を5個・139×25×110 を5個 梱包できる（1箱）", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("大", 1000, 290, 205, 230, 0, false));

    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 5, new packer.Product("product-A", 139, 40, 110));
    instances.insert(instances.end(), 5, new packer.Product("product-B", 139, 25, 110));

    const result = packAndVerify(wrappers, instances, 10);
    expect(result.size()).toBe(1);
  });

  it("安定モード: 主食x5 + ソースx10", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("大", 1000, 290, 205, 230, 0, true));

    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 5, new packer.Product("product-A", 139, 25, 110));
    instances.insert(instances.end(), 10, new packer.Product("product-B", 139, 40, 110));

    packAndVerify(wrappers, instances, 15);
  });

  it("安定モード: 主食x10 + ソースx5", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("大", 1000, 290, 205, 230, 0, true));

    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 10, new packer.Product("product-A", 139, 25, 110));
    instances.insert(instances.end(), 5, new packer.Product("product-B", 139, 40, 110));

    packAndVerify(wrappers, instances, 15);
  });

  it("安定モード: 主食x10 + ソースx10", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("大", 1000, 290, 205, 230, 0, true));

    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 10, new packer.Product("product-A", 139, 25, 110));
    instances.insert(instances.end(), 10, new packer.Product("product-B", 139, 40, 110));

    packAndVerify(wrappers, instances, 20);
  });

  it("安定モード: 主食x15 + ソースx10", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("大", 1000, 290, 205, 230, 0, true));

    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 15, new packer.Product("product-A", 139, 25, 110));
    instances.insert(instances.end(), 10, new packer.Product("product-B", 139, 40, 110));

    packAndVerify(wrappers, instances, 25);
  });

  it("安定モード: 主食x10 + ソースx15", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("大", 1000, 290, 205, 230, 0, true));

    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 10, new packer.Product("product-A", 139, 25, 110));
    instances.insert(instances.end(), 15, new packer.Product("product-B", 139, 40, 110));

    packAndVerify(wrappers, instances, 25);
  });
});

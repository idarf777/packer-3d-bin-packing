import packer from "../src";

// ─────────────────────────────────────
// ヘルパー
// ─────────────────────────────────────

/**
 * シード付き疑似乱数ジェネレータ (線形合同法)
 * 再現可能な乱数列を生成する
 */
function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/**
 * 安定性を検証するヘルパー関数
 *
 * Y=0 以外では、下側製品による合計サポート面積が
 * 上側製品の X-Z 底面積の 70% 以上であることを検証する。
 *
 * ※ packer.calculateSupportRatio を利用してサポート率を計算します。
 *    この関数は梱包**後**の検証用です。
 */
function validateStabilityConstraints(
  wrapper: packer.Wrapper,
): { isValid: boolean; violations: string[], validationDetails?: string[] } {
  const MIN_SUPPORT_RATIO = 0.7;
  const violations: string[] = [];
  const validationDetails: string[] = [];
  const wraps: packer.Wrap[] = [];

  for (let i = 0; i < wrapper.size(); i++) {
    wraps.push(wrapper.at(i) as packer.Wrap);
  }

  wraps.sort((a, b) => a.getY() - b.getY());

  for (let i = 0; i < wraps.length; i++) {
    const upper = wraps[i];
    const upperY = upper.getY();

    // wrapper底面(Y=0)に置かれたアイテムは常に安定
    if (upperY < 0.01) continue;

    const ux1 = upper.getX();
    const uz1 = upper.getZ();

    // 下側のアイテムから支援を受けるボックスを収集
    const supportingBoxes: Array<{ x1: number; x2: number; z1: number; z2: number }> = [];
    for (let j = 0; j < wraps.length; j++) {
      if (i === j) continue;
      const lower = wraps[j];
      const lowerTop = lower.getY() + lower.getLayoutHeight();

      // 上側アイテムの底面と下側アイテムの上面が接触しているかチェック
      if (Math.abs(lowerTop - upperY) >= 0.01) continue;

      supportingBoxes.push({
        x1: lower.getX(),
        x2: lower.getX() + lower.getLayoutWidth(),
        z1: lower.getZ(),
        z2: lower.getZ() + lower.getLength(),
      });
    }

    // packer.calculateSupportRatio を使用してサポート率を計算
    const ratio = packer.calculateSupportRatio(
      ux1,
      uz1,
      upper.getLayoutWidth(),
      upper.getLength(),
      supportingBoxes,
    );

    if (ratio < MIN_SUPPORT_RATIO) {
      violations.push(
        `${upper.getInstance().getName()}` +
          `(x=${ux1.toFixed(1)}, y=${upperY.toFixed(1)}, z=${uz1.toFixed(1)}) ` +
          `サポート率 ${(ratio * 100).toFixed(1)}% < ${(MIN_SUPPORT_RATIO * 100).toFixed(0)}%`,
      );
    } else {
      validationDetails.push(
        `${upper.getInstance().getName()}` +
          `(x=${ux1.toFixed(1)}, y=${upperY.toFixed(1)}, z=${uz1.toFixed(1)}) ` +
          `サポート率 ${(ratio * 100).toFixed(1)}%`,
      );
    }
  }

  return { isValid: violations.length === 0, violations, validationDetails };
}

// =============================================
// 1. ランダム大量梱包 ― プログラム安定性テスト
//
// 1 種類の wrapper にランダムな product を 1000 個格納するのを
// 5 回繰り返し、クラッシュや例外が発生しないことを確認する。
// =============================================

describe("ランダム大量梱包 プログラム安定性テスト", () => {
  // 再現可能にするため固定シードを 5 つ使用する
  const RUNS: Array<{ seed: number }> = [
    { seed: 42 },
    { seed: 137 },
    { seed: 2718 },
    { seed: 31415 },
    { seed: 99999 },
  ];

  RUNS.forEach(({ seed }, runIndex) => {
    it(
      `run ${runIndex + 1}/5 (seed=${seed}): ランダム product 1000 個を梱包してもクラッシュしない`,
      () => {
        const rng = createRng(seed);
        const randInt = (min: number, max: number) =>
          min + Math.floor(rng() * (max - min + 1));

        // 十分な容積を持つ wrapper を 1 種類だけ用意する
        // product 最大サイズ 6×6×6、1000 個の総体積 ≈ 1000 × 3.5^3 ≈ 43,000
        // 60×60×60 = 216,000 → 余裕を持って収容できる
        const wrappers = new packer.WrapperArray();
        wrappers.push(new packer.Wrapper("大箱", 1000, 60, 60, 60, 0));

        const instances = new packer.InstanceArray();
        for (let i = 0; i < 1000; i++) {
          instances.insert(
            instances.end(),
            1,
            new packer.Product(
              `品_${i}`,
              randInt(1, 6),
              randInt(1, 6),
              randInt(1, 6),
            ),
          );
        }

        // 例外が発生しないことを検証
        let result: packer.WrapperArray | undefined;
        expect(() => {
          result = new packer.Packer(wrappers, instances).optimize();
        }).not.toThrow();

        // 結果が返ってくること
        expect(result!.size()).toBeGreaterThan(0);

        // 全 1000 個が梱包されていること
        let totalPacked = 0;
        for (let i = 0; i < result!.size(); i++) {
          totalPacked += (result!.at(i) as packer.Wrapper).size();
        }
        expect(totalPacked).toBe(1000);
      },
      120_000, // 2 分タイムアウト（大量 product のため）
    );
  });
});

// =============================================
// 1.5. ビームサーチ有無の効果比較
//
// ランダム product を梱包し、ビームサーチの有無で
// 処理時間・充填率・使用箱数にどれほど差があるかを出力する。
// =============================================

describe("ビームサーチ有無の効果比較", () => {
  const scenarios: Array<{
    label: string;
    seed: number;
    productCount: number;
    wrapperSize: number;
    maxProductSize: number;
    stableMode: boolean;
  }> = [
    { label: "小規模 (50個, 非安定)", seed: 42, productCount: 50, wrapperSize: 40, maxProductSize: 6, stableMode: false },
    { label: "中規模 (200個, 非安定)", seed: 137, productCount: 200, wrapperSize: 60, maxProductSize: 6, stableMode: false },
    { label: "大規模 (500個, 非安定)", seed: 2718, productCount: 500, wrapperSize: 60, maxProductSize: 6, stableMode: false },
    { label: "小規模 (50個, 安定)", seed: 42, productCount: 50, wrapperSize: 40, maxProductSize: 6, stableMode: true },
    { label: "中規模 (200個, 安定)", seed: 137, productCount: 200, wrapperSize: 60, maxProductSize: 6, stableMode: true },
    { label: "大規模 (500個, 安定)", seed: 2718, productCount: 500, wrapperSize: 60, maxProductSize: 6, stableMode: false },
  ];

  scenarios.forEach(({ label, seed, productCount, wrapperSize, maxProductSize, stableMode }) => {
    it(
      `${label}: ビームサーチ有無で結果と処理時間を比較`,
      () => {
        const buildInputs = () => {
          const rng = createRng(seed);
          const randInt = (min: number, max: number) =>
            min + Math.floor(rng() * (max - min + 1));

          const wrappers = new packer.WrapperArray();
          wrappers.push(
            new packer.Wrapper("テスト箱", 1000, wrapperSize, wrapperSize, wrapperSize, 0, stableMode),
          );

          const instances = new packer.InstanceArray();
          for (let i = 0; i < productCount; i++) {
            instances.insert(
              instances.end(),
              1,
              new packer.Product(
                `品_${i}`,
                randInt(1, maxProductSize),
                randInt(1, maxProductSize),
                randInt(1, maxProductSize),
              ),
            );
          }
          return { wrappers, instances };
        };

        // --- ビームサーチ有り ---
        const inputWith = buildInputs();
        const startWith = performance.now();
        const resultWith = new packer.Packer(
          inputWith.wrappers, inputWith.instances, { isNotUseBeamSearch: false },
        ).optimize();
        const timeWith = performance.now() - startWith;

        // --- ビームサーチ無し ---
        const inputWithout = buildInputs();
        const startWithout = performance.now();
        const resultWithout = new packer.Packer(
          inputWithout.wrappers, inputWithout.instances, { isNotUseBeamSearch: true },
        ).optimize();
        const timeWithout = performance.now() - startWithout;

        // --- 結果集計 ---
        const summarize = (result: packer.WrapperArray) => {
          let totalPacked = 0;
          let totalVolume = 0;
          let totalCapacity = 0;
          for (let i = 0; i < result.size(); i++) {
            const w = result.at(i) as packer.Wrapper;
            totalPacked += w.size();
            totalCapacity += w.getContainableVolume();
            for (let j = 0; j < w.size(); j++) {
              const wrap = w.at(j) as packer.Wrap;
              totalVolume += wrap.getVolume();
            }
          }
          return {
            wrapperCount: result.size(),
            packedCount: totalPacked,
            fillRate: totalCapacity > 0 ? totalVolume / totalCapacity : 0,
          };
        };

        const sumWith = summarize(resultWith);
        const sumWithout = summarize(resultWithout);

        console.log(`\n========== ${label} (stableMode=${stableMode}) ==========`);
        console.log(`| 項目             | ビームサーチ有り | ビームサーチ無し | 差分           |`);
        console.log(`|------------------|-----------------|-----------------|----------------|`);
        console.log(
          `| 処理時間 (ms)    | ${timeWith.toFixed(1).padStart(15)} | ${timeWithout.toFixed(1).padStart(15)} | ${(timeWith - timeWithout > 0 ? "+" : "") + (timeWith - timeWithout).toFixed(1).padStart(13)} |`,
        );
        console.log(
          `| 使用箱数         | ${String(sumWith.wrapperCount).padStart(15)} | ${String(sumWithout.wrapperCount).padStart(15)} | ${(sumWith.wrapperCount - sumWithout.wrapperCount > 0 ? "+" : "") + String(sumWith.wrapperCount - sumWithout.wrapperCount).padStart(13)} |`,
        );
        console.log(
          `| 梱包数           | ${String(sumWith.packedCount).padStart(15)} | ${String(sumWithout.packedCount).padStart(15)} | ${(sumWith.packedCount - sumWithout.packedCount > 0 ? "+" : "") + String(sumWith.packedCount - sumWithout.packedCount).padStart(13)} |`,
        );
        console.log(
          `| 充填率           | ${(sumWith.fillRate * 100).toFixed(2).padStart(14)}% | ${(sumWithout.fillRate * 100).toFixed(2).padStart(14)}% | ${((sumWith.fillRate - sumWithout.fillRate) * 100 > 0 ? "+" : "") + ((sumWith.fillRate - sumWithout.fillRate) * 100).toFixed(2).padStart(12)}% |`,
        );

        // 両方とも全製品を梱包できていることを確認
        expect(sumWith.packedCount).toBe(productCount);
        expect(sumWithout.packedCount).toBe(productCount);
      },
      120_000,
    );
  });
});

// =============================================
// 2. 底面 70% サポートルール検証テスト
//
// 安定モードで 1 種類の wrapper に大きさが異なる product を
// 10 個格納し、全 product の配置が底面 70% サポートルールを
// 守っているかを検証する。
//
// ルール: wrapper の底面以外に置かれた product A の底面は、
//         直下の product の上面に接触している面積が
//         product A の底面積の 70% 以上でなければならない。
// =============================================

describe("底面70%サポートルール検証", () => {
  /**
   * ピラミッド段階的サイズ構造 ― 1 列スタック
   *
   * 幅方向(XZ)が wrapper とほぼ同サイズのため製品は縦に積まれる。
   * 上の製品は常に下の製品より小さいため 100% サポートされる。
   */
  it("段階的にサイズが小さくなる 10 個の product が 70% ルールを遵守する", () => {
    // 幅 30、高さ 100 の細長い wrapper
    // XZ 平面に 1 個しか収まらないため必ず縦積みになる
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("安定縦積み箱", 1000, 30, 100, Math.floor(30 * 0.75), 0, true));

    const instances = new packer.InstanceArray();
    // 30 → 12 まで 2 ずつ小さくなる 10 種類（各 1 個）
    const sizes = [30, 28, 26, 24, 22, 20, 18, 16, 14, 12];
    sizes.forEach((s, idx) => {
      instances.insert(
        instances.end(),
        1,
        new packer.Product(`品_${String.fromCharCode(65 + idx)}`, s, 6, Math.floor(s * 0.75)),
      );
    });

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBeGreaterThan(0);

    let totalPacked = 0;
    const allViolations: string[] = [];

    for (let i = 0; i < result.size(); i++) {
      const wrapper = result.at(i) as packer.Wrapper;
      expect(wrapper.getStableMode()).toBe(true);
      totalPacked += wrapper.size();

      const { isValid, violations, validationDetails } = validateStabilityConstraints(wrapper);
      if (!isValid) {
        allViolations.push(`Wrapper ${i + 1}:`, ...violations);
      } else {
        console.log(`Wrapper ${i + 1} validation details:`, validationDetails);
      }
    }

    expect(totalPacked).toBe(10);

    if (allViolations.length > 0) {
      console.error("底面 70% サポートルール違反:", allViolations);
    }
    expect(allViolations).toHaveLength(0);
  });

  /**
   * 大きな基盤 + 中型品 + 小型品 の 3 段構造
   *
   * 下の層が上の層より広いため、上の製品は必ず 70% 以上サポートされる。
   */
  it("大中小 3 段構造の 10 個の product が 70% ルールを遵守する", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("安定3段箱", 1000, 30, 50, 30, 0, true));

    const instances = new packer.InstanceArray();
    // 1 段目: 28×6×22 を 1 個（底面をほぼ覆う大きな基盤）
    instances.insert(instances.end(), 1, new packer.Product("基盤", 28, 6, 22));
    // 2 段目: 18×6×14 を 4 個（基盤の上に並ぶ中型品、基盤に完全サポートされる）
    instances.insert(instances.end(), 4, new packer.Product("中型", 18, 6, 14));
    // 3 段目: 10×6×8 を 5 個（中型品の上に載る小型品、中型品に完全サポートされる）
    instances.insert(instances.end(), 5, new packer.Product("小型", 10, 6, 8));

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBeGreaterThan(0);

    let totalPacked = 0;
    const allViolations: string[] = [];

    for (let i = 0; i < result.size(); i++) {
      const wrapper = result.at(i) as packer.Wrapper;
      expect(wrapper.getStableMode()).toBe(true);
      totalPacked += wrapper.size();

      const { isValid, violations, validationDetails } = validateStabilityConstraints(wrapper);
      if (!isValid) {
        allViolations.push(`Wrapper ${i + 1}:`, ...violations);
      } else {
        console.log(`Wrapper ${i + 1} validation details:`, validationDetails);
      }
    }

    expect(totalPacked).toBe(10);

    if (allViolations.length > 0) {
      console.error("底面 70% サポートルール違反:", allViolations);
    }
    expect(allViolations).toHaveLength(0);
  });

  /**
   * 同一高さ・異なる面積の 10 個の product
   *
   * サイズが大きく異なる製品を同じ高さにそろえることで
   * 縦積み時の 70% 判定を多様なケースで検証する。
   */
  it("面積が異なる 10 個の product (同一高さ) が 70% ルールを遵守する", () => {
    const wrappers = new packer.WrapperArray();
    // XZ が 30×30、十分な高さを持つ wrapper
    wrappers.push(new packer.Wrapper("安定同高箱", 1000, 30, 100, 30, 0, true));

    const instances = new packer.InstanceArray();
    // 各 product の高さは 8 で統一、XZ サイズのみ変化
    // 大きい順に積まれることで下の品が上の品を支える
    const productDefs = [
      { name: "P1", w: 28, l: 22 },
      { name: "P2", w: 26, l: 20 },
      { name: "P3", w: 24, l: 18 },
      { name: "P4", w: 22, l: 17 },
      { name: "P5", w: 20, l: 15 },
      { name: "P6", w: 18, l: 14 },
      { name: "P7", w: 16, l: 12 },
      { name: "P8", w: 14, l: 11 },
      { name: "P9", w: 12, l: 9 },
      { name: "P10", w: 10, l: 8 },
    ];
    productDefs.forEach(({ name, w, l }) => {
      instances.insert(instances.end(), 1, new packer.Product(name, w, 8, l));
    });

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBeGreaterThan(0);

    let totalPacked = 0;
    const allViolations: string[] = [];

    for (let i = 0; i < result.size(); i++) {
      const wrapper = result.at(i) as packer.Wrapper;
      expect(wrapper.getStableMode()).toBe(true);
      totalPacked += wrapper.size();

      const { isValid, violations, validationDetails } = validateStabilityConstraints(wrapper);
      if (!isValid) {
        allViolations.push(`Wrapper ${i + 1}:`, ...violations);
      } else {
        console.log(`Wrapper ${i + 1} validation details:`, validationDetails);
      }
    }

    expect(totalPacked).toBe(10);

    if (allViolations.length > 0) {
      console.error("底面 70% サポートルール違反:", allViolations);
    }
    expect(allViolations).toHaveLength(0);
  });

  /**
   * ランダム 100 個の product を大きな安定 wrapper に梱包し、
   * すべての product が 70% サポートルールを遵守することを検証する。
   *
   * ランダムなサイズのため、product の配置パターンが多様になり、
   * 実際の梱包で 70% ルールが適切に機能していることを確認できる。
   */
  it("ランダム product 100 個が 70% ルールを遵守する", () => {
    const rng = createRng(12345); // 再現可能な乱数シード
    const randInt = (min: number, max: number) =>
      min + Math.floor(rng() * (max - min + 1));

    const wrappers = new packer.WrapperArray();
    // 100 個のランダム製品を収容できる大きな箱
    // product 平均サイズ ≈ 4.5×4.5×4.5 = 91
    // 100 個 × 91 = 9,100
    // 充填率 70% → 必要体積 ≈ 13,000
    // 50×50×50 = 125,000 で十分な余裕がある
    wrappers.push(new packer.Wrapper("ランダム対応大箱", 1000, 50, 50, 50, 0, true));

    const instances = new packer.InstanceArray();
    for (let i = 0; i < 100; i++) {
      instances.insert(
        instances.end(),
        1,
        new packer.Product(
          `品_${i}`,
          randInt(1, 8),
          randInt(1, 8),
          randInt(1, 8),
        ),
      );
    }

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBeGreaterThan(0);

    let totalPacked = 0;
    const allViolations: string[] = [];

    for (let i = 0; i < result.size(); i++) {
      const wrapper = result.at(i) as packer.Wrapper;
      expect(wrapper.getStableMode()).toBe(true);
      totalPacked += wrapper.size();

      const { isValid, violations, validationDetails } =
        validateStabilityConstraints(wrapper);
      if (!isValid) {
        allViolations.push(`Wrapper ${i + 1}:`, ...violations);
      } else if (validationDetails && validationDetails.length > 0) {
        console.log(`Wrapper ${i + 1} validation details:`, validationDetails);
      }
    }

    expect(totalPacked).toBe(100);

    if (allViolations.length > 0) {
      console.error("底面 70% サポートルール違反:", allViolations);
    }
    expect(allViolations).toHaveLength(0);
  });

});

// =============================================
// 3. validateStabilityConstraints 関数の検証
//
// 安定性チェック関数が、複雑な梱包シーンで
// サポート率を正しく計算できることを検証する。
// =============================================

describe("validateStabilityConstraints 関数の検証", () => {
  /**
   * 複数の小さな product と 1 つの大きな product を梱包し、
   * 検証関数がサポート率を正しく計算できることを確認する。
   */
  it("複雑な梱包結果のサポート率を正しく計算できる ―複数の下層 product が上層 product をサポート", () => {
    const wrappers = new packer.WrapperArray();
    // 幅を制限して、複数の product が横に並べやすくする
    wrappers.push(new packer.Wrapper("複雑梱包テスト箱", 1000, 40, 80, 25, 0, true));

    const instances = new packer.InstanceArray();
    // 小さい product を複数個
    instances.insert(instances.end(), 2, new packer.Product("小型_L", 10, 8, 10));
    instances.insert(instances.end(), 2, new packer.Product("小型_R", 10, 8, 10));
    // 大きい product
    instances.insert(instances.end(), 2, new packer.Product("中型", 18, 8, 18));

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBeGreaterThan(0);

    let totalPacked = 0;
    const supportRatios: Array<{ name: string; ratio: number }> = [];

    for (let i = 0; i < result.size(); i++) {
      const wrapper = result.at(i) as packer.Wrapper;
      expect(wrapper.getStableMode()).toBe(true);
      totalPacked += wrapper.size();

      // 梱包配置をログ出力（デバッグ用）
      const wraps: packer.Wrap[] = [];
      for (let j = 0; j < wrapper.size(); j++) {
        wraps.push(wrapper.at(j) as packer.Wrap);
      }
      wraps.sort((a, b) => a.getY() - b.getY());

      console.log(`\n=== Wrapper ${i + 1} の梱包配置 ===`);
      wraps.forEach((wrap, idx) => {
        console.log(
          `  ${idx}: ${wrap.getInstance().getName()}` +
            `(${wrap.getLayoutWidth()}×${wrap.getLayoutHeight()}×${wrap.getLength()})` +
            ` @ (${wrap.getX().toFixed(1)}, ${wrap.getY().toFixed(1)}, ${wrap.getZ().toFixed(1)})`,
        );
      });

      // 検証関数を実行
      const { isValid, violations, validationDetails } =
        validateStabilityConstraints(wrapper);

      // すべて 70% ルールを守っていることを確認
      expect(isValid).toBe(true);
      expect(violations.length).toBe(0);

      // 各 product のサポート率を抽出
      if (validationDetails) {
        validationDetails.forEach((detail) => {
          const match = detail.match(
            /(.+?)\(.+?\) .*?サポート率 ([\d.]+)%/,
          );
          if (match) {
            const name = match[1];
            const ratio = parseFloat(match[2]);
            supportRatios.push({ name, ratio });
          }
        });

        console.log("\n検証結果:");
        console.log(validationDetails.join("\n"));
      }
    }

    expect(totalPacked).toBe(6);

    // サポート率の統計
    console.log("\n=== サポート率の統計 ===");
    const ratios = supportRatios.map((r) => r.ratio);
    console.log(`  最小値: ${Math.min(...ratios).toFixed(1)}%`);
    console.log(`  最大値: ${Math.max(...ratios).toFixed(1)}%`);
    console.log(
      `  70%-100% の product: ${supportRatios.length} 個`,
    );

    // 検証関数が存在し、70% ルールを検証できていることを確認
    expect(supportRatios.length).toBeGreaterThan(0);
    supportRatios.forEach(({ ratio }) => {
      expect(ratio).toBeGreaterThanOrEqual(70);
    });
  });

  /**
   * 段階的なサイズの多数の product を梱包し、
   * 検証関数がすべての product のサポート率を正しく計算できることを確認。
   */
  it("多数の product のサポート率を全て正しく計算できる", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("多数梱包テスト", 1000, 30, 100, 30, 0, true));

    const instances = new packer.InstanceArray();
    // 10 個の段階的サイズ product
    const sizes = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11];
    sizes.forEach((size, idx) => {
      instances.insert(
        instances.end(),
        1,
        new packer.Product(`P_${idx}`, size, 6, size),
      );
    });

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBeGreaterThan(0);

    let totalPacked = 0;
    let reportedCount = 0;

    for (let i = 0; i < result.size(); i++) {
      const wrapper = result.at(i) as packer.Wrapper;
      expect(wrapper.getStableMode()).toBe(true);
      totalPacked += wrapper.size();

      const { isValid, violations, validationDetails } =
        validateStabilityConstraints(wrapper);

      // 70% ルール違反がないことを確認
      expect(isValid).toBe(true);
      expect(violations.length).toBe(0);

      // 各 product のサポート率が報告されることを確認
      if (validationDetails) {
        reportedCount += validationDetails.length;
        validationDetails.forEach((detail) => {
          // サポート率が 70% ～ 100% の範囲であることを確認
          const match = detail.match(/サポート率 ([\d.]+)%/);
          expect(match).not.toBeNull();
          if (match) {
            const ratio = parseFloat(match[1]);
            expect(ratio).toBeGreaterThanOrEqual(70);
            expect(ratio).toBeLessThanOrEqual(100);
          }
        });
      }
    }

    expect(totalPacked).toBe(10);

    // 底面（Y ≈ 0）以外のすべての product についてサポート率が報告されることを確認
    // 最低でも 1 個以上の product のサポート率が報告されることを確認
    console.log(`\n報告されたサポート率: ${reportedCount} 個`);
    expect(reportedCount).toBeGreaterThan(0);
  });

  /**
   * wrapper 底面の product はサポート率が報告されないことを確認
   * （底面の product は常に安定しているため、チェック不要）
   */
  it("底面の product はサポート率チェック対象外", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("底面チェック", 1000, 25, 30, 25, 0, true));

    const instances = new packer.InstanceArray();
    // 底面に置かれる product
    instances.insert(instances.end(), 1, new packer.Product("底", 20, 6, 20));

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBe(1);

    const wrapper = result.at(0) as packer.Wrapper;
    const { violations, validationDetails } = validateStabilityConstraints(wrapper);

    // 底面の product なので違反はない
    expect(violations.length).toBe(0);

    // 底面の product はサポート率が報告されない（Y ≈ 0 なため）
    if (validationDetails) {
      expect(validationDetails.length).toBe(0);
    }
  });
});

// =============================================
// 4. 安定モードのサポート率が100%未満になるケースの検証
//
// 100x60x200 の wrapper に 70x20x200 と 100x20x150 の product を
// 入れると、上に載る product のサポート率が100%未満になることを確認する。
// =============================================

describe("安定モードのサポート率 100%未満ケース検証", () => {
  it("70x20x200 と 100x20x150 を 100x60x200 の wrapper に入れるとサポート率 < 100% のアイテムが存在する", () => {
    const wrappers = new packer.WrapperArray();
    // Wrapper: W=100, H=60, D=200, thickness=0, stableMode=true
    wrappers.push_back(new packer.Wrapper("安定テスト箱", 1000, 100, 60, 200, 0, true));

    const instances = new packer.InstanceArray();
    // Product 1: W=70, H=20, D=200
    instances.insert(instances.end(), 1, new packer.Product("product-70x20x200", 70, 20, 200));
    // Product 2: W=100, H=20, D=150
    instances.insert(instances.end(), 1, new packer.Product("product-100x20x150", 100, 20, 150));

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBe(1);

    const wrapper = result.at(0) as packer.Wrapper;

    // 梱包されたアイテムを取得
    const wraps: packer.Wrap[] = [];
    for (let i = 0; i < wrapper.size(); i++) {
      wraps.push(wrapper.at(i) as packer.Wrap);
    }

    // 2つの product が梱包されていることを確認
    expect(wraps.length).toBe(2);

    // Y > 0 の各アイテムについてサポート率を算出し、100%未満のものがあることを確認
    wraps.sort((a, b) => a.getY() - b.getY());

    console.log("\n=== 70x20x200 x1 + 100x20x150 x1 の梱包配置 ===");
    wraps.forEach((wrap, idx) => {
      console.log(
        `  ${idx}: ${wrap.getInstance().getName()}` +
          `(${wrap.getLayoutWidth()}×${wrap.getLayoutHeight()}×${wrap.getLength()})` +
          ` @ (${wrap.getX().toFixed(1)}, ${wrap.getY().toFixed(1)}, ${wrap.getZ().toFixed(1)})`,
      );
    });

    const ratiosBelow100: Array<{ name: string; ratio: number }> = [];

    for (const upper of wraps) {
      const upperY = upper.getY();
      if (upperY < 0.01) continue; // 底面は検査対象外

      const supportingBoxes: Array<{ x1: number; x2: number; z1: number; z2: number }> = [];
      for (const lower of wraps) {
        if (lower === upper) continue;
        const lowerTop = lower.getY() + lower.getLayoutHeight();
        if (Math.abs(lowerTop - upperY) >= 0.01) continue;

        supportingBoxes.push({
          x1: lower.getX(),
          x2: lower.getX() + lower.getLayoutWidth(),
          z1: lower.getZ(),
          z2: lower.getZ() + lower.getLength(),
        });
      }

      const ratio = packer.calculateSupportRatio(
        upper.getX(),
        upper.getZ(),
        upper.getLayoutWidth(),
        upper.getLength(),
        supportingBoxes,
      );

      // getSupportRatio() で取得した値と比較して等価性を確認
      const storedRatio = upper.getSupportRatio();
      expect(storedRatio).toBeCloseTo(ratio, 5); // 小数点以下5桁まで一致を確認

      console.log(
        `  ${upper.getInstance().getName()}` +
          `(x=${upper.getX().toFixed(1)}, y=${upperY.toFixed(1)}, z=${upper.getZ().toFixed(1)}) ` +
          `サポート率 ${(ratio * 100).toFixed(1)}% (stored: ${(storedRatio * 100).toFixed(1)}%)`,
      );

      if (ratio < 1.0 - 0.001) {
        ratiosBelow100.push({
          name: upper.getInstance().getName(),
          ratio,
        });
      }
    }

    // サポート率が100%未満のアイテムが少なくとも1つ存在する
    expect(ratiosBelow100.length).toBeGreaterThanOrEqual(1);
    for (const item of ratiosBelow100) {
      expect(item.ratio).toBeLessThan(1.0);
      expect(item.ratio).toBeGreaterThanOrEqual(0.7); // 安定モードの最低サポート率は70%
    }
  });

  it("70x20x200 x2 と 100x20x150 x1 を 100x60x200 の wrapper に入れるとサポート率 < 100% のアイテムが存在する", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push_back(new packer.Wrapper("安定テスト箱", 1000, 100, 60, 200, 0, true));

    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 2, new packer.Product("product-70x20x200", 70, 20, 200));
    instances.insert(instances.end(), 1, new packer.Product("product-100x20x150", 100, 20, 150));

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBe(1);

    const wrapper = result.at(0) as packer.Wrapper;

    const wraps: packer.Wrap[] = [];
    for (let i = 0; i < wrapper.size(); i++) {
      wraps.push(wrapper.at(i) as packer.Wrap);
    }

    expect(wraps.length).toBe(3);

    wraps.sort((a, b) => a.getY() - b.getY());

    console.log("\n=== 70x20x200 x2 + 100x20x150 x1 の梱包配置 ===");
    wraps.forEach((wrap, idx) => {
      console.log(
        `  ${idx}: ${wrap.getInstance().getName()}` +
          `(${wrap.getLayoutWidth()}×${wrap.getLayoutHeight()}×${wrap.getLength()})` +
          ` @ (${wrap.getX().toFixed(1)}, ${wrap.getY().toFixed(1)}, ${wrap.getZ().toFixed(1)})`,
      );
    });

    const ratiosBelow100: Array<{ name: string; ratio: number }> = [];

    for (const upper of wraps) {
      const upperY = upper.getY();
      if (upperY < 0.01) continue;

      const supportingBoxes: Array<{ x1: number; x2: number; z1: number; z2: number }> = [];
      for (const lower of wraps) {
        if (lower === upper) continue;
        const lowerTop = lower.getY() + lower.getLayoutHeight();
        if (Math.abs(lowerTop - upperY) >= 0.01) continue;

        supportingBoxes.push({
          x1: lower.getX(),
          x2: lower.getX() + lower.getLayoutWidth(),
          z1: lower.getZ(),
          z2: lower.getZ() + lower.getLength(),
        });
      }

      const ratio = packer.calculateSupportRatio(
        upper.getX(),
        upper.getZ(),
        upper.getLayoutWidth(),
        upper.getLength(),
        supportingBoxes,
      );

      // getSupportRatio() で取得した値と比較して等価性を確認
      const storedRatio = upper.getSupportRatio();
      expect(storedRatio).toBeCloseTo(ratio, 5);

      console.log(
        `  ${upper.getInstance().getName()}` +
          `(x=${upper.getX().toFixed(1)}, y=${upperY.toFixed(1)}, z=${upper.getZ().toFixed(1)}) ` +
          `サポート率 ${(ratio * 100).toFixed(1)}% (stored: ${(storedRatio * 100).toFixed(1)}%)`,
      );

      if (ratio < 1.0 - 0.001) {
        ratiosBelow100.push({
          name: upper.getInstance().getName(),
          ratio,
        });
      }
    }

    expect(ratiosBelow100.length).toBeGreaterThanOrEqual(1);
    for (const item of ratiosBelow100) {
      expect(item.ratio).toBeLessThan(1.0);
      expect(item.ratio).toBeGreaterThanOrEqual(0.7);
    }
  });

  it("70x20x200 x1 と 100x20x150 x2 を 100x60x200 の wrapper に入れるとサポート率 < 100% のアイテムが存在する", () => {
    const wrappers = new packer.WrapperArray();
    wrappers.push_back(new packer.Wrapper("安定テスト箱", 1000, 100, 60, 200, 0, true));

    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 1, new packer.Product("product-70x20x200", 70, 20, 200));
    instances.insert(instances.end(), 2, new packer.Product("product-100x20x150", 100, 20, 150));

    const result = new packer.Packer(wrappers, instances).optimize();
    expect(result.size()).toBe(1);

    const wrapper = result.at(0) as packer.Wrapper;

    const wraps: packer.Wrap[] = [];
    for (let i = 0; i < wrapper.size(); i++) {
      wraps.push(wrapper.at(i) as packer.Wrap);
    }

    expect(wraps.length).toBe(3);

    wraps.sort((a, b) => a.getY() - b.getY());

    console.log("\n=== 70x20x200 x1 + 100x20x150 x2 の梱包配置 ===");
    wraps.forEach((wrap, idx) => {
      console.log(
        `  ${idx}: ${wrap.getInstance().getName()}` +
          `(${wrap.getLayoutWidth()}×${wrap.getLayoutHeight()}×${wrap.getLength()})` +
          ` @ (${wrap.getX().toFixed(1)}, ${wrap.getY().toFixed(1)}, ${wrap.getZ().toFixed(1)})`,
      );
    });

    const ratiosBelow100: Array<{ name: string; ratio: number }> = [];

    for (const upper of wraps) {
      const upperY = upper.getY();
      if (upperY < 0.01) continue;

      const supportingBoxes: Array<{ x1: number; x2: number; z1: number; z2: number }> = [];
      for (const lower of wraps) {
        if (lower === upper) continue;
        const lowerTop = lower.getY() + lower.getLayoutHeight();
        if (Math.abs(lowerTop - upperY) >= 0.01) continue;

        supportingBoxes.push({
          x1: lower.getX(),
          x2: lower.getX() + lower.getLayoutWidth(),
          z1: lower.getZ(),
          z2: lower.getZ() + lower.getLength(),
        });
      }

      const ratio = packer.calculateSupportRatio(
        upper.getX(),
        upper.getZ(),
        upper.getLayoutWidth(),
        upper.getLength(),
        supportingBoxes,
      );

      // getSupportRatio() で取得した値と比較して等価性を確認
      const storedRatio = upper.getSupportRatio();
      expect(storedRatio).toBeCloseTo(ratio, 5);

      console.log(
        `  ${upper.getInstance().getName()}` +
          `(x=${upper.getX().toFixed(1)}, y=${upperY.toFixed(1)}, z=${upper.getZ().toFixed(1)}) ` +
          `サポート率 ${(ratio * 100).toFixed(1)}% (stored: ${(storedRatio * 100).toFixed(1)}%)`,
      );

      if (ratio < 1.0 - 0.001) {
        ratiosBelow100.push({
          name: upper.getInstance().getName(),
          ratio,
        });
      }
    }

    expect(ratiosBelow100.length).toBeGreaterThanOrEqual(1);
    for (const item of ratiosBelow100) {
      expect(item.ratio).toBeLessThan(1.0);
      expect(item.ratio).toBeGreaterThanOrEqual(0.7);
    }
  });
});

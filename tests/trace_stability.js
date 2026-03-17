// Detailed trace of stability placement for failing test case
const packer = require("../dist/3d-bin-packing/3d-bin-packing.js");

function traceStability() {
    const wrappers = new packer.WrapperArray();
    wrappers.push(new packer.Wrapper("安定特大箱", 2000, 40, 30, 40, 0, true));

    const instances = new packer.InstanceArray();
    instances.insert(instances.end(), 1, new packer.Product("大基台", 20, 10, 25));
    instances.insert(instances.end(), 2, new packer.Product("L型", 15, 10, 12));
    instances.insert(instances.end(), 3, new packer.Product("正方", 10, 10, 10));
    instances.insert(instances.end(), 2, new packer.Product("長方", 8, 10, 15));
    instances.insert(instances.end(), 4, new packer.Product("小立方", 6, 10, 6));
    instances.insert(instances.end(), 3, new packer.Product("薄板", 12, 10, 4));

    const result = new packer.Packer(wrappers, instances).optimize();

    console.log("=== Placement results ===");
    for (let i = 0; i < result.size(); i++) {
        const wrapper = result.at(i);
        console.log(`Wrapper ${i}: ${wrapper.getName()} (${wrapper.getWidth()}x${wrapper.getHeight()}x${wrapper.getLength()}) items=${wrapper.size()}`);
        
        const items = [];
        for (let j = 0; j < wrapper.size(); j++) {
            const wrap = wrapper.at(j);
            const inst = wrap.getInstance();
            items.push({
                name: inst.getName(),
                x: wrap.getX(),
                y: wrap.getY(),
                z: wrap.getZ(),
                lw: wrap.getLayoutWidth(),
                lh: wrap.getLayoutHeight(),
                ll: wrap.getLength(),
                x2: wrap.getX() + wrap.getLayoutWidth(),
                y2: wrap.getY() + wrap.getLayoutHeight(),
                z2: wrap.getZ() + wrap.getLength()
            });
        }
        
        // Sort by Y, then X, then Z
        items.sort((a, b) => a.y - b.y || a.x - b.x || a.z - b.z);
        
        for (const item of items) {
            console.log(`  ${item.name.padEnd(8)} pos(${item.x.toFixed(1)}, ${item.y.toFixed(1)}, ${item.z.toFixed(1)}) -> (${item.x2.toFixed(1)}, ${item.y2.toFixed(1)}, ${item.z2.toFixed(1)})  size ${item.lw}x${item.lh}x${item.ll}`);
        }
        
        // Check stability
        console.log("\n=== Stability Analysis ===");
        for (const upper of items) {
            if (upper.y < 0.01) continue; // Skip bottom items
            
            console.log(`\n  Checking: ${upper.name} at Y=${upper.y.toFixed(1)}  X[${upper.x.toFixed(1)}-${upper.x2.toFixed(1)}] Z[${upper.z.toFixed(1)}-${upper.z2.toFixed(1)}]`);
            
            let totalSupportArea = 0;
            const boxArea = upper.lw * upper.ll;
            let foundAnyBelow = false;
            
            for (const lower of items) {
                if (lower === upper) continue;
                const lowerTop = lower.y + lower.lh;
                
                if (Math.abs(lowerTop - upper.y) < 0.01) {
                    foundAnyBelow = true;
                    // Calculate overlap
                    const ox1 = Math.max(upper.x, lower.x);
                    const ox2 = Math.min(upper.x2, lower.x2);
                    const oz1 = Math.max(upper.z, lower.z);
                    const oz2 = Math.min(upper.z2, lower.z2);
                    
                    if (ox1 < ox2 && oz1 < oz2) {
                        const area = (ox2 - ox1) * (oz2 - oz1);
                        totalSupportArea += area;
                        const xWithin = upper.x >= lower.x - 0.01 && upper.x2 <= lower.x2 + 0.01;
                        const zWithin = upper.z >= lower.z - 0.01 && upper.z2 <= lower.z2 + 0.01;
                        console.log(`    Below: ${lower.name} top=${lowerTop.toFixed(1)} X[${lower.x.toFixed(1)}-${lower.x2.toFixed(1)}] Z[${lower.z.toFixed(1)}-${lower.z2.toFixed(1)}] overlap=${area.toFixed(1)} xWithin=${xWithin} zWithin=${zWithin}`);
                    }
                }
            }
            
            const ratio = totalSupportArea / boxArea;
            console.log(`    Support ratio: ${totalSupportArea.toFixed(1)}/${boxArea.toFixed(1)} = ${(ratio*100).toFixed(1)}% (need 70%)`);
            console.log(`    Algorithm would: ${ratio >= 0.7 ? "ACCEPT" : "REJECT"}`);
            console.log(`    Test requires: fully within one support box`);
        }
    }
}

traceStability();

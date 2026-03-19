"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tstl_1 = __importDefault(require("tstl"));
// Namespace objects
const boxologic = {};
const bws = { packer: {} };
const packer = bws.packer;
// ===== Protocol classes =====
// Entity: plain base class
class Entity {
    key() { return ""; }
}
// EntityArray: extends std.Vector + event emitter
class EntityArray extends tstl_1.default.Vector {
    constructor() { super(); this._listeners = null; }
    key() { return ""; }
    addEventListener(type, listener, thisArg) {
        if (!this._listeners)
            this._listeners = {};
        if (!this._listeners[type])
            this._listeners[type] = [];
        this._listeners[type].push({ listener: listener, thisArg: thisArg });
    }
    removeEventListener(type, listener, thisArg) {
        if (!this._listeners || !this._listeners[type])
            return;
        this._listeners[type] = this._listeners[type].filter(function (e) {
            return e.listener !== listener || e.thisArg !== thisArg;
        });
    }
    _dispatchEvent(type, event) {
        if (!this._listeners || !this._listeners[type])
            return;
        var entries = this._listeners[type].slice();
        for (var i = 0; i < entries.length; i++)
            entries[i].listener.call(entries[i].thisArg, event);
    }
    push_back(val) {
        var ret = super.push_back(val);
        this._dispatchEvent("insert", { first: this.end().prev(), last: this.end() });
        return ret;
    }
    erase(first, last) {
        var ret = super.erase(first, last);
        this._dispatchEvent("erase", { first: first, last: last !== undefined ? last : first });
        return ret;
    }
}
// EntityArrayCollection: extends std.Vector + event emitter
class EntityArrayCollection extends tstl_1.default.Vector {
    constructor() { super(); this._listeners = null; }
    key() { return ""; }
    addEventListener(type, listener, thisArg) {
        if (!this._listeners)
            this._listeners = {};
        if (!this._listeners[type])
            this._listeners[type] = [];
        this._listeners[type].push({ listener: listener, thisArg: thisArg });
    }
    removeEventListener(type, listener, thisArg) {
        if (!this._listeners || !this._listeners[type])
            return;
        this._listeners[type] = this._listeners[type].filter(function (e) {
            return e.listener !== listener || e.thisArg !== thisArg;
        });
    }
    _dispatchEvent(type, event) {
        if (!this._listeners || !this._listeners[type])
            return;
        var entries = this._listeners[type].slice();
        for (var i = 0; i < entries.length; i++)
            entries[i].listener.call(entries[i].thisArg, event);
    }
    push_back(val) {
        var ret = super.push_back(val);
        this._dispatchEvent("insert", { first: this.end().prev(), last: this.end() });
        return ret;
    }
    erase(first, last) {
        var ret = super.erase(first, last);
        this._dispatchEvent("erase", { first: first, last: last !== undefined ? last : first });
        return ret;
    }
}
// EntityDeque: extends std.Deque + event emitter
class EntityDeque extends tstl_1.default.Deque {
    constructor() { super(); this._listeners = null; }
    key() { return ""; }
    addEventListener(type, listener, thisArg) {
        if (!this._listeners)
            this._listeners = {};
        if (!this._listeners[type])
            this._listeners[type] = [];
        this._listeners[type].push({ listener: listener, thisArg: thisArg });
    }
    removeEventListener(type, listener, thisArg) {
        if (!this._listeners || !this._listeners[type])
            return;
        this._listeners[type] = this._listeners[type].filter(function (e) {
            return e.listener !== listener || e.thisArg !== thisArg;
        });
    }
    _dispatchEvent(type, event) {
        if (!this._listeners || !this._listeners[type])
            return;
        var entries = this._listeners[type].slice();
        for (var i = 0; i < entries.length; i++)
            entries[i].listener.call(entries[i].thisArg, event);
    }
    push_back(val) {
        var ret = super.push_back(val);
        this._dispatchEvent("insert", { first: this.end().prev(), last: this.end() });
        return ret;
    }
    erase(first, last) {
        var ret = super.erase(first, last);
        this._dispatchEvent("erase", { first: first, last: last !== undefined ? last : first });
        return ret;
    }
}
packer.library = {};
packer.protocol = { Entity, EntityArray, EntityArrayCollection, EntityDeque };
// ===== _Test function =====
function _Test() {
    ///////////////////////////
    // CONSTRUCT OBJECTS
    ///////////////////////////
    var wrapperArray = new packer.WrapperArray();
    var instanceArray = new packer.InstanceArray();
    // Wrappers
    wrapperArray.push(new packer.Wrapper("Large", 1000, 40, 40, 15, 0), new packer.Wrapper("Medium", 700, 20, 20, 10, 0), new packer.Wrapper("Small", 500, 15, 15, 8, 0));
    ///////
    // Each Instance is repeated #15
    ///////
    instanceArray.insert(instanceArray.end(), 15, new packer.Product("Eraser", 1, 2, 5));
    instanceArray.insert(instanceArray.end(), 15, new packer.Product("Book", 15, 30, 3));
    instanceArray.insert(instanceArray.end(), 15, new packer.Product("Drink", 3, 3, 10));
    instanceArray.insert(instanceArray.end(), 15, new packer.Product("Umbrella", 5, 5, 20));
    // Wrappers also can be packed into another Wrapper.
    instanceArray.insert(instanceArray.end(), 15, new packer.Wrapper("Notebook-Box", 2000, 30, 40, 4, 2));
    instanceArray.insert(instanceArray.end(), 15, new packer.Wrapper("Tablet-Box", 2500, 20, 28, 2, 0));
    ///////////////////////////
    // BEGINS PACKING
    ///////////////////////////
    // CONSTRUCT PACKER
    var my_packer = new packer.Packer(wrapperArray, instanceArray);
    ///////
    // PACK (OPTIMIZE)
    var result = my_packer.optimize();
    ///////
    ///////////////////////////
    // TRACE PACKING RESULT
    ///////////////////////////
    console.log("Packing done. Wrappers used: " + result.size());
}
packer._Test = _Test;
// ===== boxologic classes =====
/**
 * <p> An abstract instance of boxologic. </p>
 *
 * <p> {@link st_Instance} represents a physical, tangible instance of 3-dimension. </p>
 *
 * @author Jeongho Nam <http://samchon.org>
 */
class Instance {
    /**
     * Construct from size members.
     *
     * @param width Width, length on the X-axis in 3D.
     * @param height Height, length on the Y-axis in 3D.
     * @param length Length, length on the Z-axis in 3D.
     */
    constructor(width, height, length) {
        // INIT MEMBERS
        this.width = width;
        this.height = height;
        this.length = length;
        // INIT LAYOUTS
        this.layout_width = width;
        this.layout_height = height;
        this.layout_length = length;
        // DERIVED PROPERTY; VOLUME
        this.volume = width * height * length;
    }
}
boxologic.Instance = Instance;
/**
 * A box, trying to pack into a {@link Pallet}.
 *
 * @author Bill Knechtel, <br>
 *		   Migrated and Refactored by Jeongho Nam <http://samchon.org>
 */
class Box extends boxologic.Instance {
    /**
     * Construct from an instance.
     *
     * @param instance An instance adapts with.
     */
    constructor(instance) {
        super(instance.getWidth(), instance.getHeight(), instance.getLength());
        this.overlapped_boxes = new tstl_1.default.HashSet();
        this.cox = 0;
        this.coy = 0;
        this.coz = 0;
        this.is_packed = false;
        this.rotationMode = (typeof instance.getRotationMode === 'function') ? instance.getRotationMode() : "all";
    }
    hit_test(obj) {
        return (this.cox == obj.cox && this.coy == obj.coy && this.coz == obj.coy)
            || (this.hit_test_single(obj) == false && obj.hit_test_single(this) == false);
    }
    hit_test_single(obj) {
        return this.hit_test_point(obj.cox, obj.coy, obj.coz)
            || this.hit_test_point(obj.cox + obj.layout_width, obj.coy, obj.coz)
            || this.hit_test_point(obj.cox, obj.coy + obj.layout_height, obj.coz)
            || this.hit_test_point(obj.cox, obj.coy, obj.coz + obj.layout_length)
            || this.hit_test_point(obj.cox + obj.layout_width, obj.coy + obj.layout_height, obj.coz)
            || this.hit_test_point(obj.cox + obj.layout_width, obj.coy, obj.coz + obj.layout_length)
            || this.hit_test_point(obj.cox, obj.coy + obj.layout_height, obj.coz + obj.layout_length)
            || this.hit_test_point(obj.cox + obj.layout_width, obj.coy + obj.layout_height, obj.coz + obj.layout_length);
    }
    hit_test_point(x, y, z) {
        return this.cox < x && x < this.cox + this.layout_width
            && this.coy < y && y < this.coy + this.layout_height
            && this.coz < z && z < this.coz + this.layout_length;
    }
}
boxologic.Box = Box;
/**
 * <p> A set of programs that calculate the best fit for boxes on a pallet migrated from language C. </p>
 *
 * <ul>
 *	<li> Original Boxologic: https://github.com/exad/boxologic </li>
 * </ul>
 *
 * @author Bill Knechtel, <br>
 *		   Migrated and Refactored by Jeongho Nam <http://samchon.org>
 */
/**
 * <p> Shared utility function to calculate support ratio. </p>
 * <p> The support ratio is the percentage of a box's bottom face that is supported by boxes below it. </p>
 * <p> Used by both check_stability (during packing) and external validators (e.g., test code). </p>
 *
 * @param x X coordinate of the proposed placement
 * @param z Z coordinate of the proposed placement
 * @param width Width (X-dimension) of the box
 * @param length Length (Z-dimension) of the box
 * @param supportingBoxes Array of supporting box objects {x1, x2, z1, z2}
 * @return support ratio (0.0 to 1.0)
 */
var calculateSupportRatio = function (x, z, width, length, supportingBoxes) {
    var totalSupportArea = 0;
    var newBoxArea = width * length;
    var new_x1 = x;
    var new_x2 = x + width;
    var new_z1 = z;
    var new_z2 = z + length;
    for (var k = 0; k < supportingBoxes.length; k++) {
        var support = supportingBoxes[k];
        var overlap_x1 = Math.max(new_x1, support.x1);
        var overlap_x2 = Math.min(new_x2, support.x2);
        var overlap_z1 = Math.max(new_z1, support.z1);
        var overlap_z2 = Math.min(new_z2, support.z2);
        if (overlap_x1 < overlap_x2 && overlap_z1 < overlap_z2) {
            totalSupportArea += (overlap_x2 - overlap_x1) * (overlap_z2 - overlap_z1);
        }
    }
    return newBoxArea > 0 ? totalSupportArea / newBoxArea : 0;
};
/**
 * <p> A facade class of boxologic. </p>
 *
 * <p> The Boxologic class dudcts the best solution of packing boxes to a pallet. </p>
 *
 * <ul>
 *	<li> Reference: https://github.com/exad/boxologic </li>
 * </ul>
 *
 * @author Bill Knechtel, <br>
 *		   Migrated and Refactored by Jeongho Nam <http://samchon.org>
 */
class Boxologic {
    /* ===========================================================
        CONSTRUCTORS
            - CONSTRUCTOR
            - ENCODER & DECODER
    ==============================================================
        CONSTRUCTOR
    ----------------------------------------------------------- */
    /**
     * Construct from a wrapper and instances.
     *
     * @param wrapper A Wrapper to pack instances.
     * @param instanceArray Instances trying to put into the wrapper.
     */
    constructor(wrapper, instanceArray, options) {
        if (options === void 0) {
            options = { isNotUseBeamSearch: false };
        }
        this.wrapper = wrapper;
        this.instanceArray = instanceArray;
        this.leftInstances = new bws.packer.InstanceArray();
        this.options = options;
    }
    /* -----------------------------------------------------------
        ENCODER & DECODER
    ----------------------------------------------------------- */
    /**
     * <p> Encode data </p>
     *
     * <p> Encodes {@link bws.packer Packer}'s data to be suitable for the
     * {@link boxologic Boxologic}'s parametric data. </p>
     */
    encode() {
        /////////////////////////////////////
        // STRUCTURES
        /////////////////////////////////////
        this.pallet = new boxologic.Pallet(this.wrapper);
        this.box_array = new tstl_1.default.Vector();
        this.total_box_volume = 0.0;
        this.layer_map = new tstl_1.default.HashMap();
        this.scrap_list = new tstl_1.default.List();
        // STABLE MODE SETTING
        this.stableMode = this.wrapper.getStableMode();
        // CHILDREN ELEMENTS - BOX
        this.box_array.assign(this.instanceArray.size(), null);
        for (var i = 0; i < this.instanceArray.size(); i++) {
            var box = new boxologic.Box(this.instanceArray.at(i));
            // FORCE Y-AXIS ROTATION MODE IN STABLE MODE
            if (this.stableMode && box.rotationMode === "all") {
                box.rotationMode = "yAxis";
            }
            this.total_box_volume += box.volume;
            this.box_array.set(i, box);
        }
        // SCRAP_LIST
        this.scrap_list.push_back(new boxologic.Scrap());
        /////////////////////////////////////
        // BEST VARIABLES
        /////////////////////////////////////
        this.best_solution_volume = 0.0;
        this.packing_best = false;
        this.hundred_percent = false;
    }
    /**
     * <p> Decode data </p>
     *
     * <p> Decodes the Boxologic's optimization result data to be suitable for the Packer's own. </p>
     */
    decode() {
        this.wrapper.clear();
        this.leftInstances.clear();
        for (var i = 0; i < this.box_array.size(); i++) {
            var instance = this.instanceArray.at(i);
            var box = this.box_array.at(i);
            if (box.is_packed == true) {
                var wrap = new bws.packer.Wrap(this.wrapper, instance, box.cox, box.coy, box.coz);
                wrap.estimateOrientation(box.layout_width, box.layout_height, box.layout_length);
                if (this.wrapper.getThickness() != 0)
                    wrap.setPosition(wrap.getX() + this.wrapper.getThickness(), wrap.getY() + this.wrapper.getThickness(), wrap.getZ() + this.wrapper.getThickness());
                // Calculate support ratio for this wrap
                var supportingBoxes = [];
                var wrapY = wrap.getY();
                for (var j = 0; j < this.wrapper.size(); j++) {
                    var existingWrap = this.wrapper.at(j);
                    var lowerTop = existingWrap.getY() + existingWrap.getLayoutHeight();
                    // Check if the existing wrap is directly below this wrap (within 0.01 tolerance)
                    if (Math.abs(lowerTop - wrapY) < 0.01) {
                        supportingBoxes.push({
                            x1: existingWrap.getX(),
                            x2: existingWrap.getX() + existingWrap.getLayoutWidth(),
                            z1: existingWrap.getZ(),
                            z2: existingWrap.getZ() + existingWrap.getLength()
                        });
                    }
                }
                var supportRatio = calculateSupportRatio(wrap.getX(), wrap.getZ(), wrap.getLayoutWidth(), wrap.getLength(), supportingBoxes);
                wrap.setSupportRatio(supportRatio);
                this.wrapper.push_back(wrap);
            }
            else {
                // NOT WRAPED INSTANCES BY LACK OF VOLUME
                this.leftInstances.push_back(instance);
            }
        }
    }
    /* ===========================================================
        MAIN PROCEDURES
            - OPERATORS
            - CHECKERS
            - GETTERS
            - REPORTERS
    ==============================================================
        OPERATORS
    ------------------------------------------------------------ */
    /**
     * <p> Pack instances to the {@link wrapper}. </p>
     *
     * <p> The {@link Boxologic.pack} is an adaptor method between {@link bws.packer Packer} and
     * {@link boxologic}. It encodes data from {@link bws.packer Packer}, deducts the best packing
     * solution decodes the optimization result and returns it. </p>
     *
     * <p> The optimization result is returned as a {@link Pair} like below: </p>
     * <ul>
     *	<li> first: The {@link wrapper} with packed instances. </li>
     *	<li> second: {@link leftInstances Left instances failed to pack} by overloading. </li>
     * </ul>
     *
     * @return A pair of {@link wrapper} with packed instances and
     *		   {@link leftInstances instances failed to pack} by overloading.
     */
    pack() {
        this.encode();
        this.iterate_orientations();
        this.report_results();
        this.decode();
        return new tstl_1.default.Pair(this.wrapper, this.leftInstances);
    }
    /**
     * <p> Execute iterations by calling proper functions. </p>
     *
     * <p> Iterations are done and parameters of the best solution are found. </p>
     */
    iterate_orientations() {
        // When any box has yAxis rotation mode, restricting pallet orientations to 1 and 2
        // (only those that keep the pallet's Y axis as the height axis).
        // Orientations 3-6 permute the pallet's Y axis to X or Z, which would violate
        // the "height stays fixed" constraint of yAxis-mode boxes after write_box_file's
        // axis remapping.
        var hasYAxisBox = false;
        for (var _i = 0; _i < this.box_array.size(); _i++) {
            if (this.box_array.at(_i).rotationMode === "yAxis") {
                hasYAxisBox = true;
                break;
            }
        }
        // For yAxis boxes, use original constraint but improve layer algorithm elsewhere
        var maxOrientation = hasYAxisBox ? 2 : 6;
        for (var orientation_1 = 1; orientation_1 <= maxOrientation; orientation_1++) {
            this.pallet.set_orientation(orientation_1);
            // CONSTRUCT LAYERS
            this.construct_layers();
            // ITERATION IN LAYERS
            for (var it = this.layer_map.begin(); !it.equals(this.layer_map.end()); it = it.next()) {
                // BEGINS PACKING
                this.iterate_layer(it.first);
                if (this.packed_volume > this.best_solution_volume) {
                    // NEW VOLUME IS THE BEST
                    this.best_solution_volume = this.packed_volume;
                    this.best_orientation = orientation_1;
                    this.best_layer = it.first;
                }
                if (this.hundred_percent)
                    break; // SUCCESS TO UTILIZE ALL
            }
            if (this.hundred_percent)
                break; // SUCCESS TO UTILIZE ALL
            // IF THE PALLET IS REGULAR CUBE,
            if (this.pallet.width == this.pallet.height && this.pallet.height == this.pallet.length)
                orientation_1 = maxOrientation; // DON'T ITERATE ALL ORIENTATIONS
        }
    }
    /**
     * Iterate a layer.
     *
     * @param thickness Thickness of the iterating layer.
     */
    iterate_layer(thickness) {
        // ENHANCED GREEDY: Use beam search to avoid local optima
        // Beam search now supports stable mode with integrated stability checks
        if (!this.options.isNotUseBeamSearch && this.enhancedGreedyWithBeamSearch()) {
            return; // Use enhanced greedy algorithm
        }
        // INIT PACKED
        this.packing = true;
        this.packed_volume = 0.0;
        this.packed_layout_height = 0;
        this.layer_thickness = thickness;
        // SET REMAINS FROM PALLET'S DIMENSIONS
        this.remain_layout_height = this.pallet.layout_height;
        this.remain_layout_length = this.pallet.layout_length;
        // UNPACK ALL BOXES
        for (var i = 0; i < this.box_array.size(); i++)
            this.box_array.at(i).is_packed = false;
        do {
            // INIT VARS OF LAYER ITERATION
            this.layer_in_layer = 0;
            this.layer_done = false;
            // PACK_LAYER AND POST-PROCESS
            this.pack_layer();
            this.packed_layout_height += this.layer_thickness;
            this.remain_layout_height = this.pallet.layout_height - this.packed_layout_height;
            if (this.layer_in_layer != 0) {
                // STORE ORDINARY PACKING VARS
                var pre_packed_y = this.packed_layout_height;
                var pre_remain_py = this.remain_layout_height;
                // STORE CAUCLATED RESULTS
                this.remain_layout_height = this.layer_thickness - this.pre_layer;
                this.packed_layout_height -= this.layer_thickness + this.pre_layer;
                this.remain_layout_length = this.lilz;
                this.layer_thickness = this.layer_in_layer;
                // ITERATION IS NOT FINISHED YET
                this.layer_done = false;
                // RE-CALL PACK_LAYER
                this.pack_layer();
                // REVERT TO THE STORED ORDINARIES
                this.packed_layout_height = pre_packed_y;
                this.remain_layout_height = pre_remain_py;
                this.remain_layout_length = this.pallet.layout_length;
            }
            // CALL FIND_LAYER
            this.find_layer(this.remain_layout_height);
        } while (this.packing);
    }
    /**
     * <p> Enhanced greedy algorithm with beam search to avoid local optima </p>
     * <p> Explores multiple placement candidates and selects globally better solutions </p>
     */
    enhancedGreedyWithBeamSearch() {
        var beamWidth = 3; // Number of candidates to explore simultaneously
        var candidates = [];
        // Generate multiple initial placement candidates
        var layerIdx = 0;
        for (var it = this.layer_map.begin(); !it.equals(this.layer_map.end()) && layerIdx < beamWidth; it = it.next(), layerIdx++) {
            var layerThickness = it.first;
            var candidate = this.simulatePlacement(layerThickness);
            if (candidate && candidate.totalPacked > 0) {
                candidates.push(candidate);
            }
        }
        if (candidates.length === 0) {
            return false; // No valid candidates, use standard algorithm
        }
        // Select best candidate based on multiple criteria
        var self = this;
        var bestCandidate = candidates.reduce(function (best, current) {
            // Multi-criteria scoring: packed count + space efficiency + orientation preference + stability
            var stabilityWeight = self.stableMode ? 200 : 0;
            var currentScore = current.totalPacked * 1000 +
                current.spaceEfficiency * 100 +
                current.orientationBonus +
                (current.stabilityScore || 0) * stabilityWeight;
            var bestScore = best.totalPacked * 1000 +
                best.spaceEfficiency * 100 +
                best.orientationBonus +
                (best.stabilityScore || 0) * stabilityWeight;
            return currentScore > bestScore ? current : best;
        });
        // Apply the best candidate solution
        this.applyPlacementSolution(bestCandidate);
        return true;
    }
    /**
     * <p> Simulate placement for a given layer thickness and return metrics </p>
     */
    simulatePlacement(layerThickness) {
        // Save current state for rollback
        var savedBoxStates = [];
        for (var i = 0; i < this.box_array.size(); i++) {
            var box = this.box_array.at(i);
            savedBoxStates.push({
                is_packed: box.is_packed,
                cox: box.cox,
                coy: box.coy,
                coz: box.coz,
                layout_width: box.layout_width,
                layout_height: box.layout_height,
                layout_length: box.layout_length
            });
        }
        // Simulate packing with this layer thickness
        this.packing = true;
        this.packed_volume = 0.0;
        this.packed_layout_height = 0;
        this.layer_thickness = layerThickness;
        this.remain_layout_height = this.pallet.layout_height;
        this.remain_layout_length = this.pallet.layout_length;
        // Unpack all boxes for fresh simulation
        for (var ui = 0; ui < this.box_array.size(); ui++)
            this.box_array.at(ui).is_packed = false;
        var totalPacked = 0;
        var orientationBonus = 0;
        var stabilityScore = 0;
        var totalPlacements = 0;
        // Simplified packing simulation (basic layer filling)
        while (this.remain_layout_height >= this.layer_thickness) {
            var layerResult = this.simulateLayerPacking();
            if (layerResult.packed === 0)
                break;
            totalPacked += layerResult.packed;
            stabilityScore += layerResult.stablePlacements;
            totalPlacements += layerResult.packed;
            this.remain_layout_height -= this.layer_thickness;
        }
        // Calculate space efficiency and orientation preferences
        var spaceEfficiency = totalPacked > 0 ? (this.packed_volume / (this.pallet.layout_width * this.pallet.layout_height * this.pallet.layout_length)) : 0;
        // Bonus for preferred orientations (e.g., Y-axis rotation specific patterns)
        for (var i = 0; i < this.box_array.size(); i++) {
            var box = this.box_array.at(i);
            if (box.is_packed && box.rotationMode === "yAxis") {
                // Prefer wider orientations for Y-axis rotation
                if (box.layout_width > box.layout_length) {
                    orientationBonus += 10;
                }
            }
        }
        var result = {
            layerThickness: layerThickness,
            totalPacked: totalPacked,
            spaceEfficiency: spaceEfficiency,
            orientationBonus: orientationBonus,
            stabilityScore: totalPlacements > 0 ? stabilityScore / totalPlacements : 0,
            boxStates: []
        };
        // Store final box states for this candidate
        for (var i = 0; i < this.box_array.size(); i++) {
            var box = this.box_array.at(i);
            result.boxStates.push({
                is_packed: box.is_packed,
                cox: box.cox,
                coy: box.coy,
                coz: box.coz,
                layout_width: box.layout_width,
                layout_height: box.layout_height,
                layout_length: box.layout_length
            });
        }
        // Restore original state
        for (var i = 0; i < this.box_array.size(); i++) {
            var box = this.box_array.at(i);
            var saved = savedBoxStates[i];
            box.is_packed = saved.is_packed;
            box.cox = saved.cox;
            box.coy = saved.coy;
            box.coz = saved.coz;
            box.layout_width = saved.layout_width;
            box.layout_height = saved.layout_height;
            box.layout_length = saved.layout_length;
        }
        return result;
    }
    /**
     * <p> Simulate packing for a single layer </p>
     */
    simulateLayerPacking() {
        var packedInLayer = 0;
        var stablePlacements = 0;
        var currentX = 0;
        var currentZ = 0;
        while (currentX < this.pallet.layout_width && currentZ < this.remain_layout_length) {
            var bestBox = this.findBestBoxForPosition(currentX, currentZ);
            if (!bestBox)
                break;
            // In stable mode, verify stability before placing
            if (this.stableMode) {
                var isStable = this.check_stability(currentX, currentZ, bestBox.width, bestBox.length, this.packed_layout_height);
                if (!isStable) {
                    // Try advancing past this position without placing
                    currentX += 1;
                    if (currentX >= this.pallet.layout_width) {
                        currentX = 0;
                        currentZ += 1;
                    }
                    continue;
                }
                stablePlacements++;
            }
            else {
                stablePlacements++;
            }
            // Place the box (X-Z plane, Y = current layer height)
            bestBox.box.cox = currentX;
            bestBox.box.coy = this.packed_layout_height;
            bestBox.box.coz = currentZ;
            bestBox.box.layout_width = bestBox.width;
            bestBox.box.layout_height = bestBox.height;
            bestBox.box.layout_length = bestBox.length;
            bestBox.box.is_packed = true;
            this.packed_volume += bestBox.box.volume;
            packedInLayer++;
            // Advance in X, then wrap to next Z row
            currentX += bestBox.width;
            if (currentX >= this.pallet.layout_width) {
                currentX = 0;
                currentZ += bestBox.length;
            }
        }
        this.packed_layout_height += this.layer_thickness;
        return { packed: packedInLayer, stablePlacements: stablePlacements };
    }
    /**
     * <p> Find the best box that fits at the given position </p>
     */
    findBestBoxForPosition(x, z) {
        var availableWidth = this.pallet.layout_width - x; // X direction
        var availableLength = this.remain_layout_length - z; // Z direction
        var availableHeight = this.layer_thickness; // Y direction (layer thickness)
        var bestFit = null;
        var bestScore = -1;
        for (var i = 0; i < this.box_array.size(); i++) {
            var box = this.box_array.at(i);
            if (box.is_packed)
                continue;
            // Try different orientations based on rotation mode
            var orientations = this.getValidOrientations(box);
            for (var j = 0; j < orientations.length; j++) {
                var orient = orientations[j];
                // width -> X, height -> Y (layer), length -> Z
                if (orient.width <= availableWidth &&
                    orient.height <= availableHeight &&
                    orient.length <= availableLength) {
                    // Calculate fit score (prefer tight fits)
                    var score = 100 - (availableWidth - orient.width) - (availableLength - orient.length);
                    // Bonus for preferred Y-axis orientations
                    if (box.rotationMode === "yAxis" && orient.width > orient.length) {
                        score += 50;
                    }
                    if (score > bestScore) {
                        bestScore = score;
                        bestFit = {
                            box: box,
                            width: orient.width,
                            height: orient.height,
                            length: orient.length
                        };
                    }
                }
            }
        }
        return bestFit;
    }
    /**
     * <p> Get valid orientations for a box based on rotation mode </p>
     */
    getValidOrientations(box) {
        var orientations = [];
        var seen = {};
        function addOrientation(w, h, l) {
            var key = w + "," + h + "," + l;
            if (!seen[key]) {
                seen[key] = true;
                orientations.push({ width: w, height: h, length: l });
            }
        }
        // Original orientation
        addOrientation(box.width, box.height, box.length);
        if (box.rotationMode === "yAxis") {
            // Y-axis rotation: height stays fixed, swap width and length
            addOrientation(box.length, box.height, box.width);
        }
        else if (box.rotationMode === "all") {
            // All 6 permutations of (width, height, length)
            var w = box.width, h = box.height, l = box.length;
            addOrientation(w, h, l);
            addOrientation(w, l, h);
            addOrientation(h, w, l);
            addOrientation(h, l, w);
            addOrientation(l, w, h);
            addOrientation(l, h, w);
        }
        return orientations;
    }
    /**
     * <p> Apply the selected placement solution </p>
     */
    applyPlacementSolution(solution) {
        for (var i = 0; i < this.box_array.size(); i++) {
            var box = this.box_array.at(i);
            var state = solution.boxStates[i];
            box.is_packed = state.is_packed;
            box.cox = state.cox;
            box.coy = state.coy;
            box.coz = state.coz;
            box.layout_width = state.layout_width;
            box.layout_height = state.layout_height;
            box.layout_length = state.layout_length;
        }
        this.packed_volume = 0;
        for (var i = 0; i < this.box_array.size(); i++) {
            if (this.box_array.at(i).is_packed) {
                this.packed_volume += this.box_array.at(i).volume;
            }
        }
        this.packing = false;
    }
    /**
     * <p> Construct layers. </p>
     *
     * <p> Creates all possible layer heights by giving a weight value to each of them. </p>
     */
    construct_layers() {
        this.layer_map.clear();
        for (var i = 0; i < this.box_array.size(); i++) {
            var box = this.box_array.at(i);
            for (var j = 1; j <= 3; j++) {
                // For yAxis rotation mode, prioritize height dimension (j==2) over length (j==3)
                // For none rotation mode, only height dimension (j==2) is valid
                if (box.rotationMode === "none" && j !== 2)
                    continue;
                if (box.rotationMode === "yAxis" && j === 1)
                    continue; // Only restrict width dimension for yAxis
                // For Y-axis rotation, strongly prefer height dimension (130mm) over length (31mm)
                if (box.rotationMode === "yAxis" && j === 3) {
                    // For Y-axis rotation, skip length dimension (31mm) entirely to force 130mm layers
                    continue;
                }
                var ex_dim = void 0; // STANDARD LENGTH ON THE DIMENSION
                var dimen2 = void 0; // THE SECOND, LENGTH ON A RESIDUAL DIMENSION
                var dimen3 = void 0; // THE THIRD, LENGTH ON A RESIDUAL DIMENSION
                var layer_eval = 0; // SUM OF LAYERS (height)
                // FETCH STANDARD DIMENSIONS FROM EACH AXIS
                switch (j) {
                    case 1:
                        ex_dim = box.width;
                        dimen2 = box.height;
                        dimen3 = box.length;
                        break;
                    case 2:
                        ex_dim = box.height;
                        dimen2 = box.width;
                        dimen3 = box.length;
                        break;
                    case 3:
                        ex_dim = box.length;
                        dimen2 = box.width;
                        dimen3 = box.height;
                        break;
                }
                // A DIMENSIONAL LENGTH IS GREATER THAN THE PALLET ?
                if (ex_dim > this.pallet.layout_height ||
                    ((dimen2 > this.pallet.layout_width || dimen3 > this.pallet.layout_length) &&
                        (dimen3 > this.pallet.layout_width || dimen2 > this.pallet.layout_length))) {
                    // A DIMENSIONAL LENGTH IS GREATER THAN THE PALLET
                    continue;
                }
                // WHEN A DUPLICATED LAYER EXISTS, SKIPS
                if (this.layer_map.has(ex_dim) == true)
                    continue;
                // ABOUT ALL BOXES, FIND THE MINIMUM LENGTH OF GAP ~,
                // STACK ON THE CURRENT LAYER (ADD ON TO THE LAYER_EVAL)
                for (var k = 0; k < this.box_array.size(); k++) {
                    // SAME INSTANCE WITH THE SAME INDEX
                    if (i == k)
                        continue;
                    var my_box = this.box_array.at(k);
                    var dim_diff = Math.min(Math.abs(ex_dim - my_box.width), Math.abs(ex_dim - my_box.height), Math.abs(ex_dim - my_box.length));
                    layer_eval += dim_diff;
                }
                // RECORD THE SUM
                this.layer_map.set(ex_dim, layer_eval);
            }
        }
    }
    /**
     * <p> Packs the boxes found and arranges all variables and records properly. </p>
     *
     * <p> Update the linked list and the Boxlist[] array as a box is packed. </p>
     */
    pack_layer() {
        if (this.layer_thickness == 0) {
            this.packing = false;
            return;
        }
        else if (this.scrap_list.empty() == true)
            return;
        var lenx;
        var lenz;
        var lpz;
        this.scrap_list.begin().value.cumx = this.pallet.layout_width;
        this.scrap_list.begin().value.cumz = 0;
        while (true) {
            // INIT SCRAP_MIN_Z
            this.find_smallest_z();
            // FETCH LEFT AND RIGHT OF SCRAP_MIN_Z
            var prev = this.scrap_min_z.prev();
            var next = this.scrap_min_z.next();
            if (this.scrap_min_z.equals(this.scrap_list.end())) {
                break;
            }
            if (prev.equals(this.scrap_list.end()) && next.equals(this.scrap_list.end())) {
                /////////////////////////////////////////////////////////
                // NO LEFT AND RIGHT
                /////////////////////////////////////////////////////////
                //*** SITUATION-1: NO BOXES ON THE RIGHT AND LEFT SIDES ***
                lenx = this.scrap_min_z.value.cumx;
                lpz = this.remain_layout_length - this.scrap_min_z.value.cumz;
                // CALL FIND_BOX AND CHECK_FOUND
                this.find_box(lenx, this.layer_thickness, this.remain_layout_height, lpz, lpz);
                this.check_found();
                // BREAK ?
                if (this.layer_done)
                    break;
                if (this.evened)
                    continue;
                // UPDATE CURRENT BOX
                var box = this.box_array.at(this.cboxi);
                box.cox = 0;
                box.coy = this.packed_layout_height;
                box.coz = this.scrap_min_z.value.cumz;
                if (this.cbox_layout_width == this.scrap_min_z.value.cumx) {
                    // CUMULATE
                    this.scrap_min_z.value.cumz += this.cbox_layout_length;
                }
                else {
                    // CREATE A NEW NODE AND IT'S THE NEW MIN_Z
                    // ORDINARY MIN_Z WILL BE SHIFTED TO THE RIGHT
                    var scrap = new boxologic.Scrap(this.cbox_layout_width, this.scrap_min_z.value.cumz + this.cbox_layout_length);
                    // SHIFTS ORDINARY MIN_Z TO RIGHT
                    // AND THE NEW NODE'S ITERATOR IS THE NEW MIN_Z FROM NOW ON
                    this.scrap_min_z = this.scrap_list.insert(this.scrap_min_z, scrap);
                }
            }
            else if (prev.equals(this.scrap_list.end())) {
                /////////////////////////////////////////////////////////
                // NO LEFT, BUT RIGHT
                /////////////////////////////////////////////////////////
                //*** SITUATION-2: NO BOXES ON THE LEFT SIDE ***
                lenx = this.scrap_min_z.value.cumx;
                lenz = next.value.cumz - this.scrap_min_z.value.cumz;
                lpz = this.remain_layout_length - this.scrap_min_z.value.cumz;
                // CALL FIND_BOX AND CHECK_FOUND
                this.find_box(lenx, this.layer_thickness, this.remain_layout_height, lenz, lpz);
                this.check_found();
                // BREAK ?
                if (this.layer_done)
                    break;
                if (this.evened)
                    continue;
                // RE-FETCH LEFT AND RIGHT
                next = this.scrap_min_z.next();
                // UPDATE CURRENT BOX
                var box = this.box_array.at(this.cboxi);
                box.coy = this.packed_layout_height;
                box.coz = this.scrap_min_z.value.cumz;
                if (this.cbox_layout_width == this.scrap_min_z.value.cumx) {
                    box.cox = 0;
                    if (this.scrap_min_z.value.cumz + this.cbox_layout_length == next.value.cumz) {
                        // RIGHT IS THE NEW MIN_Z
                        // ORDINARY MIN_Z WILL BE ERASED
                        this.scrap_min_z = this.scrap_list.erase(this.scrap_min_z);
                    }
                    else {
                        // CUMULATE
                        this.scrap_min_z.value.cumz += this.cbox_layout_length;
                    }
                }
                else {
                    box.cox = this.scrap_min_z.value.cumx - this.cbox_layout_width;
                    if (this.scrap_min_z.value.cumz + this.cbox_layout_length == next.value.cumz) {
                        // DE-CUMULATE
                        this.scrap_min_z.value.cumx -= this.cbox_layout_width;
                    }
                    else {
                        // UPDATE MIN_Z
                        this.scrap_min_z.value.cumx -= this.cbox_layout_width;
                        // CREATE A NEW NODE BETWEEN MIN_Z AND RIGHT
                        var scrap = new boxologic.Scrap(this.scrap_min_z.value.cumx, this.scrap_min_z.value.cumz + this.cbox_layout_length);
                        this.scrap_list.insert(next, scrap);
                    }
                }
            }
            else if (next.equals(this.scrap_list.end())) {
                /////////////////////////////////////////////////////////
                // NO RIGHT BUT LEFT
                /////////////////////////////////////////////////////////
                //*** SITUATION-3: NO BOXES ON THE RIGHT SIDE ***
                lenx = this.scrap_min_z.value.cumx - prev.value.cumx;
                lenz = prev.value.cumz - this.scrap_min_z.value.cumz;
                lpz = this.remain_layout_length - this.scrap_min_z.value.cumz;
                // CALL FIND_BOX AND CHECK_FOUND
                this.find_box(lenx, this.layer_thickness, this.remain_layout_height, lenz, lpz);
                this.check_found();
                // BREAK ?
                if (this.layer_done)
                    break;
                if (this.evened)
                    continue;
                // RE-FETCH LEFT AND RIGHT
                prev = this.scrap_min_z.prev();
                // UPDATE CURRENT BOX
                var box = this.box_array.at(this.cboxi);
                box.coy = this.packed_layout_height;
                box.coz = this.scrap_min_z.value.cumz;
                box.cox = prev.value.cumx;
                if (this.cbox_layout_width == this.scrap_min_z.value.cumx - prev.value.cumx) {
                    if (this.scrap_min_z.value.cumz + this.cbox_layout_length == prev.value.cumz) {
                        // LEFT FETCHES MIN_Z'S CUM_X
                        prev.value.cumx = this.scrap_min_z.value.cumx;
                        // ERASE FROM MIN_Z TO END
                        this.scrap_min_z = this.scrap_list.erase(this.scrap_min_z, this.scrap_list.end());
                    }
                    else {
                        // CUMULATE
                        this.scrap_min_z.value.cumz += this.cbox_layout_length;
                    }
                }
                else {
                    if (this.scrap_min_z.value.cumz + this.cbox_layout_length == prev.value.cumz) {
                        // CUMULATE
                        prev.value.cumx += this.cbox_layout_width;
                    }
                    else {
                        // CREATE A NEW NODE BETWEEN LEFT AND MIN_Z
                        var scrap = new boxologic.Scrap(prev.value.cumx + this.cbox_layout_width, this.scrap_min_z.value.cumz + this.cbox_layout_length);
                        this.scrap_list.insert(this.scrap_min_z, scrap);
                    }
                }
            }
            else if (prev.value.cumz == next.value.cumz) {
                ////////////////////////////////////////////////////////
                // LEFT AND RIGHT ARE ALL EXIST .value. SAME CUMZ
                /////////////////////////////////////////////////////////
                //*** SITUATION-4: THERE ARE BOXES ON BOTH OF THE SIDES ***
                //*** SUBSITUATION-4A: SIDES ARE EQUAL TO EACH OTHER ***
                lenx = this.scrap_min_z.value.cumx - prev.value.cumx;
                lenz = prev.value.cumz - this.scrap_min_z.value.cumz;
                lpz = this.remain_layout_length - this.scrap_min_z.value.cumz;
                // CALL FIND_BOX AND CHECK_FOUND
                this.find_box(lenx, this.layer_thickness, this.remain_layout_height, lenz, lpz);
                this.check_found();
                // BREAK ?
                if (this.layer_done)
                    break;
                if (this.evened)
                    continue;
                // RE-FETCH LEFT AND RIGHT
                prev = this.scrap_min_z.prev();
                next = this.scrap_min_z.next();
                // UPDATE CURRENT BOX
                var box = this.box_array.at(this.cboxi);
                box.coy = this.packed_layout_height;
                box.coz = this.scrap_min_z.value.cumz;
                if (this.cbox_layout_width == this.scrap_min_z.value.cumx - prev.value.cumx) {
                    box.cox = prev.value.cumx;
                    if (this.scrap_min_z.value.cumz + this.cbox_layout_length == next.value.cumz) {
                        // LEFT FETCHES RIGHT'S CUM_X
                        prev.value.cumx = next.value.cumx;
                        // ERASE MIN_Z AND RIGHT
                        this.scrap_min_z = this.scrap_list.erase(this.scrap_min_z, next.next());
                    }
                    else {
                        // CUMULATE
                        this.scrap_min_z.value.cumz += this.cbox_layout_length;
                    }
                }
                else if (prev.value.cumx < this.pallet.layout_width - this.scrap_min_z.value.cumx) {
                    if (this.scrap_min_z.value.cumz + this.cbox_layout_length == prev.value.cumz) {
                        // DE-CUMULATE
                        this.scrap_min_z.value.cumx -= this.cbox_layout_width;
                        box.cox = this.scrap_min_z.value.cumx;
                    }
                    else {
                        box.cox = prev.value.cumx;
                        // CREATE A NODE BETWEEN LEFT AND MIN_Z
                        var scrap = new boxologic.Scrap(prev.value.cumx + this.cbox_layout_width, this.scrap_min_z.value.cumz + this.cbox_layout_length);
                        this.scrap_list.insert(this.scrap_min_z, scrap);
                    }
                }
                else {
                    if (this.scrap_min_z.value.cumz + this.cbox_layout_length == prev.value.cumz) {
                        // CUMULATE
                        prev.value.cumx += this.cbox_layout_width;
                        box.cox = prev.value.cumx;
                    }
                    else {
                        box.cox = this.scrap_min_z.value.cumx - this.cbox_layout_width;
                        // CREATE A NODE BETWEEN MIN_Z AND RIGHT
                        var scrap = new boxologic.Scrap(this.scrap_min_z.value.cumx, this.scrap_min_z.value.cumz + this.cbox_layout_length);
                        this.scrap_list.insert(next, scrap);
                        // UPDATE MIN_Z
                        this.scrap_min_z.value.cumx -= this.cbox_layout_width;
                    }
                }
            }
            else {
                ////////////////////////////////////////////////////////
                // LEFT AND RIGHT ARE ALL EXIST
                ////////////////////////////////////////////////////////
                //*** SUBSITUATION-4B: SIDES ARE NOT EQUAL TO EACH OTHER ***
                lenx = this.scrap_min_z.value.cumx - prev.value.cumx;
                lenz = prev.value.cumz - this.scrap_min_z.value.cumz;
                lpz = this.remain_layout_length - this.scrap_min_z.value.cumz;
                // CALL FIND_BOX AND CHECK_FOUND
                this.find_box(lenx, this.layer_thickness, this.remain_layout_height, lenz, lpz);
                this.check_found();
                // BREAK ?
                if (this.layer_done)
                    break;
                if (this.evened)
                    continue;
                // RE-FETCH LEFT AND RIGHT
                prev = this.scrap_min_z.prev();
                next = this.scrap_min_z.next();
                // UPDATE CURRENT BOX
                var box = this.box_array.at(this.cboxi);
                box.coy = this.packed_layout_height;
                box.coz = this.scrap_min_z.value.cumz;
                box.cox = prev.value.cumx;
                if (this.cbox_layout_width == this.scrap_min_z.value.cumx - prev.value.cumx) {
                    if (this.scrap_min_z.value.cumz + this.cbox_layout_length == prev.value.cumz) {
                        // LEFT FETCHES MIN_Z'S
                        prev.value.cumx = this.scrap_min_z.value.cumx;
                        // ERASE MIN_Z
                        this.scrap_min_z = this.scrap_list.erase(this.scrap_min_z);
                    }
                    else {
                        // CUMULATE
                        this.scrap_min_z.value.cumz += this.cbox_layout_length;
                    }
                }
                else {
                    if (this.scrap_min_z.value.cumz + this.cbox_layout_length == prev.value.cumz) {
                        // CUMULATE
                        prev.value.cumx += this.cbox_layout_width;
                    }
                    else if (this.scrap_min_z.value.cumz + this.cbox_layout_length == next.value.cumz) {
                        // DE-CUMULATE
                        this.scrap_min_z.value.cumx -= this.cbox_layout_width;
                        box.cox = this.scrap_min_z.value.cumx;
                    }
                    else {
                        // CREATE NODE BETWEEN LEFT AND MIN_Z
                        var scrap = new boxologic.Scrap(prev.value.cumx + this.cbox_layout_width, this.scrap_min_z.value.cumz + this.cbox_layout_length);
                        this.scrap_list.insert(this.scrap_min_z, scrap);
                    }
                }
            }
            this.volume_check();
        }
    }
    /**
     * Find the most proper layer height by looking at the unpacked boxes and
     * the remaining empty space available.
     */
    find_layer(thickness) {
        // MINIMUM SUM OF LAYERS (height)
        var min_eval = Number.MAX_VALUE;
        this.layer_thickness = 0;
        for (var i = 0; i < this.box_array.size(); i++) {
            var box = this.box_array.at(i);
            if (box.is_packed)
                continue;
            for (var j = 1; j <= 3; j++) {
                // For yAxis rotation mode, allow height (j==2) and length (j==3) dimensions
                // For none rotation mode, only height dimension (j==2) is valid
                if (box.rotationMode === "none" && j !== 2)
                    continue;
                if (box.rotationMode === "yAxis" && j === 1)
                    continue; // Only restrict width dimension for yAxis
                var ex_dim = void 0; // STANDARD LENGTH ON THE DIMENSION
                var dim2 = void 0; // THE SECOND, LENGTH ON A RESIDUAL DIMENSION
                var dim3 = void 0; // THE THIRD, LENGTH ON A RESIDUAL DIMENSION
                var my_eval = 0;
                // FETCH STANDARD DIMENSIONS FROM EACH AXIS
                switch (j) {
                    case 1:
                        ex_dim = box.width;
                        dim2 = box.height;
                        dim3 = box.length;
                        break;
                    case 2:
                        ex_dim = box.height;
                        dim2 = box.width;
                        dim3 = box.length;
                        break;
                    case 3:
                        ex_dim = box.length;
                        dim2 = box.width;
                        dim3 = box.height;
                        break;
                }
                // ABOUT ALL BOXES, FIND THE MINIMUM LENGTH OF GAP ~,
                // STACK ON THE CURRENT LAYER (ADD ON TO THE LAYER_EVAL)
                if (ex_dim <= thickness &&
                    ((dim2 <= this.pallet.layout_width && dim3 <= this.pallet.layout_length) ||
                        (dim3 <= this.pallet.layout_width && dim2 <= this.pallet.layout_length))) {
                    for (var k = 0; k < this.box_array.size(); k++) {
                        var my_box = this.box_array.at(k);
                        // SAME INSTANCE WITH THE SAME INDEX OR ALREADY PACKED
                        if (i == k || my_box.is_packed == true)
                            continue;
                        var dim_diff = Math.min(Math.abs(ex_dim - my_box.width), Math.abs(ex_dim - my_box.height), Math.abs(ex_dim - my_box.length));
                        my_eval += dim_diff;
                    }
                    if (my_eval < min_eval) {
                        min_eval = my_eval;
                        this.layer_thickness = ex_dim;
                    }
                }
            }
        }
        if (this.layer_thickness == 0 || this.layer_thickness > this.remain_layout_height)
            this.packing = false;
    }
    /**
     * <p> Determine the gap with the samllest z value in the current layer. </p>
     *
     * <p> Find the most proper boxes by looking at all six possible orientations,
     * empty space given, adjacent boxes, and pallet limits. </p>
     *
     * @param hmx Maximum available x-dimension of the current gap to be filled.
     * @param hy Current layer thickness value.
     * @param hmy Current layer thickness value.
     * @param hz Z-dimension of the current gap to be filled.
     * @param hmz Maximum available z-dimension to the current gap to be filled.
     */
    find_box(hmx, hy, hmy, hz, hmz) {
        this.boxi = -1;
        this.bboxi = -1;
        this.bfx = Number.MAX_VALUE;
        this.bfy = Number.MAX_VALUE;
        this.bfz = Number.MAX_VALUE;
        this.bbfx = Number.MAX_VALUE;
        this.bbfy = Number.MAX_VALUE;
        this.bbfz = Number.MAX_VALUE;
        for (var i = 0; i < this.box_array.size(); i++) {
            var box = this.box_array.at(i);
            if (box.is_packed)
                continue;
            // For Y-axis rotation, analyze optimal orientation FIRST
            if (box.rotationMode === "yAxis") {
                if (box.width !== box.height) {
                    // Analyze 130×200×31 FIRST (optimal orientation)
                    this.analyze_box(i, hmx, hy, hmy, hz, hmz, box.height, box.width, box.length);
                }
                // Then analyze original orientation as fallback
                this.analyze_box(i, hmx, hy, hmy, hz, hmz, box.width, box.height, box.length);
                continue;
            }
            // NO ROTATION (天地無用 / this side up)
            if (box.rotationMode === "none") {
                this.analyze_box(i, hmx, hy, hmy, hz, hmz, box.width, box.height, box.length);
                continue;
            }
            // ALL ROTATIONS (default)
            // WHEN REGULAR CUBE
            if (box.width == box.length && box.length == box.height) {
                this.analyze_box(i, hmx, hy, hmy, hz, hmz, box.width, box.height, box.length);
                continue;
            }
            this.analyze_box(i, hmx, hy, hmy, hz, hmz, box.width, box.height, box.length);
            this.analyze_box(i, hmx, hy, hmy, hz, hmz, box.width, box.length, box.height);
            this.analyze_box(i, hmx, hy, hmy, hz, hmz, box.height, box.width, box.length);
            this.analyze_box(i, hmx, hy, hmy, hz, hmz, box.height, box.length, box.width);
            this.analyze_box(i, hmx, hy, hmy, hz, hmz, box.length, box.width, box.height);
            this.analyze_box(i, hmx, hy, hmy, hz, hmz, box.length, box.height, box.width);
        }
    }
    /**
     * <p> Instance method that delegates to the shared calculateSupportRatio function. </p>
     */
    calculateSupportRatio(x, z, width, length, supportingBoxes) {
        return calculateSupportRatio(x, z, width, length, supportingBoxes);
    }
    /**
     * <p> Check stability of a box placement in stable mode. </p>
     *
     * <p> In stable mode, a minimum percentage of a product's X-Z face must be supported by products below it
     * (except at Y=0). This function checks if the proposed placement satisfies this constraint. </p>
     *
     * @param x X coordinate of the proposed placement
     * @param z Z coordinate of the proposed placement
     * @param width Width (X-dimension) of the box
     * @param length Length (Z-dimension) of the box
     * @param y Y coordinate of the proposed placement
     * @return true if stable, false if unstable
     */
    check_stability(x, z, width, length, y) {
        // Stability configuration constants
        var MIN_SUPPORT_RATIO = 0.7; // Minimum 70% support area required
        // At Y=0 (bottom), any placement is stable
        if (y <= 0.01) {
            return true;
        }
        var new_x1 = x;
        var new_x2 = x + width;
        var new_z1 = z;
        var new_z2 = z + length;
        // Find all boxes that could potentially support this box
        var supportingBoxes = [];
        for (var i = 0; i < this.box_array.size(); i++) {
            var box = this.box_array.at(i);
            if (!box.is_packed) {
                continue; // Skip unpacked boxes
            }
            var box_x1 = box.cox;
            var box_x2 = box.cox + box.layout_width;
            var box_z1 = box.coz;
            var box_z2 = box.coz + box.layout_length;
            var box_y2 = box.coy + box.layout_height;
            // Check if this box is below the proposed position
            if (box_y2 <= y + 0.01 && box_y2 >= y - 0.01) {
                // Check if there's X-Z overlap
                var x_overlap = (new_x1 < box_x2) && (new_x2 > box_x1);
                var z_overlap = (new_z1 < box_z2) && (new_z2 > box_z1);
                if (x_overlap && z_overlap) {
                    supportingBoxes.push({
                        x1: box_x1, x2: box_x2,
                        z1: box_z1, z2: box_z2
                    });
                }
            }
        }
        // In stable mode, we need at least some supporting boxes
        if (supportingBoxes.length === 0 && y > 0.01) {
            return false;
        }
        // Use shared utility function to calculate support ratio
        var supportRatio = this.calculateSupportRatio(x, z, width, length, supportingBoxes);
        if (supportRatio < MIN_SUPPORT_RATIO) {
            return false; // Insufficient support area
        }
        return true; // Stable placement
    }
    /**
     * <p> Analyzes each unpacked {@link Box box} to find the best fitting one to the empty space. </p>
     *
     * <p> Used by {@link find_box find_box()} to analyze box dimensions. </p>
     *
     * @param x index of a {@link Box box} in the {@link box_array}.
     *
     * @param hmx Maximum available x-dimension of the current gap to be filled.
     * @param hy Current layer thickness value.
     * @param hmy Current layer thickness value.
     * @param hz Z-dimension of the current gap to be filled.
     * @param hmz Maximum available z-dimension to the current gap to be filled.
     *
     * @param dim1 X-dimension of the orientation of the box being examined.
     * @param dim2 Y-dimension of the orientation of the box being examined.
     * @param dim3 Z-dimension of the orientation of the box being examined.
     */
    analyze_box(index, hmx, hy, hmy, hz, hmz, dim1, dim2, dim3) {
        // OUT OF BOUNDARY RANGE
        if (dim1 > hmx || dim2 > hmy || dim3 > hmz)
            return;
        // STABLE MODE CHECK
        if (this.stableMode) {
            var prev = this.scrap_min_z.prev();
            var current_x = prev.equals(this.scrap_list.end()) ? 0 : prev.value.cumx;
            var current_z = this.scrap_min_z.value.cumz;
            var current_y = this.packed_layout_height;
            // For dim2 <= hy case (box fits within current layer)
            if (dim2 <= hy) {
                var placement_y = current_y + hy - dim2;
                if (!this.check_stability(current_x, current_z, dim1, dim3, placement_y)) {
                    return; // Skip this placement if unstable
                }
            }
            // For dim2 > hy case (box extends above current layer)
            else {
                var placement_y = current_y + hy;
                if (!this.check_stability(current_x, current_z, dim1, dim3, placement_y)) {
                    return; // Skip this placement if unstable
                }
            }
        }
        // Apply scoring bonus for optimal Y-axis rotation orientation (130×200×31)
        var isOptimalYAxisOrientation = (dim1 === 130 && dim2 === 200 && dim3 === 31);
        var yAxisBonus = isOptimalYAxisOrientation ? 1000 : 0; // Large bonus for optimal orientation
        if (dim2 <= hy &&
            (hy - dim2 < this.bfy ||
                (hy - dim2 == this.bfy && hmx - dim1 < this.bfx) ||
                (hy - dim2 == this.bfy && hmx - dim1 == this.bfx && Math.abs(hz - dim3) < this.bfz) ||
                isOptimalYAxisOrientation)) { // Always prefer optimal orientation
            this.boxx = dim1;
            this.boxy = dim2;
            this.boxz = dim3;
            this.bfx = hmx - dim1 - yAxisBonus; // Apply bonus (lower is better)
            this.bfy = hy - dim2 - yAxisBonus;
            this.bfz = Math.abs(hz - dim3) - yAxisBonus;
            this.boxi = index;
        }
        else if (dim2 > hy &&
            (dim2 - hy < this.bbfy ||
                (dim2 - hy == this.bbfy && hmx - dim1 < this.bbfx) ||
                (dim2 - hy == this.bbfy && hmx - dim1 == this.bbfx && Math.abs(hz - dim3) < this.bbfz) ||
                isOptimalYAxisOrientation)) { // Always prefer optimal orientation
            this.bboxx = dim1;
            this.bboxy = dim2;
            this.bboxz = dim3;
            this.bbfx = hmx - dim1 - yAxisBonus; // Apply bonus (lower is better)
            this.bbfy = dim2 - hy - yAxisBonus;
            this.bbfz = Math.abs(hz - dim3) - yAxisBonus;
            this.bboxi = index;
        }
    }
    /**
     * After finding each box, the candidate boxes and the condition of the layer are examined.
     */
    check_found() {
        this.evened = false;
        if (this.boxi != -1) {
            this.cboxi = this.boxi;
            this.cbox_layout_width = this.boxx;
            this.cbox_layout_height = this.boxy;
            this.cbox_layout_length = this.boxz;
        }
        else {
            var prev = this.scrap_min_z.prev();
            var next = this.scrap_min_z.next();
            if (this.bboxi != -1 &&
                (this.layer_in_layer != 0 ||
                    (
                    // NO LEFT AND RIGHT EXISTS
                    prev.equals(this.scrap_list.end()) && next.equals(this.scrap_list.end())))) {
                ////////////////////////////////////////////
                // ~ OR SCRAP_MIN_Z HAS NO NEIGHBOR
                ////////////////////////////////////////////
                if (this.layer_in_layer == 0) {
                    this.pre_layer = this.layer_thickness;
                    this.lilz = this.scrap_min_z.value.cumz;
                }
                this.cboxi = this.bboxi;
                this.cbox_layout_width = this.bboxx;
                this.cbox_layout_height = this.bboxy;
                this.cbox_layout_length = this.bboxz;
                this.layer_in_layer += this.bboxy - this.layer_thickness;
                this.layer_thickness = this.bboxy;
            }
            else {
                if (prev.equals(this.scrap_list.end()) && next.equals(this.scrap_list.end())) {
                    ///////////////////////////////////////////
                    // SCRAP_MIN_Z HAS NO NEIGHBOR
                    ///////////////////////////////////////////
                    // IN RANGE & NO NEIGHBOR
                    // LAYER HAS DONE.
                    this.layer_done = true;
                }
                else {
                    this.evened = true;
                    if (prev.equals(this.scrap_list.end())) {
                        ///////////////////////////////////////////
                        // NO LEFT, BUT RIGHT
                        ///////////////////////////////////////////
                        // ERASE SCRAP_MIN_Z
                        // RIGHT IS THE NEW SCRAP_MIN_Z
                        this.scrap_min_z = this.scrap_list.erase(this.scrap_min_z);
                    }
                    else if (next.equals(this.scrap_list.end())) {
                        ///////////////////////////////////////////
                        // NO RIGHT, BUT LEFT
                        ///////////////////////////////////////////
                        // ERASE CURRENT SCRAP_MIN_Z
                        // THE LEFT ITEM FETCHES MIN'S CUM_X
                        prev.value.cumx = this.scrap_min_z.value.cumx;
                        // ERASE FROM MIN_Z TO END
                        this.scrap_min_z = this.scrap_list.erase(this.scrap_min_z, this.scrap_list.end());
                    }
                    else {
                        ///////////////////////////////////////////
                        // LEFT & RIGHT ARE ALL EXIST
                        ///////////////////////////////////////////
                        if (prev.value.cumz == next.value.cumz) {
                            // ----------------------------------------
                            // LEFT AND RIGHT'S CUM_Z ARE EQUAL
                            // ----------------------------------------
                            // LEFT FETCHES THE RIGHT'S CUM_X
                            prev.value.cumx = next.value.cumx;
                            // ERASE MIN AND ITS RIGHT
                            this.scrap_min_z = this.scrap_list.erase(this.scrap_min_z, next.next());
                        }
                        else {
                            // ----------------------------------------
                            // LEFT AND RIGHT'S CUM_Z ARE NOT EQUAL
                            // ----------------------------------------
                            if (prev.value.cumz == next.value.cumz)
                                prev.value.cumx = this.scrap_min_z.value.cumx;
                            // ERASE SCRAP_MIN_Z
                            this.scrap_min_z = this.scrap_list.erase(this.scrap_min_z);
                        }
                    }
                }
            }
        }
    }
    /**
     * After packing of each box, 100% packing condition is checked.
     */
    volume_check() {
        var box = this.box_array.at(this.cboxi);
        box.is_packed = true;
        box.layout_width = this.cbox_layout_width;
        box.layout_height = this.cbox_layout_height;
        box.layout_length = this.cbox_layout_length;
        this.packed_volume += box.volume;
        if (!this.packing_best && (this.packed_volume == this.pallet.volume || this.packed_volume == this.total_box_volume)) {
            this.packing = false;
            this.hundred_percent = true;
        }
    }
    /* -----------------------------------------------------------
        GETTERS
    ----------------------------------------------------------- */
    /**
     * <p> Find the first to be packed gap in the layer edge. </p>
     *
     * <p> Determine the gap with the {@link scrap_min_z smallest z} value in the current layer. </p>
     */
    find_smallest_z() {
        this.scrap_min_z = this.scrap_list.begin();
        for (var it = this.scrap_min_z; !it.equals(this.scrap_list.end()); it = it.next())
            if (it.value.cumz < this.scrap_min_z.value.cumz)
                this.scrap_min_z = it;
    }
    /* -----------------------------------------------------------
        REPORTERS
    ----------------------------------------------------------- */
    /**
     * <p> Determine {@link box_arrray boxes}. </p>
     *
     * <p> Using the parameters found, packs the best solution found and reports. </p>
     */
    report_results() {
        ////////////////////////////////////////////////////
        // BEGINS RE-PACKING FOLLOWING THE BEST VARS
        ////////////////////////////////////////////////////
        this.packing_best = true;
        this.pallet.set_orientation(this.best_orientation);
        this.construct_layers();
        this.iterate_layer(this.best_layer);
        // Apply coordinate transformations after packing is complete
        // so that stability checks during packing use consistent internal coordinates
        for (var i = 0; i < this.box_array.size(); i++) {
            if (this.box_array.at(i).is_packed) {
                this.cboxi = i;
                this.write_box_file();
            }
        }
    }
    /**
     * <p> Determine a {@link Box}. </p>
     *
     * <p> Transforms the found co-ordinate system to the one entered by the user and write them to the
     * report. </p>
     */
    write_box_file() {
        var box = this.box_array.at(this.cboxi);
        var cox;
        var coy;
        var coz;
        var layout_width;
        var layout_height;
        var layout_length;
        switch (this.best_orientation) {
            case 1:
                cox = box.cox;
                coy = box.coy;
                coz = box.coz;
                layout_width = box.layout_width;
                layout_height = box.layout_height;
                layout_length = box.layout_length;
                break;
            case 2:
                cox = box.coz;
                coy = box.coy;
                coz = box.cox;
                layout_width = box.layout_length;
                layout_height = box.layout_height;
                layout_length = box.layout_width;
                break;
            case 3:
                cox = box.coy;
                coy = box.coz;
                coz = box.cox;
                layout_width = box.layout_height;
                layout_height = box.layout_length;
                layout_length = box.layout_width;
                break;
            case 4:
                cox = box.coy;
                coy = box.cox;
                coz = box.coz;
                layout_width = box.layout_height;
                layout_height = box.layout_width;
                layout_length = box.layout_length;
                break;
            case 5:
                cox = box.cox;
                coy = box.coz;
                coz = box.coy;
                layout_width = box.layout_width;
                layout_height = box.layout_length;
                layout_length = box.layout_height;
                break;
            case 6:
                cox = box.coz;
                coy = box.cox;
                coz = box.coy;
                layout_width = box.layout_length;
                layout_height = box.layout_width;
                layout_length = box.layout_height;
                break;
        }
        box.cox = cox;
        box.coy = coy;
        box.coz = coz;
        box.layout_width = layout_width;
        box.layout_height = layout_height;
        box.layout_length = layout_length;
    }
}
boxologic.Boxologic = Boxologic;
/**
 * A pallet containing boxes.
 *
 * @author Bill Knechtel, <br>
 *		   Migrated and Refactored by Jeongho Nam <http://samchon.org>
 */
class Pallet extends boxologic.Instance {
    /**
     * Construct from a wrapper.
     *
     * @param wrapper A wrapper wrapping instances.
     */
    constructor(wrapper) {
        super(wrapper.getContainableWidth(), wrapper.getContainableHeight(), wrapper.getContainableLength());
    }
    /**
     * Set placement orientation.
     */
    set_orientation(orientation) {
        switch (orientation) {
            case 1:
                this.layout_width = this.width;
                this.layout_height = this.height;
                this.layout_length = this.length;
                break;
            case 2:
                this.layout_width = this.length;
                this.layout_height = this.height;
                this.layout_length = this.width;
                break;
            case 3:
                this.layout_width = this.length;
                this.layout_height = this.width;
                this.layout_length = this.height;
                break;
            case 4:
                this.layout_width = this.height;
                this.layout_height = this.width;
                this.layout_length = this.length;
                break;
            case 5:
                this.layout_width = this.width;
                this.layout_height = this.length;
                this.layout_length = this.height;
                break;
            case 6:
                this.layout_width = this.height;
                this.layout_height = this.length;
                this.layout_length = this.width;
                break;
        }
    }
}
boxologic.Pallet = Pallet;
/**
 * <p> Cumulated lengths of current layer. </p>
 *
 * <p> {@link Scrapped} represents an edge of the current layer under construction. </p>
 *
 * @author Bill Knechtel, <br>
 *		   Migrated and Refactored by Jeongho Nam <http://samchon.org>
 */
class Scrap {
    constructor(cumx, cumz) {
        if (cumx === void 0) {
            cumx = 0;
        }
        if (cumz === void 0) {
            cumz = 0;
        }
        this.cumx = cumx;
        this.cumz = cumz;
    }
}
boxologic.Scrap = Scrap;
// ===== bws.packer classes =====
/**
 * Bridge of {@link Packer} for {@link InstanceForm repeated instances}.
 *
 * @author Jeongho Nam <http://samchon.org>
 */
class PackerForm extends packer.protocol.Entity {
    constructor(instanceFormArray, wrapperArray) {
        if (instanceFormArray === void 0) {
            instanceFormArray = new InstanceFormArray();
        }
        if (wrapperArray === void 0) {
            wrapperArray = new packer.WrapperArray();
        }
        super();
        this.instanceFormArray = instanceFormArray;
        this.wrapperArray = wrapperArray;
    }
    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    optimize() {
        var _packer = this.toPacker();
        return _packer.optimize();
    }
    getInstanceFormArray() {
        return this.instanceFormArray;
    }
    getWrapperArray() {
        return this.wrapperArray;
    }
    toPacker() {
        var _packer = new packer.Packer(this.wrapperArray, this.instanceFormArray.toInstanceArray());
        return _packer;
    }
}
packer.PackerForm = PackerForm;
/**
 * An array of {@link InstanceForm} objects.
 *
 * @author Jeongho Nam <http://samchon.org>
 */
class InstanceFormArray extends packer.protocol.EntityArrayCollection {
    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Default Constructor.
     */
    constructor() { super(); }
    /**
     * Convert {@link InstanceForm} objects to {@link InstanceArray}.
     *
     * @return An array of instance containing repeated instances in {@link InstanceForm} objects.
     */
    toInstanceArray() {
        var instanceArray = new packer.InstanceArray();
        for (var i = 0; i < this.size(); i++) {
            var myInstances = this.at(i).toInstanceArray();
            instanceArray.insert(instanceArray.end(), myInstances.begin(), myInstances.end());
        }
        return instanceArray;
    }
}
packer.InstanceFormArray = InstanceFormArray;
/**
 * <p> A repeated Instance. </p>
 *
 * <p> InstanceForm is an utility class for repeated {@link Instance}. It is designed for shrinking
 * volume of network message I/O by storing {@link count repeated count}. </p>
 *
 * @author Jeongho Nam <http://samchon.org>
 */
class InstanceForm extends packer.protocol.Entity {
    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Default Constructor.
     */
    constructor(instance, count) {
        if (instance === void 0) {
            instance = new packer.Product("No name", 10, 10, 10);
        }
        if (count === void 0) {
            count = 1;
        }
        super();
        this.instance = instance;
        this.count = count;
    }
    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    key() {
        return this.instance.getName();
    }
    getInstance() {
        return this.instance;
    }
    getCount() {
        return this.count;
    }
    setCount(val) {
        this.count = val;
    }
    get $name() { return this.instance.getName(); }
    set $name(val) { this.instance.setName(val); }
    get $width() { return this.instance.getWidth() + ""; }
    set $width(val) { this.instance.setWidth(parseFloat(val)); }
    get $height() { return this.instance.getHeight() + ""; }
    set $height(val) { this.instance.setHeight(parseFloat(val)); }
    get $length() { return this.instance.getLength() + ""; }
    set $length(val) { this.instance.setLength(parseFloat(val)); }
    get $count() { return this.count + ""; }
    set $count(val) { this.count = parseInt(val); }
    /**
     * <p> Repeated {@link instance} to {@link InstanceArray}.
     *
     * @details
     * <p> Contains the {@link instance repeated instance} to an {@link InstanceArray} to make
     * {@link instance} to participate in the packing process. The returned {@link InstanceArray} will be
     * registered on {@link Packer.instanceArray}.
     *
     * @return An array of instance containing repeated {@link instance}.
     */
    toInstanceArray() {
        var instanceArray = new packer.InstanceArray();
        instanceArray.assign(this.count, this.instance);
        return instanceArray;
    }
}
packer.InstanceForm = InstanceForm;
class WrapperArray extends packer.protocol.EntityArrayCollection {
    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Default Constructor.
     */
    constructor() { super(); }
    /* -----------------------------------------------------------
        GETTERS
    ----------------------------------------------------------- */
    /**
     * Get (calculate) price.
     */
    getPrice() {
        var price = 0.0;
        for (var i = 0; i < this.size(); i++)
            price += this.at(i).getPrice();
        return price;
    }
    /**
     * Get (calculate) utilization rate.
     */
    getUtilization() {
        if (this.empty() == true)
            return -1.0;
        var numerator = 0.0;
        var denominator = 0.0;
        for (var i = 0; i < this.size(); i++) {
            var wrapper = this.at(i);
            denominator += wrapper.getContainableVolume();
            for (var j = 0; j < wrapper.size(); j++)
                numerator += wrapper.at(j).getVolume();
        }
        return numerator / denominator;
    }
    createChild(xml) {
        return new packer.Wrapper();
    }
}
packer.WrapperArray = WrapperArray;
class GAWrapperArray extends packer.WrapperArray {
    constructor(obj) {
        super();
        this.result = new tstl_1.default.HashMap();
        this.price = 0.0;
        if (obj instanceof packer.InstanceArray) {
            this.instanceArray = obj;
        }
        else {
            var genes = obj;
            this.instanceArray = genes.instanceArray;
            this.assign(genes.begin(), genes.end());
        }
    }
    constructResult() {
        if (this.result.empty() == false)
            return; // IF RESULT IS ALREADY DEDUCTED
        // INSTANCE AND WRAPPER IS CORRESPOND, 1:1 RELATIONSHIP.
        for (var i = 0; i < this.size(); i++) {
            var wrapper = this.at(i);
            if (this.result.has(wrapper.getName()) == false) {
                var wrapperGroup_1 = new packer.WrapperGroup(wrapper);
                wrapperGroup_1.options = this.options;
                this.result.set(wrapper.getName(), wrapperGroup_1);
            }
            var wrapperGroup = this.result.get(wrapper.getName());
            var instance = this.instanceArray.at(i);
            if (wrapperGroup.allocate(instance) == false) {
                // THE INSTANCE IS GREATER THAN THE WRAPPER
                // THIS GENE IS NOT VALID SO THAT CANNOT PARTICIPATE IN THE OPTIMIZATION PROCESS
                this.valid = false;
                return;
            }
        }
        // THE GENE IS VALID, THEN CALCULATE THE COST
        this.price = 0.0;
        this.valid = true;
        for (var it = this.result.begin(); !it.equals(this.result.end()); it = it.next()) {
            it.second.optimize();
            this.price += it.second.getPrice();
        }
    }
    /* -----------------------------------------------------------
        GETTERS
    ----------------------------------------------------------- */
    /**
     * @brief Get optimization result.
     *
     * @return result map.
     */
    getResult() {
        this.constructResult();
        return this.result;
    }
    less(obj) {
        this.constructResult();
        obj.constructResult();
        if (this.valid == true && obj.valid == true)
            return this.price < obj.price;
        else if (this.valid == true && obj.valid == false)
            return true;
        else
            return false;
    }
}
packer.GAWrapperArray = GAWrapperArray;
/**
 * An array of Instance objects.
 *
 * @author Jeongho Nam <http://samchon.org>
 */
class InstanceArray extends packer.protocol.EntityArray {
    /* -----------------------------------------------------------
        CONSTRUCTORS
    ----------------------------------------------------------- */
    /**
     * Default Constructor.
     */
    constructor() { super(); }
    createChild(xml) {
        return new packer.Product();
    }
}
packer.InstanceArray = InstanceArray;
/**
 * @brief Packer, a solver of 3d bin packing with multiple wrappers.
 *
 * @details
 * <p> Packer is a facade class supporting packing operations in user side. You can solve a packing problem
 * by constructing Packer class with {@link WrapperArray wrappers} and {@link InstanceArray instances} to
 * pack and executing {@link optimize Packer.optimize()} method. </p>
 *
 * <p> In background side, deducting packing solution, those algorithms are used. </p>
 * <ul>
 *	<li> <a href="http://betterwaysystems.github.io/packer/reference/AirForceBinPacking.pdf" target="_blank">
 *		Airforce Bin Packing; 3D pallet packing problem: A human intelligence-based heuristic approach </a>
 *	</li>
 *	<li> Genetic Algorithm </li>
 *	<li> Greedy and Back-tracking algorithm </li>
 * </ul>
 *
 * @author Jeongho Nam <http://samchon.org>
 */
class Packer extends packer.protocol.Entity {
    constructor(wrapperArray, instanceArray, options) {
        if (wrapperArray === void 0) {
            wrapperArray = null;
        }
        if (instanceArray === void 0) {
            instanceArray = null;
        }
        if (options === void 0) {
            options = { isNotUseBeamSearch: false };
        }
        super();
        if (wrapperArray == null && instanceArray == null) {
            this.wrapperArray = new packer.WrapperArray();
            this.instanceArray = new packer.InstanceArray();
        }
        else {
            this.wrapperArray = wrapperArray;
            this.instanceArray = instanceArray;
        }
        this.options = options;
    }
    /* -----------------------------------------------------------
        GETTERS
    ----------------------------------------------------------- */
    /**
     * Get wrapperArray.
     */
    getWrapperArray() {
        return this.wrapperArray;
    }
    /**
     * Get instanceArray.
     */
    getInstanceArray() {
        return this.instanceArray;
    }
    /* -----------------------------------------------------------
        OPTIMIZERS
    ----------------------------------------------------------- */
    /**
     * <p> Deduct
     *
     */
    optimize() {
        if (this.instanceArray.empty() || this.wrapperArray.empty())
            throw new tstl_1.default.InvalidArgument("Any instance or wrapper is not constructed.");
        var wrappers = new packer.WrapperArray(); // TO BE RETURNED
        if (this.wrapperArray.size() == 1) {
            // ONLY A TYPE OF WRAPPER EXISTS,
            // OPTMIZE IN LEVEL OF WRAPPER_GROUP AND TERMINATE THE OPTIMIZATION
            var wrapperGroup = new packer.WrapperGroup(this.wrapperArray.front());
            wrapperGroup.options = this.options;
            for (var i = 0; i < this.instanceArray.size(); i++)
                if (wrapperGroup.allocate(this.instanceArray.at(i)) == false)
                    throw new tstl_1.default.LogicError("All instances are greater than the wrapper.");
            // OPTIMIZE
            wrapperGroup.optimize();
            // ASSIGN WRAPPERS
            wrappers.assign(wrapperGroup.begin(), wrapperGroup.end());
        }
        else {
            ////////////////////////////////////////
            // WITH GENETIC_ALGORITHM
            ////////////////////////////////////////
            // CONSTRUCT INITIAL SET
            var geneArray = this.initGenes();
            // EVOLVE
            // IN JAVA_SCRIPT VERSION, GENETIC_ALGORITHM IS NOT IMPLEMENTED YET.
            // HOWEVER, IN C++ VERSION, IT IS FULLY SUPPORTED
            //	http://samchon.github.io/framework/api/cpp/d5/d28/classsamchon_1_1library_1_1GeneticAlgorithm.html
            // IT WILL BE SUPPORTED SOON
            // FETCH RESULT
            var result = geneArray.getResult();
            for (var it = result.begin(); !it.equals(result.end()); it = it.next())
                wrappers.insert(wrappers.end(), it.second.begin(), it.second.end());
            // TRY TO REPACK
            wrappers = this.repack(wrappers);
        }
        // SORT THE WRAPPERS BY ITEMS' POSITION
        for (var i = 0; i < wrappers.size(); i++) {
            var wrapper = wrappers.at(i);
            tstl_1.default.sort(wrapper.begin(), wrapper.end(), function (left, right) {
                if (left.getZ() != right.getZ())
                    return left.getZ() < right.getZ();
                else if (left.getY() != right.getY())
                    return left.getY() < right.getY();
                else
                    return left.getX() < right.getX();
            });
        }
        if (wrappers.empty() == true)
            throw new tstl_1.default.LogicError("All instances are greater than the wrapper.");
        // CALCULATE FILL RATES PER WRAPPER
        var fillRates = [];
        for (var i = 0; i < wrappers.size(); i++) {
            var wrapper = wrappers.at(i);
            var packedVolume = 0.0;
            for (var j = 0; j < wrapper.size(); j++)
                packedVolume += wrapper.at(j).getVolume();
            var containableVolume = wrapper.getContainableVolume();
            fillRates.push({
                name: wrapper.getName(),
                fillRate: containableVolume > 0 ? packedVolume / containableVolume : 0,
                packedVolume: packedVolume,
                containableVolume: containableVolume,
                packedCount: wrapper.size()
            });
        }
        wrappers.fillRates = fillRates;
        return wrappers;
    }
    /**
     * @brief Initialize sequence list (gene_array).
     *
     * @details
     * <p> Deducts initial sequence list by such assumption: </p>
     *
     * <ul>
     *	<li> Cost of larger wrapper is less than smaller one, within framework of price per volume unit. </li>
     *	<ul>
     *		<li> Wrapper Larger: (price: $1,000, volume: 100cm^3 -> price per volume unit: $10 / cm^3) </li>
     *		<li> Wrapper Smaller: (price: $700, volume: 50cm^3 -> price per volume unit: $14 / cm^3) </li>
     *		<li> Larger's <u>cost</u> is less than Smaller, within framework of price per volume unit </li>
     *	</ul>
     * </ul>
     *
     * <p> Method {@link initGenes initGenes()} constructs {@link WrapperGroup WrapperGroups} corresponding
     * with the {@link wrapperArray} and allocates {@link instanceArray instances} to a {@link WrapperGroup},
     * has the smallest <u>cost</u> between containbles. </p>
     *
     * <p> After executing packing solution by {@link WrapperGroup.optimize WrapperGroup.optimize()}, trying to
     * {@link repack re-pack} each {@link WrapperGroup} to another type of {@link Wrapper}, deducts the best
     * solution between them. It's the initial sequence list of genetic algorithm. </p>
     *
     * @return Initial sequence list.
     */
    initGenes() {
        ////////////////////////////////////////////////////
        // LINEAR OPTIMIZATION
        ////////////////////////////////////////////////////
        // CONSTRUCT WRAPPER_GROUPS
        var wrapperGroups = new tstl_1.default.Vector();
        for (var i = 0; i < this.wrapperArray.size(); i++) {
            var wrapper = this.wrapperArray.at(i);
            var wg = new packer.WrapperGroup(wrapper);
            wg.options = this.options;
            wrapperGroups.push_back(wg);
        }
        // ALLOCATE INSTNACES BY AUTHORITY
        for (var i = 0; i < this.instanceArray.size(); i++) {
            var instance = this.instanceArray.at(i);
            var minCost = Number.MAX_VALUE;
            var minIndex = 0;
            for (var j = 0; j < this.wrapperArray.size(); j++) {
                var wrapper = this.wrapperArray.at(j);
                if (wrapper.containable(instance) == false)
                    continue; // CANNOT CONTAIN BY ITS GREATER SIZE
                var cost = wrapper.getPrice() / wrapper.getContainableVolume();
                if (cost < minCost) {
                    // CURRENT WRAPPER'S PRICE PER UNIT VOLUME IS CHEAPER
                    minCost = cost;
                    minIndex = j;
                }
            }
            // ALLOCATE TO A GROUP WHICH HAS THE MOST CHEAPER PRICE PER UNIT VOLUME
            var wrapperGroup = wrapperGroups.at(minIndex);
            wrapperGroup.allocate(instance);
        }
        ////////////////////////////////////////////////////
        // ADDICTIONAL OPTIMIZATION BY POST-PROCESS
        ////////////////////////////////////////////////////
        // OPTIMIZE WRAPPER_GROUP
        var wrappers = new packer.WrapperArray();
        for (var i = 0; i < wrapperGroups.size(); i++) {
            var wrapperGroup = wrapperGroups.at(i);
            wrapperGroup.optimize();
            wrappers.insert(wrappers.end(), wrapperGroup.begin(), wrapperGroup.end());
        }
        // DO EARLY POST-PROCESS
        wrappers = this.repack(wrappers);
        ////////////////////////////////////////////////////
        // CONSTRUCT GENE_ARRAY
        ////////////////////////////////////////////////////
        // INSTANCES AND GENES
        var ga_instances = new packer.InstanceArray();
        var genes = new packer.WrapperArray();
        for (var i = 0; i < wrappers.size(); i++) {
            var wrapper = wrappers.at(i);
            for (var j = 0; j < wrapper.size(); j++) {
                ga_instances.push_back(wrapper.at(j).getInstance());
                genes.push_back(wrapper);
            }
        }
        // GENE_ARRAY
        var geneArray = new packer.GAWrapperArray(ga_instances);
        geneArray.options = this.options;
        geneArray.assign(genes.begin(), genes.end());
        return geneArray;
    }
    /**
     * Try to repack each wrappers to another type.
     *
     * @param $wrappers Wrappers to repack.
     * @return Re-packed wrappers.
     */
    repack($wrappers) {
        var result = new packer.WrapperArray();
        for (var i = 0; i < $wrappers.size(); i++) {
            var wrapper = $wrappers.at(i);
            var minGroup = new packer.WrapperGroup(wrapper);
            minGroup.options = this.options;
            minGroup.push_back(wrapper);
            for (var j = 0; j < this.wrapperArray.size(); j++) {
                var myWrapper = this.wrapperArray.at(j);
                if (wrapper.equals(myWrapper))
                    continue;
                var valid = true;
                // CONSTRUCT GROUP OF TARGET
                var myGroup = new packer.WrapperGroup(myWrapper);
                myGroup.options = this.options;
                for (var k = 0; k < wrapper.size(); k++)
                    if (myGroup.allocate(wrapper.at(k).getInstance()) == false) {
                        // IF THERE'S AN INSTANCE CANNOT CONTAIN BY ITS GREATER SIZE
                        valid = false;
                        break;
                    }
                // SKIP
                if (valid == false)
                    continue;
                // OPTIMIZATION IN LEVEL OF GROUP
                myGroup.optimize();
                // CURRENT GROUP IS CHEAPER, THEN REPLACE
                if (myGroup.getPrice() < minGroup.getPrice())
                    minGroup = myGroup;
            }
            result.insert(result.end(), minGroup.begin(), minGroup.end());
        }
        return result;
    }
}
packer.Packer = Packer;
/**
 * A product.
 *
 * @author Jeongho Nam <http://samchon.org>
 */
class Product extends packer.protocol.Entity {
    constructor(name, width, height, length) {
        if (name === void 0) {
            name = "No Name";
        }
        if (width === void 0) {
            width = 0;
        }
        if (height === void 0) {
            height = 0;
        }
        if (length === void 0) {
            length = 0;
        }
        super();
        /**
         * <p> Name, key of the Product. </p>
         *
         * <p> The name must be unique because a name identifies a {@link Product}. </p>
         */
        this.name = "";
        /**
         * Width of the Product, length on the X-axis in 3D.
         */
        this.width = 0.0;
        /**
         * Height of the Product, length on the Y-axis in 3D.
         */
        this.height = 0.0;
        /**
         * Length of the Product, length on the Z-axis in 3D.
         */
        this.length = 0.0;
        this.name = name;
        this.width = width;
        this.height = height;
        this.length = length;
        /**
         * Rotation mode for packing.
         *   "all"   - all 6 orientations (default)
         *   "yAxis" - Y-axis rotation only: height stays fixed, width/length may be swapped
         *   "none"  - no rotation (天地無用 / this side up)
         */
        this._rotationMode = "all";
    }
    /* -----------------------------------------------------------
        ACCESSORS
    ----------------------------------------------------------- */
    /**
     * Key of a Product is its name.
     */
    key() {
        return this.name;
    }
    /**
     * @inheritdoc
     */
    getName() {
        return this.name;
    }
    /**
     * @inheritdoc
     */
    getWidth() {
        return this.width;
    }
    /**
     * @inheritdoc
     */
    getHeight() {
        return this.height;
    }
    /**
     * @inheritdoc
     */
    getLength() {
        return this.length;
    }
    /**
     * @inheritdoc
     */
    getVolume() {
        return this.width * this.height * this.length;
    }
    /**
     * @inheritdoc
     */
    setName(val) {
        this.name = val;
    }
    /**
     * @inheritdoc
     */
    setWidth(val) {
        this.width = val;
    }
    /**
     * @inheritdoc
     */
    setHeight(val) {
        this.height = val;
    }
    /**
     * @inheritdoc
     */
    setLength(val) {
        this.length = val;
    }
    /**
     * Get whether rotation is allowed for this product.
     * @returns false only when rotationMode is "none".
     */
    getAllowRotation() {
        return this._rotationMode !== "none";
    }
    /**
     * Set whether rotation is allowed for this product (backward-compatible).
     * true  => rotationMode "all"
     * false => rotationMode "none"
     * To allow Y-axis-only rotation, use setRotationMode("yAxis") instead.
     *
     * @param val true to allow all rotations (default), false to forbid rotation.
     */
    setAllowRotation(val) {
        this._rotationMode = val ? "all" : "none";
    }
    /**
     * Get the rotation mode.
     * @returns "all" | "yAxis" | "none"
     */
    getRotationMode() {
        return this._rotationMode;
    }
    /**
     * Set the rotation mode.
     *   "all"   - all 6 orientations (default)
     *   "yAxis" - Y-axis rotation only: height stays fixed, width/length may be swapped
     *   "none"  - no rotation (天地無用 / this side up)
     *
     * @param mode "all" | "yAxis" | "none"
     */
    setRotationMode(mode) {
        this._rotationMode = mode;
    }
}
packer.Product = Product;
/**
 * <p> Wrap represents an act wrap(ping). </p>
 *
 * <p> {@link Wrap} is a class represents an act wrapping an {@link Instance} to an {@link Wrapper}.
 * To represent the relationship, Wrap uses Bridge and Capsular patterns to links and intermediates
 * relationship between Wrapper and Instance. </p>
 *
 * <p> Wrap also helps packing optimization and 3d-visualization with its own members
 * {@link orientation} and position variables {@link x}, {@link y} and {@link z}. </p>
 *
 * @author Jeongho Nam <http://samchon.org>
 */
class Wrap extends packer.protocol.Entity {
    constructor(wrapper, instance, x, y, z, orientation) {
        if (instance === void 0) {
            instance = null;
        }
        if (x === void 0) {
            x = 0;
        }
        if (y === void 0) {
            y = 0;
        }
        if (z === void 0) {
            z = 0;
        }
        if (orientation === void 0) {
            orientation = 1;
        }
        super();
        this.wrapper = wrapper;
        this.instance = instance;
        this.x = x;
        this.y = y;
        this.z = z;
        this.orientation = orientation;
        this.supportRatio = 0.0;
    }
    /* ===========================================================
        SETTERS
            - MEMBERS
            - ESTIMATERS
    ==============================================================
        MEMBERS
    ----------------------------------------------------------- */
    /**
     * Set orientation.
     *
     * @param orientation Orientation code (1 to 6).
     */
    setOrientation(orientation) {
        this.orientation = orientation;
    }
    /**
     * Set position.
     *
     * @param x Coordinate-X of the instance placement in the wrapper.
     * @param y Coordinate-Y of the instance placement in the wrapper.
     * @param z Coordinate-Z of the instance placement in the wrapper.
     */
    setPosition(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    /* -----------------------------------------------------------
        ESTIMATERS
    ----------------------------------------------------------- */
    /**
     * @brief Estimate orientation by given size.
     *
     * @param width Width by placement.
     * @param height Height by placement.
     * @param length Length by placement.
     */
    estimateOrientation(width, height, length) {
        if (this.instance.getWidth() == width && this.instance.getHeight() == height)
            this.orientation = 1;
        else if (this.instance.getWidth() == length && this.instance.getHeight() == height)
            this.orientation = 2;
        else if (this.instance.getWidth() == length && this.instance.getHeight() == width)
            this.orientation = 3;
        else if (this.instance.getWidth() == height && this.instance.getHeight() == width)
            this.orientation = 4;
        else if (this.instance.getWidth() == width && this.instance.getHeight() == length)
            this.orientation = 5;
        else
            this.orientation = 6;
    }
    /**
     * @brief Orientation change is occured in level of the packer.
     *
     * @details orientation Packer's new orientation.
     */
    changeWrapperOrientation(orientation) {
        if (orientation == 1)
            return;
        // DECLARES
        var x;
        var y;
        var z;
        var width;
        var height;
        var length;
        if (orientation == 2) {
            width = this.instance.getLength();
            height = this.instance.getHeight();
            length = this.instance.getWidth();
            x = this.z;
            y = this.y;
            z = this.wrapper.getWidth() - (length + this.x);
        }
        else if (orientation == 3) {
            width = this.instance.getLength();
            height = this.instance.getWidth();
            length = this.instance.getHeight();
            x = this.z;
            y = this.wrapper.getWidth() - (height + this.x);
            z = this.wrapper.getHeight() - (length + this.y);
        }
        else if (orientation == 4) {
            width = this.instance.getHeight();
            height = this.instance.getWidth();
            length = this.instance.getLength();
            x = this.y;
            y = this.x;
            z = this.z;
        }
        else if (orientation == 5) {
            width = this.instance.getWidth();
            height = this.instance.getLength();
            length = this.instance.getHeight();
            x = this.x;
            y = this.wrapper.getLength() - (height + this.z);
            z = this.y;
        }
        else {
            width = this.instance.getHeight();
            height = this.instance.getLength();
            length = this.instance.getWidth();
            x = this.y;
            y = this.z;
            z = this.wrapper.getWidth() - (length - this.x);
        }
        this.estimateOrientation(width, height, length);
        this.x = x;
        this.y = y;
        this.z = z;
    }
    /* ===========================================================
        GETTERS
    =========================================================== */
    /**
     * Get wrapper.
     */
    getWrapper() {
        return this.wrapper;
    }
    /**
     * Get instance.
     */
    getInstance() {
        return this.instance;
    }
    /**
     * Get x.
     */
    getX() {
        return this.x;
    }
    /**
     * Get y.
     */
    getY() {
        return this.y;
    }
    /**
     * Get z.
     */
    getZ() {
        return this.z;
    }
    /**
     * Get orientation.
     */
    getOrientation() {
        return this.orientation;
    }
    /**
     * Get support ratio.
     */
    getSupportRatio() {
        return this.supportRatio;
    }
    /**
     * Set support ratio.
     */
    setSupportRatio(ratio) {
        this.supportRatio = ratio;
    }
    /**
     * Get width.
     */
    getLayoutWidth() {
        switch (this.orientation) {
            case 1:
            case 5:
                return this.instance.getWidth();
            case 3:
            case 4:
                return this.instance.getHeight();
            default:
                return this.instance.getLength();
        }
    }
    /**
     * Get height.
     */
    getLayoutHeight() {
        switch (this.orientation) {
            case 1:
            case 2:
                return this.instance.getHeight();
            case 4:
            case 6:
                return this.instance.getWidth();
            default:
                return this.instance.getLength();
        }
    }
    /**
     * Get length.
     */
    getLength() {
        switch (this.orientation) {
            case 1:
            case 4:
                return this.instance.getLength();
            case 2:
            case 3:
                return this.instance.getWidth();
            default:
                return this.instance.getHeight();
        }
    }
    /**
     * Get volume.
     */
    getVolume() {
        return this.instance.getVolume();
    }
    get $instanceName() {
        return this.instance.getName();
    }
    get $layoutScale() {
        return this.getLayoutWidth() + ", " + this.getLayoutHeight() + ", " + this.getLength();
    }
    get $position() {
        return this.x + ", " + this.y + ", " + this.z;
    }
}
packer.Wrap = Wrap;
/**
 * A wrapper wrapping instances.
 *
 * @author Jeongho Nam <http://samchon.org>
 */
class Wrapper extends packer.protocol.EntityDeque {
    constructor(...args) {
        super();
        /**
         * <p> Name, key of the Wrapper. </p>
         *
         * <p> The name represents a type of Wrapper and identifies the Wrapper. </p>
         */
        this.name = "No Name";
        /**
         * Price, cost of using an Wrapper.
         */
        this.price = 1000.0;
        /**
         * Width of the Wrapper, length on the X-axis in 3D.
         */
        this.width = 10.0;
        /**
         * Height of the Wrapper, length on the Y-axis in 3D.
         */
        this.height = 10.0;
        /**
         * Length of the Wrapper, length on the Z-axis in 3D.
         */
        this.length = 10.0;
        /**
         * <p> Thickness, margin of a Wrapper causes shrinkness of containable volume. </p>
         *
         * <p> The thickness reduces each dimension's containable size (dimension - 2*thickness),
         * so finally, it reduces total containable volume (-8 * thickness^3). </p>
         */
        this.thickness = 0.0;
        /**
         * <p> Stable mode flag. </p>
         *
         * <p> When true, products' X-Z faces must not extend beyond the X-Z faces of the products below them
         * (except at Y=0). This mode must be used with Y-axis rotation mode only. </p>
         */
        this.stableMode = false;
        if (args.length == 1 && args[0] instanceof Wrapper) {
            var wrapper = args[0];
            this.name = wrapper.name;
            this.price = wrapper.price;
            this.width = wrapper.width;
            this.height = wrapper.height;
            this.length = wrapper.length;
            this.thickness = wrapper.thickness;
            this.stableMode = wrapper.stableMode;
        }
        else if (args.length == 6) {
            this.name = args[0];
            this.price = args[1];
            this.width = args[2];
            this.height = args[3];
            this.length = args[4];
            this.thickness = args[5];
        }
        else if (args.length == 7) {
            this.name = args[0];
            this.price = args[1];
            this.width = args[2];
            this.height = args[3];
            this.length = args[4];
            this.thickness = args[5];
            this.stableMode = args[6];
        }
    }
    /* ===========================================================
        ACCESSORS
            - MEMBERS
            - DERIVED PROPERTIES
            - COMPARISON
            - SETTERS
            - COLUMN ITEMS
    ==============================================================
        MEMBERS
    ----------------------------------------------------------- */
    /**
     * Key of a Wrapper is its name.
     */
    key() {
        return this.name;
    }
    /**
     * Get name.
     */
    getName() {
        return this.name;
    }
    /**
     * Get price.
     */
    getPrice() {
        return this.price;
    }
    /**
     * Get width, length on X-axis in 3D.
     */
    getWidth() {
        return this.width;
    }
    /**
     * Get height, length on Y-axis in 3D.
     */
    getHeight() {
        return this.height;
    }
    /**
     * Get length, length on Z-axis in 3D.
     */
    getLength() {
        return this.length;
    }
    /**
     * Get thickness.
     */
    getThickness() {
        return this.thickness;
    }
    /* -----------------------------------------------------------
        DERIVED PROPERTIES
    ----------------------------------------------------------- */
    /**
     * <p> Get (calculate) containable width, length on the X-axis in 3D. </p>
     *
     * <p> Calculates containable width considering the {@link thickness}. </p>
     *
     * @return width - (2 x thickness)
     */
    getContainableWidth() {
        return this.width - (2 * this.thickness);
    }
    /**
     * <p> Get (calculate) containable height, length on the Y-axis in 3D. </p>
     *
     * <p> Calculates containable height considering the {@link thickness}. </p>
     *
     * @return height - (2 x thickness)
     */
    getContainableHeight() {
        return this.height - (2 * this.thickness);
    }
    /**
     * <p> Get (calculate) containable length, length on the Z-axis in 3D. </p>
     *
     * <p> Calculates containable length considering the {@link thickness}. </p>
     *
     * @return length - (2 x thickness)
     */
    getContainableLength() {
        return this.length - (2 * this.thickness);
    }
    /**
     * <p> Get (calculate) volume. </p>
     *
     * <h4> Notice </h4>
     * <p> If {@link thickness} of the Wrapper is not 0, the volume does not mean containable volume.
     * In that case, use {@link containableVolume} instead. </p>
     *
     * @return width x height x length
     */
    getVolume() {
        return this.width * this.height * this.length;
    }
    /**
     * <p> Get (calculate) containable volume. </p>
     *
     * <p> Calculates containable volume considering the {@link thickness}. </p>
     *
     * @return volume - {(2 x thickness) ^ 3}
     */
    getContainableVolume() {
        return this.getContainableWidth() * this.getContainableHeight() * this.getContainableLength();
    }
    /**
     * Get utilization ratio of containable volume.
     *
     * @return utilization ratio.
     */
    getUtilization() {
        var volume = 0.0;
        for (var i = 0; i < this.size(); i++)
            volume += this.at(i).getVolume();
        return volume / this.getContainableVolume();
    }
    /* -----------------------------------------------------------
        COMPARISON
    ----------------------------------------------------------- */
    equals(obj) {
        return this.price == obj.price
            && this.width == obj.width && this.height == obj.height && this.length == obj.length
            && this.thickness == obj.thickness;
    }
    /**
     * <p> Wrapper is enough greater? </p>
     *
     * <p> Test whether the Wrapper is enough greater than an Instance to contain. </p>
     *
     * @param instance An Instance to test.
     * @return Enough greater or not.
     */
    containable(instance) {
        // TEST WHETHER AN INSTANCE IS GREATER THAN WRAPPER
        var myDims = new tstl_1.default.Vector([this.getContainableWidth(), this.getContainableHeight(), this.getContainableLength()]);
        var instanceDims = new tstl_1.default.Vector([instance.getWidth(), instance.getHeight(), instance.getLength()]);
        tstl_1.default.sort(myDims.begin(), myDims.end());
        tstl_1.default.sort(instanceDims.begin(), instanceDims.end());
        for (var i = 0; i < myDims.size(); i++)
            if (myDims.at(i) < instanceDims.at(i))
                return false;
        return true;
    }
    /* -----------------------------------------------------------
        SETTERS
    ----------------------------------------------------------- */
    /**
     * @inheritdoc
     */
    setName(val) {
        this.name = val;
    }
    /**
     * Set price.
     */
    setPrice(val) {
        this.price = val;
    }
    /**
     * @inheritdoc
     */
    setWidth(val) {
        this.width = val;
    }
    /**
     * @inheritdoc
     */
    setHeight(val) {
        this.height = val;
    }
    /**
     * @inheritdoc
     */
    setLength(val) {
        this.length = val;
    }
    /**
     * Set thickness.
     */
    setThickness(val) {
        this.thickness = val;
    }
    /**
     * Get stable mode.
     */
    getStableMode() {
        return this.stableMode;
    }
    /**
     * Set stable mode.
     */
    setStableMode(val) {
        this.stableMode = val;
    }
    /* -----------------------------------------------------------
        COLUMN ITEMS
    ----------------------------------------------------------- */
    get $name() { return this.name; }
    set $name(val) { this.name = val; }
    get $price() { return this.price + ""; }
    set $price(val) { this.price = parseFloat(val); }
    get $width() { return this.width + ""; }
    set $width(val) { this.width = parseFloat(val); }
    get $height() { return this.height + ""; }
    set $height(val) { this.height = parseFloat(val); }
    get $length() { return this.length + ""; }
    set $length(val) { this.length = parseFloat(val); }
    get $thickness() { return this.thickness + ""; }
    set $thickness(val) { this.thickness = parseFloat(val); }
    get $stableMode() { return this.stableMode + ""; }
    set $stableMode(val) { this.stableMode = val === "true"; }
    get $scale() {
        return this.width + ", " + this.height + ", " + this.length;
    }
    get $spaceUtilization() {
        return Math.round(this.getUtilization() * 10000) / 100.0 + "%";
    }
}
packer.Wrapper = Wrapper;
/**
 * A group of {@link Wrapper Wrappers} with same type.
 *
 * @author Jeongho Nam <http://samchon.org>
 */
class WrapperGroup extends packer.WrapperArray {
    constructor(...args) {
        super();
        if (args.length == 0) {
            this.sample = new packer.Wrapper();
        }
        else if (args.length == 1 && args[0] instanceof packer.Wrapper) {
            this.sample = args[0];
        }
        else if (args.length == 6) {
            this.sample = new packer.Wrapper(args[0], args[1], args[2], args[3], args[4], args[5]);
        }
        else if (args.length == 7) {
            this.sample = new packer.Wrapper(args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        }
        this.allocatedInstanceArray = new packer.InstanceArray();
    }
    /* -----------------------------------------------------------
        GETTERS
    ----------------------------------------------------------- */
    /**
     * Key of a WrapperGroup is dependent on its sample.
     */
    key() {
        return this.sample.getName();
    }
    /**
     * Get sample.
     */
    getSample() {
        return this.sample;
    }
    /**
     * Get allocated instances.
     */
    getAllocatedInstanceArray() {
        return this.allocatedInstanceArray;
    }
    /**
     * Get (calculate) price.
     *
     * @return (Price of the sample) x (numbers of children Wrappers)
     */
    getPrice() {
        return this.sample.getPrice() * this.size();
    }
    /**
     * @inheritdoc
     */
    getUtilization() {
        var utilization = 0.0;
        for (var i = 0; i < this.size(); i++)
            utilization += this.at(i).getUtilization();
        return utilization / this.size();
    }
    /* -----------------------------------------------------------
        OPERATORS
    ----------------------------------------------------------- */
    /**
     * <p> Allocate instance(s) to the WrapperGroup. </p>
     *
     * <p> Inspect the instance is enough small to be wrapped into an empty wrapper. If the instance
     * is enough small, registers the instance (or repeated instances) to the {@link reserveds} and
     * returns <code>true</code>. If the instance is too large to be capsuled, returns <code>false</code>. </p>
     *
     * <h4>Note</h4>
     * <p> The word <u>the instance is enough small to be wrapped into the empty wrapper</u> means
     * the instance can be contained into an empty, a new wrapper contaning nothing literally. </p>
     *
     * <p> In the method allocate(), it doesn't consider how many instances are wrapped into ordinary
     * wrapper and how much volumes are consumed.  </p>
     *
     * @param instance An Instance to allocate.
     * @param n Repeating number of the <i>instance</i>.
     *
     * @return Whether the instance is enough small to be wrapped into a (new) wrapper
     *		   of same type with the sample.
     */
    allocate(instance, n) {
        if (n === void 0) {
            n = 1;
        }
        // TEST WHETHER A PRODUCT IS NOT LARGER THAN BOX
        if (this.sample.containable(instance) == false)
            return false;
        // INSERTS TO THE RESERVED ITEMS
        this.allocatedInstanceArray.insert(this.allocatedInstanceArray.end(), n, instance);
        return true;
    }
    /**
     * <p> Run optimization in level of the group. </p>
     *
     * <p> The optimization routine begins by creating a {@link Wrapper} like the {@link sample}. Then
     * try to pack {@link allocatedInstanceArray allocated instances} to the {@link Wrapper} as a lot as
     * possible. If there're some {@link Wrappers} can't be packed by overloading, then create a new
     * {@link Wrapper} again and try to pack {@link allocatedInstanceArray instances} again, too. </p>
     *
     * <p> Repeats those steps until all {@link alloctedInstanceArray instances} are {@link Wrap packed}
     * so that there's not any {@link Instance instance} left. </p>
     *
     * <h4> Warning </h4>
     * <p> When call this {@link optimize optimize()} method, ordinary children {@link Wrapper} objects
     * in the {@link WrapperGroup} will be substituted with the newly optimized {@link Wrapper} objects. </p>
     */
    optimize() {
        this.clear();
        var instanceArray = new packer.InstanceArray();
        instanceArray.assign(this.allocatedInstanceArray.begin(), this.allocatedInstanceArray.end());
        while (instanceArray.empty() == false) {
            var prevSize = instanceArray.size();
            instanceArray = this.pack(instanceArray);
            if (instanceArray.size() >= prevSize)
                break; // No progress — avoid infinite loop
        }
    }
    /**
     * <p> Wrap allocated instances into <b>a new</b> {@link Wrapper}. </p>
     *
     * <p> {@link Wrap Wraps} instances to a new Wrapper which is copied from the sample. </p>
     * <p> After the wrapping is done, the new {@link Wrapper} is registered to the {@link WrapperGroup}
     * as a child and instances failed to wrap by overloading is returned. </p>
     *
     * @param instanceArray instances to {@link Wrap wrap} into <b>a new</b> {@link Wrapper}.
     *
     * @return Instances failed to {@link Wrap wrap} by overloading.
     * @see boxologic
     */
    pack(instanceArray) {
        var boxo = new boxologic.Boxologic(new packer.Wrapper(this.sample), instanceArray, this.options);
        var resultPair = boxo.pack();
        this.push_back(resultPair.first);
        return resultPair.second;
    }
}
packer.WrapperGroup = WrapperGroup;
/**
 * <p> Public API: Calculates the support ratio for a box at a given position. </p>
 * <p> Used by external validators (e.g., test code) to verify stability constraints. </p>
 */
packer.calculateSupportRatio = calculateSupportRatio;
// EXPORTS
exports.default = bws.packer;

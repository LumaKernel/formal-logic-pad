import { describe, expect, it } from "vitest";
import {
  computeObjectSnap,
  DEFAULT_OBJECT_SNAP_THRESHOLD,
  OBJECT_SNAP_DISABLED,
  OBJECT_SNAP_NONE,
  type ObjectSnapConfig,
  type SnapTargetRect,
} from "./objectSnap";
import type { Point, Size } from "./types";

const ENABLED: ObjectSnapConfig = {
  enabled: true,
  threshold: DEFAULT_OBJECT_SNAP_THRESHOLD,
};

const mkRect = (
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
): SnapTargetRect => ({
  id,
  position: { x, y },
  size: { width: w, height: h },
});

describe("computeObjectSnap", () => {
  describe("disabled / trivial cases", () => {
    it("returns candidatePosition unchanged when disabled", () => {
      const pos: Point = { x: 50, y: 50 };
      const size: Size = { width: 100, height: 40 };
      const targets = [mkRect("a", 200, 200, 100, 40)];
      const result = computeObjectSnap(
        pos,
        size,
        "dragged",
        targets,
        OBJECT_SNAP_DISABLED,
      );
      expect(result.snappedPosition).toEqual(pos);
      expect(result.guides).toEqual([]);
    });

    it("returns candidatePosition when no targets", () => {
      const pos: Point = { x: 50, y: 50 };
      const size: Size = { width: 100, height: 40 };
      const result = computeObjectSnap(pos, size, "dragged", [], ENABLED);
      expect(result.snappedPosition).toEqual(pos);
      expect(result.guides).toEqual([]);
    });

    it("excludes dragged item from targets by id", () => {
      const pos: Point = { x: 50, y: 50 };
      const size: Size = { width: 100, height: 40 };
      // Only target has the same id as dragged item
      const targets = [mkRect("dragged", 50, 50, 100, 40)];
      const result = computeObjectSnap(pos, size, "dragged", targets, ENABLED);
      expect(result.snappedPosition).toEqual(pos);
      expect(result.guides).toEqual([]);
    });

    it("OBJECT_SNAP_NONE has zero position and empty guides", () => {
      expect(OBJECT_SNAP_NONE.snappedPosition).toEqual({ x: 0, y: 0 });
      expect(OBJECT_SNAP_NONE.guides).toEqual([]);
    });
  });

  describe("left-edge snap", () => {
    it("snaps dragged left edge to target left edge", () => {
      // Target at x=100, dragged candidate at x=105 (within threshold 8)
      const target = mkRect("t1", 100, 200, 80, 40);
      const pos: Point = { x: 105, y: 50 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition.x).toBe(100);
    });

    it("snaps dragged left edge to target right edge", () => {
      // Target right edge = 100 + 80 = 180; dragged candidate x=183 (within 8)
      const target = mkRect("t1", 100, 200, 80, 40);
      const pos: Point = { x: 183, y: 50 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition.x).toBe(180);
    });
  });

  describe("right-edge snap", () => {
    it("snaps dragged right edge to target left edge", () => {
      // Target at x=200. Dragged width=60, so right edge = pos.x + 60.
      // For right edge to align with 200: pos.x + 60 = 200 → pos.x = 140.
      // Candidate at 143 → distance 3 (within 8)
      const target = mkRect("t1", 200, 100, 80, 40);
      const pos: Point = { x: 143, y: 50 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition.x).toBe(140);
    });

    it("snaps dragged right edge to target right edge", () => {
      // Target right = 200+80=280. Dragged right = pos.x+60.
      // Snap: pos.x+60=280 → pos.x=220. Candidate at 223 (within 8)
      const target = mkRect("t1", 200, 100, 80, 40);
      const pos: Point = { x: 223, y: 50 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition.x).toBe(220);
    });
  });

  describe("center snap", () => {
    it("snaps dragged center-x to target center-x", () => {
      // Target center-x = 100 + 80/2 = 140.
      // Dragged center-x = pos.x + 60/2 = pos.x + 30.
      // Snap: pos.x + 30 = 140 → pos.x = 110. Candidate at 113 (within 8)
      const target = mkRect("t1", 100, 200, 80, 40);
      const pos: Point = { x: 113, y: 50 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition.x).toBe(110);
    });

    it("snaps dragged center-y to target center-y", () => {
      // Target center-y = 200 + 40/2 = 220.
      // Dragged height=20, center-y offset = 10.
      // Candidate y=213 → dragged center-y = 223 → dist to 220 = 3
      // Also check edges: top=213 dist to 200=13, dist to 220=7, dist to 240=27
      //   bottom=233 dist to 200=33, dist to 220=13, dist to 240=7
      // center-to-center dist=3 wins
      // Snap: pos.y = 220-10 = 210
      const target = mkRect("t1", 100, 200, 80, 40);
      const pos: Point = { x: 300, y: 213 };
      const size: Size = { width: 60, height: 20 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition.y).toBe(210);
    });
  });

  describe("vertical (Y-axis) snapping", () => {
    it("snaps dragged top edge to target top edge", () => {
      // Target top=100. Dragged top=pos.y, height=30.
      // Candidate y=102 → top dist to 100=2
      //   center=102+15=117 dist to target center(120)=3, to top(100)=17
      //   bottom=132 dist to target bottom(140)=8
      // top-to-top dist=2 wins → snap pos.y=100
      const target = mkRect("t1", 200, 100, 80, 40);
      const pos: Point = { x: 50, y: 102 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition.y).toBe(100);
    });

    it("snaps dragged bottom edge to target bottom edge", () => {
      // Target bottom = 100+40=140. Dragged bottom = pos.y+30.
      // Snap: pos.y+30=140 → pos.y=110. Candidate at 113 (within 8)
      const target = mkRect("t1", 200, 100, 80, 40);
      const pos: Point = { x: 50, y: 113 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition.y).toBe(110);
    });
  });

  describe("threshold behavior", () => {
    it("does not snap when distance exceeds threshold", () => {
      const target = mkRect("t1", 100, 100, 80, 40);
      // Distance from left edge: |50-100| = 50, way above 8
      const pos: Point = { x: 50, y: 50 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition).toEqual(pos);
      expect(result.guides).toEqual([]);
    });

    it("uses custom threshold", () => {
      const target = mkRect("t1", 100, 100, 80, 40);
      // Distance = |90-100| = 10. Default threshold 8 would miss, custom 12 hits
      const pos: Point = { x: 90, y: 50 };
      const size: Size = { width: 60, height: 30 };
      const customConfig: ObjectSnapConfig = { enabled: true, threshold: 12 };
      const result = computeObjectSnap(pos, size, "d", [target], customConfig);
      expect(result.snappedPosition.x).toBe(100);
    });

    it("does not snap with custom threshold too small", () => {
      const target = mkRect("t1", 100, 100, 80, 40);
      const pos: Point = { x: 96, y: 50 };
      const size: Size = { width: 60, height: 30 };
      const customConfig: ObjectSnapConfig = { enabled: true, threshold: 2 };
      const result = computeObjectSnap(pos, size, "d", [target], customConfig);
      expect(result.snappedPosition.x).toBe(96);
    });
  });

  describe("closest snap wins", () => {
    it("picks the nearest target edge when multiple targets are within threshold", () => {
      const t1 = mkRect("t1", 100, 200, 80, 40);
      const t2 = mkRect("t2", 103, 200, 80, 40); // left edge 103
      // Dragged candidate x=104 → dist to t1(100)=4, dist to t2(103)=1 → t2 wins
      const pos: Point = { x: 104, y: 50 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [t1, t2], ENABLED);
      expect(result.snappedPosition.x).toBe(103);
    });
  });

  describe("simultaneous X and Y snap", () => {
    it("snaps both axes independently", () => {
      const target = mkRect("t1", 100, 200, 80, 40);
      // X: left-to-left, distance=|104-100|=4 → snap x=100
      // Y: top-to-top, distance=|202-200|=2 → snap y=200
      //   (center dist=|217-220|=3, bottom dist=|232-240|=8 → top wins)
      const pos: Point = { x: 104, y: 202 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition).toEqual({ x: 100, y: 200 });
      expect(result.guides).toHaveLength(2);
    });
  });

  describe("alignment guides", () => {
    it("produces a vertical guide for x-axis snap", () => {
      const target = mkRect("t1", 100, 200, 80, 40);
      // Snap left-to-left at x=100
      const pos: Point = { x: 103, y: 50 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.guides).toHaveLength(1);
      const guide = result.guides[0]!;
      expect(guide.axis).toBe("vertical");
      expect(guide.value).toBe(100);
      // Guide extends from min y of all rects to max y
      expect(guide.from).toBe(50); // dragged item top (snapped y=50 unchanged)
      expect(guide.to).toBe(240); // target bottom = 200+40=240
    });

    it("produces a horizontal guide for y-axis snap", () => {
      // Target: y=100, height=40 → center=120, bottom=140
      // Dragged: height=30, candidate y=101
      //   top=101 dist to 100=1 → wins (center=116 dist to 120=4, bottom=131 dist to 140=9)
      // Snap: pos.y=100, guide at y=100
      const target = mkRect("t1", 200, 100, 80, 40);
      const pos: Point = { x: 50, y: 101 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.guides).toHaveLength(1);
      const guide = result.guides[0]!;
      expect(guide.axis).toBe("horizontal");
      expect(guide.value).toBe(100);
      // Guide extends from min x to max x
      expect(guide.from).toBe(50); // dragged left
      expect(guide.to).toBe(280); // target right = 200+80
    });

    it("guide extent covers multiple aligned targets", () => {
      // Two targets with same left edge x=100 at different Y positions
      const t1 = mkRect("t1", 100, 50, 80, 40);
      const t2 = mkRect("t2", 100, 300, 80, 40);
      const pos: Point = { x: 103, y: 150 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [t1, t2], ENABLED);
      // Both t1 and t2 match at same snap position → only 1 vertical guide
      expect(result.snappedPosition.x).toBe(100);
      const verticalGuides = result.guides.filter((g) => g.axis === "vertical");
      expect(verticalGuides).toHaveLength(1);
      // But since findBestSnap picks the first match and then only adds same-snappedValue
      // targets, both should be collected
      const guide = verticalGuides[0]!;
      expect(guide.value).toBe(100);
      // Extent: min of all y (t1.y=50) to max (t2.y+40=340)
      expect(guide.from).toBe(50);
      expect(guide.to).toBe(340);
    });
  });

  describe("edge cases", () => {
    it("handles zero-size items", () => {
      const target = mkRect("t1", 100, 100, 0, 0);
      const pos: Point = { x: 103, y: 103 };
      const size: Size = { width: 0, height: 0 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition).toEqual({ x: 100, y: 100 });
    });

    it("handles negative position values", () => {
      // Target: x=-100, y=-200, size=(80,40)
      // Dragged: candidate (-98,-201), size=(60,30)
      // X: left=-98 dist to -100=2 (center=-68 dist to -60=8, right=-38 dist to -20=18)
      //   → left-to-left wins, snap x=-100
      // Y: top=-201 dist to -200=1 (center=-186 dist to -180=6, bottom=-171 dist to -160=11)
      //   → top-to-top wins, snap y=-200
      const target = mkRect("t1", -100, -200, 80, 40);
      const pos: Point = { x: -98, y: -201 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition.x).toBe(-100);
      expect(result.snappedPosition.y).toBe(-200);
    });

    it("snaps to the closest of multiple edges of the same target", () => {
      // Target: x=100, center=140, right=180. width=80
      // Dragged center = pos.x+30. Candidate x=105 → center=135
      //  left-to-left: |105-100|=5
      //  left-to-center: |105-140|=35
      //  center-to-left: |135-100|=35
      //  center-to-center: |135-140|=5
      // Both dist=5, but left-to-left snaps to pos.x=100, center-to-center snaps to pos.x=110
      // left-to-left comes first → pos.x=100
      const target = mkRect("t1", 100, 200, 80, 40);
      const pos: Point = { x: 105, y: 300 };
      const size: Size = { width: 60, height: 30 };
      const result = computeObjectSnap(pos, size, "d", [target], ENABLED);
      expect(result.snappedPosition.x).toBe(100);
    });
  });
});

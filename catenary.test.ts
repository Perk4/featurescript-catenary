import assert from "node:assert/strict";
import { test } from "node:test";
import { sampleCatenary, type Vec3 } from "./catenary.ts";

const EPS = 1e-12;

function dist(a: Vec3, b: Vec3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function vecClose(actual: Vec3, expected: Vec3, tol: number): void {
  assert.ok(dist(actual, expected) <= tol, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

test("endpoints match start and end", () => {
  const start = { x: 1, y: 2, z: 3 };
  const end = { x: 4, y: 0, z: -1 };
  const pts = sampleCatenary({ start, end, sag: 0.5, sampleCount: 7 });
  vecClose(pts[0], start, EPS);
  vecClose(pts[pts.length - 1], end, EPS);
});

test("odd sampleCount midpoint drops exactly sag from the chord midpoint", () => {
  const start = { x: 0, y: 0, z: 0 };
  const end = { x: 3, y: 1, z: 0 };
  const sag = 0.4;
  const sampleCount = 33;
  const pts = sampleCatenary({ start, end, sag, sampleCount });
  const mid = pts[(sampleCount - 1) / 2];
  const chordMid = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2,
    z: (start.z + end.z) / 2,
  };
  assert.ok(Math.abs(dist(mid, chordMid) - sag) <= EPS);
});

test("horizontal chord samples a true catenary", () => {
  const a = 2;
  const L = 4;
  const start = { x: -2, y: 0, z: 0 };
  const end = { x: 2, y: 0, z: 0 };
  const sag = a * (Math.cosh(L / (2 * a)) - 1);
  const pts = sampleCatenary({ start, end, sag, sampleCount: 9 });
  const c = -a * Math.cosh(L / (2 * a));
  for (const p of pts) {
    const y = a * Math.cosh(p.x / a) + c;
    assert.ok(Math.abs(p.y - y) < 1e-9);
  }
});

test("throws on coincident endpoints, non-positive sag, sampleCount < 3, and a vertical chord", () => {
  const start = { x: 0, y: 0, z: 0 };
  const end = { x: 1, y: 0, z: 0 };
  assert.throws(
    () => sampleCatenary({ start: { x: 1, y: 2, z: 3 }, end: { x: 1, y: 2, z: 3 }, sag: 0.1 }),
    { message: "start and end coincide" },
  );
  assert.throws(
    () => sampleCatenary({ start, end, sag: 0 }),
    { message: "sag must be positive" },
  );
  assert.throws(
    () => sampleCatenary({ start, end, sag: -0.2 }),
    { message: "sag must be positive" },
  );
  assert.throws(
    () => sampleCatenary({ start, end, sag: 0.1, sampleCount: 2 }),
    { message: "sampleCount must be an integer >= 3" },
  );
  assert.throws(
    () => sampleCatenary({ start, end, sag: 0.1, sampleCount: 3.5 }),
    { message: "sampleCount must be an integer >= 3" },
  );
  assert.throws(
    () => sampleCatenary({ start: { x: 0, y: 0, z: 0 }, end: { x: 0, y: 5, z: 0 }, sag: 0.1 }),
    { message: "chord is vertical: hang direction is undefined" },
  );
});

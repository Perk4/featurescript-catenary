export interface Vec3 {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface SampleCatenaryArgs {
  readonly start: Vec3;
  readonly end: Vec3;
  readonly sag: number;
  readonly sampleCount?: number;
}

const DEFAULT_SAMPLE_COUNT = 33;
const EPS_LENGTH = 1e-12;
const EPS_DIRECTION = 1e-12;
const EPS_RATIO = 1e-12;
const DOWN: Vec3 = { x: 0, y: -1, z: 0 };

export function sampleCatenary(args: SampleCatenaryArgs): Vec3[] {
  const n = args.sampleCount ?? DEFAULT_SAMPLE_COUNT;
  if (!Number.isInteger(n) || n < 3) {
    throw new Error("sampleCount must be an integer >= 3");
  }
  if (args.sag <= 0) {
    throw new Error("sag must be positive");
  }
  const chord = sub(args.end, args.start);
  const chordLength = norm(chord);
  if (chordLength < EPS_LENGTH) {
    throw new Error("start and end coincide");
  }
  const hang = hangDirection(args.start, args.end);
  const k = solveK(args.sag / chordLength);
  const points: Vec3[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    // (1-t)A + tB is exact at the ends; A + t(B-A) is not.
    const base = lerp(args.start, args.end, t);
    points.push(add(base, scale(hang, args.sag * profile(t, k))));
  }
  return points;
}

function hangDirection(start: Vec3, end: Vec3): Vec3 {
  const chord = sub(end, start);
  const u = scale(chord, 1 / norm(chord));
  const h = sub(DOWN, scale(u, dot(DOWN, u)));
  const hLen = norm(h);
  if (hLen < EPS_DIRECTION) {
    throw new Error("chord is vertical: hang direction is undefined");
  }
  return scale(h, 1 / hLen);
}

function coshSagRatio(k: number): number {
  return (Math.cosh(k) - 1) / (2 * k);
}

function solveK(sagRatio: number): number {
  if (sagRatio < EPS_RATIO) {
    // cosh differences cancel here; 4t(1-t) is the analytic k->0 limit
    return 0;
  }
  let hi = 1;
  while (coshSagRatio(hi) < sagRatio && hi < 512) {
    hi *= 2;
  }
  if (coshSagRatio(hi) < sagRatio) {
    throw new Error("sag too large for chord");
  }
  let lo = 0;
  for (let i = 0; i < 64; i++) {
    const mid = (lo + hi) / 2;
    if (coshSagRatio(mid) < sagRatio) {
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return (lo + hi) / 2;
}

function profile(t: number, k: number): number {
  if (k === 0) {
    return 4 * t * (1 - t);
  }
  return (Math.cosh(k * (2 * t - 1)) - Math.cosh(k)) / (1 - Math.cosh(k));
}

function lerp(a: Vec3, b: Vec3, t: number): Vec3 {
  return {
    x: (1 - t) * a.x + t * b.x,
    y: (1 - t) * a.y + t * b.y,
    z: (1 - t) * a.z + t * b.z,
  };
}

function add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function norm(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

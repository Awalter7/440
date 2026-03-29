import { useMemo } from "react";

// ---------------------------------------------------------------------------
// Seeded PRNG  (Mulberry32 — fast, good distribution)
// ---------------------------------------------------------------------------
function mulberry32(seed) {
  let s = seed >>> 0; // local copy — never mutate the parameter
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function randInRange(rng, min, max) {
  return min + rng() * (max - min);
}

function randParam(rng, def) {
  return randInRange(rng, def.min, def.max);
}

// ---------------------------------------------------------------------------
// Cloud type definitions
// Each definition has:
//   params  — { key: { min, max } }   (uniform random range for that param)
//   generate(params, rng) → SphereData[]
//
// SphereData: { position: [x, y, z], args: [radius, widthSegments, heightSegments] }
// ---------------------------------------------------------------------------
const CLOUD_TYPES = {
  // ── Cumulus ───────────────────────────────────────────────────────────────
  // Puffy fair-weather clouds. Flat base, domed top.
  // Spheres biased upward with a power curve; cluster narrows toward the top.
  cumulus: {
    params: {
      count:        { min: 12, max: 50 },
      baseRadius:   { min: 0.35, max: 0.90 },
      spreadX:      { min: 1.0,  max: 3.0  },
      spreadY:      { min: 0.5,  max: 1.6  },
      spreadZ:      { min: 0.6,  max: 1.8  },
      vertBias:     { min: 0.4,  max: 0.9  }, // higher → more spheres near top
      sizeVariance: { min: 0.2,  max: 0.7  },
    },
    generate(p, rng) {
      const spheres = [];
      const n = Math.round(p.count);
      for (let i = 0; i < n; i++) {
        const y =
          Math.pow(rng(), 1 / (1 + p.vertBias * 3)) * p.spreadY * (1 - Math.abs(rng() - 0.5) * 1.2) -
          p.spreadY * 0.15;
        const r2 = 1 - Math.pow(y / p.spreadY, 2);
        const xz = Math.sqrt(Math.max(0, r2));
        const ang = rng() * Math.PI * 2;
        const rad = (rng() * 0.7 + 0.3) * xz;
        const x = Math.cos(ang) * rad * p.spreadX;
        const z = Math.sin(ang) * rad * p.spreadZ;
        const radius = Math.max(
          0.1,
          p.baseRadius * (1 - p.sizeVariance * rng() * 0.8) * (1 - 0.3 * Math.abs(y / p.spreadY))
        );
        spheres.push({ position: [x, y, z], args: [radius, 8, 6] });
      }
      return spheres;
    },
  },

  // ── Stratus ───────────────────────────────────────────────────────────────
  // Flat, layered sheets. Wide horizontal extent, thin vertical profile.
  stratus: {
    params: {
      count:       { min: 30, max: 100 },
      baseRadius:  { min: 0.25, max: 0.75 },
      spreadX:     { min: 2.0,  max: 5.0  },
      spreadY:     { min: 0.05, max: 0.35 }, // very thin
      spreadZ:     { min: 1.5,  max: 3.5  },
      layerCount:  { min: 1,    max: 4    },
      density:     { min: 0.4,  max: 1.0  },
    },
    generate(p, rng) {
      const spheres = [];
      const n = Math.round(p.count);
      const nl = Math.max(1, Math.round(p.layerCount));
      for (let i = 0; i < n; i++) {
        if (rng() > p.density) continue;
        const layer = Math.floor(rng() * nl);
        const ly = (layer / nl) * p.spreadY * 2 - p.spreadY;
        const x = (rng() * 2 - 1) * p.spreadX;
        const z = (rng() * 2 - 1) * p.spreadZ;
        const y = ly + (rng() - 0.5) * p.spreadY * 0.6;
        const radius = Math.max(0.08, p.baseRadius * (rng() * 0.4 * p.density + 0.6));
        spheres.push({ position: [x, y, z], args: [radius, 8, 6] });
      }
      return spheres;
    },
  },

  // ── Cirrus ────────────────────────────────────────────────────────────────
  // High-altitude wispy streaks and tendrils.
  // Spheres placed along curling arcs; size fades toward the tip.
  cirrus: {
    params: {
      streaks:          { min: 2,    max: 8    },
      spheresPerStreak: { min: 5,    max: 18   },
      baseRadius:       { min: 0.07, max: 0.25 },
      streakLen:        { min: 1.2,  max: 4.0  },
      curlAmt:          { min: 0.1,  max: 1.4  },
      spreadY:          { min: 0.1,  max: 0.6  },
      fadeEdge:         { min: 0.3,  max: 0.9  },
    },
    generate(p, rng) {
      const spheres = [];
      const ns = Math.round(p.streaks);
      const np = Math.round(p.spheresPerStreak);
      for (let s = 0; s < ns; s++) {
        const ox = (rng() * 2 - 1) * 2.5;
        const oz = (rng() * 2 - 1) * 1.2;
        const oy = (rng() * 2 - 1) * p.spreadY;
        const ang = rng() * Math.PI * 2;
        const curl = p.curlAmt * (rng() * 2 - 1);
        for (let i = 0; i < np; i++) {
          const t = i / Math.max(1, np - 1);
          const ca = ang + curl * t * Math.PI;
          const x = ox + Math.cos(ca) * t * p.streakLen;
          const z = oz + Math.sin(ca) * t * p.streakLen * 0.4;
          const y = oy + t * 0.3 * (rng() - 0.5);
          const fade = Math.max(0, 1 - Math.pow(t, 1 / Math.max(0.01, 1 - p.fadeEdge)));
          const radius = p.baseRadius * fade * (rng() * 0.3 + 0.7);
          if (radius > 0.04) spheres.push({ position: [x, y, z], args: [radius, 6, 5] });
        }
      }
      return spheres;
    },
  },

  // ── Cumulonimbus ──────────────────────────────────────────────────────────
  // Towering storm cloud with a wide anvil top.
  // Two passes: a narrowing tower + a flat radial anvil fan.
  cumulonimbus: {
    params: {
      count:       { min: 30, max: 90  },
      baseRadius:  { min: 0.3,  max: 0.8  },
      towerHeight: { min: 1.5,  max: 4.0  },
      baseWidth:   { min: 0.8,  max: 2.0  },
      anvilSpread: { min: 0.8,  max: 2.8  },
      anvilThick:  { min: 0.1,  max: 0.5  },
      turbulence:  { min: 0.0,  max: 0.8  },
    },
    generate(p, rng) {
      const spheres = [];
      const n = Math.round(p.count);
      const anvilN = Math.round(n * 0.25);
      const towerN = n - anvilN;

      // Tower pass
      for (let i = 0; i < towerN; i++) {
        const t = rng();
        const narrowFactor = 1 - t * 0.6;
        const ang = rng() * Math.PI * 2;
        const rad = (rng() * 0.8 + 0.2) * p.baseWidth * narrowFactor;
        const x = Math.cos(ang) * rad + (rng() - 0.5) * p.turbulence * 0.3;
        const z = Math.sin(ang) * rad * 0.7 + (rng() - 0.5) * p.turbulence * 0.3;
        const y = t * p.towerHeight - p.towerHeight * 0.4 + (rng() - 0.5) * p.turbulence * 0.4;
        const radius = Math.max(0.1, p.baseRadius * (1.1 - t * 0.3) * (rng() * 0.3 + 0.7));
        spheres.push({ position: [x, y, z], args: [radius, 8, 6] });
      }

      // Anvil pass
      const topY = p.towerHeight * 0.6;
      for (let i = 0; i < anvilN; i++) {
        const ang = rng() * Math.PI * 2;
        const rad = (rng() * 0.7 + 0.15) * p.anvilSpread;
        const x = Math.cos(ang) * rad;
        const z = Math.sin(ang) * rad * 0.5;
        const y = topY + (rng() - 0.5) * p.anvilThick;
        const radius = Math.max(0.08, p.baseRadius * 0.6 * (rng() * 0.4 + 0.6));
        spheres.push({ position: [x, y, z], args: [radius, 8, 6] });
      }

      return spheres;
    },
  },

  // ── Altocumulus ───────────────────────────────────────────────────────────
  // Mid-level cloud arranged in a regular grid of puffs, warped by a sine wave.
  altocumulus: {
    params: {
      rows:        { min: 2, max: 5    },
      cols:        { min: 3, max: 9    },
      baseRadius:  { min: 0.18, max: 0.55 },
      rowSpacing:  { min: 0.5,  max: 1.4  },
      colSpacing:  { min: 0.5,  max: 1.4  },
      jitter:      { min: 0.0,  max: 0.6  },
      waviness:    { min: 0.0,  max: 0.7  },
    },
    generate(p, rng) {
      const spheres = [];
      const nr = Math.round(p.rows);
      const nc = Math.round(p.cols);
      for (let r = 0; r < nr; r++) {
        for (let c = 0; c < nc; c++) {
          const bx = (c - (nc - 1) / 2) * p.colSpacing;
          const bz = (r - (nr - 1) / 2) * p.rowSpacing;
          const wave = Math.sin(c * 1.2 + r * 0.9) * p.waviness * 0.4;
          const jx = (rng() - 0.5) * p.jitter;
          const jz = (rng() - 0.5) * p.jitter;
          const jy = (rng() - 0.5) * p.jitter * 0.5 + wave;
          const mainR = p.baseRadius * (rng() * 0.25 + 0.75);
          spheres.push({ position: [bx + jx, jy, bz + jz], args: [mainR, 8, 6] });
          const extras = Math.floor(rng() * 3) + 1;
          for (let e = 0; e < extras; e++) {
            const eang = rng() * Math.PI * 2;
            const erad = rng() * mainR * 0.9;
            spheres.push({
              position: [bx + jx + Math.cos(eang) * erad, jy + (rng() - 0.5) * 0.2, bz + jz + Math.sin(eang) * erad],
              args: [mainR * (rng() * 0.4 + 0.4), 8, 6],
            });
          }
        }
      }
      return spheres;
    },
  },
};

const CLOUD_TYPE_KEYS = Object.keys(CLOUD_TYPES);

// ---------------------------------------------------------------------------
// Main component / hook
// ---------------------------------------------------------------------------

/**
 * useProceduralCloud(seed?)
 *
 * Returns:
 *   {
 *     type:    string                          — cloud type name
 *     params:  Record<string, number>          — randomised parameter values used
 *     spheres: Array<{
 *       position: [x: number, y: number, z: number],
 *       args:     [radius: number, widthSegments: number, heightSegments: number]
 *     }>
 *   }
 *
 * Pass a numeric `seed` for a deterministic result; omit for a random one.
 */
export function useProceduralCloud(seed) {
  return useMemo(() => generateCloud(seed), [seed]);
}

/**
 * generateCloud(seed?)
 *
 * Plain function version — use this outside of React or when you want to
 * call it imperatively (e.g. on a button click).
 *
 * Returns the same shape as useProceduralCloud.
 */
export function generateCloud(seed) {
  const rootSeed = seed !== undefined ? seed : Math.random() * 0xffffffff;
  const rng = mulberry32(rootSeed >>> 0);

  // Pick a random cloud type
  const typeKey = CLOUD_TYPE_KEYS[Math.floor(rng() * CLOUD_TYPE_KEYS.length)];
  const def = CLOUD_TYPES[typeKey];

  // Randomise every parameter within its defined range
  const params = {};
  for (const [key, range] of Object.entries(def.params)) {
    params[key] = randParam(rng, range);
  }

  // Generate sphere data
  const spheres = def.generate(params, rng);

  return { type: typeKey, params, spheres };
}

// ---------------------------------------------------------------------------
// Default export — component wrapper (renders nothing, fires onChange)
// ---------------------------------------------------------------------------

/**
 * <ProceduralCloud seed={42} onChange={({ type, params, spheres }) => …} />
 *
 * A renderless component. Pass `seed` to pin the result; omit for random.
 * `onChange` is called once on mount and again whenever `seed` changes.
 */
export default function ProceduralCloud({ seed, onChange }) {
  const cloud = useProceduralCloud(seed);

  useMemo(() => {
    onChange?.(cloud);
  }, [cloud]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
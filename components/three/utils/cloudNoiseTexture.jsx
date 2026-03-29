/**
 * CloudNoiseTexture
 *
 * A self-contained ES6 class that renders a 3-D cloud noise texture
 * via WebGL (3D value noise → FBM → domain warp → turbulence) onto an
 * offscreen <canvas> and exposes the result as a live WebGLTexture.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Usage
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   const noise = new CloudNoiseTexture({ width: 512, height: 256 });
 *
 *   // Start the render loop
 *   noise.start();
 *
 *   // Read the live texture each frame in your own render loop:
 *   const tex = noise.texture;         // WebGLTexture
 *   const canvas = noise.canvas;       // HTMLCanvasElement
 *   const gl = noise.gl;              // WebGLRenderingContext
 *
 *   // Tweak params at any time (hot — no recompile):
 *   noise.setParams({ warp: 2.5, turbulence: 0.8 });
 *   noise.setDepth(0.42);
 *
 *   // Animate Z automatically:
 *   noise.animate = true;
 *   noise.flySpeed = 0.06;
 *
 *   // Read pixels back to CPU:
 *   const pixels = noise.readPixels();  // Uint8Array, RGBA
 *
 *   // Export current frame as a PNG data URL:
 *   const url = noise.toDataURL();
 *
 *   // Read GLSL source:
 *   console.log(CloudNoiseTexture.VERT_SRC);
 *   console.log(CloudNoiseTexture.FRAG_SRC);
 *
 *   // Stop and free all GPU resources:
 *   noise.destroy();
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Constructor options (all optional)
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   width        {number}   512     Canvas / texture width
 *   height       {number}   256     Canvas / texture height
 *   octaves      {number}   7       FBM octave count (1–12)
 *   lacunarity   {number}   2.0     Frequency multiplier per octave
 *   persistence  {number}   0.5     Amplitude multiplier per octave
 *   scale        {number}   2.8     World-space noise scale
 *   warp         {number}   1.2     Domain-warp strength (0 = disabled)
 *   warpOct      {number}   4       Octaves used for the warp FBM
 *   doubleWarp   {boolean}  true    Run a second warp pass
 *   contrast     {number}   1.6     Output contrast
 *   brightness   {number}   0.0     Output brightness offset
 *   turbulence   {number}   0.55    Turbulence / ridged-noise blend
 *   seed         {number}   42      Hash seed (integer, 0–999)
 *   depth        {number}   0.0     Initial Z-slice position (0–1)
 *   animate      {boolean}  false   Auto-advance depth each frame
 *   flySpeed     {number}   0.04    Z units/second when animate is true
 *   onFrame      {function} null    Called after each draw: ({ depth, dt })
 *   onReady      {function} null    Called once after GL init: (instance)
 */

// ─────────────────────────────────────────────────────────────────────────────
// GLSL
// ─────────────────────────────────────────────────────────────────────────────

const VERT_SRC = /* glsl */`
attribute vec2 a_pos;
varying   vec2 v_uv;
void main() {
  v_uv        = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const FRAG_SRC = /* glsl */`
precision highp float;
varying vec2 v_uv;

uniform float u_depth;
uniform float u_scale;
uniform float u_octaves;
uniform float u_lacunarity;
uniform float u_persistence;
uniform float u_warp;
uniform float u_warpOct;
uniform float u_doubleWarp;
uniform float u_contrast;
uniform float u_brightness;
uniform float u_turbulence;
uniform float u_seed;

// ── 3-D smooth value noise ────────────────────────────────────────────────────
float hash(float n) { return fract(sin(n) * 43758.5453123); }

float noise3(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);   // smoothstep

  float n000 = hash(dot(i + vec3(0,0,0), vec3(1.0,57.0,113.0)) + u_seed);
  float n100 = hash(dot(i + vec3(1,0,0), vec3(1.0,57.0,113.0)) + u_seed);
  float n010 = hash(dot(i + vec3(0,1,0), vec3(1.0,57.0,113.0)) + u_seed);
  float n110 = hash(dot(i + vec3(1,1,0), vec3(1.0,57.0,113.0)) + u_seed);
  float n001 = hash(dot(i + vec3(0,0,1), vec3(1.0,57.0,113.0)) + u_seed);
  float n101 = hash(dot(i + vec3(1,0,1), vec3(1.0,57.0,113.0)) + u_seed);
  float n011 = hash(dot(i + vec3(0,1,1), vec3(1.0,57.0,113.0)) + u_seed);
  float n111 = hash(dot(i + vec3(1,1,1), vec3(1.0,57.0,113.0)) + u_seed);

  return mix(
    mix(mix(n000, n100, u.x), mix(n010, n110, u.x), u.y),
    mix(mix(n001, n101, u.x), mix(n011, n111, u.x), u.y),
    u.z
  ) * 2.0 - 1.0;
}

// ── Fractional Brownian Motion ────────────────────────────────────────────────
float fbm3(vec3 p, float octs, float lac, float per) {
  float val = 0.0, amp = 0.5, freq = 1.0, maxVal = 0.0;
  for (int i = 0; i < 12; i++) {
    if (float(i) >= octs) break;
    val    += noise3(p * freq) * amp;
    maxVal += amp;
    amp    *= per;
    freq   *= lac;
  }
  return val / maxVal;
}

// ── Domain-warped FBM ─────────────────────────────────────────────────────────
float warpedFbm(vec3 p, float octs, float lac, float per,
                float ws, float wo, float dbl) {
  if (ws < 0.001) return fbm3(p, octs, lac, per);

  // First warp: displace p by three independent FBM offsets
  vec3 q = vec3(
    fbm3(p + vec3(0.0, 0.0, 0.0), wo, lac, per),
    fbm3(p + vec3(5.2, 1.3, 2.8), wo, lac, per),
    fbm3(p + vec3(1.7, 9.2, 4.1), wo, lac, per)
  );
  vec3 wp = p + ws * q;

  // Optional second warp pass (deeper swirl)
  if (dbl > 0.5) {
    vec3 r = vec3(
      fbm3(wp + vec3(1.7, 9.2, 5.1), wo, lac, per),
      fbm3(wp + vec3(8.3, 2.8, 3.5), wo, lac, per),
      fbm3(wp + vec3(4.1, 6.7, 0.3), wo, lac, per)
    );
    wp += (ws * 0.5) * r;
  }

  return fbm3(wp, octs, lac, per);
}

// ── Final density sample ──────────────────────────────────────────────────────
float cloudDensity(vec3 p) {
  float v = warpedFbm(
    p * u_scale,
    u_octaves, u_lacunarity, u_persistence,
    u_warp, u_warpOct, u_doubleWarp
  );

  // Turbulence: fold noise → sharp ridges and bright wisps
  if (u_turbulence > 0.01) {
    float t = warpedFbm(
      p * u_scale + vec3(3.1, 0.7, 2.3),
      u_octaves, u_lacunarity, u_persistence,
      0.0, u_warpOct, 0.0
    );
    t = abs(t) * 2.0 - 1.0;
    v = mix(v, t, u_turbulence);
  }

  v = v * 0.5 + 0.5;   // remap [-1,1] → [0,1]
  return clamp((v - 0.5) * u_contrast + 0.5 + u_brightness, 0.0, 1.0);
}

void main() {
  float d = cloudDensity(vec3(v_uv, u_depth));
  gl_FragColor = vec4(vec3(d), 1.0);
}`;

// ─────────────────────────────────────────────────────────────────────────────
// Defaults
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  width:       512,
  height:      256,
  octaves:     7,
  lacunarity:  2.0,
  persistence: 0.5,
  scale:       2.8,
  warp:        1.2,
  warpOct:     4,
  doubleWarp:  true,
  contrast:    1.6,
  brightness:  0.0,
  turbulence:  0.55,
  seed:        42,
  depth:       0.0,
  animate:     false,
  flySpeed:    0.04,
  onFrame:     null,
  onReady:     null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Class
// ─────────────────────────────────────────────────────────────────────────────

export class CloudNoiseTexture {

  // Static GLSL source — readable without instantiation
  static VERT_SRC = VERT_SRC;
  static FRAG_SRC = FRAG_SRC;
  static DEFAULTS = DEFAULTS;

  // ── Constructor ─────────────────────────────────────────────────────────────

  constructor(options = {}) {
    const opts = { ...DEFAULTS, ...options };

    // Public config
    this.width     = opts.width;
    this.height    = opts.height;
    this.animate   = opts.animate;
    this.flySpeed  = opts.flySpeed;
    this.onFrame   = opts.onFrame;
    this.onReady   = opts.onReady;

    // Noise params (mutable via setParams)
    this._params = {
      octaves:     opts.octaves,
      lacunarity:  opts.lacunarity,
      persistence: opts.persistence,
      scale:       opts.scale,
      warp:        opts.warp,
      warpOct:     opts.warpOct,
      doubleWarp:  opts.doubleWarp,
      contrast:    opts.contrast,
      brightness:  opts.brightness,
      turbulence:  opts.turbulence,
      seed:        opts.seed,
    };

    this._depth    = opts.depth;
    this._rafId    = null;
    this._lastTs   = 0;
    this._destroyed = false;

    // GL objects (populated in _init)
    this.canvas    = null;
    this.gl        = null;
    this.texture   = null;
    this._program  = null;
    this._vert     = null;
    this._frag     = null;
    this._uniforms = {};

    this._init();
  }

  // ── Private: GL setup ───────────────────────────────────────────────────────

  _init() {
    // Offscreen canvas
    const canvas = document.createElement("canvas");
    canvas.width  = this.width;
    canvas.height = this.height;
    this.canvas   = canvas;

    const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });
    if (!gl) throw new Error("[CloudNoiseTexture] WebGL not supported.");
    this.gl = gl;

    // Shaders & program
    this._vert    = this._compile(gl.VERTEX_SHADER,   VERT_SRC);
    this._frag    = this._compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    this._program = this._link(this._vert, this._frag);
    gl.useProgram(this._program);

    // Fullscreen quad
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, 1,1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(this._program, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Cache uniform locations
    for (const name of [
      "depth","scale","octaves","lacunarity","persistence",
      "warp","warpOct","doubleWarp","contrast","brightness","turbulence","seed",
    ]) {
      this._uniforms[name] = gl.getUniformLocation(this._program, "u_" + name);
    }

    // Output texture
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    this.texture = tex;

    gl.viewport(0, 0, this.width, this.height);

    if (this.onReady) this.onReady(this);
  }

  _compile(type, src) {
    const gl = this.gl;
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const log = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`[CloudNoiseTexture] Shader compile error:\n${log}`);
    }
    return shader;
  }

  _link(vert, frag) {
    const gl = this.gl;
    const prog = gl.createProgram();
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      const log = gl.getProgramInfoLog(prog);
      gl.deleteProgram(prog);
      throw new Error(`[CloudNoiseTexture] Program link error:\n${log}`);
    }
    return prog;
  }

  // ── Private: draw one frame ─────────────────────────────────────────────────

  _draw(ts) {
    const gl = this.gl;
    const U  = this._uniforms;
    const p  = this._params;

    const dt = this._lastTs ? Math.min((ts - this._lastTs) / 1000, 0.1) : 0;
    this._lastTs = ts;

    if (this.animate) {
      this._depth = (this._depth + this.flySpeed * dt) % 1.0;
    }

    // Upload uniforms
    gl.uniform1f(U.depth,       this._depth);
    gl.uniform1f(U.scale,       p.scale);
    gl.uniform1f(U.octaves,     p.octaves);
    gl.uniform1f(U.lacunarity,  p.lacunarity);
    gl.uniform1f(U.persistence, p.persistence);
    gl.uniform1f(U.warp,        p.warp);
    gl.uniform1f(U.warpOct,     p.warpOct);
    gl.uniform1f(U.doubleWarp,  p.doubleWarp ? 1.0 : 0.0);
    gl.uniform1f(U.contrast,    p.contrast);
    gl.uniform1f(U.brightness,  p.brightness);
    gl.uniform1f(U.turbulence,  p.turbulence);
    gl.uniform1f(U.seed,        p.seed);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // Blit the framebuffer into the texture so consumers can bind it
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.copyTexImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 0, 0, this.width, this.height, 0);

    if (this.onFrame) this.onFrame({ depth: this._depth, dt });
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Start the internal rAF render loop.
   * Returns `this` for chaining.
   */
  start() {
    if (this._rafId !== null || this._destroyed) return this;
    const loop = (ts) => {
      if (this._destroyed) return;
      this._draw(ts);
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
    return this;
  }

  /**
   * Stop the render loop (preserves GL state — call start() to resume).
   * Returns `this` for chaining.
   */
  stop() {
    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    return this;
  }

  /**
   * Draw exactly one frame synchronously (useful when you manage your own loop).
   *   noise.drawFrame(performance.now());
   */
  drawFrame(ts = performance.now()) {
    if (!this._destroyed) this._draw(ts);
    return this;
  }

  /**
   * Update any subset of noise parameters.
   * Changes take effect on the very next draw — no recompile.
   *   noise.setParams({ warp: 2.0, seed: 77 });
   */
  setParams(patch) {
    Object.assign(this._params, patch);
    return this;
  }

  /**
   * Get a copy of the current params object.
   */
  getParams() {
    return { ...this._params };
  }

  /**
   * Set the Z-slice depth (0–1).
   */
  setDepth(d) {
    this._depth = ((d % 1.0) + 1.0) % 1.0;  // wrap to [0,1]
    return this;
  }

  /**
   * Get the current Z-slice depth.
   */
  getDepth() {
    return this._depth;
  }

  /**
   * Read the current frame back to the CPU as a Uint8Array (RGBA).
   * Requires the canvas context to have preserveDrawingBuffer: true (default).
   */
  readPixels() {
    const { gl, width, height } = this;
    const buf = new Uint8Array(width * height * 4);
    gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, buf);
    return buf;
  }

  /**
   * Return the current frame as a PNG data URL.
   *   const url = noise.toDataURL();
   */
  toDataURL(type = "image/png") {
    return this.canvas.toDataURL(type);
  }

  /**
   * Return the compiled GLSL source of either shader from the live program.
   * type: "vertex" | "fragment"
   */
  getShaderSource(type = "fragment") {
    const shader = type === "vertex" ? this._vert : this._frag;
    return this.gl.getShaderSource(shader);
  }

  /**
   * Query a uniform value back from the GPU.
   *   noise.getUniform("warp")  // → 1.2
   */
  getUniform(name) {
    const loc = this._uniforms[name];
    if (!loc) throw new Error(`[CloudNoiseTexture] Unknown uniform: "${name}"`);
    return this.gl.getUniform(this._program, loc);
  }

  /**
   * Randomize all noise params.
   * Returns `this` for chaining.
   */
  randomize() {
    const r = (a, b) => Math.random() * (b - a) + a;
    return this.setParams({
      octaves:     Math.floor(r(4, 11)),
      lacunarity:  r(1.5, 3.0),
      persistence: r(0.3, 0.7),
      scale:       r(1.5, 6.0),
      warp:        r(0.2, 3.0),
      warpOct:     Math.floor(r(2, 7)),
      doubleWarp:  Math.random() > 0.4,
      contrast:    r(0.8, 3.5),
      brightness:  r(-0.2, 0.2),
      turbulence:  r(0.0, 0.9),
      seed:        Math.floor(r(0, 999)),
    });
  }

  /**
   * Free all GPU resources and stop the loop.
   * The instance is unusable after this.
   */
  destroy() {
    this.stop();
    this._destroyed = true;
    const { gl } = this;
    if (gl) {
      gl.deleteTexture(this.texture);
      gl.deleteProgram(this._program);
      gl.deleteShader(this._vert);
      gl.deleteShader(this._frag);
    }
    this.canvas  = null;
    this.gl      = null;
    this.texture = null;
  }

  // ── Getters ─────────────────────────────────────────────────────────────────

  get depth()   { return this._depth; }
  set depth(v)  { this.setDepth(v); }

  get params()  { return this.getParams(); }

  get isRunning() { return this._rafId !== null; }
}

export default CloudNoiseTexture;
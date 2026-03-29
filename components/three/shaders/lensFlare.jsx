import * as THREE from "three"

const lensFlareShader = new THREE.ShaderMaterial({
    uniforms: {
        tDiffuse:       { value: null},
        // tDepth:         { value: null},
        iTime:          { value: 0 },
        lensPosition:   { value: [0.01, 0.01] },
        colorGain:     { value: new THREE.Color(70, 70, 70) },
        iResolution:    { value: [0, 0] },
        starPoints:     { value: 6 },
        glareSize:      { value: 0.2 },
        flareSize:      { value: 0.01 },
        flareSpeed:     { value: 0.01 },
        flareShape:     { value: 0.01 },
        haloScale:      { value: 0.5 },
        maxOpacity:     { value: 0.5 },
        opacity:        { value: 1.0 },
        animated:       { value: true },
        anamorphic:     { value: false },
        enabled:        { value: true },
        secondaryGhosts:{ value: true },
        starBurst:      { value: true },
        ghostScale:     { value: 0.0 },
        aditionalStreaks:{ value: true },
        lensDirtTexture:{ value: null },
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;

        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    fragmentShader: /* glsl */`
        uniform float     iTime;
        uniform vec2      lensPosition;
        uniform vec2      iResolution;
        uniform vec3      colorGain;
        uniform float     starPoints;
        uniform float     glareSize;
        uniform float     flareSize;
        uniform float     flareSpeed;
        uniform float     flareShape;
        uniform float     haloScale;
        uniform float     opacity;
        uniform float     maxOpacity;
        uniform bool      animated;
        uniform bool      anamorphic;
        uniform bool      enabled;
        uniform bool      secondaryGhosts;
        uniform bool      starBurst;
        uniform float     ghostScale;
        uniform bool      aditionalStreaks;

        uniform sampler2D lensDirtTexture;
        // uniform sampler2D tDepth;

        varying vec2 vUv;
        
        vec2 vxtC;
        

        // ─── Noise / Math Utilities ──────────────────────────────────────────────────

        float rndf(float n) {
            return fract(sin(n) * 43758.5453123);
        }

        float niz(float p) {
            float fl = floor(p);
            float fc = fract(p);
            return mix(rndf(fl), rndf(fl + 1.0), fc);
        }

        // HSV → RGB
        vec3 hsv2rgb(vec3 c) {
            vec4 k = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + k.xyz) * 6.0 - k.www);
            return c.z * mix(k.xxx, clamp(p - k.xxx, 0.0, 1.0), c.y);
        }

        float satU(float x) {
            return clamp(x, 0.0, 1.0);
        }

        vec3 satU(vec3 x) {
            return clamp(x, vec3(0.0), vec3(1.0));
        }

        // 2-D rotation
        vec2 rtU(vec2 naz, float rtn) {
            return vec2(
                cos(rtn) * naz.x + sin(rtn) * naz.y,
                cos(rtn) * naz.y - sin(rtn) * naz.x
            );
        }

        float rnd(vec2 p) {
            return fract(sin(dot(p, vec2(12.1234, 72.8392))) * 45123.2);
        }

        float rnd(float w) {
            return fract(sin(w) * 1000.0);
        }

        // ─── Noise ──────────────────────────────────────────────────────────────────

        float diTN(vec2 p) {
            vec2 f = fract(p);
            f = (f * f) * (3.0 - 2.0 * f);
            float n = dot(floor(p), vec2(1.0, 157.0));
            vec4  a = fract(sin(vec4(n + 0.0, n + 1.0, n + 157.0, n + 158.0)) * 43758.5453123);
            return mix(mix(a.x, a.y, f.x), mix(a.z, a.w, f.x), f.y);
        }

        float fbm(vec2 p) {
            const mat2 m = mat2(0.80, -0.60, 0.60, 0.80);
            float f = 0.0;
            f += 0.5000 * diTN(p); p = m * p * 2.02;
            f += 0.2500 * diTN(p); p = m * p * 2.03;
            f += 0.1250 * diTN(p); p = m * p * 2.01;
            f += 0.0625 * diTN(p);
            return f / 0.9375;
        }

        // ─── Flare / Glare ──────────────────────────────────────────────────────────

        // Draw a single flare spike
        vec3 drwF(vec2 p, float intensity, float rnd, float speed, int id) {
            float flhos    = (1.0 / 32.0) * float(id) * 0.1;
            float lingrad  = distance(vec2(0.0), p);
            float expg     = 1.0 / exp(lingrad * (fract(rnd) * 0.66 + 0.33));

            vec3 qzTg = hsv2rgb(vec3(
                fract((expg * 8.0) + speed * flareSpeed + flhos),
                pow(1.0 - abs(expg * 2.0 - 1.0), 0.45),
                20.0 * expg * intensity
            ));

            float internalStarPoints = anamorphic ? 1.0 : starPoints;
            float ams  = length(p * flareShape * sin(internalStarPoints * atan(p.x, p.y)));
            float kJhg = pow(1.0 - satU(ams), anamorphic ? 100.0 : 12.0);

            kJhg += satU(expg - 0.9) * 3.0;
            kJhg  = pow(kJhg * expg, 8.0 + (1.0 - intensity) * 5.0);

            if (flareSpeed > 0.0) {
                return vec3(kJhg) * qzTg;
            } else {
                return vec3(kJhg) * flareSize * 15.0;
            }
        }

        float ams2(vec3 a, vec3 b) {
            return abs(a.x - b.x) + abs(a.y - b.y) + abs(a.z - b.z);
        }

        // Glare ring around the light source
        float glR(vec2 naz, vec2 pos, float zsi) {
            vec2 mni;
            if (animated) {
                mni = rtU(naz - pos, iTime * 0.1);
            } else {
                mni = naz - pos;
            }

            float ang  = atan(mni.y, mni.x) * (anamorphic ? 1.0 : starPoints);
            float ams2 = length(mni);
            ams2 = pow(ams2, 0.9);

            float f0 = 1.0 / (length(naz - pos) * (1.0 / zsi * 16.0) + 0.2);
            return f0 + f0 * (sin(ang) * 0.2 + 0.3);
        }

        // ─── Lens Streaks & Ghosts ──────────────────────────────────────────────────

        float sdHex(vec2 p) {
            p = abs(p);
            vec2 q = vec2(p.x * 2.0 * 0.5773503, p.y + p.x * 0.5773503);
            return dot(step(q.xy, q.yx), 1.0 - q.yx);
        }

        float fpow(float x, float k) {
            return x > k ? pow((x - k) / (1.0 - k), 2.0) : 0.0;
        }

        // Hexagonal ghost reflection
        vec3 rHx(vec2 naz, vec2 p, float s, vec3 col) {
            naz -= p;
            if (abs(naz.x) < 0.2 * s && abs(naz.y) < 0.2 * s) {
                return mix(
                    vec3(0.0),
                    mix(vec3(0.0), col, 0.1 + fpow(length(naz / s), 0.1) * 10.0),
                    smoothstep(0.0, 0.1, sdHex(naz * 20.0 / s))
                );
            }
            return vec3(0.0);
        }

        float rShp(vec2 p, int N) {
            float a = atan(p.x, p.y) + 0.2;
            float b = 6.28319 / float(N);
            return smoothstep(0.5, 0.51,
                cos(floor(0.5 + a / b) * b - a) * length(p.xy) * 2.0 - ghostScale
            );
        }

        // Draw circular ghost
        vec3 drC(vec2 p, float zsi, float dCy, vec3 clr, vec3 clr2, float ams2, vec2 esom) {
            float l  = length(p + esom * (ams2 * 2.0)) + zsi / 2.0;
            float l2 = length(p + esom * (ams2 * 4.0)) + zsi / 3.0;

            float c  = max(0.01 - pow(length(p + esom * ams2), zsi * ghostScale), 0.0) * 10.0;
            float c1 = max(0.001 - pow(l - 0.3, 1.0 / 40.0) + sin(l * 20.0), 0.0) * 3.0;
            float c2 = max(0.09 / pow(length(p - esom * ams2 / 0.5) * 1.0, 0.95), 0.0) / 20.0;
            float s  = max(0.02 - pow(rShp(p * 5.0 + esom * ams2 * 5.0 + dCy, 6), 1.0), 0.0) * 1.5;

            clr = cos(vec3(0.44, 0.24, 0.2) * 8.0 + ams2 * 4.0) * 0.5 + 0.5;

            vec3 f = c * clr;
            f += c1 * clr;
            f += c2 * clr;
            f += s  * clr;
            return f - 0.01;
        }

        // Main lens flare (streaks, glare, flare spike)
        vec3 mLs(vec2 naz, vec2 pos) {
            vec2  mni  = naz - pos;
            vec2  zxMp = naz * length(-naz);
            float ang  = atan(mni.x, mni.y);

            float f0  = 0.3 / (length(naz - pos) * 16.0 + 1.0);
            f0 *= sin(niz(sin(ang * 3.9 - (animated ? iTime : 0.0) * 0.3) * starPoints)) * 0.2;

            float f1  = max(0.01  - pow(length(naz + 1.20 * pos), 1.9  ), 0.0) * 7.0;
            float f2  = max(0.9   / (10.0 + 32.0 * pow(length(zxMp + 0.99 * pos), 2.0)), 0.0) * 0.35;
            float f22 = max(0.9   / (11.0 + 32.0 * pow(length(zxMp + 0.85 * pos), 2.0)), 0.0) * 0.23;
            float f23 = max(0.9   / (12.0 + 32.0 * pow(length(zxMp + 0.95 * pos), 2.0)), 0.0) * 0.6;

            vec2 ztX = mix(naz, zxMp, 0.1);
            float f4  = max(0.01 - pow(length(ztX + 0.40 * pos), 2.9), 0.0) * 4.02;
            float f42 = max(0.0  - pow(length(ztX + 0.45 * pos), 2.9), 0.0) * 4.1;
            float f43 = max(0.01 - pow(length(ztX + 0.50 * pos), 2.9), 0.0) * 4.6;

            ztX = mix(naz, zxMp, -0.4);
            float f5  = max(0.01 - pow(length(ztX + 0.1 * pos), 5.5), 0.0) * 2.0;
            float f52 = max(0.01 - pow(length(ztX + 0.2 * pos), 5.5), 0.0) * 2.0;
            float f53 = max(0.01 - pow(length(ztX + 0.1 * pos), 5.5), 0.0) * 2.0;

            ztX = mix(naz, zxMp, 2.1);
            float f6  = max(0.01 - pow(length(ztX - 0.300 * pos), 1.610), 0.0) * 3.159;
            float f62 = max(0.01 - pow(length(ztX - 0.325 * pos), 1.614), 0.0) * 3.14;
            float f63 = max(0.01 - pow(length(ztX - 0.389 * pos), 1.623), 0.0) * 3.12;

            vec3 c = vec3(glR(naz, pos, glareSize));

            vec2 prot;
            if (animated) {
                prot = rtU(naz - pos, iTime * 0.1);
            } else if (anamorphic) {
                prot = rtU(naz - pos, 1.570796);
            } else {
                prot = naz - pos;
            }

            c += drwF(prot, anamorphic ? flareSize * 10.0 : flareSize, 0.1, iTime, 1);

            c.r += f1 + f2  + f4  + f5  + f6;
            c.g += f1 + f22 + f42 + f52 + f62;
            c.b += f1 + f23 + f43 + f53 + f63;

            c = c * 1.3 * vec3(length(zxMp) + 0.09);
            c += vec3(f0);
            return c;
        }

        // ─── LUT / Color Grading ────────────────────────────────────────────────────

        vec3 cc(vec3 clr, float fct, float fct2) {
            float w = clr.x + clr.y + clr.z;
            return mix(clr, vec3(w) * fct, w * fct2);
        }

        // Gradient LUT for lens color fringing
        vec4 geLC(float x) {
            return vec4(vec3(
                mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(mix(
                    vec3(0.0,   0.0,   0.0  ),
                    vec3(0.0,   0.0,   0.0  ), smoothstep(0.000, 0.063, x)),
                    vec3(0.0,   0.0,   0.0  ), smoothstep(0.063, 0.125, x)),
                    vec3(0.0,   0.0,   0.0  ), smoothstep(0.125, 0.188, x)),
                    vec3(0.188, 0.131, 0.116), smoothstep(0.188, 0.227, x)),
                    vec3(0.31,  0.204, 0.537), smoothstep(0.227, 0.251, x)),
                    vec3(0.192, 0.106, 0.286), smoothstep(0.251, 0.314, x)),
                    vec3(0.102, 0.008, 0.341), smoothstep(0.314, 0.392, x)),
                    vec3(0.086, 0.0,   0.141), smoothstep(0.392, 0.502, x)),
                    vec3(1.0,   0.31,  0.0  ), smoothstep(0.502, 0.604, x)),
                    vec3(0.1,   0.1,   0.1  ), smoothstep(0.604, 0.643, x)),
                    vec3(1.0,   0.929, 0.0  ), smoothstep(0.643, 0.761, x)),
                    vec3(1.0,   0.086, 0.424), smoothstep(0.761, 0.847, x)),
                    vec3(1.0,   0.49,  0.0  ), smoothstep(0.847, 0.890, x)),
                    vec3(0.945, 0.275, 0.475), smoothstep(0.890, 0.941, x)),
                    vec3(0.251, 0.275, 0.796), smoothstep(0.941, 1.000, x))
            ), 1.0);
        }

        // ─── Starburst / Halo ───────────────────────────────────────────────────────

        // Starburst angular pattern
        vec4 geLS(vec2 p) {
            vec2  pp = (p - vec2(0.5)) * 2.0;
            float a  = atan(pp.y, pp.x);
            vec4  cp = vec4(sin(a * 1.0), length(pp), sin(a * 13.0), sin(a * 53.0));

            float d = sin(clamp(
                pow(length(vec2(0.5) - p) * 0.5 + haloScale / 2.0, 2.0), // 5.0 → 2.0
                0.0, 1.0
            ) * 3.14159);
            
            vec3 c = vec3(d) * vec3(
                fbm(cp.xy * 16.0) * fbm(cp.zw * 9.0) *
                max(max(max(max(
                    0.5,
                    sin(a * 1.0)),
                    sin(a * 3.0) * 0.8),
                    sin(a * 7.0) * 0.8),
                    sin(a * 9.0) * 10.6)
            );

            c *= vec3(mix(
                2.0,
                (sin(length(pp.xy) * 256.0) * 0.5) + 0.5,
                sin((clamp((length(pp.xy) - 0.875) / 0.1, 0.0, 1.0)) * 2.0 * 3.14159) * 1.5
            ) + 0.5) * 0.3275;

            return vec4(c * 1.0, d);
        }

        // Lens dirt / dust contribution
        vec4 geLD(vec2 p) {
            p.xy += vec2(fbm(p.yx * 3.0), fbm(p.yx * 2.0)) * 0.0825;

            vec3 o = vec3(mix(0.125, 0.25, max(max(
                smoothstep(0.1, 0.0, length(p - vec2(0.25))),
                smoothstep(0.4, 0.0, length(p - vec2(0.75)))),
                smoothstep(0.8, 0.0, length(p - vec2(0.875, 0.125)))
            )));

            o += vec3(max(fbm(p *  1.0) - 0.50, 0.0)) * 0.50;
            o += vec3(max(fbm(p *  2.0) - 0.50, 0.0)) * 0.50;
            o += vec3(max(fbm(p *  4.0) - 0.50, 0.0)) * 0.25;
            o += vec3(max(fbm(p *  8.0) - 0.75, 0.0)) * 1.00;
            o += vec3(max(fbm(p * 16.0) - 0.75, 0.0)) * 0.75;
            o += vec3(max(fbm(p * 64.0) - 0.75, 0.0)) * 0.50;

            return vec4(clamp(o, vec3(0.15), vec3(1.0)), 1.0);
        }

        // ─── Texture Helpers ────────────────────────────────────────────────────────

        // Safe texture fetch (returns 0 outside [0,1])
        vec4 txL(sampler2D tex, vec2 xtC) {
            if (xtC.x < 0.0 || xtC.y < 0.0 || xtC.x > 1.0 || xtC.y > 1.0) {
                return vec4(0.0);
            }
            return texture(tex, xtC);
        }

        // Chromatic-aberration texture fetch
        vec4 txD(sampler2D tex, vec2 xtC, vec2 dir, vec3 ditn) {
            return vec4(
                txL(tex, xtC + dir * ditn.r).r,
                txL(tex, xtC + dir * ditn.g).g,
                txL(tex, xtC + dir * ditn.b).b,
                1.0
            );
        }

        // ─── Starburst Accumulation ─────────────────────────────────────────────────

        vec4 strB() {
            vec2 aspXtc   = vec2(1.0) - (((vxtC - vec2(0.5)) * vec2(1.0)) + vec2(0.5));
            vec2 xtC      = vec2(1.0) - vxtC;
            vec2 ghvc     = (vec2(0.5) - xtC) * 0.3 - lensPosition;
            vec2 ghNm     = normalize(ghvc * vec2(1.0)) * vec2(1.0);
            vec2 haloVec  = normalize(ghvc) * 0.6;
            vec2 hlNm     = ghNm * 0.6;
            vec2 texelSize = vec2(1.0) / vec2(iResolution.xy);
            vec3 ditn     = vec3(-(texelSize.x * 1.5), 0.2, texelSize.x * 1.5);

            vec4 c = vec4(0.0);
            for (int i = 0; i < 8; i++) {
                vec2 offset = xtC + ghvc * float(i);
                c += txD(lensDirtTexture, offset, ghNm, ditn)
                   * pow(max(0.0, 1.0 - length(vec2(0.5) - offset) / length(vec2(0.5))), 10.0);
            }

            vec2 uyTrz = xtC + hlNm;
            return (c * geLC(length(vec2(0.5) - aspXtc) / length(vec2(haloScale))))
                 + (txD(lensDirtTexture, uyTrz, ghNm, ditn)
                   * pow(max(0.0, 1.0 - length(vec2(0.5) - uyTrz) / length(vec2(0.5))), 10.0));
        }

        // ─── Main ────────────────────────────────────────────────────────────────────

        void mainImage(vec4 v, vec2 r, out vec4 i) {
            vec2 g = r - 0.5;
            g.y *= iResolution.y / iResolution.x;

            vec2 l = lensPosition * 0.5;
            l.y *= iResolution.y / iResolution.x;

            vec3 f = mLs(g, l) * 20.0 * colorGain / 256.0;

            // Additional anamorphic-style streaks
            if (aditionalStreaks) {
                vec3 o = vec3(0.9, 0.2, 0.1);
                vec3 p = vec3(0.3, 0.1, 0.9);
                for (float n = 0.0; n < 10.0; n++) {
                    f += drC(
                        g,
                        pow(rnd(n * 2e3) * 2.8, 0.1) + 1.41,
                        0.0,
                        o + n, p + n,
                        rnd(n * 20.0) * 3.0 + 0.2 - 0.5,
                        lensPosition
                    );
                }
            }

            // Secondary hexagonal ghost reflections
            if (secondaryGhosts) {
                vec3 n = vec3(0.0);
                n += rHx(g, -lensPosition * 0.25,  ghostScale * 1.4, vec3(0.25, 0.35, 0.0));
                n += rHx(g,  lensPosition * 0.25,  ghostScale * 0.5, vec3(1.0,  0.5,  0.5));
                n += rHx(g,  lensPosition * 0.1,   ghostScale * 1.6, vec3(1.0));
                n += rHx(g,  lensPosition * 1.8,   ghostScale * 2.0, vec3(0.0,  0.5,  0.75));
                n += rHx(g,  lensPosition * 1.25,  ghostScale * 0.8, vec3(1.0,  1.0,  0.5));
                n += rHx(g, -lensPosition * 1.25,  ghostScale * 5.0, vec3(0.5,  0.5,  0.25));
                n += fpow(1.0 - abs(distance(lensPosition * 0.8, g) - 0.7), 0.985) * colorGain / 2100.0;
                f += n;
            }

            // Starburst / halo with lens dirt
            if (starBurst) {
                vxtC = g + 0.5;
                vec4  n = geLD(g);
                float o = 1.0 - clamp(0.5, 0.0, 0.5) * 2.0;
                n += mix(n, pow(n * 2.0, vec4(2.0)) * 0.5, o);
                float s = (g.x + g.y) * (1.0 / 6.0);
                vec2  d = mat2(cos(s), -sin(s), sin(s), cos(s)) * vxtC;
                n += geLS(d) * 2.0;
                f += clamp(n.xyz * strB().xyz, 0.01, 1.0);
            }

            i = enabled
                ? vec4(mix(f, vec3(0.0), opacity < maxOpacity ? maxOpacity : opacity) + v.xyz, v.w)
                : vec4(v);
        }

        uniform sampler2D tDiffuse;

        void main() {
            vec4 sceneColor = texture2D(tDiffuse, vUv);
            vec4 result;
            mainImage(sceneColor, vUv, result);
            gl_FragColor = result;
        }
    `,

    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
})

export default lensFlareShader
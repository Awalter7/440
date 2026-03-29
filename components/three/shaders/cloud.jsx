import * as THREE from "three"

const MAX_CLOUDS = 1000;

const CloudShader = new THREE.ShaderMaterial({
    uniforms: {
        tDiffuse:           { value: null },
        tDepth:             { value: null },
        tCloudMap:          { value: null },
        uInverseProjection: { value: new THREE.Matrix4() },
        uInverseView:       { value: new THREE.Matrix4() },
        uTime:              { value: 0.0 },
        uSunDir:            { value: new THREE.Vector3(1.0, 0.3, 0.0).normalize() },
        uEarthRadius:       { value: 20.0 },
        uCloudThickness:    { value: 0.5 },
        uCloudColor:        { value: new THREE.Vector3(1.0, 0.98, 0.95) },
        uShadowColor:       { value: new THREE.Vector3(0.30, 0.33, 0.42) },
        uCloudDensityScale: { value: 1.6 },
        uDriftSpeed:        { value: 0.0008 },
        uPosition:          { value: new THREE.Vector3(2.0, 0.0, 0.0) },

        // ── Adaptive resolution controls ────────────────────────────────────────
        // Distance at which LOD transitions from near (detailed) to far (coarse).
        // Tune this to match your scene scale: at uLodNearDist you get full MARCH_STEPS
        // worth of density; at uLodFarDist you get MARCH_STEPS_MIN.
        uLodNearDist:       { value: 2.0 },   // below this → maximum quality
        uLodFarDist:        { value: 40.0 },  // above this → minimum quality
        // Controls how aggressively steps bunch toward the camera entry point when
        // you are close. 1.0 = evenly spaced. <1.0 = front-loaded (more detail near
        // the first hit surface). 0.25 is a good "very close" value.
        uStepBias:          { value: 0.35 },  // only used when inside uLodNearDist
    },
    vertexShader: /* glsl */`
        varying vec2 vUv;
        void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: /* glsl */`
        // Maximum march iterations — the budget never grows beyond this.
        // When far away, fewer steps are actually used (see adaptiveSteps below).
        #define MARCH_STEPS     32
        #define MARCH_STEPS_MIN  8    // minimum steps used at max distance
        #define SHADOW_STEPS     6
        #define PI               3.14159265358979
 
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;
        uniform sampler2D tCloudMap;
 
        uniform vec3  uPosition;
        uniform mat4  uInverseProjection;
        uniform mat4  uInverseView;
        uniform float uTime;
        uniform vec3  uSunDir;
        uniform float uEarthRadius;
        uniform float uCloudThickness;
        uniform vec3  uCloudColor;
        uniform vec3  uShadowColor;
        uniform float uCloudDensityScale;
        uniform float uDriftSpeed;

        uniform float uLodNearDist;
        uniform float uLodFarDist;
        uniform float uStepBias;
 
        varying vec2 vUv;

        float maxDist = 1.0 / 0.0;
 
        // ── UV helpers ───────────────────────────────────────────────────────────
        vec2 sphereToUV(vec3 dir) {
            vec3 d = normalize(dir);
            float u = atan(d.z, d.x) / (2.0 * PI) + 0.5;
            float v = asin(clamp(d.y, -1.0, 1.0)) / PI + 0.5;
            return vec2(u, v);
        }
 
        // ── Cloud map sample ─────────────────────────────────────────────────────
        float sampleCloud(vec3 worldPos) {
            vec3  local = worldPos - uPosition;
            vec3  dir = normalize(local);
            vec2  uv  = sphereToUV(dir);

            uv.x = fract(uv.x + uTime * uDriftSpeed);

            float r      = length(local);
            float shellT = clamp((r - uEarthRadius) / uCloudThickness, 0.0, 1.0);

            float parallaxScale = 0.012;

            vec3 up      = dir;
            vec3 viewTan = normalize(cameraPosition - worldPos);
            viewTan      = normalize(viewTan - dot(viewTan, up) * up);
            
            vec2 offsetDir = sphereToUV(normalize(dir + viewTan * 0.01)) - uv;
            offsetDir      = normalize(offsetDir + vec2(1e-6));
 
            vec2 uvA = vec2(fract(uv.x + offsetDir.x * parallaxScale * (1.0 - shellT)),
                                 uv.y + offsetDir.y * parallaxScale * (1.0 - shellT));
            vec2 uvB = vec2(fract(uv.x + offsetDir.x * parallaxScale * 0.5 * (1.0 - shellT)),
                                 uv.y + offsetDir.y * parallaxScale * 0.5 * (1.0 - shellT));
 
            float d0 = texture2D(tCloudMap, uv).r;
            float d1 = texture2D(tCloudMap, uvA).r;
            float d2 = texture2D(tCloudMap, uvB).r;
 
            float raw = mix(d0 * 0.4 + d1 * 0.35 + d2 * 0.25, d0, shellT);
 
            float density = smoothstep(0.38, 0.78, raw) * uCloudDensityScale;
 
            float edgeFade = smoothstep(0.0, 0.08, shellT) * smoothstep(1.0, 0.88, shellT);
 
            return clamp(density * edgeFade, 0.0, 1.0);
        }
 
        // ── Shadow march toward sun ──────────────────────────────────────────────
        float lightMarch(vec3 pos) {
            vec3  sunDir  = normalize(uSunDir);
            float cloudR  = uEarthRadius + uCloudThickness;
 
            vec3  oc  = pos;
            float b   = dot(oc, sunDir);
            float c   = dot(oc, oc) - cloudR * cloudR;
            float det = b * b - c;
            if (det < 0.0) return 1.0;
            float tExit = -b + sqrt(det);
            if (tExit <= 0.0) return 1.0;
 
            float stepSize = tExit / float(SHADOW_STEPS);
            float shadow   = 0.0;
            vec3  p        = pos + sunDir * stepSize * 0.5;
 
            for (int i = 0; i < SHADOW_STEPS; i++) {
                shadow += sampleCloud(p) * stepSize;
                p      += sunDir * stepSize;
            }
            return exp(-shadow * 5.0);
        }
 
        vec2 raySphere(vec3 sphereCenter, float radius, vec3 rayOrigin, vec3 rayDir, float maxDist) {
            vec3 offset = rayOrigin - sphereCenter;
            float a = 1.0;
            float b = 2.0 * dot(offset, rayDir);
            float c = dot(offset, offset) - radius * radius;
            float d = b * b - 4.0 * a * c;
    
            if (d > 0.0) {
                float s = sqrt(d);
                float dstToSphereNear = max(0.0, (-b - s) / (2.0 * a));
                float dstToSphereFar = (-b + s) / (2.0 * a);
    
                if(dstToSphereFar >= 0.0){
                    return vec2(dstToSphereNear, dstToSphereFar - dstToSphereNear);
                }
            }
            
            return vec2(maxDist, 0.0);
        }

        // ── Depth reconstruction ─────────────────────────────────────────────────
        vec3 reconstructWorldPosition(float depth) {
            vec4 ndc = vec4(
            (vUv.x - 0.5) * 2.0,
            (vUv.y - 0.5) * 2.0,
            (depth - 0.5) * 2.0,
            1.0
            );
            vec4 clip = uInverseProjection * ndc;
            vec4 view = uInverseView * (clip / clip.w);
            return view.xyz;
        }
 
        float linearEyeDepth(float depth) {
            vec3 ndc = vec3(vUv * 2.0 - 1.0, depth);
            vec4 view = uInverseProjection * vec4(ndc, 1.0);
            view.xyz /= view.w;
            return -view.z;
        }

        // ── Adaptive step placement ──────────────────────────────────────────────
        // Returns the t value [0, rayLength] for step index i out of totalSteps,
        // with a power-curve bias so that small t values cluster near the entry
        // point (front-loaded detail) when bias < 1.0.
        // bias = 1.0  → uniform spacing (far LOD)
        // bias = 0.35 → steps packed toward ray origin entry (near LOD)
        float adaptiveT(float i, float totalSteps, float rayLength, float bias) {
            float frac = i / (totalSteps - 1.0);
            return pow(frac, bias) * rayLength;
        }

        vec4 calculateLight(
            vec3  rayOrigin,
            vec3  rayDir,
            float rayLength,
            vec3  originalCol,
            float camDistToShell   // ← distance from camera to cloud shell entry
        ) {
            // ── LOD: choose step count based on camera distance ──────────────────
            float lodT = clamp(
                (camDistToShell - uLodNearDist) / max(uLodFarDist - uLodNearDist, 0.001),
                0.0, 1.0
            );

            // Smooth transition so there's no sudden pop between near/far quality
            lodT = smoothstep(0.0, 1.0, lodT);

            // Integer step count, interpolated between max and min
            float fSteps = mix(float(MARCH_STEPS), float(MARCH_STEPS_MIN), lodT);

            // Bias: 1.0 when far (uniform), uStepBias when close (front-loaded)
            float bias = mix(uStepBias, 1.0, lodT);

            vec3  accumulation  = vec3(0.0);
            float transmittance = 1.0;
 
            vec3 sunDir = normalize(uSunDir);

            float cosTheta = dot(rayDir, sunDir);
            float mieG     = 0.76;
            float miePhase = (1.0 - mieG * mieG) / (4.0 * PI * pow(1.0 + mieG * mieG - 2.0 * mieG * cosTheta, 1.5));
            miePhase       = clamp(miePhase * 0.25, 0.0, 1.0);

            // ── Variable-step march loop (static bound, dynamic usage) ───────────
            // GLSL requires a compile-time loop bound, so we always iterate
            // MARCH_STEPS times but skip iterations beyond fSteps.
            for (int i = 0; i < MARCH_STEPS; i++) {
                float fi = float(i);
                if (fi >= fSteps) break;          // LOD early-out
                if (transmittance < 0.01) break;  // opacity early-out

                // Adaptive t: position along the ray for this step
                float tCurr = adaptiveT(fi,          fSteps, rayLength, bias);
                float tNext = adaptiveT(fi + 1.0,    fSteps, rayLength, bias);
                float stepSize = tNext - tCurr;

                vec3 inScatterPoint = rayOrigin + rayDir * tCurr;
                float density = sampleCloud(inScatterPoint);

                if(density > 0.001){
                    // ── Planet shadow: does a ray from this point toward the sun hit the planet? ──
                    vec3  sunDir       = normalize(uSunDir);
                    vec2  planetOcclude = raySphere(uPosition, uEarthRadius, inScatterPoint, sunDir, maxDist);
                    bool  inPlanetShadow = planetOcclude.y > 0.0;   // y > 0 means it passes through the planet

                    float sunRayLength = inPlanetShadow ? 0.0 : lightMarch(inScatterPoint);

                    float shellT = clamp((length(inScatterPoint - uPosition) - uEarthRadius) / uCloudThickness, 0.0, 1.0);

                    // Soft terminator using surface normal vs sun angle (matches atmosphere shader logic)
                    vec3  surfaceNormal = normalize(inScatterPoint - uPosition);
                    float sunDot        = dot(surfaceNormal, sunDir);
                    float daySide       = smoothstep(-0.15, 0.25, sunDot);

                    // Ambient is tiny on both sides — dark side is dark, not black
                    float ambient = mix(0.04, 0.40, shellT);

                    vec3 diffuse = uCloudColor * clamp(sunRayLength * daySide + ambient, 0.0, 1.0);
                    vec3 mieGlow = uCloudColor * miePhase * sunRayLength * daySide * 2.5;

                    float lightFactor = pow(sunRayLength * daySide, 0.5);

                    vec3 shadowTerm = uShadowColor * (ambient + 0.02);
                    vec3 litColor   = mix(shadowTerm, diffuse + mieGlow, lightFactor);

                    float absorption = density * stepSize * 8.0;
                    float scatter    = 1.0 - exp(-absorption);

                    accumulation  += transmittance * scatter * litColor;
                    transmittance *= exp(-absorption);
                }
            }

            float alpha = 1.0 - transmittance;
            return vec4(accumulation, alpha);        
        }
 
        // ── Main ─────────────────────────────────────────────────────────────────
        void main() {
            vec4  originalCol  = texture2D(tDiffuse, vUv);
            vec4  depth        = texture2D(tDepth, vUv);
            vec3  worldPos     = reconstructWorldPosition(depth.x);
            vec3  viewVector   = worldPos - cameraPosition;
            float sceneDepth   = linearEyeDepth(depth.x);
            vec3  rayOrigin    = cameraPosition;
            vec3  rayDir       = normalize(viewVector);

            bool hitSomething = depth.x < 1.0;
 
            float innerR = uEarthRadius;
            float outerR = uEarthRadius + uCloudThickness;
 
            vec2  planetHitInfo  = raySphere(uPosition, innerR, rayOrigin, rayDir, maxDist);
            float dstToPlanet    = min(sceneDepth, planetHitInfo.x);

            vec2  cloudHitInfo   = raySphere(uPosition, outerR, rayOrigin, rayDir, maxDist);
            float dstToCloud     = cloudHitInfo.x;
            float dstThroughCloud = min(cloudHitInfo.y, dstToPlanet - dstToCloud);

            
            
            if (dstThroughCloud > 0.0) {
                const float epsilon = 0.0001;
                vec3 pointInCloud = rayOrigin + rayDir * (dstToCloud + epsilon);

                // Pass camera-to-shell distance so calculateLight can pick LOD
                vec4 light = calculateLight(
                    pointInCloud,
                    rayDir,
                    dstThroughCloud - epsilon * 2.0,
                    originalCol.rgb,
                    dstToCloud          // ← LOD key: 0 = inside cloud, large = far away
                );

                bool hitPlanet             = planetHitInfo.y > 0.0;
                bool objectBehindAtmosphere = hitSomething && sceneDepth > dstToCloud;

                vec3 blended = mix(originalCol.rgb, light.rgb, light.a);
                gl_FragColor = vec4(blended, 1.0);

                return;    
            } else {
                gl_FragColor = vec4(originalCol);
            }
        }
    `,
    transparent: true,
    depthWrite:  false,
    depthTest:   true,
    blending:    THREE.NormalBlending,
})

export default CloudShader;

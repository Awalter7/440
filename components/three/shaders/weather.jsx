import * as THREE from "three"

const WeatherShader = new THREE.ShaderMaterial({
    uniforms: {

        uInverseProjection: { value: new THREE.Matrix4() },
        uInverseView: { value: new THREE.Matrix4() },

        tDiffuse: {value: null},
        tDepth: {value: null},

        pRadius: {value: 0.0},
        pPosition: {value: new THREE.Vector3(0.0, 0.0, 0.0)},
        aRadius: {value: .9},

        // Spiral control variables
        uSpiralArms:       { value: 5 },      // Number of spiral arms
        uSpiralTurns:      { value: .5 },    // How many full rotations each arm makes
        uSpiralWidth:      { value: 0.04 },   // Width/thickness of each arm (0.0 – 1.0)
        uSpiralScale:      { value: 3 },    // Overall scale multiplier of the spiral
        uSpiralColor:      { value: new THREE.Color(0.2, 0.6, 1.0) },
        uSpiralBgColor:    { value: new THREE.Color(0.04, 0.04, 0.12) },
    },
    vertexShader: `
      varying vec2 vUv;
  
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform sampler2D tDepth;

        uniform float pRadius;
        uniform vec3 pPosition;
        uniform float aRadius;

        // Spiral uniforms
        uniform int   uSpiralArms;
        uniform float uSpiralTurns;
        uniform float uSpiralWidth;
        uniform float uSpiralScale;
        uniform vec3  uSpiralColor;
        uniform vec3  uSpiralBgColor;

        varying vec2 vUv;

        uniform mat4 uInverseProjection;
        uniform mat4 uInverseView;

        float maxDist = 1.0 / 0.0;

        const float PI  = 3.14159265358979323846;
        const float TAU = 6.28318530717958647692;

        float linearEyeDepth(float depth) {
            vec3 ndc = vec3(vUv * 2.0 - 1.0, depth);
            vec4 view = uInverseProjection * vec4(ndc, 1.0);
            view.xyz /= view.w;
            return -view.z;
        }

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

        vec2 raySphere(vec3 sphereCenter, float radius, vec3 rayOrigin, vec3 rayDir, float md) {
            vec3 offset = rayOrigin - sphereCenter;
            float a = 1.0;
            float b = 2.0 * dot(offset, rayDir);
            float c = dot(offset, offset) - radius * radius;
            float d = b * b - 4.0 * a * c;
            if (d > 0.0) {
                float s = sqrt(d);
                float near = max(0.0, (-b - s) / (2.0 * a));
                float far  = (-b + s) / (2.0 * a);
                if (far >= 0.0) return vec2(near, far - near);
            }
            return vec2(md, 0.0);
        }

        // Given a point on the unit sphere surface, compute spiral coverage [0,1]
        // Uses a stereographic-like UV from the sphere normal to draw the spiral.
        float spiralMask(vec3 norm) {
            // Use azimuth (phi) and inclination mapped to radius on the disc
            // phi  = angle around the sphere (0..TAU)
            // theta = polar angle from north pole (0..PI)
            float theta = acos(clamp(norm.y, -1.0, 1.0));  // 0 at north, PI at south
            float phi   = atan(norm.z, norm.x);             // -PI..PI

            // Map theta to a disc radius r in [0,1] (stereographic projection)
            float r = sin(theta / 2.0) * 2.0 * uSpiralScale; // 0..uSpiralScale

            // For each arm, shift phi by arm offset
            float minDist = 1.0;
            float arms = float(uSpiralArms);
            for (int i = 0; i < 8; i++) {          // max loop count; break via arms check
                if (float(i) >= arms) break;
                float armOffset = TAU * float(i) / arms;
                float adjustedPhi = phi + armOffset;

                // Archimedean spiral: r = a * theta_spiral
                // Rearranged: theta_spiral at this r = r / (1/turns) = r * turns
                // Spiral angle for this r:
                float spiralAngle = r * uSpiralTurns * TAU; // total winding at radius r

                // Distance of current phi from spiral arm angle (mod TAU)
                float delta = mod(adjustedPhi - spiralAngle + PI, TAU) - PI; // wrap to -PI..PI
                minDist = min(minDist, abs(delta));
            }

            // Convert angular distance to a smooth width mask
            // uSpiralWidth controls the arc width
            float arcWidth = uSpiralWidth * PI;
            float mask = 1.0 - smoothstep(0.0, arcWidth, minDist);

            // Fade out near the poles so the spiral looks natural
            float poleFade = smoothstep(0.0, 0.1, r) * smoothstep(1.05, 0.95, r);
            return mask * poleFade;
        }

        void main(){
            vec4 originalCol = texture2D(tDiffuse, vUv);
            vec4 depth = texture2D(tDepth, vUv);
            vec3 worldPosition = reconstructWorldPosition(depth.x);
            vec3 viewVector = worldPosition - cameraPosition;
            float sceneDepth = linearEyeDepth(depth.x);
            vec3 rayOrigin = cameraPosition;
            vec3 rayDir = normalize(viewVector);

            vec2 atmosphereHitInfo = raySphere(pPosition, aRadius, rayOrigin, rayDir, maxDist);
            float dstToAtmosphere = atmosphereHitInfo.x;
            bool hitPlanet = atmosphereHitInfo.y > 0.0;

            if (hitPlanet) {
                // Compute the exact hit point on the sphere surface
                vec3 hitPoint = rayOrigin + rayDir * dstToAtmosphere;
                vec3 surfaceNormal = normalize(hitPoint - pPosition);

                // Draw spiral on the sphere surface
                float spiral = spiralMask(surfaceNormal);

                vec3 color = mix(uSpiralBgColor, uSpiralColor, spiral);

                // Add a subtle glow on the spiral arms
                vec3 glow = uSpiralColor * spiral * 0.4;
                color += glow;

                gl_FragColor = vec4(color, 1.0);
            } else {
                // Space — transparent / additive black
                gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
            }
        }
    `,
    transparent: true, 
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
  })


export default WeatherShader;
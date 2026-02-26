import * as THREE from "three"

const AtmosphereShader = new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: {value: null},
      tDepth: {value: null},
      tOpticalDepthLookup: {value: null},
  
      pRadius: {value: 0.0},
      pPosition: {value: new THREE.Vector3(0.0, 0.0, 0.0)},
      aRadius: {value: .9},

      sDistance: {value: 0.0},
      sPosition: {value: new THREE.Vector3(0.0, 0.5, 0.5).normalize()},
  
      numOpticalDepthPoints: {value: 50.0},
      numInScatteringPoints: {value: 50.0},
      densityFallOff: {value: 2.0},

      uInverseProjection: { value: new THREE.Matrix4() },
      uInverseView: { value: new THREE.Matrix4() },

      uBrightnessStrength: {value: 2.0},
      uReflectiveStrength: {value: 15.0},
      uBlendStrength: {value: 1.5},
      
      r: {value: 590.0},
      g: {value: 497.0},
      b: {value: 443.0}
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
      uniform sampler2D tOpticalDepthLookup;

  
      uniform float pRadius;
      uniform vec3 pPosition;
      uniform float aRadius;
  
  
      uniform float numOpticalDepthPoints;
      uniform sampler2D uOpticalDepthLookup;
      uniform float numInScatteringPoints;
      uniform float densityFallOff;
  
      uniform float sDistance;
      uniform vec3 sPosition;

      uniform float r;
      uniform float g;
      uniform float b;
  
  
      varying vec2 vUv;
      varying vec3 vWorldPosition;
      varying vec3 vViewPosition;
  
      uniform mat4 uInverseProjection;
      uniform mat4 uInverseView;


      uniform float uBrightnessStrength;
      uniform float uReflectiveStrength;
      uniform float uBlendStrength;


      float maxDist = 1.0 / 0.0;

      float lerp(float a, float b, float t) {
        return a + t * (b - a);
      }

      float linearEyeDepth(float depth) {
        vec3 ndc = vec3(vUv * 2.0 - 1.0, depth);

        vec4 view = uInverseProjection * vec4(ndc, 1.0);
        view.xyz /= view.w;
        float linear_depth = -view.z;

        return linear_depth;
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
        vec3 result = view.xyz;

        return result;
      }

      vec2 raySphere(vec3 sphereCenter, float radius, vec3 rayOrigin, vec3 rayDir, float maxDist) {
  
        // If it intersects, perform the sphere intersection
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
        
        return vec2(maxDist, 0.0); // No intersection
      }
      
      float densityAtPoint(vec3 densitySamplePoint){
        float heightAboveSurface = length(densitySamplePoint - pPosition) - pRadius ;
        float height01 = heightAboveSurface / (aRadius - pRadius);
        float localDensity = exp(-height01 * densityFallOff) * (1.0 - height01);
  
        return localDensity;
      }

      float opticalDepth(vec3 rayOrigin, vec3 rayDir, float rayLength){
          vec3 densitySamplePoint = rayOrigin;
          float stepSize = rayLength / (numOpticalDepthPoints - 1.0);
          float opticalDepth = 0.0;
  
          for(float i = 0.0; i < numOpticalDepthPoints; i ++){
              float localDensity = densityAtPoint(densitySamplePoint);
              opticalDepth += localDensity * stepSize;
              densitySamplePoint += rayDir * stepSize;
          }
  
          return opticalDepth;
      }

      float opticalDepthBaked(vec3 rayOrigin, vec3 rayDir) {
          // Compute the height of the current sampling point above the sphere.
          float height = length(rayOrigin - pPosition) - pRadius;
          float height01 = clamp(height / (aRadius - pRadius), 0.0, 1.0);
          
          // Compute a normalized angle factor.
          float angle01 = 1.0 - (dot(normalize(rayOrigin - pPosition), rayDir) * .5 + .5);
          
          // Sample the baked ambient optical depth lookup table.
          float bakedOD = texture2D(tOpticalDepthLookup, vec2(angle01, height01)).x;
          
          return bakedOD ;
      }

      float opticalDepthBaked2(vec3 rayOrigin, vec3 rayDir, float rayLength) {
				vec3 endPoint = rayOrigin + rayDir * rayLength;
				float d = dot(rayDir, normalize(rayOrigin - pPosition));
				float opticalDepth = 0.0;

				float w = clamp(d * uBlendStrength + .5, 0.0, 1.0);
				
				float d1 = opticalDepthBaked(rayOrigin, rayDir) - opticalDepthBaked(endPoint, rayDir);
				float d2 = opticalDepthBaked(endPoint, -rayDir) - opticalDepthBaked(rayOrigin, -rayDir);

				opticalDepth = mix(d2, d1, w);
				return opticalDepth;
			}
			

      vec3 calculateLight(vec3 rayOrigin, vec3 rayDir, float rayLength, vec3 originalCol, float maxDist){
          vec3 inScatterPoint = rayOrigin;
          float stepSize = rayLength / (numInScatteringPoints - 1.0);
          vec3 inScatteredLight = vec3(0.0);
          float viewRayOpticalDepth = 0.0;
  
          vec3 scatteringCoeficients = vec3(r, g, b);
  
          for(float i = 0.0; i < numInScatteringPoints; i ++){
              float sunRayLength = raySphere(pPosition, aRadius, inScatterPoint, sPosition, maxDist).y;
              float sunRayOpticalDepth = opticalDepthBaked(inScatterPoint + sPosition, sPosition);
              viewRayOpticalDepth = opticalDepthBaked2(rayOrigin, rayDir, stepSize * i);
              vec3 transmittance = exp(-(sunRayOpticalDepth + viewRayOpticalDepth) * scatteringCoeficients);
              float localDensity = densityAtPoint(inScatterPoint);

              inScatteredLight += localDensity * transmittance;
              inScatterPoint += rayDir * stepSize;
          }

          float intensity = uReflectiveStrength;
          inScatteredLight *= scatteringCoeficients * intensity * stepSize / pRadius;

          float brightnessAdaptionStrength = uBrightnessStrength;
          float reflectedLightOutScatterStrength = uReflectiveStrength;
          float brightnessAdaption = dot(inScatteredLight, vec3(1.0)) * brightnessAdaptionStrength ;
          float brightnessSum = viewRayOpticalDepth * intensity * brightnessAdaption;
          float reflectedLightStrength = exp(-brightnessSum);
          float hdrStrength = clamp(dot(originalCol, vec3(1.0)) / intensity - 1.0, 0.0, 1.0);
          reflectedLightStrength = mix(reflectedLightStrength, 1.0, hdrStrength);
          vec3 reflectedLight = originalCol * reflectedLightStrength;

          return reflectedLight + inScatteredLight ;
      }
  
  


      void main(){
        vec4 originalCol = texture2D(tDiffuse, vUv);
        vec4 depth = texture2D(tDepth, vUv);

        vec3 worldPosition = reconstructWorldPosition(depth.x );

        vec3 viewVector = worldPosition - cameraPosition;
        float vVlength = length(viewVector);

        float sceneDepth = linearEyeDepth(depth.x);
        
      
        vec3 rayOrigin = cameraPosition;
        vec3 rayDir = normalize(viewVector);

        vec2 planetHitInfo = raySphere(pPosition, pRadius, rayOrigin, rayDir, maxDist);
        float dstToPlanet = min( sceneDepth, planetHitInfo.x);

        vec2 atmsophereHitInfo = raySphere(pPosition, aRadius, rayOrigin, rayDir, maxDist);
  
        float dstToAtmosphere = atmsophereHitInfo.x;
        float dstThroughAtmosphere = min(atmsophereHitInfo.y,  dstToPlanet - dstToAtmosphere);


        if (dstThroughAtmosphere > 0.0) {
          const float epsilon = 0.0001;
          vec3 pointInAtmosphere = rayOrigin + rayDir * (dstToAtmosphere + epsilon);
          vec3 light = calculateLight(pointInAtmosphere, rayDir, dstThroughAtmosphere - epsilon * 2.0, originalCol.rgb, maxDist);

          
          if(dstToAtmosphere < sceneDepth){
            gl_FragColor = vec4(light, 1.0); 
          }
        }else{
            gl_FragColor = originalCol;
        }
      }

    
    `,
    transparent: true, 
    depthWrite: false, // Allow writing to depth buffer
    depthTest: true,  // Enable depth testing
    blending: THREE.AdditiveBlending, // Use normal blending
  })


export default AtmosphereShader;
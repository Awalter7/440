import * as THREE from 'three';


export function OpticalDepth({
    textureSize = 256,
    numOutScatteringSteps = 400,
    atmosphereRadius = 10.3,
    densityFallOff = 30.0,
} = {}) {
    const planetRadius = 1;
    const data = new Float32Array(textureSize * textureSize);
  

    function densityAtPoint(densitySamplePoint) {
        const planetCentre = new THREE.Vector2(0, 0);
        const heightAboveSurface = densitySamplePoint.distanceTo(planetCentre) - planetRadius;

        const height01 = heightAboveSurface / (atmosphereRadius - planetRadius);

        const clampedHeight01 = Math.min(Math.max(height01, 0), 1);
        const localDensity = Math.exp(-clampedHeight01 * densityFallOff) * (1 - clampedHeight01);
        return localDensity;
    }
  
    function opticalDepth(rayOrigin, rayDir, rayLength) {
        let densitySamplePoint = rayOrigin.clone();
        const stepSize = rayLength / (numOutScatteringSteps - 1);
        let opticalDepthSum = 0;
        for (let i = 0; i < numOutScatteringSteps; i++) {
            const localDensity = densityAtPoint(densitySamplePoint);
            opticalDepthSum += localDensity * stepSize;
            densitySamplePoint.add(rayDir.clone().multiplyScalar(stepSize));
        }
        return opticalDepthSum;
    }
  
    function raySphere(center, radius, origin, dir) {
      const offset = origin.clone().sub(center);
      const a = 1.0;
      const b = 2.0 * offset.dot(dir);
      const c = offset.dot(offset) - radius * radius;
      const discriminant = b * b - 4.0 * a * c;
  
      if (discriminant > 0.0) {
            const sqrtDisc = Math.sqrt(discriminant);
            // Nearest intersection distance (clamped to zero)
            const dstToSphereNear = Math.max(0.0, (-b - sqrtDisc) / (2.0 * a));
            // Intersection length along ray (from near intersection to far intersection)
            const dstToSphereFar = (-b + sqrtDisc) / (2.0 * a);
            if (dstToSphereFar >= 0.0) {
                return new THREE.Vector2(dstToSphereNear, dstToSphereFar - dstToSphereNear);
            }
      }
      return new THREE.Vector2(Infinity, 0.0);
    }
  
    // Loop over each “pixel” (mimicking the compute shader thread dispatch)
    for (let y = 0; y < textureSize; y++) {
      // In the compute shader, uv.y maps directly to "height01"
      const uv_y = y / (textureSize - 1);
      const height01 = uv_y;
  
        for (let x = 0; x < textureSize; x++) {
            const uv_x = x / (textureSize - 1);
    

            let angle = uv_x * Math.PI;

            let dir2D = new THREE.Vector2(Math.sin(angle), Math.cos(angle));
            let dy = -2 * uv_x + 1;
            const dx = Math.sin(Math.acos(dy));
            dir2D = new THREE.Vector2(dx, dy);
    

            const inPoint = new THREE.Vector2(0, THREE.MathUtils.lerp(planetRadius, atmosphereRadius, height01));
    
            const origin3D = new THREE.Vector3(inPoint.x, inPoint.y, 0);
            const dir3D = new THREE.Vector3(dir2D.x, dir2D.y, 0);
            const sphereCenter = new THREE.Vector3(0, 0, 0);

            const rs = raySphere(sphereCenter, atmosphereRadius, origin3D, dir3D);
            const dstThroughAtmosphere = rs.y;

            const inPointOffset = inPoint.clone().add(dir2D.clone().multiplyScalar(0.0001));
            const rayLength = dstThroughAtmosphere - 0.0002;

            const od = opticalDepth(inPointOffset, dir2D, rayLength);
    
            data[y * textureSize + x] = od;
        }
    }
  
    const texture = new THREE.DataTexture(
        data,
        textureSize,
        textureSize,
        THREE.RedFormat,
        THREE.FloatType
    );

    texture.needsUpdate = true;
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
  
    return texture;
  }


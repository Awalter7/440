// SphereVolumeTint.jsx
import React, { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

/*
  Usage:
  <Canvas>
    <SceneWithVolume />
  </Canvas>

  The sphere is defined by `sphereCenter` (world-space) and `sphereRadius`.
  `tintColor` is the color applied to anything inside the sphere.
*/




export default function SphereVolumeTintPass({
  sphereCenter = new THREE.Vector3(0, 0, -1),
  sphereRadius = 1.2,
  tintColor = new THREE.Color(0xff00ff),
}) {
  const { gl, scene, camera, size } = useThree();
  const quadScene = useMemo(() => new THREE.Scene(), []);
  const orthoCam = useMemo(() => new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1), []);
  const renderTargetRef = useRef();
  const quadRef = useRef();

  // Setup render target with depth texture
  useEffect(() => {
    const pixelRatio = gl.getPixelRatio();
    const w = size.width * pixelRatio;
    const h = size.height * pixelRatio;

    const depthTexture = new THREE.DepthTexture(w, h);
    depthTexture.type = THREE.UnsignedShortType;

    const renderTarget = new THREE.WebGLRenderTarget(w, h, {
      format: THREE.RGBAFormat,
      depthTexture,
      depthBuffer: true,
    });

    renderTargetRef.current = { renderTarget, depthTexture };
    return () => {
      renderTarget.dispose();
      depthTexture.dispose();
    };
  }, [gl, size]);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: null },
        tDepth: { value: null },
        invProjectionMatrix: { value: new THREE.Matrix4() },
        invViewMatrix: { value: new THREE.Matrix4() },
        cameraNear: { value: 0.1 },
        cameraFar: { value: 1000.0 },
        sphereCenter: { value: new THREE.Vector3() },
        sphereRadius: { value: sphereRadius },
        tintColor: { value: new THREE.Vector3(tintColor.r, tintColor.g, tintColor.b) },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform sampler2D tColor;
        uniform sampler2D tDepth;
        uniform mat4 invProjectionMatrix;
        uniform mat4 invViewMatrix;
        uniform float cameraNear;
        uniform float cameraFar;
        uniform vec3 sphereCenter;
        uniform float sphereRadius;
        uniform vec3 tintColor;

        float linearizeDepth(float depth) {
          float z = depth * 2.0 - 1.0;
          return (2.0 * cameraNear * cameraFar) / (cameraFar + cameraNear - z * (cameraFar - cameraNear));
        }

        void main() {
          vec4 baseColor = texture2D(tColor, vUv);
          float depth = texture2D(tDepth, vUv).x;

          if (depth >= 1.0) {
            gl_FragColor = baseColor;
            return;
          }

          // Reconstruct world position
          vec4 clipPos = vec4(vUv * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0);
          vec4 viewPos = invProjectionMatrix * clipPos;
          viewPos /= viewPos.w;
          vec4 worldPos = invViewMatrix * viewPos;

          float dist = distance(worldPos.xyz, sphereCenter);
          if (dist < sphereRadius) {
            // Hard tint (not darker)
            vec3 mixed = mix(baseColor.rgb, tintColor, 1.0);
            gl_FragColor = vec4(mixed, baseColor.a);
          } else {
            gl_FragColor = baseColor;
          }
        }
      `,
    });
  }, [sphereRadius, tintColor]);

  useEffect(() => {
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    quadScene.add(quad);
    quadRef.current = quad;
    return () => quadScene.remove(quad);
  }, [quadScene, material]);

  useFrame(() => {
    if (!renderTargetRef.current) return;
    const { renderTarget, depthTexture } = renderTargetRef.current;

    // 1️⃣ Render main scene into target (includes depth)
    gl.setRenderTarget(renderTarget);
    gl.clear();
    gl.render(scene, camera);

    // 2️⃣ Prepare shader uniforms for fullscreen tint pass
    material.uniforms.tColor.value = renderTarget.texture;
    material.uniforms.tDepth.value = depthTexture;
    material.uniforms.invProjectionMatrix.value.copy(camera.projectionMatrixInverse);
    material.uniforms.invViewMatrix.value.copy(camera.matrixWorld);
    material.uniforms.cameraNear.value = camera.near;
    material.uniforms.cameraFar.value = camera.far;
    material.uniforms.sphereCenter.value.copy(sphereCenter);
    material.uniforms.sphereRadius.value = sphereRadius;
    material.uniforms.tintColor.value.set(tintColor.r, tintColor.g, tintColor.b);

    // 3️⃣ Render the tint pass to screen (no double render of base)
    gl.setRenderTarget(null);
    gl.clear();
    gl.render(quadScene, orthoCam);
  });

  return null;
}
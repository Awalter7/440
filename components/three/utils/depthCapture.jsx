import { useEffect, useState } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';


/**
 * Custom hook to capture depth information from the scene.
 * @returns {Object} An object containing the render target and depth texture.
 */
const useDepthCapture = () => {
  const { gl, scene, size, camera } = useThree();
  const [renderTarget, setRenderTarget] = useState(null);

  useEffect(() => {
    // Set a flag to avoid state updates if the component is unmounted
    let disposed = false;

    // Define an async function to initialize the render target.
    const initializeRenderTarget = async () => {

      const depthTexture = new THREE.DepthTexture();
      depthTexture.type = THREE.FloatType;
      depthTexture.format = THREE.DepthFormat;
      depthTexture.minFilter = THREE.NearestFilter;
      depthTexture.magFilter = THREE.NearestFilter;

      // Create the render target using the depth texture.
      const target = new THREE.WebGLRenderTarget(size.width, size.height, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        format: THREE.RGBAFormat,
        depthTexture: depthTexture,
        depthBuffer: true,
        stencilBuffer: false,
      });

      if (!disposed) {
        // Dispose the previous render target if it exists.
        if (renderTarget) {
          renderTarget.dispose();
        }
        setRenderTarget(target);
      }
    };

    // Initialize the render target.
    initializeRenderTarget();

    // Cleanup on unmount.
    return () => {
      disposed = true;
      if (renderTarget) {
        renderTarget.dispose();
      }
    };
  }, [size.width, size.height]); // re-run effect if the size changes

  // Render the scene to the render target each frame.
  useFrame(() => {
    if (renderTarget && camera) {
      gl.setRenderTarget(renderTarget);
      gl.render(scene, camera);
      gl.setRenderTarget(null);
    }
  });

  return {
    renderTarget,
    depthTexture: renderTarget ? renderTarget.depthTexture : null,
  };
};

export default useDepthCapture;

"use client"
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';

export const ComposerContext = createContext(null);

export const ComposerProvider = ({ children }) => {
  const { gl, scene, camera } = useThree();
  const composer  = useContext(ComposerContext)
  const composerRef = useRef(new EffectComposer(gl));

  useEffect(() => {
    // Create and add a RenderPass
    const renderPass = new RenderPass(scene, camera);
    composerRef.current.addPass(renderPass);

    return () => {
      composerRef.current.removePass(renderPass);
    };
  }, [scene, camera]);

  useEffect(() => {
    const canvas = gl.domElement;
    const onContextRestored = () => {
      // Reinitialize passes if needed.
    };

    canvas.addEventListener('webglcontextrestored', onContextRestored, false);
    return () => {
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
    };
  }, [gl]);

  // Safely convert children to an array, filtering out null/undefined values
  const childrenArray = React.Children.toArray(children);


  return (
    <ComposerContext.Provider value={composerRef}>
      {childrenArray.map((child, index) =>
        React.cloneElement(child, {
          key: `effect-${index}`
        })
      )}
    </ComposerContext.Provider>
  );
};

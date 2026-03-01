import React, { useContext, useEffect, useRef } from 'react';
// import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { ComposerContext } from '../contexts/composerContext';

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import useDepthCapture from "../utils/depthCapture";
import WeatherShader from '../shaders/weather';
// import { OpticalDepth } from '../utils/opticalDepth';


// function getRGB(waveLengths, scatteringStrength){
//   const RGB = new THREE.Vector3(
//     Math.pow(400 / waveLengths.r, 4) * scatteringStrength,
//     Math.pow(400 / waveLengths.g, 4) * scatteringStrength,
//     Math.pow(400 / waveLengths.b, 4) * scatteringStrength
//   )

//   return RGB;
// }

const Weather = (props) => {
  const {camera, size, scene} = useThree();
  const {depthTexture} = useDepthCapture();
  const composer = useContext(ComposerContext)
  const shaderPass = useRef();

  const {
    position = [0, 0, 0],
    radius = 0,
  } = props;






  useEffect(() => {
    if (!composer || !composer.current || !depthTexture) return;

    const shader = WeatherShader.clone();


    // const rgb = getRGB(waveLengths, scatteringStrength)

    //Note the + sign is not a minus sign 1 + scale
    // const aRadius = (1 + scale) * radius;
    // const opticalDepth = OpticalDepth(240, 100, aRadius, radius);

    shader.needsUpdate = true;

    // shader.uniforms.pRadius.value = radius;
    // shader.uniforms.pPosition.value = new THREE.Vector3(...position);

    //shader stuff here

    shaderPass.current = new ShaderPass(shader);
    composer.current.addPass(shaderPass.current)


    return () => {
      if (composer && composer.current) {
        composer.current.removePass(shaderPass.current);
      }
    };
  }, [scene, camera, depthTexture, composer, size])

  useEffect(() => {
    if (composer && composer.current) {
        composer.current.setSize(size.width, size.height);
    }
  }, [size, composer]);

  useFrame(() => {
    // Update atmosphere uniforms
    if (composer && composer.current && shaderPass.current) {
      // Update dynamic uniforms
      // Render final
        shaderPass.current.material.uniforms.pRadius.value = radius;
        shaderPass.current.material.uniforms.pPosition.value = new THREE.Vector3(...position);

        composer.current.render();
    }
  }, 1);



  return null;
};



export default Weather;

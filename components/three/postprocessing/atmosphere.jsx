import React, { useContext, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { ComposerContext } from '../contexts/composerContext';

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import useDepthCapture from "../utils/depthCapture";
import AtmosphereShader from '../shaders/atmosphere';
import { OpticalDepth } from '../utils/opticalDepth';


function getRGB(waveLengths, scatteringStrength){
  const RGB = new THREE.Vector3(
    Math.pow(400 / waveLengths.r, 4) * scatteringStrength,
    Math.pow(400 / waveLengths.g, 4) * scatteringStrength,
    Math.pow(400 / waveLengths.b, 4) * scatteringStrength
  )

  return RGB;
}

const Atmosphere = (props) => {
  const {camera, size, scene} = useThree();
  const {depthTexture} = useDepthCapture();
  const composer = useContext(ComposerContext)
  const shaderPass = useRef();

  const {
    position = [0, 0, 0],
    radius = 5,

    sunPosition = [0, 0, 0],
    sunDistance = 10.0,

    scale = 0.50,
    numInScatteringPoints = 100,
    numOpticalDepthPoints = 100,
    scatteringStrength = 20,
    densityFallOff = 250, 
    waveLengths = { 
      r: 530.0, 
      g: 480.0, 
      b: 433.0 
    },
    blendStrength = 0.4,
    brightness = 2,
    reflectiveness = 2,
  } = props;






  useEffect(() => {
    if (!composer || !composer.current || !depthTexture) return;

    const shader = AtmosphereShader.clone();


    const rgb = getRGB(waveLengths, scatteringStrength)

    //Note the + sign is not a minus sign 1 + scale
    const aRadius = (1 + scale) * radius;
    const opticalDepth = OpticalDepth(240, 100, aRadius, radius);

    shader.needsUpdate = true;

    shader.uniforms.tDepth.value = depthTexture;
    shader.uniforms.tOpticalDepthLookup.value = opticalDepth;

    shader.uniforms.uInverseProjection.value.copy(camera.projectionMatrixInverse);
    shader.uniforms.uInverseView.value.copy(camera.matrixWorld);
    shader.uniforms.cameraPosition = { value: camera.position };

    shader.uniforms.pRadius.value = radius;
    shader.uniforms.pPosition.value = new THREE.Vector3(...position);

    shader.uniforms.aRadius.value = aRadius;

    shader.uniforms.sDistance.value = sunDistance;
    shader.uniforms.sPosition.value = new THREE.Vector3(...sunPosition).normalize();

    shader.uniforms.numOpticalDepthPoints.value = numOpticalDepthPoints;
    shader.uniforms.numInScatteringPoints.value = numInScatteringPoints;
    shader.uniforms.densityFallOff.value = densityFallOff;
    shader.uniforms.r.value = rgb.x;
    shader.uniforms.g.value = rgb.y;
    shader.uniforms.b.value = rgb.z;
    shader.uniforms.uBlendStrength.value = blendStrength;
    shader.uniforms.uBrightnessStrength.value = brightness;
    shader.uniforms.uReflectiveStrength.value = reflectiveness;
    
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
      const rgb = getRGB(waveLengths, scatteringStrength)
      const aRadius = (1 + scale) * radius;


      shaderPass.current.material.uniforms.uInverseProjection.value.copy(camera.projectionMatrixInverse);
      shaderPass.current.material.uniforms.uInverseView.value.copy(camera.matrixWorld);
      shaderPass.current.material.uniforms.tDepth.value = depthTexture;
      shaderPass.current.material.uniforms.pPosition.value = new THREE.Vector3(...position);
      shaderPass.current.material.uniforms.cameraPosition = { value: camera.position };


      shaderPass.current.material.uniforms.pRadius.value = radius;
      shaderPass.current.material.uniforms.pPosition.value = new THREE.Vector3(...position);
      shaderPass.current.material.uniforms.aRadius.value = aRadius;

      shaderPass.current.material.uniforms.sDistance.value = sunDistance;
      shaderPass.current.material.uniforms.sPosition.value = new THREE.Vector3(...sunPosition).normalize();
  
      shaderPass.current.material.uniforms.numOpticalDepthPoints.value = numOpticalDepthPoints;
      shaderPass.current.material.uniforms.numInScatteringPoints.value = numInScatteringPoints;
      shaderPass.current.material.uniforms.densityFallOff.value = densityFallOff;
      shaderPass.current.material.uniforms.r.value = rgb.x;
      shaderPass.current.material.uniforms.g.value = rgb.y;
      shaderPass.current.material.uniforms.b.value = rgb.z;
      shaderPass.current.material.uniforms.uBlendStrength.value = blendStrength;
      shaderPass.current.material.uniforms.uBrightnessStrength.value = brightness;
      shaderPass.current.material.uniforms.uReflectiveStrength.value = reflectiveness;


      composer.current.render();
    }
  }, 1);



  return null;
};



export default Atmosphere;

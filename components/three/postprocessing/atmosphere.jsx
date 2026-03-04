import React, { useContext, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { ComposerContext } from '../contexts/composerContext';

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import useDepthCapture from "../utils/depthCapture";
import AtmosphereShader from '../shaders/atmosphere';
import WeatherShader from '../shaders/weather';
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

  const skyShaderPass = useRef();
  // const weatherShaderPass = useRef();

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

    const skyShader = AtmosphereShader.clone();


    const rgb = getRGB(waveLengths, scatteringStrength)

    //Note the + sign is not a minus sign 1 + scale
    const aRadius = (1 + scale) * radius;
    const opticalDepth = OpticalDepth(240, 100, aRadius, radius);

    skyShader.needsUpdate = true;

    skyShader.uniforms.tDepth.value = depthTexture;
    skyShader.uniforms.tOpticalDepthLookup.value = opticalDepth;

    skyShader.uniforms.uInverseProjection.value.copy(camera.projectionMatrixInverse);
    skyShader.uniforms.uInverseView.value.copy(camera.matrixWorld);
    skyShader.uniforms.cameraPosition = { value: camera.position };

    skyShader.uniforms.pRadius.value = radius;
    skyShader.uniforms.pPosition.value = new THREE.Vector3(...position);
    skyShader.uniforms.aRadius.value = aRadius;

    skyShader.uniforms.sDistance.value = sunDistance;
    skyShader.uniforms.sPosition.value = new THREE.Vector3(...sunPosition).normalize();

    skyShader.uniforms.numOpticalDepthPoints.value = numOpticalDepthPoints;
    skyShader.uniforms.numInScatteringPoints.value = numInScatteringPoints;
    skyShader.uniforms.densityFallOff.value = densityFallOff;
    skyShader.uniforms.r.value = rgb.x;
    skyShader.uniforms.g.value = rgb.y;
    skyShader.uniforms.b.value = rgb.z;
    skyShader.uniforms.uBlendStrength.value = blendStrength;
    skyShader.uniforms.uBrightnessStrength.value = brightness;
    skyShader.uniforms.uReflectiveStrength.value = reflectiveness;
    
    skyShaderPass.current = new ShaderPass(skyShader);
    composer.current.addPass(skyShaderPass.current)


    // //Weather Texture.

    // const weatherShader = WeatherShader.clone();

    // weatherShader.uniforms.uInverseProjection.value.copy(camera.projectionMatrixInverse);
    // weatherShader.uniforms.uInverseView.value.copy(camera.matrixWorld);
    // weatherShader.uniforms.cameraPosition = { value: camera.position };

    // weatherShader.uniforms.tDepth.value = depthTexture;

    // weatherShader.uniforms.pRadius.value = radius;
    // weatherShader.uniforms.pPosition.value = new THREE.Vector3(...position);
    // weatherShader.uniforms.aRadius.value = aRadius;
    // // weatherShader.uniforms.pRadius.value = radius;
    // // weatherShader.uniforms.pPosition.value = new THREE.Vector3(...position);

    // weatherShaderPass.current = new ShaderPass(weatherShader)
    // composer.current.addPass(weatherShaderPass.current)

    return () => {
      if (composer && composer.current) {
        composer.current.removePass(skyShaderPass.current);
        // composer.current.removePass(weatherShaderPass.current);
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
    if (
      composer && composer.current 
      && 
      skyShaderPass.current 
      // && 
      // weatherShaderPass.current
    ) {
      // Update dynamic uniforms
      // Render final
      const rgb = getRGB(waveLengths, scatteringStrength)
      const aRadius = (1 + scale) * radius;


      skyShaderPass.current.material.uniforms.uInverseProjection.value.copy(camera.projectionMatrixInverse);
      skyShaderPass.current.material.uniforms.uInverseView.value.copy(camera.matrixWorld);
      
      skyShaderPass.current.material.uniforms.tDepth.value = depthTexture;

      skyShaderPass.current.material.uniforms.cameraPosition = { value: camera.position };


      skyShaderPass.current.material.uniforms.pRadius.value = radius;
      skyShaderPass.current.material.uniforms.pPosition.value = new THREE.Vector3(...position);
      skyShaderPass.current.material.uniforms.aRadius.value = aRadius;

      skyShaderPass.current.material.uniforms.sDistance.value = sunDistance;
      skyShaderPass.current.material.uniforms.sPosition.value.set(...sunPosition).normalize();
  
      skyShaderPass.current.material.uniforms.numOpticalDepthPoints.value = numOpticalDepthPoints;
      skyShaderPass.current.material.uniforms.numInScatteringPoints.value = numInScatteringPoints;
      skyShaderPass.current.material.uniforms.densityFallOff.value = densityFallOff;
      skyShaderPass.current.material.uniforms.r.value = rgb.x;
      skyShaderPass.current.material.uniforms.g.value = rgb.y;
      skyShaderPass.current.material.uniforms.b.value = rgb.z;
      skyShaderPass.current.material.uniforms.uBlendStrength.value = blendStrength;
      skyShaderPass.current.material.uniforms.uBrightnessStrength.value = brightness;
      skyShaderPass.current.material.uniforms.uReflectiveStrength.value = reflectiveness;

      // weatherShaderPass.current.material.uniforms.sDistance.value = sunDistance;
      // weatherShaderPass.current.material.uniforms.sPosition.value = new THREE.Vector3(...sunPosition).normalize();
      
      // weatherShaderPass.current.material.uniforms.uInverseProjection.value.copy(camera.projectionMatrixInverse);
      // weatherShaderPass.current.material.uniforms.uInverseView.value.copy(camera.matrixWorld);
      // weatherShaderPass.current.material.uniforms.cameraPosition = { value: camera.position };

      // weatherShaderPass.current.material.uniforms.tDepth.value = depthTexture;

      // weatherShaderPass.current.material.uniforms.pRadius.value = radius;
      // weatherShaderPass.current.material.uniforms.pPosition.value = new THREE.Vector3(...position);
      // weatherShaderPass.current.material.uniforms.aRadius.value = aRadius;


      composer.current.render();
    }
  }, 1);



  return null;
};



export default Atmosphere;

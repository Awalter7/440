import React, { useContext, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { ComposerContext } from '../contexts/composerContext';

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import useDepthCapture from "../utils/depthCapture";
import AtmosphereShader from '../shaders/atmosphere';
import { OpticalDepth } from '../utils/opticalDepth';

import { useControls, folder } from 'leva'

function getRGB(waveLengths, scatteringStrength) {
  const RGB = new THREE.Vector3(
    Math.pow(400 / waveLengths.r, 4) * scatteringStrength,
    Math.pow(400 / waveLengths.g, 4) * scatteringStrength,
    Math.pow(400 / waveLengths.b, 4) * scatteringStrength
  );
  return RGB;
}

const Atmosphere = ({
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
}) => {

  const { camera, size, scene } = useThree();
  const { depthTexture } = useDepthCapture();
  const composer = useContext(ComposerContext);

  const atmospherePass = useRef();

  const atmosphereProps = useControls({
    Atmosphere: folder(
      {
        // Planet Position
        position: { value: { x: 2, y: 0, z: 0 }, step: 1, label: "position" },
        // Planet
        radius: { value: radius, min: 0.1, max: 50, step: 0.1, label: 'Radius' },
        scale:  { value: scale,  min: 0.0, max: 2.0, step: 0.01, label: 'Atmosphere Scale' },

        // Sun
        Sun: folder({
          sunPosition: { value: { x: 0, y: 50, z: 1000 }, step: 1, label: "position" },
          sunDistance:{ value: sunDistance, min: 1, max: 200, step: 0.5, label: 'Sun Distance' },
        }, { collapsed: true }),

        // Scattering
        Scattering: folder({
           scatteringStrength:     { value: scatteringStrength,     min: 1,   max: 100,  step: 0.5,  label: 'Scattering Strength' },
           densityFallOff:         { value: densityFallOff,         min: 1,   max: 1000, step: .5,    label: 'Density Fall-Off' },
           numInScatteringPoints:  { value: numInScatteringPoints,  min: 1,   max: 20,  step: .5,    label: 'In-Scattering Points' },
           numOpticalDepthPoints:  { value: numOpticalDepthPoints,  min: 1,   max: 256,  step: 1,    label: 'Optical Depth Points' },
        }, { collapsed: true }),

        // Wavelengths
        Wavelengths: folder({
          waveR: { value: waveLengths.r, min: 300, max: 800, step: 1, label: 'Red λ (nm)' },
          waveG: { value: waveLengths.g, min: 300, max: 800, step: 1, label: 'Green λ (nm)' },
          waveB: { value: waveLengths.b, min: 300, max: 800, step: 1, label: 'Blue λ (nm)' },
        }, { collapsed: true }),

        // Appearance
        Appearance: folder({
           blendStrength:   { value: blendStrength,   min: 0, max: 2,  step: 0.01, label: 'Blend Strength' },
           brightness:      { value: brightness,      min: 0, max: 10, step: 0.1,  label: 'Brightness' },
           reflectiveness:  { value: reflectiveness,  min: 0, max: 10, step: 0.1,  label: 'Reflectiveness' },
        }, { collapsed: true }),
      },
      { collapsed: true }
    ),
  });

  // Derived values from Leva controls


  useEffect(() => {
    if (!composer || !composer.current || !depthTexture) return;

    const atmosphere = AtmosphereShader.clone();
    const u = atmosphere.uniforms;

    const rgb    = getRGB({r: atmosphereProps.waveR, g: atmosphereProps.waveG, b: atmosphereProps.waveB},  scatteringStrength);
    const aRadius = (1 +  atmosphereProps.scale) *  atmosphereProps.radius;
    const opticalDepth = OpticalDepth(240, 100, aRadius,  atmosphereProps.radius);

    atmosphere.needsUpdate = true;

    u.tDepth.value                = depthTexture;
    u.tOpticalDepthLookup.value   = opticalDepth;
    u.uInverseProjection.value.copy(camera.projectionMatrixInverse);
    u.uInverseView.value.copy(camera.matrixWorld);
    u.cameraPosition              = { value: camera.position };
    u.pRadius.value               = atmosphereProps.radius;
    u.pPosition.value             = new THREE.Vector3(atmosphereProps.position.x, atmosphereProps.position.y, atmosphereProps.position.z);
    u.aRadius.value               = aRadius;
    u.sDistance.value             = atmosphereProps.sunDistance;
    u.sPosition.value             = new THREE.Vector3(atmosphereProps.sunPosition.x, atmosphereProps.sunPosition.y, atmosphereProps.sunPosition.z).normalize();
    u.numOpticalDepthPoints.value = atmosphereProps.numOpticalDepthPoints;
    u.numInScatteringPoints.value = atmosphereProps.numInScatteringPoints;
    u.densityFallOff.value        = atmosphereProps.densityFallOff;
    u.r.value                     = rgb.x;
    u.g.value                     = rgb.y;
    u.b.value                     = rgb.z;
    u.uBlendStrength.value        = atmosphereProps.blendStrength;
    u.uBrightnessStrength.value   = atmosphereProps.brightness;
    u.uReflectiveStrength.value   = atmosphereProps.reflectiveness;

    atmospherePass.current = new ShaderPass(atmosphere);
    composer.current.addPass(atmospherePass.current);

    return () => {
      if (composer && composer.current) {
        composer.current.removePass(atmospherePass.current);
      }
    };
  }, [scene, camera, depthTexture, composer, size]);

  useEffect(() => {
    if (composer && composer.current) {
      composer.current.setSize(size.width, size.height);
    }
  }, [size, composer]);

  useFrame(() => {
    if (composer && composer.current && atmospherePass.current) {
      const u = atmospherePass.current.material.uniforms;

      const rgb    = getRGB({r: atmosphereProps.waveR, g: atmosphereProps.waveG, b: atmosphereProps.waveB},  scatteringStrength);
      const aRadius = (1 +  atmosphereProps.scale) *  atmosphereProps.radius;

      u.uInverseProjection.value.copy(camera.projectionMatrixInverse);
      u.uInverseView.value.copy(camera.matrixWorld);
      u.tDepth.value                = depthTexture;
      u.cameraPosition              = { value: camera.position };
      u.pRadius.value               = atmosphereProps.radius;
      u.pPosition.value             = new THREE.Vector3(atmosphereProps.position.x, atmosphereProps.position.y, atmosphereProps.position.z);
      u.aRadius.value               = aRadius;
      u.sDistance.value             = atmosphereProps.sunDistance;
      u.sPosition.value.set(atmosphereProps.sunPosition.x, atmosphereProps.sunPosition.y, atmosphereProps.sunPosition.z).normalize();
      u.numOpticalDepthPoints.value = atmosphereProps.numOpticalDepthPoints;
      u.numInScatteringPoints.value = atmosphereProps.numInScatteringPoints;
      u.densityFallOff.value        = atmosphereProps.densityFallOff;
      u.r.value                     = rgb.x;
      u.g.value                     = rgb.y;
      u.b.value                     = rgb.z;
      u.uBlendStrength.value        = atmosphereProps.blendStrength;
      u.uBrightnessStrength.value   = atmosphereProps.brightness;
      u.uReflectiveStrength.value   = atmosphereProps.reflectiveness;

      composer.current.render();
    }
  }, 1);

  return null;
};

export default Atmosphere;
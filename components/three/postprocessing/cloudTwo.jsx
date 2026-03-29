import { useContext, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { ComposerContext } from '../contexts/composerContext';

import * as THREE from 'three';

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import useDepthCapture from '../utils/depthCapture';
import CloudShader from '../shaders/cloud2';

const CloudTwo = (props) => {
    const { camera, size, scene } = useThree();
    const { depthTexture } = useDepthCapture();
    const composer = useContext(ComposerContext);

    const cloudShaderPass = useRef();

    const {
        noise,
    } = props;

    useEffect(() => {
        if (!composer?.current || !depthTexture) return;

       

        const cloudShader = CloudShader.clone();
        cloudShader.needsUpdate = true;

        cloudShader.uniforms.tDepth.value = depthTexture;
        cloudShader.uniforms.uInverseProjection.value.copy(camera.projectionMatrixInverse);
        cloudShader.uniforms.uInverseView.value.copy(camera.matrixWorld);
        cloudShader.uniforms.cameraPosition = { value: camera.position};
        cloudShader.uniforms.tNoise.value = noise;

        // if (cloudMap) {
        //     cloudShader.uniforms.tCloudMap.value = cloudMap;
        // }

        // cloudShader.uniforms.uEarthRadius.value     = earthRadius;
        // cloudShader.uniforms.uCloudThickness.value  = cloudThickness;
        // cloudShader.uniforms.uTime.value             = 0.0;
        // cloudShader.uniforms.uCloudDensityScale.value = densityScale;
        // cloudShader.uniforms.uDriftSpeed.value        = driftSpeed;
        
        // if (sunDir)      cloudShader.uniforms.uSunDir.value.copy(sunDir);
        // if (cloudColor)  cloudShader.uniforms.uCloudColor.value.copy(cloudColor);
        // if (shadowColor) cloudShader.uniforms.uShadowColor.value.copy(shadowColor);

        cloudShaderPass.current = new ShaderPass(cloudShader);
        composer.current.addPass(cloudShaderPass.current);

        return () => {
            if (composer && composer.current) {
                composer.current.removePass(cloudShaderPass.current);
            }
        };
    }, [scene, camera, depthTexture, composer, size]);

    useEffect(() => {
        if (composer?.current) {
            composer.current.setSize(size.width, size.height);
        }
    }, [size, composer]);

    useFrame((_, delta) => {
        if (!cloudShaderPass.current) return;

        const u = cloudShaderPass.current.material.uniforms;

        u.uInverseProjection.value.copy(camera.projectionMatrixInverse);
        u.uInverseView.value.copy(camera.matrixWorld);
        u.tDepth.value  = depthTexture;
        u.tNoise.value = noise;
        // u.uTime.value  += delta;
        u.cameraPosition = { value: camera.position};
       

        // if (sunDir)      u.uSunDir.value.copy(sunDir);
        // if (cloudColor)  u.uCloudColor.value.copy(cloudColor);
        // if (shadowColor) u.uShadowColor.value.copy(shadowColor);

        // u.uCloudDensityScale.value = densityScale;
        // u.uDriftSpeed.value        = driftSpeed;

        composer.current.render();
    }, 1);

    return null;
};

export default CloudTwo;
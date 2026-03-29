import { BlendFunction } from 'postprocessing';
import { useContext, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { ComposerContext } from '../contexts/composerContext';
import { useTexture } from '@react-three/drei';
import  * as THREE from "three";
import { easing } from 'maath';

import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import useDepthCapture from '../utils/depthCapture';
import lensFlareShader from "../shaders/lensFlare"
import { useControls, folder } from 'leva'


const lensFlare = ({
    position = {x: 0, y: 50, z: 1000},
    blendFunction = BlendFunction.NORMAL,
    glareSize = 0.07,
    followMouse,
    starPoints = 0.0,
    flareSize = 0.001,
    flareSpeed = 0.21,
    flareShape = 0.13,
    animated = true,
    anamorphic = false,
    colorGain = new THREE.Color(245, 243, 155),
    dirtTextureFile = 'https://i.ibb.co/c3x4dBy/lens-Dirt-Texture.jpg',
    haloScale = 0.5,
    secondaryGhosts = true,
    aditionalStreaks = true,
    ghostScale = 0.8,
    starBurst = true,
    enabled = true,
    opacity = .38
}) => {
    const { camera, size, scene } = useThree();
    const { depthTexture } = useDepthCapture();
    const composer = useContext(ComposerContext);



    const { viewport, raycaster } = useThree()
    const lensDirtTexture = useTexture(dirtTextureFile)

    const lensFlarePass = useRef();

    

    const lensFlareProps = useControls({
        LensFlare: folder(
            {
                enabled: { value: true, label: "enabled?" },
                opacity: { value: .38, min: 0.0, max: 1.0, label: "opacity" },
                position: { value: { x: 0, y: 50, z: 1000 }, step: 1, label: "position" },
                glareSize: { value: .07, min: 0.01, max: 1.0, label: "glareSize" },
                starPoints: {
                    value: 0.0,
                    step: 1.0,
                    min: 0,
                    max: 32.0,
                    label: "starPoints",
                },
                animated: { value: true, label: "animated?" },
                followMouse: { value: false, label: "followMouse?" },
                anamorphic: { value: false, label: "anamorphic?" },
                colorGain: { value: new THREE.Color(245, 243, 155), label: "colorGain" },

                Flare: folder({
                    flareSpeed: {
                        value: 0.21,
                        step: 0.001,
                        min: 0.0,
                        max: 1.0,
                        label: "flareSpeed",
                    },
                    flareShape: {
                        value: 0.13,
                        step: 0.001,
                        min: 0.0,
                        max: 1.0,
                        label: "flareShape",
                    },
                    flareSize: {
                        value: 0.001,
                        step: 0.0001,
                        min: 0.0,
                        max: 0.01,
                        label: "flareSize",
                    },
                }),

                SecondaryGhosts: folder({
                    secondaryGhosts: { value: true, label: "secondaryGhosts?" },
                    ghostScale: { value: 0.8, min: 0.01, max: 1.0, label: "ghostScale" },
                    aditionalStreaks: { value: true, label: "aditionalStreaks?" },
                }),

                StartBurst: folder({
                    starBurst: { value: true, label: "starBurst?" },
                    haloScale: { value: 0.49, step: 0.01, min: 0.3, max: 1.0 },
                }),
            },
            { collapsed: true }
        ),
    });

    useEffect(() => {
        if(!composer?.current || !depthTexture) return;

        const lensFlare = lensFlareShader.clone();

        lensFlare.needsUpdate = true;

        const u = lensFlare.uniforms;

        u.iResolution.value.x = viewport.width
        u.iResolution.value.y = viewport.height

        u.glareSize.value = lensFlareProps.glareSize;
        u.starPoints.value = lensFlareProps.starPoints;
        u.flareSize.value = lensFlareProps.flareSize;
        u.flareSpeed.value = lensFlareProps.flareSpeed;
        u.flareShape.value = lensFlareProps.flareShape;
        u.animated.value = lensFlareProps.animated;
        u.anamorphic.value = lensFlareProps.anamorphic;
        u.colorGain.value = lensFlareProps.colorGain;
        u.haloScale.value = lensFlareProps.haloScale;
        u.secondaryGhosts.value = lensFlareProps.secondaryGhosts;
        u.aditionalStreaks.value = lensFlareProps.aditionalStreaks;
        u.ghostScale.value = lensFlareProps.ghostScale;
        u.starBurst.value = lensFlareProps.starBurst;
        u.enabled.value = lensFlareProps.enabled;
        u.maxOpacity.value = lensFlareProps.opacity;
        

        lensFlarePass.current = new ShaderPass(lensFlare)
        composer.current.addPass(lensFlarePass.current);

        return () => {
            if (composer && composer.current) {
                composer.current.removePass(lensFlarePass.current);
            }
        }
    }, [scene, camera, depthTexture, composer, size])

    const dampValue = (current, target, smoothing, delta) => {
        const ref = { value: current }
        easing.damp(ref, 'value', target, smoothing, delta)
        return ref.value
    }

    useEffect(() => {
        if (composer && composer.current) {
            composer.current.setSize(size.width, size.height);
        }
    }, [size, composer]);



    useFrame((_, delta) => {
        let flarePosition = new THREE.Vector3()
        
        if (lensFlarePass.current) {
            const u = lensFlarePass.current.material.uniforms;
            if (followMouse) {
                u.lensPosition.value.x = mouse.x
                u.lensPosition.value.y = mouse.y
                u.opacity.value = dampValue(u.opacity.value, 0.0, 0.02, delta)
            } else {
                const screenPosition = new THREE.Vector3(position.x, position.y, position.z)
                let projectedPosition;

                projectedPosition = screenPosition.clone()
                projectedPosition.project(camera)

                flarePosition.set(projectedPosition.x, projectedPosition.y, projectedPosition.z)

                if (flarePosition.z > 1) return

                raycaster.setFromCamera(projectedPosition, camera)
                let intersects = raycaster.intersectObjects(scene.children, true)
                intersects = intersects.filter(intersect => intersect.object.name !== 'flare-source')

                if (intersects[0]) {
                    if (intersects[0].object.userData && intersects[0].object.userData.lensflare === 'no-occlusion') {
                        u.opacity.value = dampValue(u.opacity.value, 0.2, 0.02, delta)
                    } else {
                        //Check for MeshTransmissionMaterial
                        if (intersects[0].object.material.uniforms) {
                            if (intersects[0].object.material.uniforms._transmission) {
                                if (intersects[0].object.material.uniforms._transmission.value > 0.2) {
                                    easing.damp(lensFlarePass.current.uniforms.get('opacity'), 'value', 0.2, 0.02, delta)
                                }
                            }
                        } else {
                            u.opacity.value = dampValue(u.opacity.value, 1.0, 0.02, delta)
                        }

                        //Check for MeshPhysicalMaterial with transmission setting
                        if (intersects[0].object.material._transmission && intersects[0].object.material._transmission > 0.2) {
                            u.opacity.value = dampValue(u.opacity.value, 0.2, 0.03, delta)
                        } else {
                            u.opacity.value = dampValue(u.opacity.value, 1.0, 0.03, delta)
                        }

                        //Check for OtherMaterials with transparent parameter
                        if (intersects[0].object.material.transparent) {
                            u.opacity.value = dampValue(u.opacity.value, intersects[0].object.material.opacity, .5, delta);
                        } else {
                            u.opacity.value = dampValue(u.opacity.value, 1.0, .7, delta)
                        }
                    }
                } else {
                    u.opacity.value = dampValue(u.opacity.value, 0.0, 0.02, delta)
                }

                u.lensPosition.value.x = flarePosition.x
                u.lensPosition.value.y = flarePosition.y
            }

            u.maxOpacity.value = lensFlareProps.opacity;
            u.glareSize.value = lensFlareProps.glareSize;
            u.starPoints.value = lensFlareProps.starPoints;
            u.flareSize.value = lensFlareProps.flareSize;
            u.flareSpeed.value = lensFlareProps.flareSpeed;
            u.flareShape.value = lensFlareProps.flareShape;
            u.animated.value = lensFlareProps.animated;
            u.anamorphic.value = lensFlareProps.anamorphic;
            u.colorGain.value = lensFlareProps.colorGain;
            u.haloScale.value = lensFlareProps.haloScale;
            u.secondaryGhosts.value = lensFlareProps.secondaryGhosts;
            u.aditionalStreaks.value = lensFlareProps.aditionalStreaks;
            u.ghostScale.value = lensFlareProps.ghostScale;
            u.starBurst.value = lensFlareProps.starBurst;
            u.enabled.value = lensFlareProps.enabled;

        }

        composer.current.render();
    }, 1)
}

export default lensFlare;
"use client"
import {  Component, createRef } from "react";
import { extend } from "@react-three/fiber";
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import * as THREE from 'three'

import GUI from 'lil-gui'

import AtmospherePass from "../postprocessing/atmospherePass"
import { SolidPlanetMaterial } from "../shaders/planet"

import Bump from "../../../public/images/4K/2k_earth_normal_map.jpg"
import Specular from "../../../public/images/4K/2k_earth_specular_map.jpg"
import Diffuse from "../../../public/images/4K/2k_earth_daymap.jpg"
import HighResDiffuse from "../../../public/images/4K/8k_earth_daymap.jpg"
import Lights from "../../../public/images/4K/2k_earth_nightmap.jpg"
import Normal from "../../../public/images/4k/2k_earth_normal.png"
import { roughness } from "three/src/nodes/core/PropertyNode";

extend({ MeshLineGeometry, MeshLineMaterial })


export default class Earth extends Component {
    constructor(props) {
        super(props);

        const [px = 0, py = 0, pz = 0] = props.position || [];
        this._rawPosition = new THREE.Vector3(px, py, pz);

        this._position = new Proxy(this._rawPosition, {
        get: (target, prop) => target[prop],
        set: (target, prop, value) => {
            if (["x", "y", "z"].includes(prop)) {
            target[prop] = value;
            this.forceUpdate();
            return true;
            }
            return Reflect.set(target, prop, value);
        }
        });

        this._rotation = props.rotation ?? [0, 0, 0];
        this._sunPosition = props.sunPosition ?? [10, 10, 5];
        this.args = props.args || [20, 30, 30];
        this.state = { hover: false };

        
        this.earthMeshRef = createRef();
        this.earthAtmosphereRef = createRef();

        this._refs = {earthMeshRef: this.earthMeshRef, earthAtmosphereRef: this.earthAtmosphereRef}

        this._connectRefs = typeof props.connectRefs === "function"
            ? props.connectRefs
            : () => {};

        this._controlsRef =
        {
            scale: .1, 
            r: 700, 
            g: 530, 
            b: 440, 
            numInScatteringPoints: 13.16, 
            numOpticalDepthPoints: 45.85, 
            scatteringStrength: 4, 
            densityFallOff: 22.087, 
            blendStrength: .631, 
            brightness: .115, 
            reflectiveness: 7.8, 
            sunDistance: .4
        }

        this.camera = props.camera;
        this.scene = props.scene;
    }

    get connectRefs() {
        return this._connectRefs;
    }

    set connectRefs(callback) {
        if (typeof callback === "function") {
            this._connectRefs = callback;
        } else {
            console.warn("connectRefs must be a function");
        }
    }

    initMaterial() {
        const loader = new THREE.TextureLoader();
    
        const dif    =          loader.load(Diffuse.src,  (texture) => this.setState({ diffuseMap:  texture }));
        const highResDiffuse    =  loader.load(HighResDiffuse.src,  (texture) => this.setState({ HighResDiffuseMap:  texture }));
        const bump   =          loader.load(Bump.src,     (texture) => this.setState({ bumpMap:     texture }));
        const normal =          loader.load(Normal.src, (texture) => this.setState({ normal:     texture }));
        const spec   =          loader.load(Specular.src, (texture) => this.setState({ specularMap: texture }));
        const lights =          loader.load(Lights.src,   (texture) => this.setState({ lightsMap:   texture }));
    
        return new SolidPlanetMaterial({ // ← return the material
            map: dif,
            highResMap: highResDiffuse,
            normalMap: normal,
            bumpMap: bump,
            bumpScale: 0.5,
            specularIntensityMap: spec,
            lightMap: lights,
            cameraPosition: this.camera.position,
            roughness: 1,
            bumpScale: 10,
        });
    }

    get position() {
        return this._position;
    }

    set position(value){
        this._position = value;
    }


    componentDidMount(){
        this.material = this.initMaterial(); // ← call it, fix typo
        this.animate();
    }

    animate = () => {
        const ref = this.earthAtmosphereRef.current;
        if (!ref) return requestAnimationFrame(this.animate); // guard null


        const light = this.scene.getObjectByName("atmosphere-source");;
        
        if(!light) return;

        ref.sunPosition = light.position;

        requestAnimationFrame(this.animate);
    };

    getMeshRef() {
        return earthRef;
    }

    handleHover = () => {
        this.setState((prevState) => ({ hover: !prevState.hover }));
    };

    render() {
        return (
            // <AtmospherePass ref={this.earthAtmosphereRef}>
                <mesh
                    ref={this.earthMeshRef}
                    material={this.material}
                    position={[this._position.x, this._position.y, this._position.z]}
                    rotation={this._rotation}
                    castShadow
                    receiveShadow
                    onPointerEnter={this.handleHover}
                    onPointerLeave={this.handleHover}
                    userData={{sunPosition: this._sunPosition}}
                >
                    <AtmospherePass ref={this.earthAtmosphereRef}/>
                    <sphereGeometry args={this.args} />
                </mesh>
            // {/* </AtmospherePass> */}
        );
    }
}

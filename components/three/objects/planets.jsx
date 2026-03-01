"use client"
import { useState, useRef, useEffect, Component, createRef} from "react";
import {useLoader, extend} from "@react-three/fiber";
import { MeshLineGeometry, MeshLineMaterial} from 'meshline'
import * as THREE from 'three'

import AtmospherePass from "../postprocessing/atmospherePass"
import { SolidPlanetMaterial } from "../shaders/planet"

import Bump from "../../../public/images/4K/2k_earth_normal_map.jpg"
import Specular from "../../../public/images/4K/2k_earth_specular_map.jpg"
import Diffuse from "../../../public/images/4K/2k_earth_daymap.jpg"
// import Cloud from "../../../public/images/4K/2k_earth_clouds.jpg"
// import CloudBump from "../../../public/images/4K/2k_earth_clouds_bump.jpg"
import Lights from "../../../public/images/4K/2k_earth_nightmap.jpg"

extend({ MeshLineGeometry, MeshLineMaterial })


class PlanetBase extends Component {
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

    this.args = props.args || [20, 30, 30];
    this.state = { hover: false };
    this.ref = createRef();

    this.EARTH_TILT = THREE.MathUtils.degToRad(23.44);
    this.rotationSpeed = 0.0002;
    this.tiltAxis = new THREE.Vector3(
      0,
      Math.cos(this.EARTH_TILT),
      Math.sin(this.EARTH_TILT)
    ).normalize();

    this.animate = this.animate.bind(this);
  }

  componentDidMount() {
    this.animate();
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.frameId);
  }

  animate() {
    if (this.ref.current) {
      this.ref.current.rotateOnWorldAxis(this.tiltAxis, this.rotationSpeed);
    }
    this.frameId = requestAnimationFrame(this.animate);
  }

  get position() {
    return this._position;
  }

  handleHover = () => {
    this.setState((prevState) => ({ hover: !prevState.hover }));
  };

  render() {
    return (
      <mesh
        ref={this.ref}
        material={this.props.material} // ✅ just use the prop directly
        position={[this._position.x, this._position.y, this._position.z]}
        castShadow
        receiveShadow
        onPointerEnter={this.handleHover}
        onPointerLeave={this.handleHover}
      >
        <sphereGeometry args={this.args} />
      </mesh>
    );
  }
}


const PlanetGroup = () => {
    const diffuseMap   = useLoader(THREE.TextureLoader, Diffuse.src)
    const bumpMap      = useLoader(THREE.TextureLoader, Bump.src)
    const specularMap  = useLoader(THREE.TextureLoader, Specular.src)
    // const cloudMap     = useLoader(THREE.TextureLoader, Cloud.src)
    // const cloudBumpMap = useLoader(THREE.TextureLoader, CloudBump.src)
    const lightsMap    = useLoader(THREE.TextureLoader, Lights.src)

    // ✅ Material is constructed here in PlanetGroup and passed as a prop
    const material = new SolidPlanetMaterial({
      map: diffuseMap,
      bumpMap: bumpMap,
      bumpScale: 0.5,
      specularIntensityMap: specularMap,
    //   cloudMap: cloudMap,
    //   cloudBumpMap: cloudBumpMap,
      lightMap: lightsMap,
    })

    const [sunPosition, setSunPosition] = useState([10, 0, 5])
    const atmosphereRef = useRef()

    useEffect(() => {
      if(atmosphereRef.current){
        atmosphereRef.current.sunPosition = sunPosition
      }
    }, [sunPosition])

    return (
      <>
          <directionalLight
            castShadow
            intensity={4.0}
            position={sunPosition}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
            shadow-camera-far={50}
            shadow-camera-left={-10}
            shadow-camera-right={10}
            shadow-camera-top={10}
            shadow-camera-bottom={-10}
          />  
          
          <AtmospherePass ref={atmosphereRef}>
            <PlanetBase 
              position={[13, 0, 0]}
              args={[20, 300, 300]}   
              material={material} // ✅ passed as a single prop
            />
          </AtmospherePass>
      </>
    );
  };

export default PlanetGroup;
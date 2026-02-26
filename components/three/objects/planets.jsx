"use client"
//planet imports 
import { useState, useRef, useEffect, Component, createRef} from "react";
import {useLoader, extend} from "@react-three/fiber";
import { MeshLineGeometry, MeshLineMaterial} from 'meshline'
import * as THREE from 'three'


import usePointPlane from "../hooks/planePosition"

import AtmospherePass from "../postprocessing/atmospherePass"


import Bump from "../../../../public/textures/planets/water-planet/4K/2k_earth_normal_map.jpg"
import Specular from "../../../../public/textures/planets/water-planet/4K/2k_earth_specular_map.jpg"
import Diffuse from "../../../../public/textures/planets/water-planet/4K/2k_earth_daymap.jpg"

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

    const [rx = 0, ry = 0, rz = 0] = props.rotation || [0, 0, 0];
    this._rotation = { x: rx, y: ry, z: rz };

    this.args = props.args || [20, 30, 30];
    this.text = props.text || "Text Here";
    this.dist = props.dist || 5;
    this.spacing = props.spacing || 0;
    this.size = props.size || 4;

    this.state = { hover: false, opacity: 0 };
    this.ref = createRef();

    this.animate = this.animate.bind(this);
  }

  componentDidMount() {
    if (this.ref.current) {
      this.ref.current.rotation.set(
        this._rotation.x,
        this._rotation.y,
        this._rotation.z
      );
    }
    this.animate();
  }

  animate = (time) => {
    if (this.ref.current) {
      this._rotation.y += 0.000001;

      const wobbleAmount = 0.00005;
      const baseX = this._rotation.x;
      const wobbleX = Math.sin(time / 1000) * wobbleAmount;

      this.ref.current.rotation.set(baseX + wobbleX, this._rotation.y, this._rotation.z);
    }
    requestAnimationFrame(this.animate);
  };

  get position() {
    return this._position;
  }

  handleHover = () => {
    this.setState((prevState) => ({ hover: !prevState.hover }));
  };

  render() {
    const { map, bumpMap, specular } = this.props;

    return (
      <>
        <mesh
          ref={this.ref}
          position={[
            this._position.x,
            this._position.y,
            this._position.z
          ]}
          castShadow
          receiveShadow
          onPointerEnter={this.handleHover}
          onPointerLeave={this.handleHover}
        >
          <sphereGeometry args={this.args} />
          <meshPhysicalMaterial
            map={map}
            bumpMap={bumpMap}
            bumpScale={0.5}
            specularIntensityMap={specular}
          />
        </mesh>
      </>
    );
  }
}


const PlanetGroup = () => {

    const {SunPositionPlane} = usePointPlane({
      args: [100, 100, 10, 10],
      position: [0, 0, 0],
      rotation: [0, Math.PI, 0],
      transparent: true,
      planeName: "SunPositionPlane",
      // onPointChange: (value) => setSunPosition([value.x * 5.0, Math.pow(1.1, value.y), 100]),
    });

    const diffuseMap = useLoader(THREE.TextureLoader, Diffuse.src)
    const BumpMap    = useLoader(THREE.TextureLoader, Bump.src)
    const SpecularMap = useLoader(THREE.TextureLoader, Specular.src)

    const [sunPosition, setSunPosition] = useState([0, 100, 0])
    const atmosphereRef = useRef()

    useEffect(() => {
      if(atmosphereRef.current){
        atmosphereRef.current.sunPosition = [0, 0, 10]
      }
    }, [sunPosition])


    return (
      <>
          {/* <SunPositionPlane /> */}
          <directionalLight
            castShadow
            intensity={4.0}
            position={[0, 0, 10]}
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
              position={[0, 0, 0]}
              args={[20, 300, 300]}   
              rotation={[-Math.PI / 2, Math.PI, 0]}
              spacing={2}
              text={
                "ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME - ABOUT ME -"
              }
              dist={2}
              size={0.2}
              map={diffuseMap}
              bumpMap={BumpMap}
              specular={SpecularMap}
            />
          </AtmospherePass>
      
      </>
    );
  };


  
  
export default PlanetGroup;
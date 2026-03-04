"use client"
import { useState, useRef, useEffect, Component, createRef } from "react";
import { useLoader, extend } from "@react-three/fiber";
import { MeshLineGeometry, MeshLineMaterial } from 'meshline'
import * as THREE from 'three'

import AtmospherePass from "../postprocessing/atmospherePass"
import { SolidPlanetMaterial } from "../shaders/planet"

import Bump from "../../../public/images/4K/2k_earth_normal_map.jpg"
import Specular from "../../../public/images/4K/2k_earth_specular_map.jpg"
import Diffuse from "../../../public/images/4K/2k_earth_daymap.jpg"
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

    this._rotation = props.rotation ?? [0, 0, 0];
    this._sunPosition = props.sunPosition ?? [10, 10, 5];
    this.args = props.args || [20, 30, 30];
    this.state = { hover: false };
    this.ref = createRef();
  }

  get position() {
    return this._position;
  }




  // Expose the inner mesh ref so PlanetGroup can drive animation
  getMeshRef() {
    return this.ref;
  }

  handleHover = () => {
    this.setState((prevState) => ({ hover: !prevState.hover }));
  };

  render() {
    return (
      <mesh
        ref={this.ref}
        material={this.props.material}
        position={[this._position.x, this._position.y, this._position.z]}
        rotation={this._rotation}
        castShadow
        receiveShadow
        onPointerEnter={this.handleHover}
        onPointerLeave={this.handleHover}
        userData={{sunPosition: this._sunPosition}}
      >
        <sphereGeometry args={this.args} />
      </mesh>
    );
  }
}

// ─── Sun orbit config ─────────────────────────────────────────────────────
// The sun orbits the planet's center in world space.
// SUN_ORBIT_SPEED:  radians per frame (idle spin speed)
// SUN_ORBIT_TILT:   how much the orbit plane is tilted (radians) — 
//                   matching planet's axial tilt gives a realistic feel
const SUN_ORBIT_TILT   = THREE.MathUtils.degToRad(23.44)
const INITIAL_SUN_POS = new THREE.Vector3(0, 10, -8)
const SUN_ORBIT_INITIAL_ANGLE = Math.atan2(INITIAL_SUN_POS.x, INITIAL_SUN_POS.z)


const GROUP_QUAT_START = new THREE.Quaternion() // identity = no rotation at scroll 0
const GROUP_QUAT_END   = new THREE.Quaternion(
  0,                        // x
  0.32292650250065913,      // y
  0,                        // z
  0.9464240455433768        // w
)
const _groupQuat = new THREE.Quaternion() // reusable, no GC

const BASE_ROTATION = [0, 0, Math.PI / 2]
const baseQuat      = new THREE.Quaternion().setFromEuler(new THREE.Euler(...BASE_ROTATION))

// ─── Animation config ────────────────────────────────────────────────────
const SCROLL_TOTAL    = 2000
const SPLIT           = 0.5
const DELAY_START     = 0.0
const DELAY_END       = 1.0
const SCROLL_ROTATION = Math.PI * 4
const SCROLL_X        = -40

const easedFraction = (raw) => {
  const clamped    = Math.min(Math.max(raw, DELAY_START), DELAY_END)
  const normalised = (clamped - DELAY_START) / (DELAY_END - DELAY_START)
  if (normalised <= SPLIT) {
    return normalised
  } else {
    const local = (normalised - SPLIT) / (1 - SPLIT)
    const eased = local * local
    return SPLIT + eased * (1 - SPLIT)
  }
}


const PlanetGroup = () => {
  const diffuseMap  = useLoader(THREE.TextureLoader, Diffuse.src)
  const bumpMap     = useLoader(THREE.TextureLoader, Bump.src)
  const specularMap = useLoader(THREE.TextureLoader, Specular.src)
  const lightsMap   = useLoader(THREE.TextureLoader, Lights.src)

  const material = new SolidPlanetMaterial({
    map: diffuseMap,
    bumpMap: bumpMap,
    bumpScale: 0.5,
    specularIntensityMap: specularMap,
    lightMap: lightsMap,
  })

  const atmosphereRef = useRef()
  const planetRef     = useRef()
  const groupRef      = useRef()
  const lightRef      = useRef()

  const animStateRef = useRef({
    frameId:        null,
    spinAngle:      0,
    scrollY:        SUN_ORBIT_INITIAL_ANGLE,
    currentScrollY: SUN_ORBIT_INITIAL_ANGLE,  // ✅ start at correct angle
    targetX:        0,
    currentX:       0,
    rotationSpeed:  0.0002,
    sunOrbitAngle:  0,
  })

  // Reusable objects — allocated once, reused every frame to avoid GC pressure
  const tiltAxisRef = useRef((() => { const tilt = THREE.MathUtils.degToRad(23.44); return new THREE.Vector3(Math.cos(tilt), Math.sin(tilt), 0 ).normalize()})())
  const _tiltQuat      = useRef(new THREE.Quaternion())
  const _orbitQuat     = useRef(new THREE.Quaternion())
  const _sunLocal      = useRef(new THREE.Vector3([10, 20, 0]))
  // Orbit axis is the planet's tilt axis — sun orbits in the equatorial plane
  const _orbitAxis     = useRef( new THREE.Vector3(Math.sin(SUN_ORBIT_TILT), Math.cos(SUN_ORBIT_TILT), 0 ).normalize())


  useEffect(() => {
    const handleScroll = () => {
      const raw   = window.scrollY / SCROLL_TOTAL
      const eased = easedFraction(raw)

      animStateRef.current.scrollY = SUN_ORBIT_INITIAL_ANGLE + (eased * SCROLL_ROTATION)
      animStateRef.current.targetX = eased * SCROLL_X
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const state    = animStateRef.current
    const tiltAxis = tiltAxisRef.current


    const animate = () => {
      const scrollT = (state.currentScrollY - SUN_ORBIT_INITIAL_ANGLE) / SCROLL_ROTATION

      const planet = planetRef.current.ref.current
      const group = groupRef.current
      const light = lightRef.current;

      if (planet && group && light) {
        state.spinAngle      += state.rotationSpeed
        state.currentScrollY += (state.scrollY  - state.currentScrollY) * 0.06
        state.currentX       += (state.targetX  - state.currentX)       * 0.06

        planet.position.x = state.currentX

        _groupQuat.slerpQuaternions(GROUP_QUAT_START, GROUP_QUAT_END, Math.min(Math.max(scrollT, 0), 1))
        group.quaternion.copy(_groupQuat)


        _tiltQuat.current.setFromAxisAngle(tiltAxis, state.spinAngle)
        planet.quaternion
          .copy(baseQuat)
          .premultiply(_tiltQuat.current)

        _orbitQuat.current.setFromAxisAngle(
          _orbitAxis.current,
          state.currentScrollY - SUN_ORBIT_INITIAL_ANGLE
        )
        _sunLocal.current.copy(INITIAL_SUN_POS)
        _sunLocal.current.applyQuaternion(_orbitQuat.current)


        if (atmosphereRef.current) {
          atmosphereRef.current.sunPosition.set(light.position.x, light.position.y, light.position.z)
        }
      }

      state.frameId = requestAnimationFrame(animate)
    }

    animate()
    return () => cancelAnimationFrame(state.frameId)
  }, [])

  return (
    <>
      <group ref={groupRef}>
        <directionalLight
          ref={lightRef}
          position={[0, 50, 100]}
          castShadow
          intensity={4.0}
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-far={50}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={10}
          shadow-camera-bottom={-10}
        />
        <AtmospherePass ref={atmosphereRef} >
          <PlanetBase
            ref={planetRef}
            position={[2, 0, 0]}
            args={[20, 300, 300]}
            rotation={[0, 0, 0]}
            material={material}
          />
        </AtmospherePass>
      </group>
    </>
  )
}

export default PlanetGroup;
import React, { Component, createRef, useRef, useEffect} from "react";
import * as THREE from 'three';

export class Orbit extends Component {
    constructor(props) {
        super(props)

        this.children = props.children.length ? props.children : [props.children];
        this._refs = this.children.map(() => createRef())

        this.cameraRef = props.cameraRef;

        this.enableCamera = props.enableCamera;

        this._center = props.center
            ? new THREE.Vector3(props.center[0], props.center[1], props.center[2])
            : new THREE.Vector3(0, 0, 0)

        this._inclination = props.inclination ? props.inclination : 0;

        this.orbitAxis = new THREE.Vector3(0, Math.cos(this._inclination), Math.sin(this._inclination));
        this.q = new THREE.Quaternion();
        this.startOffset = new THREE.Vector3(this._radius, 0, 0);

        this._radius = 20.5;
        this._omega = 0.001;
        this._theta = Math.PI / 2;
        this._phi = 0;

        this.isGroup = props.isGroup === false ? false : true;

        // Reusable objects — allocated once, mutated each frame
        this._toCenter = new THREE.Vector3();
        this._up = new THREE.Vector3(0, 1, 0);
        this._rotMatrix = new THREE.Matrix4();
        this._faceQuat = new THREE.Quaternion();
    }

    componentDidMount() {
        this.rafId = requestAnimationFrame(this.animate)
    }

    componentWillUnmount() {
        cancelAnimationFrame(this.rafId)
    }

    getOrbitalPosition() {
        this._phi += this._omega;

        const x0 = this._radius * Math.cos(this._phi);
        const z0 = this._radius * Math.sin(this._phi);

        const x1 = x0;
        const y1 = -z0 * Math.sin(this._inclination);
        const z1 =  z0 * Math.cos(this._inclination);

        const x2 =  x1 * Math.cos(this._omega) + z1 * Math.sin(this._omega);
        const y2 =  y1;
        const z2 = -x1 * Math.sin(this._omega) + z1 * Math.cos(this._omega);

        return new THREE.Vector3(x2, y2, z2).add(this._center);
    }

    getFaceRotation(pos) {
        // Vector pointing FROM the object TOWARD the orbit center
        this._toCenter.subVectors(this._center, pos).normalize();

        // Build a rotation matrix whose -Z axis points toward the center.
        // THREE.Matrix4.lookAt(eye, target, up) makes -Z face the target,
        // which matches the default Three.js "forward" convention.
        this._rotMatrix.lookAt(
            pos,          // eye: where the object sits
            this._center, // target: the point to face
            this._up      // world up — swap to (0,0,1) if your scene uses Z-up
        );

        this._faceQuat.setFromRotationMatrix(this._rotMatrix);
        return this._faceQuat;
    }

    animate = () => {
        const pos = this.getOrbitalPosition();
        const rot = this.getFaceRotation(pos);

        this._refs.forEach((ref) => {
            if (ref.current) {
                if (this.isGroup) {
                    const group = ref.current.groupRef.current;
                    group.position.copy(pos);
                    group.quaternion.copy(rot);
                }
            }
        });

        // Write the current orbital pose for the camera rig to consume

        

        if (this.cameraRef && this.enableCamera) {
            this.cameraRef.current = { pos, rot };
        }

        this.rafId = requestAnimationFrame(this.animate)
    }

    render() {
        return (
            <>
                <group>
                    {this.children.map((child, i) =>
                        React.cloneElement(child, { ref: this._refs[i] })
                    )}
                </group>
            </>
        )
    }
}



export function useOrbit({
  center = [0, 0, 0],
  radius = 20.5,
  omega = 0.001,
  inclination = 0,
} = {}) {
  // Stable refs — allocated once, never recreated
  const phiRef = useRef(0);

  const _center = useRef(new THREE.Vector3(...center));
  const _up = useRef(new THREE.Vector3(0, 1, 0));
  const _rotMatrix = useRef(new THREE.Matrix4());
  const _faceQuat = useRef(new THREE.Quaternion());
  const _toCenter = useRef(new THREE.Vector3());

  // Output refs — callers read these each frame
  const positionRef = useRef(new THREE.Vector3());
  const rotationRef = useRef(new THREE.Quaternion());

  const rafId = useRef(null);

  useEffect(() => {
    function getOrbitalPosition() {
      phiRef.current += omega;
      const phi = phiRef.current;

      const x0 = radius * Math.cos(phi);
      const z0 = radius * Math.sin(phi);

      const x1 = x0;
      const y1 = -z0 * Math.sin(inclination);
      const z1 =  z0 * Math.cos(inclination);

      const x2 =  x1 * Math.cos(omega) + z1 * Math.sin(omega);
      const y2 =  y1;
      const z2 = -x1 * Math.sin(omega) + z1 * Math.cos(omega);

      return positionRef.current.set(x2, y2, z2).add(_center.current);
    }

    function getFaceRotation(pos) {
      _toCenter.current.subVectors(_center.current, pos).normalize();
      _rotMatrix.current.lookAt(pos, _center.current, _up.current);
      _faceQuat.current.setFromRotationMatrix(_rotMatrix.current);
      return _faceQuat.current;
    }

    function animate() {
      const pos = getOrbitalPosition();
      const rot = getFaceRotation(pos);

      // positionRef and rotationRef are updated in-place —
      // callers that read them each frame always get the latest values
      positionRef.current = pos;
      rotationRef.current = rot;

      rafId.current = requestAnimationFrame(animate);
    }

    rafId.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId.current);
  }, [center, radius, omega, inclination]);

  return { positionRef, rotationRef };
}
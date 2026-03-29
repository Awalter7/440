import { Component, createRef, useRef} from "react"
import { useThree, useFrame } from "@react-three/fiber"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as THREE from 'three';

// offset: how far behind/above the station the camera sits,
// in the station's LOCAL space before the face-rotation is applied


export default class SpaceStation extends Component {
    constructor(props) {
        super(props)
        this.groupRef = createRef()
        this.gltf = null

        this._position = props.position ? props.position : new THREE.Vector3(-18.3, 0, 0);
        this.rotation = [Math.PI / 2, 0, Math.PI / 2]
        this.scale = .05;
        this.name = "space-station"
    }

    get position() {
        return this._position;
    }

    set position(value) {
        this._position = value;
    }

    componentDidMount() {
        if (this.groupRef.current) {
            this.groupRef.current.position.copy(this._position);
        }

        const loader = new GLTFLoader()
        loader.load(
            '/objects/space-station.glb',
            (gltf) => {
                this.gltf = gltf
                this.groupRef.current.add(gltf.scene)
            },
            undefined,
            (error) => console.error('GLTF load error:', error)
        )
    }

    componentWillUnmount() {
        if (this.gltf) {
            this.gltf.scene.traverse((obj) => {
                if (obj.geometry) obj.geometry.dispose()
                if (obj.material) obj.material.dispose()
            })
        }
    }

    render() {
        return (
            <group
                ref={this.groupRef}
                rotation={this.rotation}
                scale={this.scale}
                name={this.name}
            />
        )
    }
}
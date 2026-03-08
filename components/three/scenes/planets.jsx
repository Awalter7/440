"use client"
import * as THREE from 'three';
import { Canvas, useThree } from "@react-three/fiber";
import PlanetGroup from "../objects/planets"
import { ComposerProvider } from "../contexts/composerContext";
import { useRef, Component, createRef, useEffect } from "react";
import { CurvedPath } from '../helpers/helpers';
import { OrbitControls } from '@react-three/drei';
import { usePlasmicCanvasContext } from '@plasmicapp/host';


class ScrollCamera extends Component{
    constructor(props){
        super(props)

        this.pathRef = createRef();

        this.camera = props.camera ?? null;

        //load sequence finished
        this.loaded = false;

        //load sequence time values
        this.currentLoadT = .01;
        this.targetLoadT = .01;
        this.lerp = this.lerpFactor(2000, 60)

        //time values
        this.currentT = 0;
        this.targetT = 0;

        //position values
        this.targetPoint = new THREE.Vector3;

        //rotation values
        this.targetRotation = new THREE.Quaternion;

        this.handleScroll = this.handleScroll.bind(this);

        this.rafId;
        this.timeoutId;
    }

    componentDidMount(){
        window.addEventListener("scroll", this.handleScroll, { passive: true });
        this.currentT = 0;
        this.targetT = 0;

        this.camera.rotation.set(-3.0332631463700075, 0, -Math.PI);


        this.timeoutId = setTimeout(() => {
            this.animate();
        }, 3000);
    }

    componentWillUnmount(){
        window.removeEventListener("scroll", this.handleScroll);
        if (this.rafId) cancelAnimationFrame(this.rafId);
        if (this.timeoutId) clearTimeout(this.timeoutId);
    }

    handleScroll() {
        const scrollY = window.scrollY;
        const maxScroll = document.body.scrollHeight - window.innerHeight;
        // Clamp t to [0, 1] along the path
        this.targetT = Math.max(0, Math.min(1, scrollY / maxScroll));
    }


    expRamp(t) {
        // t is 0–1, output is 0–100
        return (Math.pow(2, t * 7) - 1) / (Math.pow(2, 7) - 1) * 100;
    }

    lerpFactor(durationMs, fps = 60) {
        const frames = (durationMs / 1000) * fps;
        return 1 - Math.pow(0.01, 1 / frames);
    }

    animate() {
        this.rafId = requestAnimationFrame(() => this.animate());
        const path = this.pathRef.current;

        if (!path || !this.camera) return;

        const currentPoint = this.camera.position;

        if(!this.loaded){

            this.currentLoadT += (1 - this.currentLoadT) * this.lerp

            const index = Math.round(this.expRamp(this.currentLoadT))

            this.targetPoint = path.getPoint(index);
            this.targetRotation = path.getRotation(index);


            this.camera.quaternion.slerp(this.targetRotation, 0.08);

            if(index === 100){
                this.loaded = true;
            }

            const newPoint = currentPoint.clone().lerp(this.targetPoint, 0.08);

            this.camera.position.copy(newPoint);
        }else{
            // Lerp the t value
            this.currentT += (this.targetT - this.currentT) * 0.08;
        
            // Convert 0–1 to an index into the points array (0–300)
            const index = Math.round((this.currentT * 50) + 100);

            this.targetPoint = path.getPoint(index);
            this.targetRotation = path.getRotation(index);

            this.camera.quaternion.slerp(this.targetRotation, 0.08);

            const newPoint = currentPoint.clone().lerp(this.targetPoint, 0.08);

            this.camera.position.copy(newPoint);
        }
    }

    render(){
        return(
            <CurvedPath 
                posArgs={
                    [     
                        {
                            start: new THREE.Vector3(2, 107, -1000),
                            end: new THREE.Vector3(2, 20, -180),
                            path: "stright",
                            steps: 100,
                        },
                        {
                            start: new THREE.Vector3(2, 20, -180), 
                            end: new THREE.Vector3(104.6587779486033, 41.61408445716821, -96.94938610680649), 
                            path: "curved", 
                            rotation: 120, 
                            arcHeight: 40, 
                            arcSharpness: 1, 
                            steps: 50
                            
                        }
                    ]
                }
                rotArgs={
                    [
                        {
                            start: new THREE.Vector3(-3.0332631463700075, 0, -Math.PI),
                            end: new THREE.Vector3(-3.0332631463700075, 0, -Math.PI),
                            steps: 100,
                        },
                        {
                            start: new THREE.Vector3(-3.0332631463700075, 0, -Math.PI),
                            end: new THREE.Vector3(-2.8787066785351962, 0.557873783454524, 3.0000803168483334),
                            steps: 50,
                        }
                    ]
                }
                ref={this.pathRef}
                visible={false}
            />
        )
    }
}

function CameraWrapper(){
    const {camera} = useThree();

    return <ScrollCamera camera={camera}/>
}


export function Planets({ className, id }) {
    const canvasRef = useRef(null);   // ← new ref
    const inEditor = usePlasmicCanvasContext();

        

  // useMomentumScroll();
    return (
        <Canvas
            ref={canvasRef} 
            shadows
            camera={{
                fov: 20,
                position: [2, 200, -2000], // ← starts at -550
                rotation: [-3.0332631463700075, 0, -Math.PI],
                near: 10,
                far: 10000,
            }}
            gl={{ antialias: true }}
            className={className}
            id={id}
            frameloop="always"
            style={{
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: "10",
                backgroundColor: "transparent",

        }}
        >
            {
                !inEditor
                &&
                <>
                    <ComposerProvider>
                        <PlanetGroup />
                    </ComposerProvider>
                    <CameraWrapper/>
                </>
            }

            {/* <OrbitControls /> */}

        </Canvas>
    );
}

export default Planets;
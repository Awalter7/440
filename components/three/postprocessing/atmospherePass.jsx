import React, { useEffect, useRef, useState, Component, createRef } from "react";
import Atmosphere from "./atmosphere";
import * as THREE from 'three';
import Weather from "./weather"


export default class AtmospherePass extends Component{
    constructor(props){
        super(props)
        
        this.children = props.children;
        this.state = {meshData: []};
        this.ref = createRef()

        this._scale = .18;
        this._wavelength = {
            r: 550.0,
            g: 497.0, 
            b: 443.0
        };
        this._numInScatteringPoints = 20;
        this._numOpticalDepthPoints = 20;
        this._scatteringStrength = 20.3;
        this._densityFallOff = 15;
        this._blendStrength = .55;
        this._brightness = 0;
        this._reflectiveness = 2;
        this._sunPosition = new THREE.Vector3(10, 10, 5);
        this._sunDistance = .4;
    }

    get scale() {
        return this._scale;
    }
    set scale(value) {
        this._scale = value;
    }

    // Getter and setter for wavelength
    get wavelength() {
        return this._wavelength;
    }
    set wavelength(value) {
        if (value && typeof value === "object" && "r" in value && "g" in value && "b" in value) {
            this._wavelength = { ...value };
        } else {
            console.error("wavelength must be an object with properties r, g, and b");
        }
    }

    // Getter and setter for numInScatteringPoints
    get numInScatteringPoints() {
        return this._numInScatteringPoints;
    }
    set numInScatteringPoints(value) {
        this._numInScatteringPoints = value;
    }

    // Getter and setter for numOpticalDepthPoints
    get numOpticalDepthPoints() {
        return this._numOpticalDepthPoints;
    }
    set numOpticalDepthPoints(value) {
        this._numOpticalDepthPoints = value;
    }

    // Getter and setter for scatteringStrength
    get scatteringStrength() {
        return this._scatteringStrength;
    }
    set scatteringStrength(value) {
        this._scatteringStrength = value;
    }

    // Getter and setter for densityFallOff
    get densityFallOff() {
        return this._densityFallOff;
    }
    set densityFallOff(value) {
        this._densityFallOff = value;
    }

    // Getter and setter for blendStrength
    get blendStrength() {
        return this._blendStrength;
    }
    set blendStrength(value) {
        this._blendStrength = value;
    }

    // Getter and setter for brightness
    get brightness() {
        return this._brightness;
    }
    set brightness(value) {
        this._brightness = value;
    }

    get reflectiveness() {
        return this._reflectiveness;
    }
    set reflectiveness(value) {
        this._reflectiveness = value;
    }

    get sunPosition() {
        return this._sunPosition;
    }

    set sunPosition(value) {
        if (Array.isArray(value) && value.length === 3) {
            // Spread creates a new array reference → React sees a changed prop
            this._sunPosition = [...value]
            this.forceUpdate()
        } else if (value?.isVector3) {
            this._sunPosition = [value.x, value.y, value.z]
            this.forceUpdate()
        } else {
            console.error("sunPosition must be an array [x, y, z] or a THREE.Vector3")
        }
    }

    get sunDistance() {
        return this._sunDistance;
    }
    set sunDistance(value) {
        this._sunDistance = value;
    }
    
    animate = () => {
        this.initalize();
        
        requestAnimationFrame(this.animate)
    }

    componentDidMount() {
        this.animate();
    }



    initalize(){
        if(this.ref.current === undefined && !this.ref.current.children) return;
        
        const groupMesh = this.ref.current.children
        let arr = [];

        for (let i = 0; i < groupMesh.length; i++) {
            let mesh = groupMesh[i];
            if (mesh.isMesh) {
                arr.push({
                    id: mesh.id ? mesh.id : `mesh-${i}`,
                    radius: mesh.geometry.parameters.radius,
                    position: [
                        mesh.matrixWorld.elements[12],
                        mesh.matrixWorld.elements[13],
                        mesh.matrixWorld.elements[14],
                    ],
                });
            }
        }

        this.setState({meshData: arr})
    }

    render(){
    //         this._renderCount = (this._renderCount || 0) + 1
    // console.log("AtmospherePass render #", this._renderCount)
    
        return(
            <group ref={this.ref}>
                {this.children}
                {this.state.meshData.length > 0 &&
                    this.state.meshData.map((data, key) => (
                        <>
                            <Atmosphere
                                scale={this.scale}
                                wavelengths={this.wavelengths}
                                numInScatteringPoints={this._numInScatteringPoints}
                                numOpticalDepthPoints={this._numOpticalDepthPoints}
                                scatteringStrength={this._scatteringStrength}
                                densityFallOff={this._densityFallOff}
                                blendStrength={this._blendStrength}
                                brightness={this._brightness}
                                reflectiveness={this._reflectiveness}
                                sunDistance={this._sunDistance}
                                sunPosition={this._sunPosition}
                                {...data}
                                key={`atmosphere-${key}`}
                            />
                        </>

                    ))
                }
            </group>
        )
    }

}

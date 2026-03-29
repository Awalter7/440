"use client"
import React, {  Component, createRef } from "react";

export default class EarthRotation extends Component{
    constructor(props){
        super(props)

        this.children = props.children.length ? props.children : [props.children]
        
        if(this.children.length > 1){
            console.error("The EarthOrbit component should only recive one child.")
        }

        this.earthRef = createRef();

    }


    _connectRefs(refs){
        Object.entries(refs).map(([key, value]) => {
            this._refs[key] = value;
        })
    }

    componentDidMount(){
        this.animate();
    }

    animate = () => {
        const mesh = this.earthRef.current?.earthMeshRef?.current;
        if (!mesh) return;

        mesh.rotation.x += 0.0001;

        requestAnimationFrame(this.animate)
    }

    render(){
        return(
        <group>
            {this.children.map((child, i) =>
                React.cloneElement(child, { 
                    ref: this.earthRef 
                })
            )}
        </group>
        )
    }
}

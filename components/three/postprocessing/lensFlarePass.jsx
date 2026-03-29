import { Component } from "react";
import LensFlare from "./lensFlare";

export default class LensFlarePass extends Component{
    constructor(props){
        super(props)

        this._position = props.position;

        this.state = {position: this._position ?? {x: 0, y: 50, z: 100}}
    }

    get position(){
        return this._position;
    }

    set position(value){
        this._position = value;
        this.setState({position: value})
    }

    render(){
        // Use state, not the raw field
        const { position } = this.state;
        return <LensFlare position={position} />;
    }
}
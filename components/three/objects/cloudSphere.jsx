import { Component } from "react";
import Cloud from "../postprocessing/cloud";
import * as THREE from 'three'
import CloudMap from "../../../public/images/4k/Solarsystemscope_texture_8k_earth_clouds.jpg"
import CloudNoiseTexture from "../utils/cloudNoiseTexture"

export default class CloudSphere extends Component {
    constructor(props) {
        super(props)

        this.earthRadius = 20.0  // ← must match your Earth sphere's actual radius
        this.sunDir      = new THREE.Vector3(1, .5, 100)

        this.state = { cloudMap: null }

        const loader = new THREE.TextureLoader()
        loader.load(CloudMap.src, (texture) => {
            texture.wrapS = THREE.RepeatWrapping
            texture.wrapT = THREE.ClampToEdgeWrapping
            this.setState({ cloudMap: texture })
        })

        const noise = new CloudNoiseTexture({ width: 512, height: 256, animate: true });
        noise.start();

        console.log(noise)
    }

    render() {
        const { cloudMap } = this.state

        // Don't mount the pass until the texture is actually ready
        if (!cloudMap) return null

        return (
            <Cloud
                cloudMap={cloudMap}
                earthRadius={this.earthRadius}   // ← was missing
                cloudThickness={.1}  // thickness relative to radius
                sunDir={this.sunDir}
                densityScale={2}
            />
        )
    }
}
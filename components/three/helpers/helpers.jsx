import * as THREE from 'three';
import { Component } from "react";
import {Line} from "@react-three/drei";


export class LineMesh extends Component{
  constructor(props) {
    super(props)

    this.points = props.points;
    this.colors = props.colors; // Array of colors, one per point

  }

  render(){
    const vertexColors = this.colors.map(c => new THREE.Color(c));
    
    return(
      <>
        {
          this.points 
          && vertexColors
          &&
          <Line
            points={this.points}         // ✅ required prop
            // color="red"
            vertexColors={vertexColors}  // ✅ per-point colors
            lineWidth={1}
          />
        }
      </>
    )
  }
}


export class CurvedPath extends Component {
  constructor(props) {
    super(props);

    this.colors = [];

    this.posArgs = props.posArgs ?? [
        {
            start: new THREE.Vector3(2, 107, -1000),
            end: new THREE.Vector3(2, 20, -180),
            path: "stright",
            steps: 100,
        },
    ]

    this.rotArgs = props.rotArgs ?? [
        {
            start: new THREE.Vector3(-3.0332631463700075, 0, -Math.PI),
            end: new THREE.Vector3(-2.8787066785351962, 0.557873783454524, 3.0000803168483334),
            steps: 100,
        },
    ]

    this.points = this.posArgs.flatMap((arg) => {
      if (arg.path === "curved") {
        return this.computeCurvedPath(
            arg.start,
            arg.end,
            arg.rotation / 57.2958,
            arg.arcHeight,
            arg.arcSharpness,
            arg.steps,
        );
      }else if(arg.path === "stright"){
        return this.computeStrightPath(
            arg.start,
            arg.end,
            arg.steps,
        )
      }
      return [];
    });

    this.rotations = this.rotArgs.flatMap((arg) => {
        return this.computeRotation(
            arg.start,
            arg.end,
            arg.steps,
        )
    })

    this.visible = props.visible;
  }

  /**
   * Rotate a point p around an arbitrary unit axis (ax, ay, az) by angle r,
   * using Rodrigues' rotation formula.
   */
    rotateAroundAxis(p, ax, ay, az, r) {
        const cos = Math.cos(r);
        const sin = Math.sin(r);
        const dot = ax * p.x + ay * p.y + az * p.z;

        return new THREE.Vector3(
            p.x * cos + (ay * p.z - az * p.y) * sin + ax * dot * (1 - cos),
            p.y * cos + (az * p.x - ax * p.z) * sin + ay * dot * (1 - cos),
            p.z * cos + (ax * p.y - ay * p.x) * sin + az * dot * (1 - cos)
        );
    }

    computeStrightPath(start, end, steps){
        const points = [];

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;          // t goes from 0 → 1
            points.push(
                new THREE.Vector3().lerpVectors(start, end, t)
            );
        }

        return points;
    }

    computeRotation(start, end, steps) {
        const rotations = [];

        const quatStart = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(start.x, start.y, start.z)
        );
        const quatEnd = new THREE.Quaternion().setFromEuler(
            new THREE.Euler(end.x, end.y, end.z)
        );

        if (quatStart.dot(quatEnd) < 0) {
            quatEnd.set(-quatEnd.x, -quatEnd.y, -quatEnd.z, -quatEnd.w);
        }

        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const q = new THREE.Quaternion().slerpQuaternions(quatStart, quatEnd, t);
            rotations.push(q); // ✅ store quaternion

            if(this.visible){
            // color from quaternion components
                this.colors.push(new THREE.Color(
                    (q.x + 1) / 2,
                    (q.y + 1) / 2,
                    (q.z + 1) / 2
                ));
            }
        }
        return rotations;
    }

    computeCurvedPath(start, end, r, arcHeight, arcSharpness, steps) {
        // Unit vector along the start→end axis (this is the rotation axis)
        const axis = new THREE.Vector3().subVectors(end, start);
        const axisLen = axis.length();

        if (axisLen === 0) return [];
        
        const axisUnit = axis.clone().divideScalar(axisLen);

        // Build a perpendicular vector to use as the arc displacement direction.
        // Pick any vector not parallel to axisUnit, then cross to get a true perpendicular.
        const arbitrary = Math.abs(axisUnit.x) < 0.9
        ? new THREE.Vector3(1, 0, 0)
        : new THREE.Vector3(0, 1, 0);
        const perp = new THREE.Vector3().crossVectors(axisUnit, arbitrary).normalize();

        // Rotate perp around axisUnit by r so the arc sweeps in the chosen direction
        const arcDir = this.rotateAroundAxis(perp, axisUnit.x, axisUnit.y, axisUnit.z, r);

        const points = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps; // t goes 0→1, guaranteeing endpoints hit start and end

            // Simple lerp: at t=0 we get start, at t=1 we get end — always exact
            const base = new THREE.Vector3().lerpVectors(start, end, t);

            // Parabolic arc scalar — zero at t=0 and t=1, peak at t=0.5
            const arc = 4 * Math.pow(t, arcSharpness) * Math.pow(1 - t, arcSharpness);

            // Displace along the perpendicular arc direction (not world Y)
            base.addScaledVector(arcDir, arc * arcHeight);

            points.push(base);
        }

        return points;
    }

    getPoint(index){
        return this.points[index];
    }

    getRotation(index){
        return this.rotations[index];
    }

    getColor(index){
        return this.colors[index];
    }

    render() {
        return (
            <>
                {
                    this.visible
                    &&
                    <LineMesh points={this.points} colors={this.colors} />
                }
            </>
            
        );
    }
}

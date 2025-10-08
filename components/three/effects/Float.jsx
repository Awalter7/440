import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { cloneElement } from "react";

/**
 * Float component that floats each child independently
 */
export default function Float({ children, intensity = 1, speed = 1, directions = { x: true, y: true, z: true } }) {
  const groupRefs = useRef([]);

  // Initialize phase offsets for each child
  const phases = useRef(
    React.Children.map(children, () => ({
      x: Math.random() * Math.PI * 2,
      y: Math.random() * Math.PI * 2,
      z: Math.random() * Math.PI * 2,
    }))
  );

  // Store base positions for each child
  const basePositions = useRef([]);

  useFrame((state) => {
    const t = state.clock.getElapsedTime() * speed;
    groupRefs.current.forEach((group, i) => {
      if (!group) return;

      // Capture base position once
      if (!basePositions.current[i]) {
        basePositions.current[i] = group.position.clone();
      }

      const phase = phases.current[i];
      const base = basePositions.current[i];
      const { x: dx, y: dy, z: dz } = directions;
      const strength = 0.05 * intensity;

      // Apply independent floating per child
      group.position.x = base.x + (dx ? Math.sin(t + phase.x) * strength : 0);
      group.position.y = base.y + (dy ? Math.sin(t + phase.y) * strength : 0);
      group.position.z = base.z + (dz ? Math.cos(t + phase.z) * strength : 0);

      // Optional rotation sway
      group.rotation.x += Math.sin(t * 0.3 + phase.x) * 0.0008 * intensity;
      group.rotation.z += Math.cos(t * 0.5 + phase.z) * 0.0008 * intensity;
    });
  });

  // Wrap each child in its own floating group
  return (
    <>
      {React.Children.map(children, (child, i) => (
        <group ref={(ref) => (groupRefs.current[i] = ref)}>{cloneElement(child)}</group>
      ))}
    </>
  );
}

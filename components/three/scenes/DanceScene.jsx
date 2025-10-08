import React, { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useFBX, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { AnimationMixer } from 'three';
import { SkeletonUtils } from 'three-stdlib'; // ✅ import this for deep clone

export default function DanceScene({ count = 50, spacing = .03 }) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const fbx = useFBX(`${baseUrl}/objects/dance.fbx`);

  const mixersRef = useRef([]);
  const [instances, setInstances] = useState([]);

  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * spacing * count;
      const z = (Math.random() - 0.5) * spacing * count;
      pos.push({ x, z });
    }
    return pos;
  }, [count, spacing]);

  useEffect(() => {
    if (!fbx) return;

    mixersRef.current = [];
    const newInstances = [];

    for (let i = 0; i < count; i++) {
      // ✅ Use deep clone
      const clone = i === 0 ? fbx : SkeletonUtils.clone(fbx);
      clone.position.set(positions[i].x, .5, positions[i].z - 2);

      const mixer = new AnimationMixer(clone);
      fbx.animations.forEach((clip) => {
        const action = mixer.clipAction(clip);
        action.time = Math.random() * clip.duration;
        action.play();
      });

      mixersRef.current.push(mixer);
      newInstances.push(clone);
    }

    setInstances(newInstances);
  }, [fbx, positions, count]);

  useFrame((_, delta) => {
    mixersRef.current.forEach((mixer) => mixer.update(delta));
  });

  return (
    <group>
      {instances.map((instance, i) => (
        <primitive key={i} object={instance} scale={.001} />
      ))}
    </group>
  );
}

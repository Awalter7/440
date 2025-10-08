import { useState, useEffect, useRef } from 'react'

export default function useScrollPositionLerp(objectRef, progress, initial, end) {
  useEffect(() => {
    console.log(objectRef)
    if (!objectRef.current) return;
    const [x, y, z] = [
      THREE.MathUtils.lerp(initial[0], end[0], progress),
      THREE.MathUtils.lerp(initial[1], end[1], progress),
      THREE.MathUtils.lerp(initial[2], end[2], progress),
    ];
    console.log(x, y, z)
    objectRef.current.position.set(x, y, z);
  }, [objectRef, progress, initial, end]);
}
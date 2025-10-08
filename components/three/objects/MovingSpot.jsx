import { Vector3 } from 'three'
import { useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { SpotLight } from '@react-three/drei'

export function MovingSpot({
  vec = new Vector3(),
  move = true,
  inverse = false,
  lookAt = [0, 1, 0],
  mode = "off",
  realOff = false,
  flickerDuration = 500,
  ...props
}) {
  const light = useRef()
  const viewport = useThree((state) => state.viewport)

  const originalIntensity = 2
  const originalDistance = 6

  const [currentIntensity, setCurrentIntensity] = useState(0)
  const [currentDistance, setCurrentDistance] = useState(0)
  const targetValues = useRef({ intensity: 0, distance: 0 })
  const [flickering, setFlickering] = useState(false)
  const flickerStart = useRef(0)

  useFrame((state) => {
    // Handle light target movement
    if (light.current) {
      const target = move
        ? vec.set(
            inverse
              ? -(state.mouse.x * viewport.width) / 2
              : (state.mouse.x * viewport.width) / 2,
            inverse
              ? -(state.mouse.y * viewport.height) / 2
              : (state.mouse.y * viewport.height) / .5,
            0
          )
        : vec.set(...lookAt)

      light.current.target.position.lerp(target, 0.1)
      light.current.target.updateMatrixWorld()
    }

    // Handle flickering or smooth transition
    const elapsed = Date.now() - flickerStart.current
    const { intensity: targetIntensity, distance: targetDistance } = targetValues.current

    if (flickering && elapsed < flickerDuration) {
      setCurrentIntensity((prev) =>
        Math.max(
          0,
          lerp(prev, targetIntensity, 0.1) + (Math.random() - 0.5) * 0.5
        )
      )
      setCurrentDistance((prev) =>
        Math.max(
          0,
          lerp(prev, targetDistance, 0.1) + (Math.random() - 0.5) * 0.3
        )
      )
    } else if (flickering) {
      setFlickering(false)
      setCurrentIntensity(targetIntensity)
      setCurrentDistance(targetDistance)
    } else {
      setCurrentIntensity((prev) => lerp(prev, targetIntensity, 0.05))
      setCurrentDistance((prev) => lerp(prev, targetDistance, 0.05))
    }
  })

  useEffect(() => {
    const turningOn = mode === "on"
    targetValues.current = {
      intensity: turningOn ? originalIntensity : 0,
      distance: turningOn ? originalDistance : 0,
    }
    flickerStart.current = Date.now()
    setFlickering(true)
  }, [mode])

  return (
    <SpotLight
        castShadow
        ref={light}
        penumbra={1}
        distance={currentDistance}
        attenuation={1.5} 
        angle={.35} 
        anglePower={30} 
        intensity={currentIntensity}
        {...props}
    />
  )
}

// Helper lerp function
function lerp(a, b, t) {
  return a + (b - a) * t
}

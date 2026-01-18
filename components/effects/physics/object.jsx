import { MatterBody } from "@/components/fancy/physics/gravity"

export function Object({
    children,
        
    // MatterBody specific props
    x = 0,
    y = 0,
    angle = 0,
    bodyType = "rectangle",
    isDraggable = true,
    sampleLength = 15,
    className,

    // Matter.js body options
    matterBodyOptions = {},
    friction = 0.1,
    restitution = 0.1,
    density = 0.001,
    isStatic = false,
    isSleeping = false,
    motion = 0,
    sleepThreshold = 60,
    mass,
    inverseMass,
    inertia,
    inverseInertia,
    restitutionThreshold = 4,
    frictionAir = 0.01,
    frictionStatic = 0.5,
    collisionFilter,
    slop = 0.05,
    timeScale = 1,
    force,
    torque,
    ...restProps
}) {
  // Combine individual Matter.js properties with matterBodyOptions
  const combinedMatterOptions = {
    friction,
    restitution,
    density,
    isStatic,
    isSleeping,
    motion,
    sleepThreshold,
    ...(mass !== undefined && { mass }),
    ...(inverseMass !== undefined && { inverseMass }),
    ...(inertia !== undefined && { inertia }),
    ...(inverseInertia !== undefined && { inverseInertia }),
    restitutionThreshold,
    frictionAir,
    frictionStatic,
    ...(collisionFilter && { collisionFilter }),
    slop,
    timeScale,
    ...(force && { force }),
    ...(torque !== undefined && { torque }),
    ...matterBodyOptions, // Allow override via matterBodyOptions prop
  };

  console.log(x, y)

  return (
    <MatterBody
      x={x}
      y={y}
      angle={angle}
      bodyType={bodyType}
      isDraggable={isDraggable}
      sampleLength={sampleLength}
      className={className}
      matterBodyOptions={combinedMatterOptions}
      {...restProps}
    >
        <div className="relative">
            {children}
        </div>
      
    </MatterBody>
  );
}
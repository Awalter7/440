import Gravity from "@/components/fancy/physics/gravity"

export function GravityWrapper({
  children,
  className,

  // Gravity component props
  debug = false,
  gravity = { x: 0, y: 1 },
  resetOnResize = true,
  grabCursor = true,
  addTopWall = true,
  autoStart = true,

  // Additional props for controlling the physics world
  ...restProps
}) {
  return (
    <Gravity
      debug={debug}
      gravity={gravity}
      resetOnResize={resetOnResize}
      grabCursor={grabCursor}
      addTopWall={addTopWall}
      autoStart={autoStart}
      className={className}
      {...restProps}
    >
      {children}
    </Gravity>
  );
}
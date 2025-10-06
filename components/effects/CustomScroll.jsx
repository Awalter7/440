
import * as React from "react";

export function CustomScroll({
  children,
  className,
  positionType = "fixed",
  animationMode = "interpolation",
  duration = 1000,
  startTop,
  startLeft,
  startRight,
  startBottom,
  endTop,
  endLeft,
  endRight,
  endBottom,
  scrollStart = 0,
  scrollEnd = 1000,
  startOpacity = 1,
  endOpacity = 1,
  zIndex = 1000,
}) {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isInStudio, setIsInStudio] = React.useState(true);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [animationProgress, setAnimationProgress] = React.useState(0);
  const animationStartTime = React.useRef(null);
  const animationFrameId = React.useRef(null);

  React.useEffect(() => {
    // Detect if we're in Plasmic Studio
    const inStudio = window.location.href.includes("studio.plasmic.app") || 
                     window.location.href.includes("host.plasmic.app") ||
                     window.parent !== window;
    setIsInStudio(inStudio);

    if (inStudio) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      if (animationMode === "interpolation") {
        // Interpolation mode: animate based on scroll position
        if (scrollY <= scrollStart) {
          setScrollProgress(0);
        } else if (scrollY >= scrollEnd) {
          setScrollProgress(1);
        } else {
          const progress = (scrollY - scrollStart) / (scrollEnd - scrollStart);
          setScrollProgress(progress);
        }
      } else {
        // Duration mode: trigger animation when scroll hits start point
        if (scrollY >= scrollStart && !isAnimating && animationProgress < 1) {
          setIsAnimating(true);
          animationStartTime.current = performance.now();
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollStart, scrollEnd, animationMode, isAnimating, animationProgress]);

  // Duration-based animation loop
  React.useEffect(() => {
    if (!isAnimating || animationMode !== "duration") return;

    const animate = (currentTime) => {
      if (!animationStartTime.current) {
        animationStartTime.current = currentTime;
      }

      const elapsed = currentTime - animationStartTime.current;
      const progress = Math.min(elapsed / duration, 1);

      setAnimationProgress(progress);

      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isAnimating, duration, animationMode]);

  // Parse value with unit (e.g., "100px", "50vw", "20vh")
  const parseValue = (value) => {
    if (value === undefined || value === null || value === "") return null;
    
    const str = String(value).trim();
    const match = str.match(/^(-?[\d.]+)(px|vw|vh|%|em|rem)?$/);
    
    if (!match) return null;
    
    return {
      number: parseFloat(match[1]),
      unit: match[2] || "px"
    };
  };

  // Interpolate between two values with units
  const interpolate = (start, end) => {
    const startParsed = parseValue(start);
    const endParsed = parseValue(end);
    
    if (!startParsed || !endParsed) return undefined;
    
    // If units don't match, we can't interpolate
    if (startParsed.unit !== endParsed.unit) {
      console.warn(`Unit mismatch: ${start} vs ${end}. Using start value unit.`);
    }
    
    // Use the appropriate progress based on animation mode
    const progress = animationMode === "duration" ? animationProgress : scrollProgress;
    
    const interpolatedNumber = startParsed.number + (endParsed.number - startParsed.number) * progress;
    return `${interpolatedNumber}${startParsed.unit}`;
  };

  const currentTop = interpolate(startTop, endTop);
  const currentLeft = interpolate(startLeft, endLeft);
  const currentRight = interpolate(startRight, endRight);
  const currentBottom = interpolate(startBottom, endBottom);
  
  // Use the appropriate progress for opacity
  const progress = animationMode === "duration" ? animationProgress : scrollProgress;
  const currentOpacity = startOpacity + (endOpacity - startOpacity) * progress;

  // In studio, always use relative positioning
  const position = isInStudio ? "relative" : positionType;

  const style = {
    position,
    ...(currentTop !== undefined && { top: currentTop }),
    ...(currentLeft !== undefined && { left: currentLeft }),
    ...(currentRight !== undefined && { right: currentRight }),
    ...(currentBottom !== undefined && { bottom: currentBottom }),
    opacity: currentOpacity,
    zIndex,
    transition: "none",
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
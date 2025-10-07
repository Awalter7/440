import * as React from "react";

export function CustomScroll({
  children,
  className,
  positionType = "fixed",
  animationMode = "interpolation",
  duration = 1000,
  // Legacy single breakpoint props (for backwards compatibility)
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
  startBorderRadius,
  endBorderRadius,
  startWidth,
  endWidth,
  startHeight,
  endHeight,
  // New multi-breakpoint prop
  breakpoints = [],
  zIndex = 1000,
}) {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isInStudio, setIsInStudio] = React.useState(true);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [animationProgress, setAnimationProgress] = React.useState(0);
  const [currentBreakpointIndex, setCurrentBreakpointIndex] = React.useState(0);
  const animationStartTime = React.useRef(null);
  const animationFrameId = React.useRef(null);

  // Build breakpoints array from legacy props or use new breakpoints prop
  const effectiveBreakpoints = React.useMemo(() => {
    if (breakpoints && breakpoints.length > 0) {
      return breakpoints;
    }
    
    // Legacy mode: create single breakpoint from individual props
    return [{
      scrollStart,
      scrollEnd,
      startStyles: {
        top: startTop,
        left: startLeft,
        right: startRight,
        bottom: startBottom,
        opacity: startOpacity,
        borderRadius: startBorderRadius,
        width: startWidth,
        height: startHeight,
      },
      endStyles: {
        top: endTop,
        left: endLeft,
        right: endRight,
        bottom: endBottom,
        opacity: endOpacity,
        borderRadius: endBorderRadius,
        width: endWidth,
        height: endHeight,
      }
    }];
  }, [
    breakpoints,
    scrollStart, scrollEnd,
    startTop, startLeft, startRight, startBottom,
    endTop, endLeft, endRight, endBottom,
    startOpacity, endOpacity,
    startBorderRadius, endBorderRadius,
    startWidth, endWidth, startHeight, endHeight
  ]);

  React.useEffect(() => {
    const inStudio = window.location.href.includes("studio.plasmic.app") || 
                     window.location.href.includes("host.plasmic.app") ||
                     window.parent !== window;
    setIsInStudio(inStudio);

    if (inStudio) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      if (animationMode === "interpolation") {
        // Find which breakpoint we're in
        let found = false;
        for (let i = 0; i < effectiveBreakpoints.length; i++) {
          const bp = effectiveBreakpoints[i];
          const bpStart = bp.scrollStart || 0;
          const bpEnd = bp.scrollEnd || 1000;
          
          if (scrollY >= bpStart && scrollY <= bpEnd) {
            const progress = (scrollY - bpStart) / (bpEnd - bpStart);
            setScrollProgress(progress);
            setCurrentBreakpointIndex(i);
            found = true;
            break;
          }
        }
        
        // Handle edge cases
        if (!found) {
          if (scrollY < (effectiveBreakpoints[0]?.scrollStart || 0)) {
            setScrollProgress(0);
            setCurrentBreakpointIndex(0);
          } else {
            setScrollProgress(1);
            setCurrentBreakpointIndex(effectiveBreakpoints.length - 1);
          }
        }
      } else {
        // Duration mode: check all breakpoints for trigger
        for (let i = 0; i < effectiveBreakpoints.length; i++) {
          const bp = effectiveBreakpoints[i];
          const bpStart = bp.scrollStart || 0;
          
          if (scrollY >= bpStart && i > currentBreakpointIndex) {
            setCurrentBreakpointIndex(i);
            setIsAnimating(true);
            setAnimationProgress(0);
            animationStartTime.current = null;
            break;
          }
        }
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [effectiveBreakpoints, animationMode, currentBreakpointIndex]);

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
        setAnimationProgress(1);
      }
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [isAnimating, duration, animationMode]);

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

  const interpolate = (start, end, progress) => {
    const startParsed = parseValue(start);
    const endParsed = parseValue(end);
    
    if (!startParsed || !endParsed) return undefined;
    
    if (startParsed.unit !== endParsed.unit) {
      console.warn(`Unit mismatch: ${start} vs ${end}. Using start value unit.`);
    }
    
    const interpolatedNumber = startParsed.number + (endParsed.number - startParsed.number) * progress;
    return `${interpolatedNumber}${startParsed.unit}`;
  };

  // Get current styles based on active breakpoint
  const getCurrentStyles = () => {
    const bp = effectiveBreakpoints[currentBreakpointIndex] || effectiveBreakpoints[0];
    if (!bp) return {};
    
    const progress = animationMode === "duration" ? animationProgress : scrollProgress;
    const { startStyles = {}, endStyles = {} } = bp;
    
    const styles = {};
    
    // Interpolate all style properties
    const styleProps = ['top', 'left', 'right', 'bottom', 'borderRadius', 'width', 'height'];
    styleProps.forEach(prop => {
      const interpolated = interpolate(startStyles[prop], endStyles[prop], progress);
      if (interpolated !== undefined) {
        styles[prop] = interpolated;
      }
    });
    
    // Handle opacity separately (it's a number, not a string with units)
    if (startStyles.opacity !== undefined && endStyles.opacity !== undefined) {
      styles.opacity = startStyles.opacity + (endStyles.opacity - startStyles.opacity) * progress;
    } else if (startStyles.opacity !== undefined) {
      styles.opacity = startStyles.opacity;
    } else if (endStyles.opacity !== undefined) {
      styles.opacity = endStyles.opacity;
    }
    
    return styles;
  };

  const currentStyles = getCurrentStyles();
  const position = isInStudio ? "relative" : positionType;

  const style = {
    position,
    ...currentStyles,
    zIndex,
    transition: "none",
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
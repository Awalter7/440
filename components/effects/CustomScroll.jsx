//CustomScroll

import * as React from "react";
import easingFunctions from "../utils/easingFunctions";

// Convert camelCase to kebab-case for CSS properties
const camelToKebab = (str) => {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
};

export function CustomScroll({
  children,
  className,
  positionType = "fixed",
  animationMode = "interpolation",
  duration = 1000,
  easingFunction = "linear",
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
    const legacyStyles = [];
    
    // Build legacy styles array from individual props
    if (startTop !== undefined || endTop !== undefined) {
      legacyStyles.push({ property: 'top', startValue: startTop, endValue: endTop });
    }
    if (startLeft !== undefined || endLeft !== undefined) {
      legacyStyles.push({ property: 'left', startValue: startLeft, endValue: endLeft });
    }
    if (startRight !== undefined || endRight !== undefined) {
      legacyStyles.push({ property: 'right', startValue: startRight, endValue: endRight });
    }
    if (startBottom !== undefined || endBottom !== undefined) {
      legacyStyles.push({ property: 'bottom', startValue: startBottom, endValue: endBottom });
    }
    if (startWidth !== undefined || endWidth !== undefined) {
      legacyStyles.push({ property: 'width', startValue: startWidth, endValue: endWidth });
    }
    if (startHeight !== undefined || endHeight !== undefined) {
      legacyStyles.push({ property: 'height', startValue: startHeight, endValue: endHeight });
    }
    if (startOpacity !== undefined || endOpacity !== undefined) {
      legacyStyles.push({ property: 'opacity', startValue: startOpacity, endValue: endOpacity });
    }
    if (startBorderRadius !== undefined || endBorderRadius !== undefined) {
      legacyStyles.push({ property: 'borderRadius', startValue: startBorderRadius, endValue: endBorderRadius });
    }
    
    return [{
      scrollStart,
      scrollEnd,
      easingFunction: easingFunction,
      styles: legacyStyles
    }];
  }, [
    breakpoints,
    scrollStart, scrollEnd, easingFunction,
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

  const parseValue = (value, property) => {
    if (value === undefined || value === null || value === "") return null;
    
    const str = String(value).trim();
    
    // Handle unitless numbers (for properties like opacity, scale, etc.)
    if (/^-?[\d.]+$/.test(str)) {
      const num = parseFloat(str);
      
      // Auto-add default units for rotation properties if no unit specified
      if (property && (property === 'rotate' || property === 'rotateX' || 
          property === 'rotateY' || property === 'rotateZ' || 
          property === 'skewX' || property === 'skewY')) {
        return {
          number: num,
          unit: "deg"
        };
      }
      
      return {
        number: num,
        unit: ""
      };
    }
    
    const match = str.match(/^(-?[\d.]+)(px|vw|vh|%|em|rem|deg|turn|rad)?$/);
    
    if (!match) return null;
    
    return {
      number: parseFloat(match[1]),
      unit: match[2] || ""
    };
  };

  const interpolate = (start, end, progress, easing, property) => {
    const startParsed = parseValue(start, property);
    const endParsed = parseValue(end, property);
    
    if (!startParsed || !endParsed) return undefined;
    
    if (startParsed.unit !== endParsed.unit) {
      console.warn(`Unit mismatch: ${start} vs ${end}. Using start value unit.`);
    }
    
    // Apply easing function to progress
    const easedProgress = easing ? easing(progress) : progress;
    
    const interpolatedNumber = startParsed.number + (endParsed.number - startParsed.number) * easedProgress;
    return startParsed.unit ? `${interpolatedNumber}${startParsed.unit}` : interpolatedNumber;
  };

  // Get current styles based on active breakpoint
  const getCurrentStyles = () => {
    const bp = effectiveBreakpoints[currentBreakpointIndex] || effectiveBreakpoints[0];
    if (!bp) return {};
    
    const progress = animationMode === "duration" ? animationProgress : scrollProgress;
    const styles = bp.styles || [];
    
    // Get easing function for this breakpoint (or fall back to global/default)
    const easingName = bp.easingFunction || easingFunction || "linear";
    const easing = easingFunctions[easingName] || easingFunctions.linear;
    
    const currentStyles = {};
    const transformValues = [];
    
    // Transform properties that need to be combined into a single transform string
    const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                            'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];
    
    // Interpolate each style property
    styles.forEach(styleItem => {
      const { property, startValue, endValue } = styleItem;
      
      if (!property) return;
      
      const interpolated = interpolate(startValue, endValue, progress, easing, property);
      
      if (interpolated !== undefined) {
        // Handle transform properties specially
        if (transformProps.includes(property)) {
          // Add parentheses for transform functions
          transformValues.push(`${property}(${interpolated})`);
        } else {
          // Regular CSS properties
          currentStyles[property] = interpolated;
        }
      }
    });
    
    // Combine all transform properties into a single transform string
    if (transformValues.length > 0) {
      currentStyles.transform = transformValues.join(' ');
    }
    
    return currentStyles;
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
    <div className={className} style={{...style, transformStyle: "preserve-3d"}}>
      {children}
    </div>
  );
}
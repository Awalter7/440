import * as React from "react";

// Easing functions
const easingFunctions = {
  linear: (t) => t,
  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,
  easeInQuint: (t) => t * t * t * t * t,
  easeOutQuint: (t) => 1 + (--t) * t * t * t * t,
  easeInOutQuint: (t) => t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t,
  easeInSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  easeOutSine: (t) => Math.sin((t * Math.PI) / 2),
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeInExpo: (t) => t === 0 ? 0 : Math.pow(2, 10 * t - 10),
  easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
  easeInOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  easeInCirc: (t) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  easeOutCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  easeInOutCirc: (t) => {
    return t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2;
  },
  easeInBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutBack: (t) => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (t * 2 - 2) + c2) + 2) / 2;
  },
  easeInElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  easeOutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  easeInOutElastic: (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  easeInBounce: (t) => 1 - easingFunctions.easeOutBounce(1 - t),
  easeOutBounce: (t) => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  easeInOutBounce: (t) => {
    return t < 0.5
      ? (1 - easingFunctions.easeOutBounce(1 - 2 * t)) / 2
      : (1 + easingFunctions.easeOutBounce(2 * t - 1)) / 2;
  },
};

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

  const parseValue = (value) => {
    if (value === undefined || value === null || value === "") return null;
    
    const str = String(value).trim();
    
    // Handle unitless numbers (for properties like opacity, scale, etc.)
    if (/^-?[\d.]+$/.test(str)) {
      return {
        number: parseFloat(str),
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

  const interpolate = (start, end, progress, easing) => {
    const startParsed = parseValue(start);
    const endParsed = parseValue(end);
    
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
    
    // Interpolate each style property
    styles.forEach(styleItem => {
      const { property, startValue, endValue } = styleItem;
      
      if (!property) return;
      
      const interpolated = interpolate(startValue, endValue, progress, easing);
      
      if (interpolated !== undefined) {
        // Convert camelCase to kebab-case for CSS properties
        const cssProperty = camelToKebab(property);
        currentStyles[property] = interpolated;
      }
    });
    
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
    <div className={className} style={style}>
      {children}
    </div>
  );
}
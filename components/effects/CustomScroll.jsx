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
  triggerId,
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
  // New click-triggered effects
  clickEffects = [],
  zIndex = 1000,
}) {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isInStudio, setIsInStudio] = React.useState(true);
  const [isAnimating, setIsAnimating] = React.useState(false);
  const [animationProgress, setAnimationProgress] = React.useState(0);
  const [currentBreakpointIndex, setCurrentBreakpointIndex] = React.useState(0);
  
  // New state for click effects
  const [activeClickEffects, setActiveClickEffects] = React.useState([]);
  const [clickEffectProgress, setClickEffectProgress] = React.useState({});
  const [completedClickEffects, setCompletedClickEffects] = React.useState([]);
  
  const animationStartTime = React.useRef(null);
  const animationFrameId = React.useRef(null);
  const clickEffectAnimationFrames = React.useRef({});

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

  // Handle click triggers for click effects
  React.useEffect(() => {
    if (!clickEffects || clickEffects.length === 0) return;

    const handleClick = (e) => {
      let element = e.target;
      while (element) {
        // Check each click effect to see if this element triggers it
        clickEffects.forEach((effect, index) => {
          if (effect.triggerId && element.id === effect.triggerId) {
            const effectId = `effect_${index}`;
            
            // Don't retrigger if already animating
            if (activeClickEffects.includes(effectId)) return;
            
            // Add to active effects
            setActiveClickEffects(prev => [...prev, effectId]);
            setClickEffectProgress(prev => ({ ...prev, [effectId]: 0 }));
          }
        });
        element = element.parentElement;
      }
    };

    document.addEventListener("click", handleClick);
    
    return () => document.removeEventListener("click", handleClick);
  }, [clickEffects, activeClickEffects]);

  // Handle legacy click trigger for duration mode
  React.useEffect(() => {
    if (animationMode !== "duration" || !triggerId) return;

    const handleClick = (e) => {
      let element = e.target;
      while (element) {
        if (element.id === triggerId) {
          const nextIndex = currentBreakpointIndex < effectiveBreakpoints.length - 1 
            ? currentBreakpointIndex + 1 
            : 0;
          
          setCurrentBreakpointIndex(nextIndex);
          setIsAnimating(true);
          setAnimationProgress(0);
          animationStartTime.current = null;
          break;
        }
        element = element.parentElement;
      }
    };

    document.addEventListener("click", handleClick);
    
    return () => document.removeEventListener("click", handleClick);
  }, [animationMode, triggerId, currentBreakpointIndex, effectiveBreakpoints.length]);

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
      } else if (!triggerId) {
        // Duration mode with scroll trigger
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
  }, [effectiveBreakpoints, animationMode, currentBreakpointIndex, triggerId]);

  // Duration-based animation loop for legacy duration mode
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

  // Animation loops for click effects
  React.useEffect(() => {
    activeClickEffects.forEach((effectId) => {
      const effectIndex = parseInt(effectId.split('_')[1]);
      const effect = clickEffects[effectIndex];
      
      if (!effect || clickEffectAnimationFrames.current[effectId]) return;

      const startTime = { current: null };
      const effectDuration = effect.duration || 1000;

      const animate = (currentTime) => {
        if (!startTime.current) {
          startTime.current = currentTime;
        }

        const elapsed = currentTime - startTime.current;
        const progress = Math.min(elapsed / effectDuration, 1);

        setClickEffectProgress(prev => ({ ...prev, [effectId]: progress }));

        if (progress < 1) {
          clickEffectAnimationFrames.current[effectId] = requestAnimationFrame(animate);
        } else {
          // Animation complete
          delete clickEffectAnimationFrames.current[effectId];
          setActiveClickEffects(prev => prev.filter(id => id !== effectId));
          setCompletedClickEffects(prev => [...prev, effectId]);
        }
      };

      clickEffectAnimationFrames.current[effectId] = requestAnimationFrame(animate);
    });

    return () => {
      Object.values(clickEffectAnimationFrames.current).forEach(frameId => {
        if (frameId) cancelAnimationFrame(frameId);
      });
    };
  }, [activeClickEffects, clickEffects]);

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

  // Get base styles from interpolation/duration mode
  const getBaseStyles = () => {
    const bp = effectiveBreakpoints[currentBreakpointIndex] || effectiveBreakpoints[0];
    if (!bp) return {};
    
    const progress = animationMode === "duration" ? animationProgress : scrollProgress;
    const styles = bp.styles || [];
    
    const easingName = bp.easingFunction || easingFunction || "linear";
    const easing = easingFunctions[easingName] || easingFunctions.linear;
    
    const currentStyles = {};
    const transformValues = [];
    
    const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                            'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];
    
    styles.forEach(styleItem => {
      const { property, startValue, endValue } = styleItem;
      
      if (!property) return;
      
      const interpolated = interpolate(startValue, endValue, progress, easing, property);
      
      if (interpolated !== undefined) {
        if (transformProps.includes(property)) {
          transformValues.push(`${property}(${interpolated})`);
        } else {
          currentStyles[property] = interpolated;
        }
      }
    });
    
    if (transformValues.length > 0) {
      currentStyles.transform = transformValues.join(' ');
    }
    
    return currentStyles;
  };

  // Get current styles including click effects
  const getCurrentStyles = () => {
    const baseStyles = getBaseStyles();
    
    // If no click effects, return base styles
    if (!clickEffects || clickEffects.length === 0) {
      return baseStyles;
    }
    
    // Apply click effects on top of base styles
    const finalStyles = { ...baseStyles };
    const transformValues = [];
    const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                            'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];
    
    // Extract existing transform from base styles
    if (baseStyles.transform) {
      transformValues.push(baseStyles.transform);
      delete finalStyles.transform;
    }
    
    // Process each click effect in order
    clickEffects.forEach((effect, index) => {
      const effectId = `effect_${index}`;
      const isActive = activeClickEffects.includes(effectId);
      const isCompleted = completedClickEffects.includes(effectId);
      const progress = clickEffectProgress[effectId] || 0;
      
      if (!effect.styles) return;
      
      const easingName = effect.easingFunction || "linear";
      const easing = easingFunctions[easingName] || easingFunctions.linear;
      
      effect.styles.forEach(styleItem => {
        const { property, startValue, endValue } = styleItem;
        if (!property) return;
        
        let currentValue;
        
        if (isCompleted) {
          // Use end value for completed effects
          currentValue = endValue;
        } else if (isActive) {
          // Interpolate from start to end based on current progress
          const interpolated = interpolate(startValue, endValue, progress, easing, property);
          if (interpolated !== undefined) {
            currentValue = interpolated;
          }
        } else {
          // Use start value for not-yet-triggered effects
          currentValue = startValue;
        }
        
        if (currentValue !== undefined) {
          if (transformProps.includes(property)) {
            // For transform properties, add to transform array
            const existingTransformIndex = transformValues.findIndex(t => t.startsWith(`${property}(`));
            const newTransform = `${property}(${currentValue})`;
            
            if (existingTransformIndex >= 0) {
              // Replace existing transform of same type
              transformValues[existingTransformIndex] = newTransform;
            } else {
              transformValues.push(newTransform);
            }
          } else {
            // Regular CSS properties
            finalStyles[property] = currentValue;
          }
        }
      });
    });
    
    // Combine all transform properties
    if (transformValues.length > 0) {
      finalStyles.transform = transformValues.join(' ');
    }
    
    return finalStyles;
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
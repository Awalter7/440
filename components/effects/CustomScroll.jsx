//CustomScroll

import * as React from "react";
import easingFunctions from "../utils/easingFunctions";
import { interpolate } from "./utils";
import { Effects } from "@react-three/drei";

// Convert camelCase to kebab-case for CSS properties
const camelToKebab = (str) => {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
};

  // Legacy single breakpoint props (for backwards compatibility)
  // startTop,
  // startLeft,
  // startRight,
  // startBottom,
  // endTop,
  // endLeft,
  // endRight,
  // endBottom,
  // scrollStart = 0,
  // scrollEnd = 1000,
  // startOpacity = 1,
  // endOpacity = 1,
  // startBorderRadius,
  // endBorderRadius,
  // startWidth,
  // endWidth,
  // startHeight,
  // endHeight,

export function CustomScroll({
  children,
  className,
  positionType = "fixed",
  animationMode = "interpolation",
  duration = 1000,
  easingFunction = "linear",
  triggerId,

  // New multi-breakpoint prop
  breakpoints = [],
  initialStyles = [],
  // New click-triggered effects
  clickEffects = [],
  zIndex = 1000,
}) {
  const [isInStudio, setIsInStudio] = React.useState(true);
  const [currentBreakpointIndex, setCurrentBreakpointIndex] = React.useState(0);

  
  // New state for click effects
  const [activeClickEffects, setActiveClickEffects] = React.useState([]);
  const [clickEffectProgress, setClickEffectProgress] = React.useState([]);
  const [scrollProgress, setScrollProgress] = React.useState([])

  const [styles, setStyles] = React.useState({})
  
  const animationStartTime = React.useRef(null);
  const clickEffectAnimationFrames = React.useRef({});

  // Build breakpoints array from legacy props or use new breakpoints prop
  const effectiveBreakpoints = React.useMemo(() => {
    if (breakpoints && breakpoints.length > 0) {
      return breakpoints;
    }
  }, [
    breakpoints,
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
          }
        });
        element = element.parentElement;
      }
    };

    document.addEventListener("click", handleClick);
    
    return () => document.removeEventListener("click", handleClick);
  }, [clickEffects, activeClickEffects]);

  // Handle legacy click trigger for duration mode
  // React.useEffect(() => {
  //   if (animationMode !== "duration" || !triggerId) return;

  //   const handleClick = (e) => {
  //     let element = e.target;
  //     while (element) {
  //       if (element.id === triggerId) {
  //         const nextIndex = currentBreakpointIndex < effectiveBreakpoints.length - 1 
  //           ? currentBreakpointIndex + 1 
  //           : 0;
          
  //         setCurrentBreakpointIndex(nextIndex);
  //         setIsAnimating(true);
  //         setAnimationProgress(0);
  //         animationStartTime.current = null;
  //         break;
  //       }
  //       element = element.parentElement;
  //     }
  //   };

  //   document.addEventListener("click", handleClick);
    
  //   return () => document.removeEventListener("click", handleClick);
  // }, [animationMode, triggerId, currentBreakpointIndex, effectiveBreakpoints.length]);

  React.useEffect(() => {
    const inStudio = window.location.href.includes("studio.plasmic.app") || 
                     window.location.href.includes("host.plasmic.app") ||
                     window.parent !== window;
    setIsInStudio(inStudio);

    if (inStudio) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      if (animationMode === "interpolation") {
        // // Find which breakpoint we're in
        // let found = false;
        // for (let i = 0; i < effectiveBreakpoints.length; i++) {
        //   const bp = effectiveBreakpoints[i];
        //   const bpStart = bp.scrollStart || 0;
        //   const bpEnd = bp.scrollEnd || 1000;
          
        //   if (scrollY >= bpStart && scrollY <= bpEnd) {
        //     const progress = (scrollY - bpStart) / (bpEnd - bpStart);
        //     setScrollProgress(progress);
        //     setCurrentBreakpointIndex(i);
        //     found = true;
        //     break;
        //   }
        // }
        
        // // Handle edge cases
        // if (!found) {
        //   if (scrollY < (effectiveBreakpoints[0]?.scrollStart || 0)) {
        //     setScrollProgress(0);
        //     setCurrentBreakpointIndex(0);
        //   } else {
        //     setScrollProgress(1);
        //     setCurrentBreakpointIndex(effectiveBreakpoints.length - 1);
        //   }
        // }
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
  // React.useEffect(() => {
  //   if (!isAnimating || animationMode !== "duration") return;

  //   const animate = (currentTime) => {
  //     if (!animationStartTime.current) {
  //       animationStartTime.current = currentTime;
  //     }

  //     const elapsed = currentTime - animationStartTime.current;
  //     const progress = Math.min(elapsed / duration, 1);

  //     setAnimationProgress(progress);

  //     if (progress < 1) {
  //       animationFrameId.current = requestAnimationFrame(animate);
  //     } else {
  //       setIsAnimating(false);
  //       setAnimationProgress(1);
  //     }
  //   };

  //   animationFrameId.current = requestAnimationFrame(animate);

  //   return () => {
  //     if (animationFrameId.current) {
  //       cancelAnimationFrame(animationFrameId.current);
  //     }
  //   };
  // }, [isAnimating, duration, animationMode]);


  function updateStyle(animationValues){
    if(!animationValues.property) return;

    const startValue = styles[animationValues.property];

    if(!currentValue) return;

    const interpolated = interpolate(startValue, endValue)
  }

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

        if(!activeClickEffects.includes(effectId)){
          //do not animate
          setClickEffectProgress()
          return;
        }else if (progress < 1) {
          //Animate
          clickEffectAnimationFrames.current[effectId] = requestAnimationFrame(animate);
        } else {
          // Animation complete
          delete clickEffectAnimationFrames.current[effectId];
          setActiveClickEffects(prev => prev.filter(id => id !== effectId));
        }
      };

      clickEffectAnimationFrames.current[effectId] = requestAnimationFrame(animate);
    });

    return () => {
      Object.values(clickEffectAnimationFrames.current).forEach(frameId => {
        if (frameId) cancelAnimationFrame(frameId);
      });
    };
  }, [activeClickEffects, clickEffects])

  React.useEffect(() => {
    const progressingClickEffects = Object.entries(clickEffectProgress)
      .filter(([key]) => activeClickEffects.includes(key))
      .map(([key, value]) => ({
          id: key,
          progress: value
        })
    );

    if(progressingClickEffects.length  === 0 ) return;

    const transformValues = [];
    const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                            'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];

                            console.log(progressingClickEffects)
    
    progressingClickEffects.map((effect) => {
      const idx = effect.id.split("_")[1]

      clickEffects[idx].styles.forEach((style) => {
        const { property, endValue } = style;

        let startValue = styles[property];

        if(!startValue){
          // startValue = 
          return;
        }

        const interpolated = interpolate(startValue, endValue, progress, easing, property);
        console.log(property, endValue)
      })
      // console.log(endValue)
      // console.log(idx)
      // console.log(effect)
      // console.log(clickEffects)
    })
    
    
    
  }, [clickEffectProgress, activeClickEffects])

  // Animation loops for click effects
  // React.useEffect(() => {
  //   activeClickEffects.forEach((effectId) => {
  //     const effectIndex = parseInt(effectId.split('_')[1]);
  //     const effect = clickEffects[effectIndex];
      
  //     if (!effect || clickEffectAnimationFrames.current[effectId]) return;

  //     const startTime = { current: null };
  //     const effectDuration = effect.duration || 1000;

  //     const animate = (currentTime) => {
  //       if (!startTime.current) {
  //         startTime.current = currentTime;
  //       }

  //       const elapsed = currentTime - startTime.current;
  //       const progress = Math.min(elapsed / effectDuration, 1);

  //       setClickEffectProgress(prev => ({ ...prev, [effectId]: progress }));

  //       if (progress < 1) {
  //         clickEffectAnimationFrames.current[effectId] = requestAnimationFrame(animate);
  //       } else {
  //         // Animation complete
  //         delete clickEffectAnimationFrames.current[effectId];
  //         setActiveClickEffects(prev => prev.filter(id => id !== effectId));
  //         setCompletedClickEffects(prev => [...prev, effectId]);
  //       }
  //     };

  //     clickEffectAnimationFrames.current[effectId] = requestAnimationFrame(animate);
  //   });

  //   return () => {
  //     Object.values(clickEffectAnimationFrames.current).forEach(frameId => {
  //       if (frameId) cancelAnimationFrame(frameId);
  //     });
  //   };
  // }, [activeClickEffects, clickEffects]);

  // Get base styles from interpolation/duration mode
  // const getBaseStyles = () => {
  //   const bp = effectiveBreakpoints[currentBreakpointIndex] || effectiveBreakpoints[0];
  //   if (!bp) return {};
    
  //   const progress = animationMode === "duration" ? animationProgress : scrollProgress;
  //   const styles = bp.styles || [];
    
  //   const easingName = bp.easingFunction || easingFunction || "linear";
  //   const easing = easingFunctions[easingName] || easingFunctions.linear;
    
  //   const currentStyles = {};
  //   const transformValues = [];
    
  //   const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
  //                           'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];
    
  //   styles.forEach(styleItem => {
  //     const { property, startValue, endValue } = styleItem;
      
  //     if (!property) return;
      
  //     const interpolated = interpolate(startValue, endValue, progress, easing, property);
      
  //     if (interpolated !== undefined) {
  //       if (transformProps.includes(property)) {
  //         transformValues.push(`${property}(${interpolated})`);
  //       } else {
  //         currentStyles[property] = interpolated;
  //       }
  //     }
  //   });
    
  //   if (transformValues.length > 0) {
  //     currentStyles.transform = transformValues.join(' ');
  //   }
    
  //   return currentStyles;
  // };

  // Get current styles including click effects
  // const getCurrentStyles = () => {
  //   const baseStyles = getBaseStyles();
    
  //   // If no click effects, return base styles
  //   if (!clickEffects || clickEffects.length === 0) {
  //     return baseStyles;
  //   }
    
  //   // Apply click effects on top of base styles
  //   const finalStyles = { ...baseStyles };
  //   const transformValues = [];
  //   const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
  //                           'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];
    
  //   // Extract existing transform from base styles
  //   if (baseStyles.transform) {
  //     transformValues.push(baseStyles.transform);
  //     delete finalStyles.transform;
  //   }
    
  //   // Process each click effect in order
  //   clickEffects.forEach((effect, index) => {
  //     const effectId = `effect_${index}`;
  //     const isActive = activeClickEffects.includes(effectId);
  //     const isCompleted = completedClickEffects.includes(effectId);
  //     const progress = clickEffectProgress[effectId] || 0;
      
  //     if (!effect.styles) return;
      
  //     const easingName = effect.easingFunction || "linear";
  //     const easing = easingFunctions[easingName] || easingFunctions.linear;
      
  //     effect.styles.forEach(styleItem => {
  //       const { property, startValue, endValue } = styleItem;
  //       if (!property) return;
        
  //       let currentValue;
        
  //       if (isCompleted) {
  //         // Use end value for completed effects
  //         currentValue = endValue;
  //       } else if (isActive) {
  //         // Interpolate from start to end based on current progress
  //         const interpolated = interpolate(startValue, endValue, progress, easing, property);
  //         if (interpolated !== undefined) {
  //           currentValue = interpolated;
  //         }
  //       } else {
  //         // Use start value for not-yet-triggered effects
  //         currentValue = startValue;
  //       }
        
  //       if (currentValue !== undefined) {
  //         if (transformProps.includes(property)) {
  //           // For transform properties, add to transform array
  //           const existingTransformIndex = transformValues.findIndex(t => t.startsWith(`${property}(`));
  //           const newTransform = `${property}(${currentValue})`;
            
  //           if (existingTransformIndex >= 0) {
  //             // Replace existing transform of same type
  //             transformValues[existingTransformIndex] = newTransform;
  //           } else {
  //             transformValues.push(newTransform);
  //           }
  //         } else {
  //           // Regular CSS properties
  //           finalStyles[property] = currentValue;
  //         }
  //       }
  //     });
  //   });
    
  //   // Combine all transform properties
  //   if (transformValues.length > 0) {
  //     finalStyles.transform = transformValues.join(' ');
  //   }
    
  //   return finalStyles;
  // };

  // const currentStyles = getCurrentStyles();
  const position = isInStudio ? "relative" : positionType;

  const style = {
    position,
    // ...currentStyles,
    zIndex,
    transition: "none",
  };

  return (
    <div className={className} style={{...style, transformStyle: "preserve-3d"}}>
      {children}
    </div>
  );
}
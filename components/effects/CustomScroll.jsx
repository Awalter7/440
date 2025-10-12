//CustomScroll

import * as React from "react";
import easingFunctions from "../utils/easingFunctions";
import { interpolate } from "./utils";
import { useEffect } from "react";

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

  // New multi-breakpoint prop
  breakpoints = [],
  initialStyles = [],
  loadEffect = [],
  // New click-triggered effects
  clickEffects = [],
  zIndex = 1000,
}) {
  const stableInitialStyles = React.useMemo(() => initialStyles, [JSON.stringify(initialStyles)]);

  // Changed from ref to state
  const [styles, setStyles] = React.useState(stableInitialStyles.reduce((acc, { property, startValue }) => {
        acc[property.trim()] = startValue;
        return acc;
      }, {})
    );

  const [currentBreakpointIndex, setCurrentBreakpointIndex] = React.useState(0);

  const [loadEffectProgress, setLoadEffectProgress] = React.useState(0);
  
  // New state for click effects
  const [activeEffect, setActiveEffect] = React.useState("");
  const [clickEffectProgress, setClickEffectProgress] = React.useState(0);
    
  const clickEffectAnimationFrames = React.useRef({});
  const loadEffectAnimationFrames = React.useRef({})


  //Handle Load effects
  // useEffect(() => {
  //   if (loadEffectAnimationFrames.current["onLoad"]) return;

  //   const startTime = { current: null };

  //   let delayTimeoutId = null;

  //   const animate = (currentTime) => {
  //     if (!startTime.current) {
  //       startTime.current = currentTime;
  //     }

  //     const elapsed = currentTime - startTime.current;
  //     const progress = Math.min(elapsed / onLoadDuration, 1);

  //     setLoadEffectProgress(progress)

  //     if (progress < 1) {
  //       // Continue animating
  //       loadEffectAnimationFrames.current["onLoad"] = requestAnimationFrame(animate);
  //     } else {
  //       // Animation complete - update styles with final values

  //       // setStyles(prevStyles => {
  //       //   const updatedStyles = { ...prevStyles };

  //       //   Object.keys(onLoadStyles).forEach(key => {
  //       //     if (key !== 'transform') {
  //       //       updatedStyles[key] = onLoadStyles[key];
  //       //     }
  //       //   });

  //       //   return updatedStyles;
  //       // });
        

  //       delete loadEffectAnimationFrames.current["onLoad"];
  //       setLoadEffectProgress(1);
  //     }
  //   }
    
  //   delayTimeoutId = setTimeout(() => {
  //     loadEffectAnimationFrames.current["onLoad"] = requestAnimationFrame(animate);
  //   }, onLoadDellay);

  //   // Cleanup function
  //   return () => {
  //     // Cancel any scheduled animation frames
  //     Object.values(loadEffectAnimationFrames.current).forEach(frameId => {
  //       if (frameId) cancelAnimationFrame(frameId);
  //     });

  //     // Clear timeout if still pending
  //     if (delayTimeoutId) clearTimeout(delayTimeoutId);
  //   };

  // }, [onLoadStyles, styles])

  useEffect(() => {
    console.log(loadEffectProgress)
  }, [loadEffectProgress])

  // Handle click triggers for click effects
  useEffect(() => {
    if (!clickEffects || clickEffects.length === 0) return;
    
    const handleClick = (e) => {
      let element = e.target;

      // Check if styles are initialized
      if (!styles || Object.keys(styles).length === 0) {
        console.warn("Styles not initialized yet");
        return;
      }

      while (element) {
        clickEffects.forEach((effect, index) => {
          if (effect.triggerId && element.id === effect.triggerId) {
            const effectId = `effect_${index}`;
            
            if (activeEffect === effectId) return;
            
            // If there's an active effect, capture current interpolated values
            if (activeEffect !== "" && clickEffectProgress > 0) {
              const currentEffectIndex = parseInt(activeEffect.split('_')[1]);
              const currentEffect = clickEffects[currentEffectIndex];
              
              if (currentEffect && currentEffect.styles) {
                // Save current interpolated values to styles state
                const currentStyles = getStyles();
                const updatedStyles = { ...styles };
                
                Object.keys(currentStyles).forEach(key => {
                  if (key !== 'transform') {
                    updatedStyles[key] = currentStyles[key];
                  }
                });
                
                // Handle transform properties separately
                if (currentStyles.transform) {
                  const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                                        'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];
                  const transformRegex = /(\w+)\(([^)]+)\)/g;
                  let match;
                  while ((match = transformRegex.exec(currentStyles.transform)) !== null) {
                    const [, prop, value] = match;
                    if (transformProps.includes(prop)) {
                      updatedStyles[prop] = value;
                    }
                  }
                }
                
                setStyles(updatedStyles);
              }
              
              // Cancel the current animation
              if (clickEffectAnimationFrames.current[activeEffect]) {
                cancelAnimationFrame(clickEffectAnimationFrames.current[activeEffect]);
                delete clickEffectAnimationFrames.current[activeEffect];
              }
            }
            
            setActiveEffect(effectId);
            setClickEffectProgress(0);
          }
        });
        element = element.parentElement;
      }
    };

    document.addEventListener("click", handleClick);
    
    return () => document.removeEventListener("click", handleClick);
  }, [ clickEffects, activeEffect, clickEffectProgress, styles]);

  // Animation loop for click effects
  useEffect(() => {
    if (activeEffect === "") return;

    const effectIndex = parseInt(activeEffect.split('_')[1]);
    const effect = clickEffects[effectIndex];

    if (!effect || clickEffectAnimationFrames.current[activeEffect]) return;

    const startTime = { current: null };
    const effectDuration = effect.duration || 1000;
    const effectDelay = effect.delay || 0; // Delay in ms

    let delayTimeoutId = null;

    const animate = (currentTime) => {
      if (!startTime.current) {
        startTime.current = currentTime;
      }

      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / effectDuration, 1);

      setClickEffectProgress(progress);

      if (progress < 1) {
        // Continue animating
        clickEffectAnimationFrames.current[activeEffect] = requestAnimationFrame(animate);
      } else {
        // Animation complete - update styles with final values
        const idx = parseInt(activeEffect.split('_')[1]);
        if (clickEffects[idx] && clickEffects[idx].styles) {
          setStyles(prevStyles => {
            const updatedStyles = { ...prevStyles };
            clickEffects[idx].styles.forEach((style) => {
              updatedStyles[style.property.trim()] = style.endValue;
            });
            return updatedStyles;
          });
        }

        delete clickEffectAnimationFrames.current[activeEffect];
        setActiveEffect("");
        setClickEffectProgress(0);
      }
    };

    // Delay the start of the animation using setTimeout
    delayTimeoutId = setTimeout(() => {
      clickEffectAnimationFrames.current[activeEffect] = requestAnimationFrame(animate);
    }, effectDelay);

    // Cleanup function
    return () => {
      // Cancel any scheduled animation frames
      Object.values(clickEffectAnimationFrames.current).forEach(frameId => {
        if (frameId) cancelAnimationFrame(frameId);
      });

      // Clear timeout if still pending
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [activeEffect, clickEffects]);


  useEffect(() => {
    console.log(loadEffectProgress)
  }, [loadEffectProgress])


  const getStyles = () => {
    if (activeEffect === "") return styles;

    const computedStyles = { ...styles };
    const transformValues = [];
    const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                            'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];

    const idx = parseInt(activeEffect.split("_")[1]);
    const progress = clickEffectProgress;

    if (!clickEffects[idx] || !clickEffects[idx].styles) return styles;

    clickEffects[idx].styles.forEach((style) => {
      const { property, endValue } = style;
      const propKey = property.trim();

      const easingName = clickEffects[idx].easingFunction || "linear";
      const easing = easingFunctions[easingName] || easingFunctions.linear;

      const currentStartValue = styles[propKey];

      const interpolated = interpolate(currentStartValue, endValue, progress, easing, property);
      
      if (interpolated !== undefined) {
        if (transformProps.includes(propKey)) {
          transformValues.push(`${propKey}(${interpolated})`);
        } else {
          computedStyles[propKey] = interpolated;
        }
      }
    });

    if (transformValues.length > 0) {
      computedStyles.transform = transformValues.join(' ');
    }

    return computedStyles;
  };

  const currentStyles = getStyles();
  const position = positionType;

  const style = {
    position,
    ...currentStyles,
    zIndex: zIndex,
    transition: "none",
  };

  return (
    <div className={className} style={{...style, transformStyle: "preserve-3d"}}>
      {children}
    </div>
  );
}
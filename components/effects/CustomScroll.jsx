//CustomScroll

import * as React from "react";
import easingFunctions from "../utils/easingFunctions";
import { interpolate } from "./utils";
import { Effects } from "@react-three/drei";

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
  onLoadStyles = [],
  onLoadDuration = 1000,
  onLoadDellay = 0,
  onLoadEasingFunction = "linear",
  // New click-triggered effects
  clickEffects = [],
  zIndex = 1000,
}) {
  const stableInitialStyles = React.useMemo(() => initialStyles, [JSON.stringify(initialStyles)]);

  // Changed from ref to state
  const [styles, setStyles] = React.useState({});

  const [currentBreakpointIndex, setCurrentBreakpointIndex] = React.useState(0);

  const [loadEffectProgress, setLoadEffectProgress] = React.useState(0);
  
  // New state for click effects
  const [activeClickEffect, setActiveClickEffect] = React.useState("");
  const [clickEffectProgress, setClickEffectProgress] = React.useState(0);
  const [stylesInitialized, setStylesInitialized] = React.useState(false);
    
  const animationStartTime = React.useRef(null);
  const clickEffectAnimationFrames = React.useRef({});

  // Initialize styles using state instead of ref
  React.useEffect(() => {
    if (Object.keys(styles).length === 0 && initialStyles.length !== 0) {
      const newStyles = stableInitialStyles.reduce((acc, { property, startValue }) => {
        acc[property.trim()] = startValue;
        return acc;
      }, {});
      setStyles(newStyles);
      setStylesInitialized(true);
    }
  }, [stableInitialStyles, styles, initialStyles.length]);

  //Handle Load effects
  React.useEffect(() => {
    if (!stylesInitialized || clickEffectAnimationFrames.current["onLoad"]) return;

    const startTime = { current: null };

    let delayTimeoutId = null;

    const animate = (currentTime) => {
      if (!startTime.current) {
        startTime.current = currentTime;
      }

      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / onLoadDuration, 1);

      console.log(progress)
      setLoadEffectProgress(progress)

      if (progress < 1) {
        // Continue animating
        clickEffectAnimationFrames.current["onLoad"] = requestAnimationFrame(animate);
      } else {
        // Animation complete - update styles with final values

        // setStyles(prevStyles => {
        //   const updatedStyles = { ...prevStyles };

        //   Object.keys(onLoadStyles).forEach(key => {
        //     if (key !== 'transform') {
        //       updatedStyles[key] = onLoadStyles[key];
        //     }
        //   });

        //   return updatedStyles;
        // });
        

        delete clickEffectAnimationFrames.current["onLoad"];
        setClickEffectProgress(0);
      }
    }
    
    delayTimeoutId = setTimeout(() => {
      clickEffectAnimationFrames.current["onLoad"] = requestAnimationFrame(animate);
    }, onLoadDellay);

    // Cleanup function
    return () => {
      // Cancel any scheduled animation frames
      Object.values(clickEffectAnimationFrames.current).forEach(frameId => {
        if (frameId) cancelAnimationFrame(frameId);
      });

      // Clear timeout if still pending
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };

  }, [stylesInitialized, onLoadStyles, loadEffectProgress])

  // Handle click triggers for click effects
  React.useEffect(() => {
    if (!stylesInitialized || !clickEffects || clickEffects.length === 0) return;
    
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
            
            if (activeClickEffect === effectId) return;
            
            // If there's an active effect, capture current interpolated values
            if (activeClickEffect !== "" && clickEffectProgress > 0) {
              const currentEffectIndex = parseInt(activeClickEffect.split('_')[1]);
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
              if (clickEffectAnimationFrames.current[activeClickEffect]) {
                cancelAnimationFrame(clickEffectAnimationFrames.current[activeClickEffect]);
                delete clickEffectAnimationFrames.current[activeClickEffect];
              }
            }
            
            setActiveClickEffect(effectId);
            setClickEffectProgress(0);
          }
        });
        element = element.parentElement;
      }
    };

    document.addEventListener("click", handleClick);
    
    return () => document.removeEventListener("click", handleClick);
  }, [stylesInitialized, clickEffects, activeClickEffect, clickEffectProgress, styles]);

  // Animation loop for click effects
  React.useEffect(() => {
    if (activeClickEffect === "") return;

    const effectIndex = parseInt(activeClickEffect.split('_')[1]);
    const effect = clickEffects[effectIndex];

    if (!effect || clickEffectAnimationFrames.current[activeClickEffect]) return;

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
        clickEffectAnimationFrames.current[activeClickEffect] = requestAnimationFrame(animate);
      } else {
        // Animation complete - update styles with final values
        const idx = parseInt(activeClickEffect.split('_')[1]);
        if (clickEffects[idx] && clickEffects[idx].styles) {
          setStyles(prevStyles => {
            const updatedStyles = { ...prevStyles };
            clickEffects[idx].styles.forEach((style) => {
              updatedStyles[style.property.trim()] = style.endValue;
            });
            return updatedStyles;
          });
        }

        delete clickEffectAnimationFrames.current[activeClickEffect];
        setActiveClickEffect("");
        setClickEffectProgress(0);
      }
    };

    // Delay the start of the animation using setTimeout
    delayTimeoutId = setTimeout(() => {
      clickEffectAnimationFrames.current[activeClickEffect] = requestAnimationFrame(animate);
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
  }, [activeClickEffect, clickEffects]);


  React.useEffect(() => {
    console.log(loadEffectProgress)
  }, [loadEffectProgress])

  const getStyles = () => {
    if (activeClickEffect === "") return styles;

    const computedStyles = { ...styles };
    const transformValues = [];
    const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                            'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];

    const idx = parseInt(activeClickEffect.split("_")[1]);
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
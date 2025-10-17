//CustomScroll

import * as React from "react";
import easingFunctions from "../utils/easingFunctions";
import { interpolate } from "./utils";
import { useEffect } from "react";
import { useProgress } from "@react-three/drei";

// Generate unique ID for component instances
let instanceCounter = 0;
const generateUniqueId = () => {
  instanceCounter += 1;
  return `custom-scroll-${instanceCounter}-${Date.now()}`;
};

// Convert camelCase to kebab-case for CSS properties
const camelToKebab = (str) => {
  return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
};

export function CustomScroll({
  children,
  className,
  positionType = "fixed",
  // Initial Styles
  initialStyles = [],
  // New click-triggered effects
  clickEffects = [],
  // New load effects
  loadEffect = [],

  zIndex = 1000,
}) {
  const stableInitialStyles = React.useMemo(() => initialStyles, [JSON.stringify(initialStyles)]);
  const { progress } = useProgress();   

  // Generate unique class name for this instance
  const uniqueClassName = React.useMemo(() => generateUniqueId(), []);

  // Changed from ref to state
  const [styles, setStyles] = React.useState(stableInitialStyles.reduce((acc, { property, startValue }) => {
      acc[property.trim()] = startValue;
      return acc;
    }, {})
  );

  const triggerIds = clickEffects.map((effect) => effect.triggerId);

  
  // New state for click effects
  const [activeEffect, setActiveEffect] = React.useState("");
  const [clickEffectProgress, setClickEffectProgress] = React.useState(0);
  const clickEffectAnimationFrames = React.useRef({});

  const [loadEffectActive, setLoadEffectActive] = React.useState(false);
  const [loadEffectProgress, setLoadEffectProgress] = React.useState(0);
  const loadEffectAnimationFrame = React.useRef({});

  const ref = React.useRef(null)
  const startTime = React.useRef(null);

  useEffect(() => {
    if( progress !== 100 || !loadEffect.duration || !loadEffect.styles || clickEffectAnimationFrames.current["load"]) return;

    const effectDelay = loadEffect.delay || 0;
    const effectDuration = loadEffect.duration || 1000;

    let delayTimeoutId = null;

    const animate = (currentTime) => {
      if (!startTime.current) {
        startTime.current = currentTime;
      }

      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / effectDuration, 1);

      setLoadEffectProgress(progress);

      if (progress < 1) {
        loadEffectAnimationFrame.current["load"] = requestAnimationFrame(animate);
      } else {
        // Animation complete
        setStyles(prevStyles => {
          const updatedStyles = { ...prevStyles };
          loadEffect.styles.forEach((style) => {
            updatedStyles[style.property.trim()] = style.endValue;
          });
          return updatedStyles;
        });

        setLoadEffectActive(false);
        delete loadEffectAnimationFrame.current["load"];
      }
    };

    delayTimeoutId = setTimeout(() => {
      clickEffectAnimationFrames.current["load"] = requestAnimationFrame(animate);
    }, effectDelay);

    // Cleanup function
    return () => {
      if (loadEffectAnimationFrame.current["load"]) {
        cancelAnimationFrame(loadEffectAnimationFrame.current["load"]);
        delete loadEffectAnimationFrame.current["load"];
      }

      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [progress])

  





  // Handle click triggers for click effects
  useEffect(() => {
    console.log(clickEffects)
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
  }, []);

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
  }, [activeEffect]);


  const getStyles = (loadEffectProgress) => {
    if(!ref.current){
      startTime.current = 0;

      return;
    }


    const computedStyles = { ...styles };
    const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                            'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];
    const transformValues = [];

    const applyEffectStyles = (effectStyles, progress, easingName) => {
      const easing = easingFunctions[easingName] || easingFunctions.linear;

      effectStyles.forEach(({ property, endValue }) => {
        const propKey = property.trim();
        const startValue = styles[propKey];
        const interpolated = interpolate(startValue, endValue, progress, easing, propKey);

        if (interpolated !== undefined) {
          if (transformProps.includes(propKey)) {
            transformValues.push(`${propKey}(${interpolated})`);
          } else {
            computedStyles[propKey] = interpolated;
          }
        }
      });
    };

    if (loadEffectProgress > 0 && loadEffectProgress < 1 && loadEffect?.styles?.length > 0) {
      applyEffectStyles(loadEffect.styles, loadEffectProgress, loadEffect.easingFunction || 'linear');
    }else if (activeEffect !== "") {
      const idx = parseInt(activeEffect.split('_')[1]);
      const effect = clickEffects[idx];
      if (effect?.styles?.length > 0) {
        applyEffectStyles(effect.styles, clickEffectProgress, effect.easingFunction || 'linear');
      }
    }

    if (transformValues.length > 0) {
      computedStyles.transform = transformValues.join(' ');
    } else {
      delete computedStyles.transform;
    }

    return computedStyles;
  };

  const currentStyles = getStyles(loadEffectProgress);
  const position = positionType;

  
  const style = {
    position,
    ...currentStyles,
    zIndex: zIndex,
    transition: "none",
  };

  // Combine user-provided className with unique identifier
  const finalClassName = className ? `${className} ${uniqueClassName}` : uniqueClassName;

  return (
    <div className={finalClassName} data-triggerIds={triggerIds} style={{...style, transformStyle: "preserve-3d"}} ref={ref}>
      {
        children
      }
    </div>
  );
}
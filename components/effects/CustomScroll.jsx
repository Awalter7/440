//CustomScroll

import * as React from "react";
import easingFunctions from "../utils/easingFunctions";
import { interpolate } from "./utils";
import { useEffect, useMemo, useCallback } from "react";
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
  // Click-triggered effects
  clickEffects = [],
  // Hover effects
  hoverEffects = [],
  // Load effects
  loadEffect = [],
  zIndex = 1000,
}) {
  const stableInitialStyles = useMemo(() => initialStyles, [initialStyles]);
  const stableClickEffects = useMemo(() => clickEffects, [clickEffects]);
  const stableHoverEffects = useMemo(() => hoverEffects, [hoverEffects]);
  const stableLoadEffect = useMemo(() => loadEffect, [loadEffect]);
  const { progress } = useProgress();   

  // Generate unique class name for this instance
  const uniqueClassName = useMemo(() => generateUniqueId(), []);

  // Changed from ref to state
  const [styles, setStyles] = React.useState(() => 
    stableInitialStyles.reduce((acc, { property, startValue }) => {
      acc[property.trim()] = startValue;
      return acc;
    }, {})
  );

  // State for click effects
  const [activeEffect, setActiveEffect] = React.useState("");
  const [clickEffectProgress, setClickEffectProgress] = React.useState(0);
  const clickEffectAnimationFrames = React.useRef({});

  // State for hover effects
  const [activeHoverEffect, setActiveHoverEffect] = React.useState("");
  const [hoverEffectProgress, setHoverEffectProgress] = React.useState(0);
  const [isHovering, setIsHovering] = React.useState(false);
  const [reversingHover, setReversingHover] = React.useState(false);
  const hoverEffectAnimationFrame = React.useRef(null);
  const hoverStartStyles = React.useRef({});
  const hoverStartStylesLocked = React.useRef(false); // Lock to prevent overwriting
  const previousHoverEffect = React.useRef(""); // Track previous hover effect

  // State for load effects
  const [loadEffectProgress, setLoadEffectProgress] = React.useState(0);
  const loadEffectAnimationFrame = React.useRef({});

  const ref = React.useRef(null)
  const startTime = React.useRef(null);

  const getStyles = useCallback(() => {
    if(!ref.current){
      startTime.current = 0;
      return {};
    }

    const computedStyles = { ...styles };
    const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                            'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];
    const transformValues = [];

    const applyEffectStyles = (effectStyles, progress, easingName) => {
      const easing = easingFunctions[easingName] || easingFunctions.linear;

      effectStyles.forEach(({ property, endValue }) => {
        const propKey = property.trim();
        const startValue = reversingHover && activeHoverEffect !== "" 
          ? hoverStartStyles.current[propKey] 
          : styles[propKey];
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

    // Priority: hover > load > click
    if ((activeHoverEffect !== "" && (isHovering || reversingHover)) && hoverEffectProgress >= 0) {
      const idx = parseInt(activeHoverEffect.split('_')[1]);
      const effect = stableHoverEffects[idx];
      if (effect?.styles?.length > 0) {
        applyEffectStyles(effect.styles, hoverEffectProgress, effect.easingFunction || 'linear');
      }
    } else if (loadEffectProgress > 0 && loadEffectProgress < 1 && stableLoadEffect?.styles?.length > 0) {
      applyEffectStyles(stableLoadEffect.styles, loadEffectProgress, stableLoadEffect.easingFunction || 'linear');
    } else if (activeEffect !== "") {
      const idx = parseInt(activeEffect.split('_')[1]);
      const effect = stableClickEffects[idx];
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
  }, [styles, activeHoverEffect, isHovering, reversingHover, hoverEffectProgress, stableHoverEffects, 
      loadEffectProgress, stableLoadEffect, activeEffect, clickEffectProgress, stableClickEffects]);

  // Load effect
  useEffect(() => {
    if (progress !== 100 || !stableLoadEffect.duration || !stableLoadEffect.styles) return;

    const loadEffectFrame = loadEffectAnimationFrame.current;
    if (loadEffectFrame["load"]) return;

    const effectDelay = stableLoadEffect.delay || 0;
    const effectDuration = stableLoadEffect.duration || 1000;

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
          stableLoadEffect.styles.forEach((style) => {
            updatedStyles[style.property.trim()] = style.endValue;
          });
          return updatedStyles;
        });

        delete loadEffectAnimationFrame.current["load"];
      }
    };

    delayTimeoutId = setTimeout(() => {
      loadEffectAnimationFrame.current["load"] = requestAnimationFrame(animate);
    }, effectDelay);

    // Cleanup function
    return () => {
      const frameToCancel = loadEffectAnimationFrame.current["load"];
      if (frameToCancel) {
        cancelAnimationFrame(frameToCancel);
        delete loadEffectAnimationFrame.current["load"];
      }

      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [progress, stableLoadEffect]);

  // Handle hover effects
  useEffect(() => {
    if (!stableHoverEffects || stableHoverEffects.length === 0) return;
    
    const handleMouseEnter = (e) => {
      let element = e.target;

      if (!styles || Object.keys(styles).length === 0) {
        console.warn("Styles not initialized yet");
        return;
      }

      while (element) {
        stableHoverEffects.forEach((effect, index) => {
          if (effect.triggerId && element.id === effect.triggerId) {
            const effectId = `hover_${index}`;
            
            // If we're already hovering the same element, don't restart
            if (activeHoverEffect === effectId && isHovering) return;

            // CRITICAL: Only save start styles if:
            // 1. This is a completely new hover effect, OR
            // 2. The hover effect has fully completed (lock is released)
            const isNewHoverEffect = previousHoverEffect.current !== effectId;
            const canSaveStartStyles = !hoverStartStylesLocked.current || isNewHoverEffect;

            if (canSaveStartStyles) {
              // Get the ACTUAL current rendered styles (not mid-animation styles)
              // If we're in the middle of reversing, we should use the locked start styles
              // Otherwise, get fresh styles from the base state
              if (isNewHoverEffect || Object.keys(hoverStartStyles.current).length === 0) {
                // For a new hover or first hover, capture from base styles
                hoverStartStyles.current = { ...styles };
              }
              // If same effect re-entering, keep existing start styles
              
              hoverStartStylesLocked.current = true;
              previousHoverEffect.current = effectId;
            }
            
            // Cancel any active click effect
            if (activeEffect !== "" && clickEffectProgress > 0) {
              const currentEffectIndex = parseInt(activeEffect.split('_')[1]);
              const currentEffect = stableClickEffects[currentEffectIndex];
              
              if (currentEffect && currentEffect.styles) {
                const currentStyles = getStyles();
                const updatedStyles = { ...styles };
                
                Object.keys(currentStyles).forEach(key => {
                  if (key !== 'transform') {
                    updatedStyles[key] = currentStyles[key];
                  }
                });
                
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
              
              const frameToCancel = clickEffectAnimationFrames.current[activeEffect];
              if (frameToCancel) {
                cancelAnimationFrame(frameToCancel);
                delete clickEffectAnimationFrames.current[activeEffect];
              }
              setActiveEffect("");
              setClickEffectProgress(0);
            }
            
            setActiveHoverEffect(effectId);
            setIsHovering(true);
            setReversingHover(false);
            setHoverEffectProgress(0);
          }
        });
        element = element.parentElement;
      }
    };

    const handleMouseLeave = (e) => {
      let element = e.target;

      while (element) {
        stableHoverEffects.forEach((effect, index) => {
          if (effect.triggerId && element.id === effect.triggerId) {
            const effectId = `hover_${index}`;
            
            if (activeHoverEffect === effectId && isHovering) {
              setIsHovering(false);
              setReversingHover(true);
            }
          }
        });
        element = element.parentElement;
      }
    };

    document.addEventListener("mouseenter", handleMouseEnter, true);
    document.addEventListener("mouseleave", handleMouseLeave, true);
    
    return () => {
      document.removeEventListener("mouseenter", handleMouseEnter, true);
      document.removeEventListener("mouseleave", handleMouseLeave, true);
    };
  }, [activeHoverEffect, isHovering, stableHoverEffects, styles, activeEffect, clickEffectProgress, stableClickEffects, getStyles]);

  // Hover animation loop
  useEffect(() => {
    if (activeHoverEffect === "" && !reversingHover) return;

    const effectIndex = parseInt(activeHoverEffect.split('_')[1]);
    const effect = stableHoverEffects[effectIndex];

    if (!effect) return;

    if (hoverEffectAnimationFrame.current) {
      cancelAnimationFrame(hoverEffectAnimationFrame.current);
    }

    const startTime = { current: null };
    const effectDuration = effect.duration || 1000;
    const effectDelay = isHovering ? (effect.delay || 0) : 0;

    let delayTimeoutId = null;

    const animate = (currentTime) => {
      if (!startTime.current) {
        startTime.current = currentTime;
      }

      const elapsed = currentTime - startTime.current;
      let progress = Math.min(elapsed / effectDuration, 1);

      // If reversing, invert the progress
      if (reversingHover) {
        progress = 1 - progress;
      }

      setHoverEffectProgress(progress);

      if ((reversingHover && progress > 0) || (!reversingHover && progress < 1)) {
        hoverEffectAnimationFrame.current = requestAnimationFrame(animate);
      } else {
        // Animation complete
        if (reversingHover) {
          // Restore original styles
          setStyles(prevStyles => {
            const updatedStyles = { ...prevStyles };
            Object.keys(hoverStartStyles.current).forEach(key => {
              if (key !== 'transform') {
                updatedStyles[key] = hoverStartStyles.current[key];
              }
            });
            
            if (hoverStartStyles.current.transform) {
              const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                                    'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];
              const transformRegex = /(\w+)\(([^)]+)\)/g;
              let match;
              while ((match = transformRegex.exec(hoverStartStyles.current.transform)) !== null) {
                const [, prop, value] = match;
                if (transformProps.includes(prop)) {
                  updatedStyles[prop] = value;
                }
              }
            }
            
            return updatedStyles;
          });
          
          // CRITICAL: Only unlock after reverse animation fully completes
          hoverStartStylesLocked.current = false;
          setActiveHoverEffect("");
          setReversingHover(false);
        } else {
          // Hover animation complete - update with final values
          setStyles(prevStyles => {
            const updatedStyles = { ...prevStyles };
            effect.styles.forEach((style) => {
              updatedStyles[style.property.trim()] = style.endValue;
            });
            return updatedStyles;
          });
        }
        
        hoverEffectAnimationFrame.current = null;
        setHoverEffectProgress(0);
      }
    };

    delayTimeoutId = setTimeout(() => {
      hoverEffectAnimationFrame.current = requestAnimationFrame(animate);
    }, effectDelay);

    return () => {
      const frameToCancel = hoverEffectAnimationFrame.current;
      if (frameToCancel) {
        cancelAnimationFrame(frameToCancel);
        hoverEffectAnimationFrame.current = null;
      }
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [activeHoverEffect, isHovering, reversingHover, stableHoverEffects]);

  // Handle click triggers for click effects
  useEffect(() => {
    if (!stableClickEffects || stableClickEffects.length === 0) return;
    
    const handleClick = (e) => {
      // Don't trigger click effects if hover is active
      if (activeHoverEffect !== "" && isHovering) return;
      
      let element = e.target;

      if (!styles || Object.keys(styles).length === 0) {
        console.warn("Styles not initialized yet");
        return;
      }

      while (element) {
        stableClickEffects.forEach((effect, index) => {
          if (effect.triggerId && element.id === effect.triggerId) {
            const effectId = `effect_${index}`;
            
            if (activeEffect === effectId) return;
            
            // If there's an active effect, capture current interpolated values
            if (activeEffect !== "" && clickEffectProgress > 0) {
              const currentEffectIndex = parseInt(activeEffect.split('_')[1]);
              const currentEffect = stableClickEffects[currentEffectIndex];
              
              if (currentEffect && currentEffect.styles) {
                const currentStyles = getStyles();
                const updatedStyles = { ...styles };
                
                Object.keys(currentStyles).forEach(key => {
                  if (key !== 'transform') {
                    updatedStyles[key] = currentStyles[key];
                  }
                });
                
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
              
              const frameToCancel = clickEffectAnimationFrames.current[activeEffect];
              if (frameToCancel) {
                cancelAnimationFrame(frameToCancel);
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
  }, [activeHoverEffect, isHovering, styles, activeEffect, clickEffectProgress, stableClickEffects, getStyles]);

  // Animation loop for click effects
  useEffect(() => {
    if (activeEffect === "") return;

    const effectIndex = parseInt(activeEffect.split('_')[1]);
    const effect = stableClickEffects[effectIndex];

    if (!effect) return;
    
    const clickFrames = clickEffectAnimationFrames.current;
    if (clickFrames[activeEffect]) return;

    const startTime = { current: null };
    const effectDuration = effect.duration || 1000;
    const effectDelay = effect.delay || 0;

    let delayTimeoutId = null;

    const animate = (currentTime) => {
      if (!startTime.current) {
        startTime.current = currentTime;
      }

      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / effectDuration, 1);

      setClickEffectProgress(progress);

      if (progress < 1) {
        clickEffectAnimationFrames.current[activeEffect] = requestAnimationFrame(animate);
      } else {
        // Animation complete - update styles with final values
        const idx = parseInt(activeEffect.split('_')[1]);
        if (stableClickEffects[idx] && stableClickEffects[idx].styles) {
          setStyles(prevStyles => {
            const updatedStyles = { ...prevStyles };
            stableClickEffects[idx].styles.forEach((style) => {
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

    delayTimeoutId = setTimeout(() => {
      clickEffectAnimationFrames.current[activeEffect] = requestAnimationFrame(animate);
    }, effectDelay);

    return () => {
      const framesToCancel = { ...clickEffectAnimationFrames.current };
      Object.values(framesToCancel).forEach(frameId => {
        if (frameId) cancelAnimationFrame(frameId);
      });

      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [activeEffect, stableClickEffects]);

  const currentStyles = getStyles();
  const position = positionType;

  const style = {
    position,
    ...currentStyles,
    zIndex: zIndex,
    transition: "none",
  };

  const finalClassName = className ? `${className} ${uniqueClassName}` : uniqueClassName;

  return (
    <div className={finalClassName}  style={{...style, transformStyle: "preserve-3d"}} ref={ref}>
      {children}
    </div>
  );
}
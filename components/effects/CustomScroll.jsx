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
  // Click-triggered effects
  clickEffects = [],
  // Hover effects
  hoverEffects = [],
  // Load effects
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

  // State for load effects
  const [loadEffectProgress, setLoadEffectProgress] = React.useState(0);
  const loadEffectAnimationFrame = React.useRef({});

  const ref = React.useRef(null)
  const startTime = React.useRef(null);

  // Load effect
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

  // Handle hover effects
  useEffect(() => {
    if (!hoverEffects || hoverEffects.length === 0) return;
    
    const handleMouseEnter = (e) => {
      let element = e.target;

      if (!styles || Object.keys(styles).length === 0) {
        console.warn("Styles not initialized yet");
        return;
      }

      while (element) {
        hoverEffects.forEach((effect, index) => {
          if (effect.triggerId && element.id === effect.triggerId) {
            const effectId = `hover_${index}`;
            
            if (activeHoverEffect === effectId && isHovering) return;
            
            // Save current styles before hover animation
            const currentStyles = getStyles();
            hoverStartStyles.current = { ...currentStyles };
            
            // Cancel any active click effect
            if (activeEffect !== "" && clickEffectProgress > 0) {
              const currentEffectIndex = parseInt(activeEffect.split('_')[1]);
              const currentEffect = clickEffects[currentEffectIndex];
              
              if (currentEffect && currentEffect.styles) {
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
              
              if (clickEffectAnimationFrames.current[activeEffect]) {
                cancelAnimationFrame(clickEffectAnimationFrames.current[activeEffect]);
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
        hoverEffects.forEach((effect, index) => {
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
  }, [activeHoverEffect, isHovering, hoverEffects, styles]);

  // Hover animation loop
  useEffect(() => {
    if (activeHoverEffect === "" && !reversingHover) return;

    const effectIndex = parseInt(activeHoverEffect.split('_')[1]);
    const effect = hoverEffects[effectIndex];

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
      if (hoverEffectAnimationFrame.current) {
        cancelAnimationFrame(hoverEffectAnimationFrame.current);
        hoverEffectAnimationFrame.current = null;
      }
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [activeHoverEffect, isHovering, reversingHover]);

  // Handle click triggers for click effects
  useEffect(() => {
    if (!clickEffects || clickEffects.length === 0) return;
    
    const handleClick = (e) => {
      // Don't trigger click effects if hover is active
      if (activeHoverEffect !== "" && isHovering) return;
      
      let element = e.target;

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
  }, [activeHoverEffect, isHovering]);

  // Animation loop for click effects
  useEffect(() => {
    if (activeEffect === "") return;

    const effectIndex = parseInt(activeEffect.split('_')[1]);
    const effect = clickEffects[effectIndex];

    if (!effect || clickEffectAnimationFrames.current[activeEffect]) return;

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

    delayTimeoutId = setTimeout(() => {
      clickEffectAnimationFrames.current[activeEffect] = requestAnimationFrame(animate);
    }, effectDelay);

    return () => {
      Object.values(clickEffectAnimationFrames.current).forEach(frameId => {
        if (frameId) cancelAnimationFrame(frameId);
      });

      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [activeEffect]);

  const getStyles = () => {
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
      const effect = hoverEffects[idx];
      if (effect?.styles?.length > 0) {
        applyEffectStyles(effect.styles, hoverEffectProgress, effect.easingFunction || 'linear');
      }
    } else if (loadEffectProgress > 0 && loadEffectProgress < 1 && loadEffect?.styles?.length > 0) {
      applyEffectStyles(loadEffect.styles, loadEffectProgress, loadEffect.easingFunction || 'linear');
    } else if (activeEffect !== "") {
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
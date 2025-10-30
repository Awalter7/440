//CustomScroll

import { useState, useCallback, useMemo, useEffect, useReducer } from "react";
import easingFunctions from "../utils/easingFunctions";
import { interpolate, parseValue, getPixelFromPercent} from "./utils";
import { useProgress } from "@react-three/drei";
import useShaderStatus from "../hooks/useShaderStatus";
import useAnimationProgress from "../hooks/useAnimationProgress";
import useThreeLoadedListener from "../hooks/useThreeLoadedListener";
import useClickListener from "../hooks/useClickListener";

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
  loadEffect = null,
  zIndex = 1000,
}) {

    const [uID] = useState(() => generateUniqueId());

    const stableClickEffects = clickEffects.map((obj, idx) => ({
        ...obj,
        id: `click-${idx}`,
    }));

    const stableLoadEffect = loadEffect ? { ...loadEffect, id: "load" } : null;

    const [currentBaseStyles, setCurrentBaseStyles] = useState(
        initialStyles.reduce((acc, { property, startValue }) => {
            acc[property.trim()] = startValue;
            return acc;
        }, {})
    );

    const [activeEffects, setActiveEffect] = useState({
        hover: null,
        click: null,
        load: null
    });



    const activeEffect = useMemo(() => {
        if (activeEffects.load) {
            return activeEffects.load;
        }

        if (activeEffects.hover) {
            return activeEffects.hover;
        }

        if (activeEffects.click) {
            return activeEffects.click;
        }
        
        return null;
    }, [activeEffects]);


    const { progress, resetProgress }= useAnimationProgress(
        activeEffect,
        activeEffect !== null, 
        activeEffect?.duration, 
        activeEffect?.delay
    )

    function captureMidEffectStyles(){
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
    
        return currentStyles;
    }

    useClickListener(
        useMemo(() => stableClickEffects?.map(e => e.triggerId), [stableClickEffects]),

        useCallback((id) => {
            const idx = stableClickEffects.findIndex(e => e.triggerId === id);

            
            let styleWith = null;

            if(progress > 0 && activeEffect.id.startsWith('click-') && idx !== -1){
                styleWith = captureMidEffectStyles();
                resetProgress()
            }

            // const formatedStyles = () => effect.styles.forEach(({property, endValue}) => {
            //     let startValue =  activeEffect?.startWith?.[property] ?? currentBaseStyles[property];

            //     let s = parseValue(startValue);
            //     let e = parseValue(endValue);

            //     if(property === "width" || property === "height"){
            //         if(s.unit === "px" && e.unit === "%"){
            //             e.number = getPixelFromPercent(property, e.number, uID)
            //             e.unit = "px"
            //         }else if(s.unit === "%" && e.unit === "px"){
            //             s.number = getPixelFromPercent(property, s.number, uID)
            //             s.unit = "px"
            //         }
            //     }


            //     return {property: property, startValue: `${s.number}${s.unit}`, endValue: `${e.number}${e.unit}`}
            // });


            if (idx !== -1) {
               setActiveEffect(prev => ({ ...prev, click: {...stableClickEffects[idx], startWith: styleWith}}));
            }
            

        }, [stableClickEffects])
    );

    useThreeLoadedListener(useCallback((loaded) => {
        if (loaded && stableLoadEffect) {
            setActiveEffect(prev => ({ ...prev, load: stableLoadEffect}));
        }
    }, [stableLoadEffect]));



    function getStyles(){
        if(!activeEffect || !activeEffect.styles) return currentBaseStyles;

        const computedStyles = { ...currentBaseStyles};
        const transformProps = ['scale', 'scaleX', 'scaleY', 'scaleZ', 'rotate', 'rotateX', 'rotateY', 'rotateZ', 
                                'translateX', 'translateY', 'translateZ', 'skewX', 'skewY'];
        const transformValues = [];

        const easing = easingFunctions[activeEffect.easingFunction] || easingFunctions.linear;

        activeEffect.styles.forEach(({property, endValue}) => {
            let startValue = activeEffect?.startWith?.[property] ?? currentBaseStyles[property];

            const interpolated = interpolate(startValue, endValue, progress, easing, property, uID)
            
            if (interpolated !== undefined) {
                if (transformProps.includes(property)) {
                    transformValues.push(`${property}(${interpolated})`);
                } else {
                    computedStyles[property] = interpolated;
                }
            }
        })

        if(progress === 1){
            const updatedStyles = { ...currentBaseStyles };

            activeEffect.styles.forEach(({ property, endValue }) => {
                updatedStyles[property.trim()] = endValue;
            });

            setCurrentBaseStyles(updatedStyles);
            
            if (progress === 1) {
                if (activeEffect.id.startsWith('click-')) {
                    setActiveEffect(prev => ({ ...prev, click: null }));
                } else if (activeEffect.id.startsWith('load')) {
                    setActiveEffect(prev => ({ ...prev, load: null }));
                }
            }
        }

        return computedStyles;
    }


    const styles = getStyles();

    const style = {
        position: positionType,
        ...styles,
        zIndex: zIndex,
        transition: "none",
    };

    const finalClassName = className;

    return (
        <div className={finalClassName} id={uID} style={{...style, transformStyle: "preserve-3d"}}>
            {children}
        </div>
    );
}
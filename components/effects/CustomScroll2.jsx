//CustomScroll

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import easingFunctions from "../utils/easingFunctions";
import { interpolate, parseValue, getPixelFromPercent} from "./utils";
import { useProgress } from "@react-three/drei";
import useShaderStatus from "../hooks/useShaderStatus";
import useAnimationProgress from "../hooks/useAnimationProgress";
import useThreeLoadedListener from "../hooks/useThreeLoadedListener";
import useClickListener from "../hooks/useClickListener";


import Effect from "../classes/effect";
import EffectManager from "../classes/effectManager";
import LoadEffect from "../classes/loadEffect";
import ClickEffect from "../classes/clickEffect";

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
    const { progress } = useProgress();

    const [uID] = useState(() => generateUniqueId());


    const stableClickEffects = useMemo(
        () => (clickEffects ? clickEffects.map((obj, idx) => (
            new ClickEffect({
                trigger: obj?.triggerId,
                duration: obj.duration,
                delay: obj.delay,
                easingFunction: obj.easingFunction,
                styles: obj.styles,
                id: `click-${idx}`
            })
        )) : null),
        [clickEffects]
    );

    const stableLoadEffect = useMemo(
        () => (loadEffect ?  
            new LoadEffect({
                duration: loadEffect.duration,
                delay: loadEffect.delay,
                easingFunction: loadEffect.easingFunction,
                styles: loadEffect.styles,
                id: `load-0`,
            })
         : null),
        [loadEffect]
    );

    const [effects, setEffects] = useState(null);
    const effectManagerRef = useRef(null);


    useEffect(() => {
        if(effects) return;
        
        setEffects([stableLoadEffect, ...stableClickEffects].filter(effect => effect != null));
    }, [stableLoadEffect, stableClickEffects])


    return (
        <>
            {
                effects
                &&
                <EffectManager 
                    ref={effectManagerRef}
                    effects={effects}
                    initialStyles={initialStyles}
                    customTriggers={{
                        start: {
                            'load-0': progress === 100,
                        }
                    }}
                >
                    <div className={className} data-attribute-unique-id={uID} style={{position: positionType, zIndex: zIndex, transition: "none", transformStyle: "preserve-3d"}}>
                        {children}
                    </div>
                </EffectManager>
            }

        </>
    );
}

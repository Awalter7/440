//CustomScroll

import { useState, useMemo, useEffect, useRef} from "react";
import { useProgress } from "@react-three/drei";
import EffectManager from "../classes/effectManager";
import LoadEffect from "../classes/loadEffect";
import ClickEffect from "../classes/clickEffect";
import ScrollEffect from "../classes/scrollEffect";
import GravityEffect from "../classes/gravityEffect"

// Generate unique ID for component instances
let instanceCounter = 0;
const generateUniqueId = () => {
  instanceCounter += 1;
  return `custom-scroll-${instanceCounter}-${Date.now()}`;
};


export function CustomScroll({
  children,
  className,
  positionType = "fixed",
  physics = {},
  isButton = false,
  autoTriggerPoints,
  // Initial Styles
  initialStyles = [],
  // Click-triggered effects
  clickEffects = [],
  // Hover effects
  hoverEffects = [],

  breakpoints = [],
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

    const stableScrollEffect = useMemo(
        () => (breakpoints ? breakpoints.map((obj, idx) => (
            
            new ScrollEffect({
                scrollStart: obj.scrollStart,
                scrollEnd: obj.scrollEnd,
                easingFunction: obj.easingFunction,
                styles: obj.styles,
                delay: null,
                trigger: null,
                id: `scroll-${idx}`
            })
        )) : null),
        [breakpoints]
    );

    const effects = useMemo(
        () => [
                stableLoadEffect, 
                ...stableClickEffects, 
                ...stableScrollEffect, 
                ...(physics.hasGravity ? [new GravityEffect({ id: 'gravity-1' })] : []),
            ].filter(effect => effect != null),
        [stableLoadEffect, stableClickEffects]
    );

    const effectManagerRef = useRef(null);

    return (
        <>
            {/* {
                effects
                && */}
                <EffectManager 
                    ref={effectManagerRef}
                    effects={effects}
                    initialStyles={initialStyles}
                    uID={uID}
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
            {/* } */}

        </>
    );
}

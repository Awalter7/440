//CustomScroll

import React, { useState, useMemo, useRef, useEffect} from "react";
import { useProgress } from "@react-three/drei";
import {
  ClickEffect,
  ScrollEffect,
  LoadEffect,
  HoverEffect,
  DistanceEffect,
  ValueChangeEffect
} from "./effects"

import EffectManager from "./managers/effectManager";

// Generate unique ID for component instances
let instanceCounter = 0;
const generateUniqueId = () => {
  instanceCounter += 1;
  return `custom-scroll-${instanceCounter}-${Date.now()}`;
};


export function CustomScroll({
    children,
    className,
    id,
    position,
    usePropValue = false,
    useSpecificProp = false,
    propToUse = null,

    initialStyles = [],

    clickEffects = [],
    hoverEffects = [],
    valueChangeEffects = [],
    breakpoints = [],
    distanceEffects = [],
    loadEffect = null,
    text = "",

    customValue = {},
}) {
    const { progress, total } = useProgress();

    const [uID] = useState(() => generateUniqueId());

    const [values, setValues] = useState(null);
    const [oldValues, setOldValues] = useState({})






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

    const stableHoverEffects = useMemo(
        () => (hoverEffects ? hoverEffects.map((obj, idx) => (
            new HoverEffect({
                trigger: obj?.triggerId,
                duration: obj.duration,
                delay: obj.delay,
                easingFunction: obj.easingFunction,
                styles: obj.styles,
                id: `hover-${idx}`
            })
        )) : null),
        [hoverEffects]
    );

    const stableDistanceEffects = useMemo(
        () => (distanceEffects ? distanceEffects.map((obj, idx) => (
            new DistanceEffect({
                trigger: obj.targetId,
                qualifyer: obj.qualifyer,
                distance: obj.distance,
                duration: obj.duration,
                delay: obj.delay,
                easingFunction: obj.easingFunction,
                styles: obj.styles,
                id: `hover-${idx}`
            })
        )) : null),
        [hoverEffects]
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

    function handleSetVales(value){
        setValues(value)
    }

    function handleSetOldValues(value){
        setOldValues(value)
    }


    const stableValueChangeEffects = useMemo(
        () =>
            valueChangeEffects
            ? 
            valueChangeEffects.map((obj, idx) => (
                new ValueChangeEffect({
                    useSpecificProp: useSpecificProp,
                    propToUse: propToUse,
                    useOldValue: obj.useOldValue,
                    customValue: customValue,
                    values: values,
                    setValues: (values) =>  handleSetVales(values),
                    oldValues: oldValues,
                    setOldValues: (values) =>  handleSetOldValues(values), 
                    duration: obj.duration,
                    delay: obj.delay,
                    easingFunction: obj.easingFunction,
                    styles: obj.styles,
                    id: `value-${idx}`,
                })
                ))
            : 
            null,
        [valueChangeEffects, customValue]
    );

    const effects = useMemo(
        () => [
                stableLoadEffect, 
                ...stableClickEffects, 
                ...stableScrollEffect, 
                ...stableHoverEffects,
                ...stableDistanceEffects,
                ...stableValueChangeEffects,
                // ...(physics.hasGravity ? [new GravityEffect({ id: 'gravity-1', objectId: uID, containerId: physics.container })] : []),
            ].filter(effect => effect != null),
        [stableLoadEffect, stableClickEffects]
    );


    const effectManagerRef = useRef(null);


    useEffect(() => {
        if(!effectManagerRef.current) return;

        const effects = effectManagerRef.current.effects;

        effects.map((effect) => {
            if(effect.type === `value`){
                effect.customValues = customValue;
            }
        })
     }, [customValue])



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
                    data-attibute-elm-type={"effectManager"}
                    customTriggers={{
                        start: {
                            'load-0': progress === 100 || total === 0,
                        },
                    }}
                >   
                    <div className={className} data-attribute-unique-id={uID} id={id} style={{ position: position, transition: "none", transformStyle: "preserve-3d"}}>
                        {
                            usePropValue 
                                ?
                                    values
                                    &&
                                    Object.values(values).map((value, idx) => (
                                        value
                                    ))
                                :
                                    text ? text : children
                        }
                    </div>
                </EffectManager>
            {/* } */}

        </>
    );
}

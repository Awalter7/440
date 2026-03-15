//CustomScroll

import React, { useState, useMemo, useRef, useEffect, useId, useCallback} from "react";
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
    animateChars = false,
    animateWords = false,
    characterDelayOffset = 0,

    customValue = {},
    compIndex = 0,
    length=1,
}) {

    const uID = useId(); // guaranteed stable, no module-level state needed

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
                id: `click-${idx}`,
                index: compIndex,
                length: length,
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
                exitDelay: 300,
                easingFunction: obj.easingFunction,
                fullCycle: obj.fullCycle,
                styles: obj.styles,
                id: `hover-${idx}`,
                index: compIndex,
                length: length,
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
                id: `distance-${idx}`,
                index: compIndex,
                length: length,
            })
        )) : null),
        [distanceEffects]
    );

    const stableLoadEffect = useMemo(
        () => (loadEffect ?  
            new LoadEffect({
                duration: loadEffect.duration,
                delay: loadEffect.delay,
                easingFunction: loadEffect.easingFunction,
                styles: loadEffect.styles,
                id: `load-0`,
                index: 0,
                length: length,
            })
         : null),
        [loadEffect]
    );

    const stableScrollEffect = useMemo(
        () => (breakpoints ? breakpoints.map((obj, idx) => (
            new ScrollEffect({
                scrollStart: obj.scrollStart,
                scrollEnd: obj.scrollEnd,
                scrollUpStart: obj.scrollUpStart,
                easingFunction: obj.easingFunction,
                styles: obj.styles,
                delay: obj.delay,
                duration: obj.duration,
                timed: obj.timed,
                trigger: null,
                reversable: obj.reversable,
                id: `scroll-${idx}`,
                index: compIndex,
                length: length,
                dir: obj.dir === "up" ? true : false,
            })
        )) : null),
        [breakpoints]
    );

    const handleSetValues = useCallback((value) => {
        setValues(value);
    }, []); // ✅ Never recreated

    const handleSetOldValues = useCallback((value) => {
        setOldValues(value);
    }, []); // ✅ Never recreated

    const stableValueChangeEffects = useMemo(
        () =>
            valueChangeEffects
            ? valueChangeEffects.map((obj, idx) => (
                new ValueChangeEffect({
                    useSpecificProp,
                    propToUse,
                    useOldValue: obj.useOldValue,
                    customValue,
                    values,
                    setValues: handleSetValues,       // ✅ stable ref
                    oldValues,
                    setOldValues: handleSetOldValues, // ✅ stable ref
                    duration: obj.duration,
                    delay: obj.delay,
                    easingFunction: obj.easingFunction,
                    styles: obj.styles,
                    id: `value-${idx}`,
                    index: compIndex,
                    length,
                })
            ))
            : null,
        // ✅ handleSetValues/handleSetOldValues are now stable so safe to include
        // JSON.stringify prevents new object reference from triggering rememo
        [valueChangeEffects, JSON.stringify(customValue), handleSetValues, handleSetOldValues]
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
        [stableLoadEffect, stableClickEffects, stableScrollEffect]
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
            {
                // !animateWords
                //     ?
                //         !animateChars 
                //             ?
                                <EffectManager 
                                    ref={effectManagerRef}
                                    effects={effects}
                                    initialStyles={initialStyles}
                                    uID={uID}
                                    data-attibute-elm-type={"effectManager"}
                                    customTriggers={{
                                        start: {
                                            'load-0': true === true
                                        },
                                    }}
                                >   
                                    <div className={className} data-attribute-unique-id={uID} id={id} style={{ position: position, transition: "none", transformStyle: "preserve-3d", width: (animateChars || animateWords) ? "max-content" : "auto"}}>
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
                    //         :
                    //             text
                    //             &&
                    //             text.split('').map((char, idx) => (
                    //                 <CustomScroll
                    //                     key={"char-" + idx}
                    //                     className={className}
                    //                     id={id}
                    //                     position={position}
                    //                     usePropValue={usePropValue}
                    //                     useSpecificProp={useSpecificProp}
                    //                     propToUse={propToUse}

                    //                     initialStyles={initialStyles}

                    //                     clickEffects={clickEffects}
                    //                     hoverEffects={hoverEffects}
                    //                     valueChangeEffects={valueChangeEffects}
                    //                     breakpoints={breakpoints}
                    //                     distanceEffects={distanceEffects}
                    //                     loadEffect={loadEffect}

                    //                     customValue={customValue}

                    //                     text={char}
                    //                     animateChars={false}
                    //                     characterDelayOffset={characterDelayOffset}
                    //                     compIndex={idx}
                    //                     length={text.split('').length}
                    //                 >
                    //                     {children}
                    //                 </CustomScroll>

                    //             ))
                    // :

                    //     text
                    //     &&
                    //     text.split(' ').map((char, idx) => (
                    //         <CustomScroll
                    //             key={"char-" + idx}
                    //             className={className}
                    //             id={id}
                    //             position={position}
                    //             usePropValue={usePropValue}
                    //             useSpecificProp={useSpecificProp}
                    //             propToUse={propToUse}

                    //             initialStyles={initialStyles}

                    //             clickEffects={clickEffects}
                    //             hoverEffects={hoverEffects}
                    //             valueChangeEffects={valueChangeEffects}
                    //             breakpoints={breakpoints}
                    //             distanceEffects={distanceEffects}
                    //             loadEffect={loadEffect}

                    //             customValue={customValue}

                    //             text={char}
                    //             animateChars={false}
                    //             characterDelayOffset={characterDelayOffset}
                    //             compIndex={idx}
                    //             length={text.split(' ').length}
                    //         >
                    //             {children}
                    //         </CustomScroll>
                    //     ))
     
            }
        </>
    );
}

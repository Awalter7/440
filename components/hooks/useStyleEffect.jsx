// useStyleEffect.js (main hook)
import { useState, useCallback, useMemo, useReducer } from "react";
import useClickListener from "./useClickListener";
import useHoverListener from "./useHoverListener";
import useThreeLoadedListener from "./useThreeLoadedListener";
import useAnimationProgress from "./useAnimationProgress";
import { computeStyles } from "./computeStyles";

// // Reducer for managing active effects with priority
function effectReducer(state, action) {
  switch (action.type) {
    case 'SET_HOVER':
      return { ...state, hover: action.payload };
    case 'SET_CLICK':
        console.log('SET_CLICK fired', action.payload, 'Hover active?', !!state.hover);
        return { ...state, click: action.payload };
    case 'SET_LOAD':
      // Only set load if no hover or click
      if (state.hover || state.click) return state;
      return { ...state, load: action.payload };
    case 'CLEAR_HOVER':
      return { ...state, hover: null };
    case 'CLEAR_CLICK':
      return { ...state, click: null };
    case 'CLEAR_LOAD':
      return { ...state, load: null };
    default:
      return state;
  }
}

// Make sure this is exported as default!
export default function useStyleEffect(
  initialStyles = [],
  clickEffects = [],
  hoverEffects = [],
  loadEffect = null
) {


    // Initialize base styles once
    const baseStyles = useMemo(() => {
        return initialStyles.reduce((acc, { property, startValue }) => {
            acc[property.trim()] = startValue;
            return acc;
        }, {});
    }, [initialStyles]);

    // Track base styles that get updated after animations complete
    const [currentBaseStyles, setCurrentBaseStyles] = useState(baseStyles);

    // Use reducer to manage effect priorities
    const [activeEffects, dispatch] = useReducer(effectReducer, {
        hover: null,
        click: null,
        load: null
    });

    // Track hover state separately for reversing
    // const [hoverState, setHoverState] = useState({ isHovering: false, savedStyles: null });

    // Determine the active effect based on priority: hover > load > click
    const activeEffect = useMemo(() => {
        if (activeEffects.hover) {
            return activeEffects.hover;
        }

        if (activeEffects.load) {
            return activeEffects.load;
        }

        if (activeEffects.click) {
            return activeEffects.click;
        }
        
        return null;
    }, [activeEffects]);

    // Animation progress
    const progress = useAnimationProgress(activeEffect, useCallback(() => {
        if (!activeEffect) return;


        // const { id, effect, isReversing } = activeEffect;
        
        // console.log(effect)
        // if(!effect.styles) return;


        // if (isReversing) {
        //     // Restore saved styles after reverse completes
        //     if (hoverState.savedStyles) {
        //         setCurrentBaseStyles(hoverState.savedStyles);
        //     }
        //     setHoverState({ isHovering: false, savedStyles: null });
        //     dispatch({ type: 'CLEAR_HOVER' });
        // } else {
        //     // Update base styles with final values
        //     const updatedStyles = { ...currentBaseStyles };
        //     effect.styles.forEach(({ property, endValue }) => {
        //         updatedStyles[property.trim()] = endValue;
        //     });
        //     setCurrentBaseStyles(updatedStyles);

        //     // Clear the completed effect
        //     if (id.startsWith('click-')) {
        //         dispatch({ type: 'CLEAR_CLICK' });
        //     } else if (id.startsWith('load')) {
        //         dispatch({ type: 'CLEAR_LOAD' });
        //     } else if (id.startsWith('hover-')) {
        //         // Hover stays active until mouse leaves
        //     }
        // }
    }, [activeEffect, currentBaseStyles]));

    useEffect(() => {
        console.log(progress)
    }, [progress])

    // Click listener
    useClickListener(
        useMemo(() => clickEffects?.map(e => e.triggerId), [clickEffects]),

        useCallback((id) => {
            const idx = clickEffects.findIndex(e => e.triggerId === id);

            if (idx !== -1) {
                dispatch({
                    type: 'SET_CLICK',
                    payload: { id: `click-${idx}`, effect: clickEffects[idx] }
                });
            }

        }, [clickEffects])
    );

    // Hover listener
    // useHoverListener(
    //     useMemo(() => hoverEffects?.map(e => e.triggerId), [hoverEffects]),
    //     useCallback((id) => {
    //         const idx = hoverEffects.findIndex(e => e.triggerId === id);
    //         if (idx !== -1) {
    //             // Save current styles before hovering
    //             setHoverState({ isHovering: true, savedStyles: { ...currentBaseStyles } });
    //             dispatch({
    //                 type: 'SET_HOVER',
    //                 payload: { id: `hover-${idx}`, effect: hoverEffects[idx] }
    //             });
    //         }
    //     }, [hoverEffects, currentBaseStyles]),
    //     useCallback((id) => {
    //         const idx = hoverEffects.findIndex(e => e.triggerId === id);
    //         if (idx !== -1 && activeEffects.hover?.id === `hover-${idx}`) {
    //             // Start reversing
    //             dispatch({
    //                 type: 'SET_HOVER',
    //                 payload: { ...activeEffects.hover, isReversing: true }
    //             });
    //         }
    //     }, [hoverEffects, activeEffects.hover])
    // );

    // Load listener
    useThreeLoadedListener(useCallback((loaded) => {
        if (loaded && loadEffect) {
            dispatch({
                type: 'SET_LOAD',
                payload: { id: 'load', effect: loadEffect }
            });
        }
    }, [loadEffect]));

    // Compute final styles
    const styles = useMemo(() => {
        return computeStyles(currentBaseStyles, activeEffect, progress);
    }, [currentBaseStyles, activeEffect, progress]);

    return { styles };
}
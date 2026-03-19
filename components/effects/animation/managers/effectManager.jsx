import React, { Component } from "react";
import { easingFunctionsJS } from "../../../utils/easingFunctions"
import { interpolate, parseValue, convertWidthUnit, convertHeightUnit} from "../../../effects/utils"





export default class EffectManager extends Component{
    constructor(props = {}){
        super(props)
        this._effects = props.effects ?? [];
        const transformProps = [
            "scale", "scaleX", "scaleY", "scaleZ",
            "rotate", "rotateX", "rotateY", "rotateZ",
            "translateX", "translateY", "translateZ",
            "skewX", "skewY"
        ];

        let baseStyles = {};
        let transformValues = [];

        // Build initial styles properly
        if (Array.isArray(props.initialStyles)) {
            props.initialStyles.forEach(({ property, startValue }) => {
                property = property.trim();

                if (transformProps.includes(property)) {
                    transformValues.push(`${property}(${startValue})`);
                } else {
                    baseStyles[property] = startValue;
                }
            });

            if (transformValues.length > 0) {
                baseStyles.transform = transformValues.join(" ");
            }
        }

        this.state = {
            styles: baseStyles 
        }

        // --- Style queue ---
        // Pending patches from all effects; flushed in a single setState per frame.
        this._styleQueue = [];       // Array<{ type: "flat"|"transform", key?: string, value: any, transforms?: object }>
        this._flushScheduled = false;

        this._effects.forEach(effect => {
            if(effect !== null){
                effect.onProgressChange = this._onProgressChange.bind(this);
                effect.uID = props.uID ?? "example-id";
                effect.setStyle = this._setStyle.bind(this);
            }
        });


        this.children = props.children;

        this.prevCustomTriggers = JSON.parse(JSON.stringify(props.customTriggers || {}));

        this.uID = props.uID ?? "example-id";
    }

    // ─── Style Queue ─────────────────────────────────────────────────────────────

    /**
     * Enqueue a style patch and schedule a single flush for this tick.
     * Each patch is { flatStyles: object, transformUpdates: object } so that
     * multiple effects writing in the same frame are all merged before setState.
     */
    _enqueueStylePatch(flatStyles = {}, transformUpdates = {}) {
        this._styleQueue.push({ flatStyles, transformUpdates });

        if (!this._flushScheduled) {
            this._flushScheduled = true;
            // Use a microtask so all synchronous enqueues in this tick are batched.
            Promise.resolve().then(() => this._flushStyleQueue());
        }
    }

    /**
     * Merge every pending patch into one setState call using the functional
     * updater so we always read the latest state, not a stale closure.
     */
    _flushStyleQueue() {
        this._flushScheduled = false;

        if (this._styleQueue.length === 0) return;

        const patches = this._styleQueue;
        this._styleQueue = [];

        this.setState(({ styles: prevStyles }) => {
            // Start from latest committed styles
            const newStyles = { ...prevStyles };

            // Parse the current transform string into a mutable map
            const currentTransformString = newStyles.transform || "";
            const transformMap = {};
            currentTransformString.replace(
                /(\w+)\(([^)]+)\)/g,
                (_, key, value) => (transformMap[key] = value)
            );

            // Apply every patch in order
            for (const { flatStyles, transformUpdates } of patches) {
                // Flat (non-transform) properties
                Object.assign(newStyles, flatStyles);

                // Transform properties — merge into the shared map
                Object.assign(transformMap, transformUpdates);
            }

            // Rebuild transform string
            newStyles.transform = Object.entries(transformMap)
                .map(([k, v]) => `${k}(${v})`)
                .join(" ");

            return { styles: newStyles };
        });
    }

    // ─── Public style setter (used by effects via effect.setStyle) ────────────

    /**
     * Single key/value setter. Flat properties go directly; transform props are
     * routed through the transform update map.
     */
    _setStyle(key, value) {
        const transformProps = [
            "scale", "scaleX", "scaleY", "scaleZ",
            "rotate", "rotateX", "rotateY", "rotateZ",
            "translateX", "translateY", "translateZ",
            "skewX", "skewY"
        ];

        if (transformProps.includes(key)) {
            this._enqueueStylePatch({}, { [key]: value });
        } else {
            this._enqueueStylePatch({ [key]: value }, {});
        }
    }

    // ─── Getters / setters ────────────────────────────────────────────────────

    get effects(){
        return this._effects;
    }

    set effects(value){
        this._effects = value;
    }

    get initialStyles(){
        return this._initialStyles;
    }

    set initialStyles(value){
        this._initialStyles = value;
    }

    get styles(){
        return this._styles;
    }

    set styles(value){
        this._styles = value;
    }

    // ─── Lifecycle ────────────────────────────────────────────────────────────

    componentDidUpdate(prevProps) {
        if (JSON.stringify(prevProps.customTriggers) !== JSON.stringify(this.props.customTriggers)) {
            this._logTriggerDifferences(prevProps.customTriggers, this.props.customTriggers);
        }
    }

    componentDidMount() {
        for (const category in this.props.customTriggers) {
            for (const key in this.props.customTriggers[category]) {
                if (this.props.customTriggers[category][key]) {
                    this._resolveAndRunFunction([category, key]);
                }
            }
        }

        this._effects.forEach(effect => {
            if (effect.componentDidMount) effect.componentDidMount();
        });
    }

    componentWillUnmount() {
        // Cancel any pending flush to avoid setState on unmounted component
        this._flushScheduled = false;
        this._styleQueue = [];

        this._effects.forEach(effect => {
            if (effect.componentWillUnmount) effect.componentWillUnmount();
        });
    }

    // ─── Trigger helpers ──────────────────────────────────────────────────────

    _resolveAndRunFunction(newPath) {
        if (!Array.isArray(newPath) || newPath.length < 2) {
            console.warn("Invalid path:", newPath);
            return;
        }

        const effect = this._effects.find((e) => e.id === newPath[1])
        const fn = effect?.[newPath[0]];

        if (typeof fn === "function") {
            try {
                fn.call(effect);
            } catch (err) {
                console.error(`❌ Error executing function at path ${newPath[1]}.${newPath[0]}():`, err);
            }
        } else {
            console.warn(`⚠️ No function found at path ${newPath[1]}.${newPath[0]}`);
        }
    }

    _logTriggerDifferences(prev, current, path = [], depth = 0) {
        const allKeys = new Set([...Object.keys(prev || {}), ...Object.keys(current || {})]);

        for (const key of allKeys) {
            const newPath = [...path, key];
            const prevVal = prev?.[key];
            const currVal = current?.[key];

            const bothObjects =
                typeof prevVal === "object" && prevVal !== null &&
                typeof currVal === "object" && currVal !== null;

            if (bothObjects) {
                this._logTriggerDifferences(prevVal, currVal, newPath, depth + 1);
            } else if (JSON.stringify(prevVal) !== JSON.stringify(currVal)) {
                if(this.props.customTriggers[newPath[0]][newPath[1]]){
                    this._resolveAndRunFunction(newPath);
                }
            }
        }
    }

    _stopOthers(current){
        this._effects.map((effect) => {
            if(effect.trigger !== current.trigger && effect.active === true){
                effect.stop();
            }
        })
    }

    // ─── Progress handler ─────────────────────────────────────────────────────

    _onProgressChange(progress, effect, modifyStartValue = true) {
        const easing = easingFunctionsJS[effect.easingFunction] || easingFunctionsJS.linear;

        const transformProps = [
            "scale", "scaleX", "scaleY", "scaleZ",
            "rotate", "rotateX", "rotateY", "rotateZ",
            "translateX", "translateY", "translateZ",
            "skewX", "skewY"
        ];

        // Snapshot current styles once — only for reading start values.
        // Writes go through the queue, not direct setState.
        const currentStyles = this.state.styles;

        const currentTransformString = currentStyles.transform || "";
        const existingTransforms = {};
        currentTransformString.replace(
            /(\w+)\(([^)]+)\)/g,
            (_, key, value) => (existingTransforms[key] = value)
        );

        // Accumulate this effect's contribution into two buckets
        const flatStyles = {};
        const transformUpdates = { ...existingTransforms };

        effect.styles.forEach(({ property, endValue, startValue }) => {
            let currentStartValue = startValue;

            if (transformProps.includes(property)) {
                if (!currentStartValue) {
                    currentStartValue = existingTransforms[property] || 0;
                    if (modifyStartValue) effect.setStartValue(property, currentStartValue);
                }
            } else {
                if (!currentStartValue) {
                    currentStartValue = currentStyles[property];

                    if (property === "width") {
                        console.log(endValue, currentStartValue)
                        const e = parseValue(endValue, property);
                        const s = parseValue(currentStartValue, property);
                        console.log(e, s)
                        if (s.unit === "px" && e.unit === "%") {
                            currentStartValue = convertWidthUnit(e.number, s.unit, this.uID) + "%";
                        } else if (s.unit === "%" && e.unit === "px") {
                            currentStartValue = convertWidthUnit(s.number, s.unit, this.uID) + "px";
                        }
                    } else if (property === "height") {
                        const e = parseValue(endValue, property);
                        const s = parseValue(currentStartValue, property);
                        if (s.unit === "px" && e.unit === "%") {
                            currentStartValue = convertHeightUnit(e.number, s.unit, this.uID) + "%";
                        } else if (s.unit === "%" && e.unit === "px") {
                            currentStartValue = convertHeightUnit(s.number, s.unit, this.uID) + "px";
                        }
                    }

                    if (modifyStartValue) effect.setStartValue(property, currentStartValue);
                }
            }

            const interpolated = interpolate(
                currentStartValue,
                endValue,
                progress,
                easing,
                property
            );

            if (interpolated !== undefined) {
                if (transformProps.includes(property)) {
                    transformUpdates[property] = interpolated;
                } else {
                    flatStyles[property] = interpolated;
                }
            }

            if (progress === 1 && effect.loop === true) {
                const originalStyle = effect.styles.find(s => s.property === property);
                if (originalStyle && originalStyle.startValue !== undefined) {
                    if (transformProps.includes(property)) {
                        transformUpdates[property] = originalStyle.startValue;
                    } else {
                        flatStyles[property] = originalStyle.startValue;
                    }
                }

                effect._progress = 0;
                effect.stop();
            } else if (!effect.active) {
                effect.stop();
                if (modifyStartValue) effect.setStartValue(property, undefined);
            }
        });

        // Single enqueue per effect per frame — the queue merges all effects together
        this._enqueueStylePatch(flatStyles, transformUpdates);
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    render() {
        const styles = this.state.styles;

        return( 
            <>
                {
                    React.cloneElement(this.props.children, {
                        style: {...this.children.props.style, ...styles},
                        'data-attribute-tag': "custom-animation-box",
                    })
                }
            </>
        );
    }
}
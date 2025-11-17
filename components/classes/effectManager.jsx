import React, { Component } from "react";
import easingFunctions from "../utils/easingFunctions";
import { interpolate } from "../effects/utils";


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


        this._effects.forEach(effect => {
            if(effect !== null){
                effect.onProgressChange = this._onProgressChange.bind(this);
                effect.stopOthers = this._stopOthers.bind(this)
            }
        });

        this.children = props.children;

        this.prevCustomTriggers = JSON.parse(JSON.stringify(props.customTriggers || {}));
    }

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

    componentDidUpdate(prevProps) {
        // Compare customTriggers deeply to detect changes
        if (JSON.stringify(prevProps.customTriggers) !== JSON.stringify(this.props.customTriggers)) {
            // console.log("🌀 customTriggers changed:");
            // console.log("Previous:", prevProps.customTriggers);
            // console.log("Current:", this.props.customTriggers);

            // Optionally, find which specific keys changed:
            this._logTriggerDifferences(prevProps.customTriggers, this.props.customTriggers);
        }
    }

    _resolveAndRunFunction(newPath) {
        if (!Array.isArray(newPath) || newPath.length < 2) {
            console.warn("Invalid path:", newPath);
            return;
        }


        const effect = this._effects.find((e) => e.id === newPath[1])
        // Dynamically resolve the function
        const fn = effect?.[newPath[0]];

        if (typeof fn === "function") {
            try {
                // console.log(`⚡ Executing function at path: ${newPath[1]}.${newPath[0]}()`);
                fn.call(effect); // <-- bind `this` correctly
            } catch (err) {
                // console.error(`❌ Error executing function at path ${newPath[1]}.${newPath[0]}():`, err);
            }
        } else {
            // console.warn(`⚠️ No function found at path ${newPath[1]}.${newPath[0]}`);
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
                // Recurse deeper
                this._logTriggerDifferences(prevVal, currVal, newPath, depth + 1);
            } else if (JSON.stringify(prevVal) !== JSON.stringify(currVal)) {
                if(this.props.customTriggers[newPath[0]][newPath[1]]){
                    // --- Dynamically execute function using the key path ---
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

    _onProgressChange(progress, effect) {
        const easing = easingFunctions[effect.easingFunction] || easingFunctions.linear;

        const transformProps = [
            "scale", "scaleX", "scaleY", "scaleZ",
            "rotate", "rotateX", "rotateY", "rotateZ",
            "translateX", "translateY", "translateZ",
            "skewX", "skewY"
        ];

        // Clone current styles
        const newStyles = { ...this.state.styles };

        // 🔍 Parse existing transform into an object (e.g. { scaleX: "2", rotate: "30deg" })
        const currentTransformString = newStyles.transform || "";
        const existingTransforms = {};
        currentTransformString.replace(
            /(\w+)\(([^)]+)\)/g,
            (_, key, value) => (existingTransforms[key] = value)
        );

        // Store updated transforms here
        const updatedTransforms = { ...existingTransforms };

        effect.styles.forEach(({ property, endValue, startValue }) => {
            let currentStartValue = startValue;

            // 🧠 For transform props, pull starting value from the parsed transform map
            if (transformProps.includes(property)) {
                if (!currentStartValue) {
                    currentStartValue = existingTransforms[property] || 0;
                    effect.setStartValue(property, currentStartValue);
                }
            } else {
                if (!currentStartValue) {
                    currentStartValue = newStyles[property];
                    effect.setStartValue(property, currentStartValue);
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
                    updatedTransforms[property] = interpolated;
                } else {
                    newStyles[property] = interpolated;
                }
            }

            if (progress === 1) {
                effect.stop();
                effect.setStartValue(property, undefined);
            }
        });

        // 🌀 Rebuild transform string from updatedTransforms
        const transformString = Object.entries(updatedTransforms)
            .map(([key, value]) => `${key}(${value})`)
            .join(" ");

        newStyles.transform = transformString;

        this.setState({ styles: newStyles });
    }

    componentDidMount() {
        this._effects.forEach(effect => {
            if (effect.componentDidMount) effect.componentDidMount();
        });
    }

    componentWillUnmount() {
        this._effects.forEach(effect => {
            if (effect.componentWillUnmount) effect.componentWillUnmount();
        });
    }

    render() {
        const styles = this.state.styles;

        return( 
            <>
                {
                    React.cloneElement(this.children, {
                        style: {...this.children.props.style, ...styles},
                        'data-attribute-tag': "custom-animation-box",
                    })
                }
            </>
        );
    }
}
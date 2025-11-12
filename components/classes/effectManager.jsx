import React, { Component } from "react";
import easingFunctions from "../utils/easingFunctions";
import { interpolate } from "../effects/utils";


export default class EffectManager extends Component{
    constructor(props = {}){
        super(props)
        this._effects = props.effects ?? [];
        this._initialStyles = props.initialStyles ?? {};
        this.state = {
            styles: 
            this._initialStyles.length 
            && 
            this._initialStyles.reduce(
                (acc, { property, startValue }) => 
                    {
                        acc[property.trim()] = startValue;
                        return acc;
                    }, {}
            )
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

        const transformValues = [];

        const newStyles = { ...this.state.styles }; // <-- create a new object

        effect.styles.forEach(({ property, endValue, startValue }) => {
            let currentStartValue = startValue;

            if(!currentStartValue){
                currentStartValue = newStyles[property];
                effect.setStartValue(property, currentStartValue);
            }

            // let startValue = this.state.styles[property];
            const interpolated = interpolate(startValue, endValue, progress, easing, property);
            
            if (interpolated !== undefined) {
                if (transformProps.includes(property)) {
                    transformValues.push(`${property}(${interpolated})`);
                } else {
                    newStyles[property] = interpolated;
                }
            }

            if(progress === 1){
                effect.stop();
                effect.setStartValue(property, undefined);
            }
        });

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
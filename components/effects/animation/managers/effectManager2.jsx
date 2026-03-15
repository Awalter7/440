import React, { Component } from "react";
import { easingFunctionsJS, easingFunctionsCSS } from "../../../utils/easingFunctions";
import { interpolate, parseValue, converWidthUnity, convertHeightUnit } from "../../../effects/utils";

const transformProps = [
    "scale", "scaleX", "scaleY", "scaleZ",
    "rotate", "rotateX", "rotateY", "rotateZ",
    "translateX", "translateY", "translateZ",
    "skewX", "skewY"
];


export default class EffectManager extends Component{
    constructor(props = {}){
        super(props)

        

        this._effects = props.effects ?? [];
        this.initialStyles = props.initialStyles ?? {};

        this._effects.forEach(effect => {                                   // PASS FUNCTIONS TO EFFECTS
            if(effect !== null){
                effect.manageProgress = this._manageProgress.bind(this);
                // effect.stopOthers = this._stopOthers.bind(this)
                effect.uID = props.uID ?? "example-id";
                effect.setStyle = this._setStyle.bind(this);
                effect.playClassAnimation = this.playClassAnimation.bind(this);
            }
        });
        

        this.children = props.children;
        this.prevCustomTriggers = JSON.parse(JSON.stringify(props.customTriggers || {}));
        this.uID = props.uID ?? "example-id";

        this.state = {
            styles: [],
            className: [],
        }

        this.classesGenerated = false;

        this._registerTranslateProperties()

    }

    // MOUNTING SETUP

    componentDidMount() {
        // Fire triggers that are already true on first render
        for (const category in this.props.customTriggers) {
            for (const key in this.props.customTriggers[category]) {
                if (this.props.customTriggers[category][key]) {
                    this._resolveAndRunFunction([category, key]);
                }
            }
        }

        
        this._initalizeClassStyles();
        // this._initalizeInlineStyles();

        // Run effect mounts
        this._effects.forEach(effect => {
            if (effect.componentDidMount) effect.componentDidMount();
        });
    }

    componentWillUnmount() {
        // Run effect unmounts
        this._effects.forEach(effect => {
            if (effect.componentWillUnmount) effect.componentWillUnmount();
        });
    }

    // SETTERS & GETTERS

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


    // Set Single Style
    _setStyle(key, value) {
        this.setState({styles: {
            ...this._styles,
            [key]: value
        }})
    }

    getStartValue(property) {
        const targetClass = `.${(this.uID.replace(":", "") + "-General Styles").replace(/[^a-zA-Z0-9_-]/g, "_")}`;

        let rule;
        for (const sheet of document.styleSheets) {
            try {
                rule = Array.from(sheet.cssRules).find(r => r.selectorText === targetClass);
                if (rule) break;
            } catch (e) {
                // Skip cross-origin sheets
            }
        }

        if (!rule) {
            console.warn(`No rule found for class: ${targetClass}`);
            return undefined;
        }

        const value = rule.style.getPropertyValue(property);

        if (!value) {
            console.warn(`Property "${property}" not found in rule ${targetClass}`);
            return undefined;
        }

        return value;
    }

    //RESOLVE CUSTOM FUNCTIONS

    _resolveAndRunFunction(newPath) {
        if (!Array.isArray(newPath) || newPath.length < 2) {
            console.warn("Invalid path:", newPath);
            return;
        }


        const effect = this._effects.find((e) => e.id === newPath[1])

        if(!effect) return;
        // Dynamically resolve the function
        const fn = effect?.[newPath[0]];

        if (typeof fn === "function") {
            try {
                // console.log(`⚡ Executing function at path: ${newPath[1]}.${newPath[0]}()`);
                fn.call(effect); // <-- bind `this` correctly
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

    addCSSVars = (styles, end) => {
        styles.forEach(({ property, startValue, endValue }) => {
            const value = end ? endValue : startValue;

            if (value === undefined || value === null) {
                console.warn(`addCSSVars: No value for property "${property}" (end=${end})`);
                return; // skip instead of writing "undefined"
            }
            console.log(property, value)
            document.documentElement.style.setProperty(
                `--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-${property}`,
                `${value}`
            );
            console.log(                `--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-${property}`,
                `${value}`)
            console.log( document.documentElement.style.getPropertyValue(`--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-${property}`))
        });
    };

    addTranslateVars = (styles) => {
        let value = {x: null, y: null, z: null}
        
        styles.forEach(({property, startValue, endValue}) => {
            if(property.includes("X")){
                value.x = startValue ? `${startValue}` : `${endValue}`;
            }else if(property.includes("Y")){
                value.y = startValue ? `${startValue}` : `${endValue}`;
            }else if(property.includes("Z")){
                value.z = startValue ? `${startValue}` : `${endValue}`;
            }else{
                console.warn("You are passing a style property to 'addTransitionVars' that does not contain a transition property.")
            }
        })

        if(!value.x){
            const oldPropValue = document.documentElement.style.getPropertyValue(`--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-translateX`)
        
            value.x = oldPropValue;
        }else if(!value.y){
            const oldPropValue = document.documentElement.style.getPropertyValue(`--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-translateY`)
            
            value.y = oldPropValue;
        }else if(!value.z){
            const oldPropValue = document.documentElement.style.getPropertyValue(`--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-translateZ`)
        
            value.z = oldPropValue;
        }

        document.documentElement.style.setProperty(`--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-translateX`, `${value.x}`);
        document.documentElement.style.setProperty(`--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-translateY`, `${value.y}`);
        document.documentElement.style.setProperty(`--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-translateZ`, `${value.z}`);
    }

    getCSSVars = () => {

    }

    removeCSSVars = () => {

    }



    addSheetRule = (name, rule) => {
        const styleSheet = document.styleSheets[0];
        const ruleAlrInSheet = Array.from(styleSheet.cssRules).some(r => r.selectorText === `.${name}`);

        if (!ruleAlrInSheet){
            try {
                styleSheet.insertRule(rule.trim(), styleSheet.cssRules.length);
            } catch(e) {
                console.warn(`Failed to insert rule for ${name}:`, e);
            }
        }
    }

    removeSheetRule = (name) => {
        const styleSheet = document.styleSheets[0];
        const ruleIndex = Array.from(styleSheet.cssRules).findIndex(r => r.selectorText === `.${name}`);

        if (ruleIndex !== -1) {
            try {
                styleSheet.deleteRule(ruleIndex);
            } catch(e) {
                console.warn(`Failed to delete rule for ${name}:`, e);
            }
        }
    }




    addInlineRule = (name) => {
        const el = document.querySelector(`[data-attribute-unique-id="${this.uID}"]`);
        const ruleAlrOnEl = el.classList.contains(name);

        if (!ruleAlrOnEl) el.classList.add(name);
        
    }

    removeInlineRule = (name) => {
        const el = document.querySelector(`[data-attribute-unique-id="${this.uID}"]`);
        const ruleOnEl = el.classList.contains(name);

        if (ruleOnEl) el.classList.remove(name);
    }


    getInlineClasses = () => {

    }


    getStyles(effect, initial){
        if(initial){
            return { 
                translateStyles: this.initialStyles.filter(({ property }) => property.includes("translate")),
                normalStyles: this.initialStyles.filter(({ property }) => !property.includes("translate"))
            }
        }else{
            return { 
                translateStyles: effect.styles.filter(({ property }) => property.includes("translate")),
                normalStyles: effect.styles.filter(({ property }) => !property.includes("translate"))
            }
        }
    }

    _registerTranslateProperties() {
        const name = this.uID.replace(/[^a-zA-Z0-9_-]/g, "_");
        
        ['translateX', 'translateY', 'translateZ'].forEach(axis => {
            try {
                CSS.registerProperty({
                    name: `--current-${name}-${axis}`,
                    syntax: '<length-percentage>',
                    inherits: true,
                    initialValue: '0px'
                });
            } catch(e) {} // already registered
        });
    }


    //CSS POWERED CLASS ANIMATION

    _initalizeClassStyles(){
        const name = this.uID.replace(/[^a-zA-Z0-9_-]/g, "_");
        
        let normalStylesF = [];
        let translateStylesF = [];

        if(this.classesGenerated) return;

        const { translateStyles, normalStyles } = this.getStyles(null, true);

        normalStylesF.push(
            ...normalStyles
        );

        translateStylesF.push(
            ...translateStyles.filter((styleObj) => styleObj.property.includes("translate"))
        )

        this.classesGenerated = true;

        normalStylesF = normalStylesF.filter(
            (s, i, arr) => arr.findIndex(x => x.property === s.property) === i
        );

        translateStylesF = translateStylesF.filter(
            (s, i, arr) => arr.findIndex(x => x.property === s.property) === i
        );

        
        this.addCSSVars(normalStylesF);
        this.addTranslateVars(translateStylesF);

        if (normalStylesF.length > 0 || translateStylesF.length > 0) {
            const rule = `
                .${name} {
                    translate: var(--current-${name}-translateX) var(--current-${name}-translateY) var(--current-${name}-translateZ);
                    ${ normalStylesF.length > 0 ? normalStylesF.map(({ property }) => `${property}: var(--current-${name}-${property});`).join("\n    ") : ""}
                }
            `;


            
            this.addSheetRule(`${name}`, rule);
            this.addInlineRule(`${name}`);
        }
    }

    updateTransition(ruleName, transitionValue) {
        const styleSheet = document.styleSheets[0];

        for (const rule of styleSheet.cssRules) {
            console.log(":here 1")
            console.log(rule.selectorText)
            console.log(ruleName)
            console.log(`.${ruleName}`)
            console.log(rule.selectorText === `.${ruleName}`)
            if (rule.selectorText === `.${ruleName}`.trim()) {
                console.log(":here 2")
                rule.style.setProperty("transition", transitionValue);

                console.log(transitionValue)

                console.log(rule) 
                return;
            }
        }
    }

    playClassAnimation(effect) {
        const name = this.uID.replace(/[^a-zA-Z0-9_-]/g, "_");
        const { translateStyles, normalStyles } = this.getStyles(effect);

        const duration = effect._duration + (typeof effect._duration === 'number' ? 'ms' : '');
        const delay = effect._delay + (typeof effect._delay === 'number' ? 'ms' : '');

        const easing = easingFunctionsCSS[effect._easingFunction];

        const translateTransitions = [];
        const allTransitions = [];
        
        translateStyles.map((styleObj) => {
            if(styleObj.property.includes("X")){
                translateTransitions.push(`--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-translateX ${duration} ${easing} ${delay}`)
            }else if(styleObj.property.includes("Y")){
                translateTransitions.push(`--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-translateY ${duration} ${easing} ${delay}`)
            }else if(styleObj.property.includes("Z")){
                translateTransitions.push(`--current-${this.uID.replace(/[^a-zA-Z0-9_-]/g, "_")}-translateZ ${duration} ${easing} ${delay}`)
            }
        })

        allTransitions.push(
            ...normalStyles.map(({ property }) => `${property} ${duration} ${easing} ${delay}`),
            ...translateTransitions
        );

        this.updateTransition(name, `${allTransitions.join(", ")}`)


        this.addTranslateVars(translateStyles);
        this.addCSSVars(normalStyles, true);
        
    }
    

    pauseClassAnimation(){

    }



    _manageClasses(){

    }

    // //INLINE STYLE CSS  ANIMATION
    // _initalizeInlineStyles(){
    //     const transformProps = [
    //         "scale", "scaleX", "scaleY", "scaleZ",
    //         "rotate", "rotateX", "rotateY", "rotateZ",
    //         "translateX", "translateY", "translateZ",
    //         "skewX", "skewY"
    //     ];

    //     let baseStyles = {};
    //     let transformValues = [];

    //     const styleSheet = document.styleSheets[0];
    //     const rule = Array.from(styleSheet.cssRules).find(r => r.selectorText === `.${(this.uID.replace(":", "") + "-General Styles").replace(/[^a-zA-Z0-9_-]/g, "_")}`);

    //     if (Array.isArray(this.initialStyles)) {
    //         this.initialStyles.forEach(({ property, startValue }) => {
    //             property = property.trim();

    //             if (rule && rule.style.getPropertyValue(property)) return;

    //             if (transformProps.includes(property)) {
    //                 transformValues.push(`${property}(${startValue})`);
    //             } else {
    //                 baseStyles[property] = startValue;
    //             }
    //         });

    //         if (transformValues.length > 0) {
    //             if (!rule || !rule.style.getPropertyValue("transform")) {
    //                 baseStyles.transform = transformValues.join(" ");
    //             }
    //         }
    //     }

    //     this.setState({styles: baseStyles})
    // }

    _manageProgress(progress, effect, modifyStartValue = true) {
        return;

        const easing = easingFunctionsJS[effect.easingFunction] || easingFunctionsJS.linear;

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

        effect.styles.forEach(({property, endValue}) => {
            let currentStartValue = this.getStartValue(property);

            // 🧠 For transform props, pull starting value from the parsed transform map
            if (transformProps.includes(property)) {
                if (!currentStartValue) {
                    currentStartValue = existingTransforms[property] || 0;

                    if(modifyStartValue){
                        effect.setStartValue(property, currentStartValue);
                    }
                }
            } else {
                if (!currentStartValue) {
                    currentStartValue = newStyles[property];

                    if(property === "width"){
                        const e = parseValue(endValue, property)
                        const s = parseValue(currentStartValue, property);

                        console.log(s, currentStartValue, property)

                        if( s.unit === "px" && e.unit === "%"){
                            const newValue = convertWidthUnit(e.number, s.unit, this.uID)
                            currentStartValue = newValue + "%"
                        }else if(s.unit === "%" && e.unit === "px"){
                            const newValue = convertWidthUnit(s.number, s.unit, this.uID)
                            currentStartValue = newValue + "px"
                        }
                    }else if(property === "height"){
                        const e = parseValue(endValue, property)
                        const s = parseValue(currentStartValue, property);

                        if( s.unit === "px" && e.unit === "%"){
                            const newValue = convertHeightUnit(e.number, s.unit, this.uID)
                            currentStartValue = newValue + "%"
                        }else if(s.unit === "%" && e.unit === "px"){
                            const newValue = convertHeightUnit(s.number, s.unit, this.uID)
                            currentStartValue = newValue + "px"
                        }
                    }

                    if(modifyStartValue){
                        effect.setStartValue(property, currentStartValue);
                    }
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


            if(progress === 1 && effect.loop === true){
                const originalStyle = effect.styles.find(s => s.property === property);
                if (originalStyle && originalStyle.startValue !== undefined) {
                    if (transformProps.includes(property)) {
                        updatedTransforms[property] = originalStyle.startValue;
                    } else {
                        newStyles[property] = originalStyle.startValue;
                    }
                }

                effect._progress = 0;
                effect.stop();
            }else if(!effect.active){
                effect.stop();
                if(modifyStartValue){
                    effect.setStartValue(property, undefined)
                }
            }
        });
        

        // 🌀 Rebuild transform string from updatedTransforms
        const transformString = Object.entries(updatedTransforms)
            .map(([key, value]) => `${key}(${value})`)
            .join(" ");

    
        newStyles.transform = transformString;

        this.setState({ styles: newStyles });
    }


    render(){
        const styles = this.state.styles;
        const className = this.state.className;

        return(
            <>
                {
                    React.cloneElement(this.props.children, {
                        style: {...this.children.props.styles, ...styles},
                        className: [this.children.props.className, className].filter(Boolean).join(" "),
                        'data-attribute-tag': "custom-animation-box",
                    })
                }
            </>
        )
    }
}
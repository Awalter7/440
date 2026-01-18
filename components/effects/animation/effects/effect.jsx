import { Component } from "react";

export default class Effect extends Component{
    constructor(props = {}) {
        super(props)

        if (props.styles) {
            props.styles.forEach(style => {
                if (!('startValue' in style)) {
                    style.startValue = undefined;
                }
            });
        }


        this._trigger = props.trigger ?? "";
        this._duration = props.duration ?? 1000;
        this._delay = props.delay ?? 0;
        this._easingFunction = props.easingFunction ?? "linear";
        this._styles = props.styles ?? [{}];

        this._id = props.id ?? null;

        // Internal state
        this._animationFrame = null;
        this._startTime = null;

        this._onProgressChange = () => {};
        this._stopOthers = () => {};
        this._setStyle = () => {};

        this._active = false;
        this._progress = 0;
        this._useReverse = false;

        this._uID = props.uID ?? "example-id"
    }


    setStartValue(property, value) {
        this._styles.forEach((style) => {
            if(style.property === property){
                style.startValue = value;
            }
        });
    }

    clearStartValues(){
        this._styles.forEach((style) => {
            style.startValue = undefined;
        })    
    }

    // trigger
    get trigger() {
        return this._trigger;
    }
    set trigger(value) {
        this._trigger = value;
    }

    // duration
    get duration() {
        return this._duration;
    }
    set duration(value) {
        this._duration = value;
    }

    // delay
    get delay() {
        return this._delay;
    }
    set delay(value) {
        this._delay = value;
    }

    // easingFunction
    get easingFunction() {
        return this._easingFunction;
    }
    set easingFunction(value) {
        this._easingFunction = value;
    }

    // styles
    get styles() {
        return this._styles;
    }
    set styles(value) {
        this._styles = value;
    }

    // id
    get id() {
        return this._id;
    }
    set id(value) {
        this._id = value;
    }

    get active() {
        return this._active;
    }
    set active(value) {
        this._active = value;
    }

    get uID() {
        return this._uID;
    }
    set uID(value) {
        this._uID = value;
    }

    // progress
    get progress() {
        return this._progress;
    }
    set progress(value) {
        this._progress = Math.min(Math.max(value, 0), 1); // Clamp between 0 and 1
    }

    get onProgressChange() {
        return this._onProgressChange;
    }

    set onProgressChange(callback) {
        if (typeof callback === "function") {
            this._onProgressChange = callback;
        } else {
            console.warn("onProgressChange must be a function");
        }
    }

    get stopOthers() {
        return this._stopOthers;
    }

    set stopOthers(callback) {
        if (typeof callback === "function") {
            this._stopOthers = callback;
        } else {
            console.warn("onProgressChange must be a function");
        }
    }

    get setStyle(){
        return this._setStyle();
    }

    set setStyle(callback){
        if(typeof callback === "function"){
            this._setStyle = callback;
        }else{
            console.warn("setStyle must be a function")
        }
    }

    // --- Animation control ---
    start() {
        if (this._active) return;

        this._stopOthers(this);
        this._active = true;
        const startProgress = this._progress;
        this._startTime = null;
        this._useReverse = false;

        const animate = (timestamp) => {
            if (!this._active) return; // Stop if animation stopped
            if (!this._startTime) this._startTime = timestamp;

            const elapsed = timestamp - this._startTime - this._delay;

            if (elapsed < 0) {
                this._animationFrame = requestAnimationFrame(animate);
                return;
            }

            // Calculate progress from startProgress to 1
            const progressDelta = elapsed / this._duration;
            const progress = Math.min(startProgress + progressDelta, 1);
            this._progress = progress;

            if (this._onProgressChange) {
                this._onProgressChange(progress, this);
            }

            if (progress < 1) {
                this._animationFrame = requestAnimationFrame(animate);
            } else {
                this._active = false;
            }
        };

        this._animationFrame = requestAnimationFrame(animate);
    }

    reverse() {
        this._stopOthers(this);
        this._active = true;
        const startProgress = this._progress;
        this._startTime = null;
        this._useReverse = true;

        const animate = (timestamp) => {
            if (!this._active) return;
            if (!this._startTime) this._startTime = timestamp;

            console.log("reversing");
            console.log(this._progress);

            const elapsed = timestamp - this._startTime - this._delay;

            if (elapsed < 0) { 
                requestAnimationFrame(animate); 
                return; 
            }

            // Scale the progress based on how far we need to go
            // If startProgress is 0.5, we only need half the duration to reach 0
            const progressDelta = elapsed / this._duration;
            const reverseProgress = Math.max(0, startProgress * (1 - elapsed / this._duration));
            this._progress = reverseProgress;

            if (this._onProgressChange) {
                this._onProgressChange(reverseProgress, this);
            }

            if (reverseProgress > 0) {
                this._animationFrame = requestAnimationFrame(animate);
            } else {
                this._active = false;
            }
        };

        this._animationFrame = requestAnimationFrame(animate);
    }

    stop() {
        if (this._animationFrame) {
            cancelAnimationFrame(this._animationFrame);
            this._animationFrame = null;
            this._active = false;
            this.clearStartValues();
        }
    }
}

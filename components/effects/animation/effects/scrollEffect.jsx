import Effect from "./effect";

export default class ScrollEffect extends Effect{
    constructor(props = {}){
        super(props)

        this._type = "scroll"
        this._scrollPercent = 0;
        this._scrollStart = props.scrollStart ?? 0;
        this._scrollEnd = props.scrollEnd ?? 0;
        this._pixelDelay = props.pixelDelay ?? 0;
        this._reversable = props.reversable ?? false;
        this._dir = props.dir ?? false
        this.stopOnEnd = false;
        this.duration = props.duration ?? 0;
        this.timed = props.timed ?? 0;

        this.lastY = 0;

        console.log(this._styles)
        console.log(this)
    

        // this.firstProgress = true;
        
        // this.reverseEndValue = null;

    }

    componentDidMount(){
        this.lastY = window.scrollY;
    }

    // type
    get type() {
        return this._type;
    }
    
    set type(value) {
        this._type = value;
    }

    get scrollStart(){
        return this._scrollStart;
    }   

    set scrollStart(value){
        this._scrollStart = value;
    }
    
    get scrollEnd(){
        return this._scrollEnd;
    }   

    set scrollEnd(value){
        this._scrollEnd = value;
    }

    componentDidMount() {
        window.addEventListener("scroll", this.handleScroll, { passive: true });
    }

    componentWillUnmount() {
        window.removeEventListener("scroll", this.handleScroll);
    }

    // pageHeight(){
    //     return Math.max(
    //         document.body.scrollHeight,
    //         document.documentElement.scrollHeight,
    //         document.body.offsetHeight,
    //         document.documentElement.offsetHeight,
    //         document.body.clientHeight,
    //         document.documentElement.clientHeight
    //     );
    // }

    handleEnter = () => {
        if (this._exitTimeout) {
        clearTimeout(this._exitTimeout);
        this._exitTimeout = null;
        }
        this.start();
    }

    handleLeave = () => {
        if (this._exitTimeout) {
            clearTimeout(this._exitTimeout);
        }

        if (this._active && this._fullCycle) {
            // Wait for forward animation to finish before reversing
            const waitTime = this._duration - (this._elapsed ?? 0);
            this._exitTimeout = setTimeout(() => {
                this.reverse();
            }, Math.max(0, waitTime));
        } else {
            // Reverse immediately (after exitDelay if set)
            this._exitTimeout = setTimeout(() => {
                this.reverse();
            }, this._exitDelay);
        }
    }

    handleScroll = () => {
        const y = window.scrollY;
        const delayedStart = this.scrollStart - 
            (this._pixelDelay * (this._dir === true 
                ? this._index 
                : this._length - this._index));
        const delayedEnd = this.scrollEnd;
        const range = delayedEnd - delayedStart;
        const scrollingUp = y < this.lastY;

        if (this.timed) {
            const crossedThreshold = scrollingUp
                ? (this.lastY > delayedStart && y <= delayedStart)  // crossed going up
                : (this.lastY < delayedStart && y >= delayedStart); // crossed going down

            if (crossedThreshold) {
                // _dir = true means "trigger on up", false means "trigger on down"
                if (scrollingUp !== this._dir) {
                    this.handleEnter();
                } else {
                    this.handleLeave();
                }
            }
        } else {
            if (y <= delayedStart) {
                this._progress = 0;
                this._onProgressChange(0, this, false);
            } else if (y >= delayedEnd) {
                this._progress = 1;
                this._onProgressChange(1, this, false);
            } else {
                this._progress = (y - delayedStart) / range;
                this._onProgressChange(this._progress, this, false);
            }
        }

        this.lastY = y;
    }
}
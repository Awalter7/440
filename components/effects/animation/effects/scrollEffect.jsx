import Effect from "./effect";

export default class ScrollEffect extends Effect{
    constructor(props = {}){
        super(props)

        this._type = "scroll"
        this._scrollPercent = 0;

        this._scrollStart = props.scrollStart ?? 0;
        this._scrollEnd = props.scrollEnd ?? 0;
        this._scrollUpStart = props.scrollUpStart ?? 0;

        
        this._downDelay = props.downDelay !== 0 ? props.downDelay : 1;
        this._upDelay = props.upDelay !== 0 ? props.upDelay : 1;

        this._downDuration = props.downDuration ?? 0;
        this._upDuration = props.upDuration ?? 0;

        this._reversable = props.reversable ?? false;
        this._dir = props.dir ?? false
        this.stopOnEnd = false;
        this.timed = props.timed ?? 0;

        this.lastY = 0;
    }

    componentDidMount(){
        this.lastY = window.scrollY;
    }

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

    handleEnter = () => {
        if (this._exitTimeout) {
            clearTimeout(this._exitTimeout);
            this._exitTimeout = null;
        }

        this._delay = this._downDelay;
        this._duration = this._downDuration;
        
        this.start();
    }

    handleLeave = () => {
        if (this._exitTimeout) {
            clearTimeout(this._exitTimeout);
        }

        this._delay = this._upDelay;
        this._duration = this._upDuration;

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

        const range = this.scrollEnd - this.scrollStart;
        const scrollingUp = y < this.lastY;

        if (this.timed) {
            const crossedThreshold = scrollingUp
                ? (this.lastY > this.scrollStart && y <= this.scrollStart)  // crossed going up
                : (this.lastY < this.scrollStart && y >= this.scrollStart); // crossed going down

                
            if (crossedThreshold) {


                if(!this._reversable && this._dir === scrollingUp){
                    this.handleEnter();
                }else if(this._reversable){
                    // _dir = true means "trigger on up", false means "trigger on down"
                    if (scrollingUp !== this._dir) {
                        this.handleLeave();
                    } else {
                        this.handleEnter();
                    }
                }
            }
        } else {
            if (y <= this.scrollStart) {
                this._progress = 0;
                this._onProgressChange(0, this, false);
            } else if (y >= this.scrollEnd) {
                this._progress = 1;
                this._onProgressChange(1, this, false);
            } else {
                this._progress = (y - this.scrollStart) / range;
                this._onProgressChange(this._progress, this, false);
            }
        }

        this.lastY = y;
    }
}
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
    

        // this.firstProgress = true;
        
        // this.reverseEndValue = null;

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

    handleScroll = (event) => {
        const y = window.scrollY;
        const delayedStart = this.scrollStart - (this._pixelDelay * (this.dir === true ? this._index : this._length - this._index));
        const delayedEnd = this.scrollEnd
        const range = delayedEnd - delayedStart;


        if (y <= delayedStart) {
            this._progress = 0;
        } else if (y >= delayedEnd) {
            this._progress = 1;
        } else {
            this._progress = (y - delayedStart) / range;
            this._onProgressChange(this._progress, this, false);
        }
    }
}
import Effect from "./effect";

export default class ScrollEffect extends Effect{
    constructor(props = {}){
        super(props)

        this._type = "scroll"
        this._scrollPercent = 0;
        this._scrollStart = props.scrollStart ?? 0;
        this._scrollEnd = props.scrollEnd ?? 0;
        this._reversable = props.reversable ?? false;
        this.stopOnEnd = false;
        
        this.lastY = 0;

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
        const range = this.scrollEnd - this.scrollStart;

        if (y <= this.scrollStart) {
            this._progress = 0;
        } else if (y >= this.scrollEnd) {
            this._progress = 1;
        } else {
            this.firstProgress = false;
            this.reverseEndValues = this.styles

            this._progress = (y - this.scrollStart) / range;
            this._onProgressChange(this._progress, this, false);
        }
    }
}
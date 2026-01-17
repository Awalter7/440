import Effect from "./effect";

export default class ScrollEffect extends Effect{
    constructor(props = {}){
        super(props)

        this._type = "scroll"
        this._scrollPercent = 0;
        this._scrollStart = props.scrollStart ?? 0;
        this._scrollEnd = props.scrollEnd ?? 0;
        this.stopOnEnd = false;

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
        let y = window.scrollY;

        if(y < this.scrollStart){
            this.progress = 0
        }else if(y > this.scrollStart && y < this.scrollEnd){
            this.progress = ((window.scrollY - this.scrollStart) / this.scrollEnd)
        }else if(y > this.scrollEnd){
            this.progress = 1
        }

        console.log(this._progress)

        this._onProgressChange(this.progress, this)
    }
}
import Effect from "./effect";

export default class ClickEffect extends Effect{
    constructor(props = {}){
        super(props)

        this._type = "click";
    }

    // type
    get type() {
        return this._type;
    }
    
    set type(value) {
        this._type = value;
    }

    componentDidMount() {
        const element = document.getElementById(this._trigger);

        if (element) {
            element.addEventListener('click', this.handleClick);
        }
    }

    componentWillUnmount() {
        const element = document.getElementById(this._trigger);

        if (element) {
            element.removeEventListener('click', this.handleClick);
        }
    }

    handleClick = (event) => {
        this.start();
    }
}
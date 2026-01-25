import Effect from "./effect";

export default class DistanceEffect extends Effect {
    constructor(props = {}) {
        super(props);

        this._type = "distance";
        this.stopOnEnd = false;

        // distance from top of viewport (px)
        this._distance = props.distance ?? 100;

        this._hasTriggered = false;
    }

    get type() {
        return this._type;
    }

    componentDidMount() {
        window.addEventListener("scroll", this.handleScroll, { passive: true });
        this.handleScroll(); // run once in case it's already in position
    }

    componentWillUnmount() {
        window.removeEventListener("scroll", this.handleScroll);
    }

    handleScroll = () => {
        if (this._hasTriggered && this.stopOnEnd) return;

        const element = document.getElementById(this._trigger);
        if (!element) return;

        const rect = element.getBoundingClientRect();

        // trigger when element is at or above target distance
        if (rect.top <= this._distance) {
            this.start();
            this._hasTriggered = true;
        }
    };
}
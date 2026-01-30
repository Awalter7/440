import Effect from "./effect";

export default class DistanceEffect extends Effect {
    constructor(props = {}) {
        super(props);

        this._type = "distance";
        this.stopOnEnd = false;

        // Distance in pixels from top of viewport
        this._distance = props.distance ?? 100;

        this._hasTriggered = false;
    }

    get type() {
        return this._type;
    }

    componentDidMount() {
        window.addEventListener("scroll", this.handleScroll, { passive: true });
        this.handleScroll(); // run immediately in case it's already in range
    }

    componentWillUnmount() {
        window.removeEventListener("scroll", this.handleScroll);
    }

    getTargetElement() {
        return document.querySelector(
            `[data-attribute-unique-id="${this._trigger}"]`
        );
    }

    handleScroll = () => {
        if (this._hasTriggered && this.stopOnEnd) return;

        const element = this.getTargetElement();
        if (!element) return;

        const rect = element.getBoundingClientRect();

        if (rect.top <= this._distance) {
            this.start();
            this._hasTriggered = true;
        }
    };
}

import Effect from "./effect";

export default class HoverEffect extends Effect {
  constructor(props = {}) {
    super(props);

    this._type = "hover";
    this.stopOnEnd = true;
  }

  get type() {
    return this._type;
  }

  set type(value) {
    this._type = value;
  }

  componentDidMount() {
    const element = document.getElementById(this._trigger);
    if (element) {
      // Use mouseenter and mouseleave for hover detection
      element.addEventListener('mouseenter', this.handleHoverEnter);
      element.addEventListener('mouseleave', this.handleHoverLeave);
    }
  }

  componentWillUnmount() {
    const element = document.getElementById(this._trigger);
    if (element) {
      element.removeEventListener('mouseenter', this.handleHoverEnter);
      element.removeEventListener('mouseleave', this.handleHoverLeave);
    }
  }

  handleHoverEnter = () => {
    this.start();
  }

  handleHoverLeave = () => {
    // If you want the effect to stop when the mouse leaves:
    this.reverse();
  }
}

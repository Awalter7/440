import Effect from "./effect";

export default class HoverEffect extends Effect {
  constructor(props = {}) {
    super(props);

    this._type = "hover";
    this._exitDelay = props.exitDelay ?? 0
    this._fullCycle = props.fullCycle ?? true;
    this.stopOnEnd = true;
  }

  get type() {
    return this._type;
  }

  set type(value) {
    this._type = value;
  }

  componentDidMount() {
    this._attachWhenReady();
  }

  _attachWhenReady = () => {
    if (!this._uID || this._uID === "") {
      // Retry on next frame
      this._raf = requestAnimationFrame(this._attachWhenReady);
      return;
    }

    let element;

    if (this._trigger !== "") {
      element = document.getElementById(this._trigger ?? this._uID);
    } else {
      element = document.querySelector(
        `[data-attribute-unique-id="${this._uID}"]`
      );
    }

    if (element) {
      this._element = element; // store reference for cleanup
      element.addEventListener("mouseenter", this.handleHoverEnter);
      element.addEventListener("mouseleave", this.handleHoverLeave);
    }
  };

  handleHoverEnter = () => {
    if (this._exitTimeout) {
      clearTimeout(this._exitTimeout);
      this._exitTimeout = null;
    }
    this.start();
  }

  handleHoverLeave = () => {
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
}

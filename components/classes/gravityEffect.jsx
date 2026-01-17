import Effect from "./effect";

export default class ScrollEffect extends Effect{
    constructor(props = {}) {
        super(props);

        this._type = "gravity"
        this.state = {
            y: props.startY || 0
        };

        this.velocity = props.startVelocity || 0;
        this.lastTime = null;
        this.raf = null;
    }

  componentDidMount() {
    this.raf = requestAnimationFrame(this.update);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
  }

  update = (time) => {
    if (!this.lastTime) this.lastTime = time;

    const delta = (time - this.lastTime) / 1000; // seconds
    this.lastTime = time;

    const {
      gravity = 9.81,
      mass = 1,
      floor = 500,
      bounce = 0.6,
      scale = 100
    } = this.props;

    // F = m * g → a = F / m → g
    const acceleration = gravity;

    // Integrate velocity
    this.velocity += acceleration * delta;

    // Integrate position
    let nextY = this.state.y + this.velocity * delta * scale;

    // Floor collision
    if (nextY >= floor) {
      nextY = floor;
      this.velocity *= -bounce;
    }

    this.setState({ y: nextY });
    this.raf = requestAnimationFrame(this.update);
  };
}
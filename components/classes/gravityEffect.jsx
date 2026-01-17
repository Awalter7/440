import Effect from "./effect";

export default class ScrollEffect extends Effect {
  constructor(props = {}) {
    super(props);

    // Position
    this.x = props.startX || 0;
    this.y = props.startY || 0;

    // Velocity
    this.vx = props.startVX || 0;
    this.vy = props.startVY || 0;

    // Rotation (degrees)
    this.rotation = props.startRotation || 0;
    this.angularVelocity = props.startAngularVelocity || 0;

    this.lastTime = null;
    this.raf = null;

    // Container dimensions
    this.containerRect = null;
    this.elementRect = null;
  }

  componentDidMount() {
    // Get element and container dimensions
    // const el = this._el; // assuming Effect stores ref in this._el
    // if (!el) return;

    // this.elementRect = el.getBoundingClientRect();
    // if (el.parentElement) {
    //   this.containerRect = el.parentElement.getBoundingClientRect();
    // }

    // console.log

    // this.raf = requestAnimationFrame(this.update);
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.raf);
  }

  update = (time) => {
    if (!this.lastTime) this.lastTime = time;
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    const {
      gravity = 1200,
      mass = 1,
      bounce = 0.6,
      friction = 0.98,
      airDrag = 0.999,
      angularDrag = 0.98,
      torqueOnBounce = 0.15
    } = this.props;

    if (!this.containerRect || !this.elementRect) {
      this.raf = requestAnimationFrame(this.update);
      return;
    }

    const elW = this.elementRect.width;
    const elH = this.elementRect.height;

    const leftWall = 0;
    const topWall = 0;
    const rightWall = this.containerRect.width - elW;
    const floor = this.containerRect.height - elH;

    /* -----------------------------
     * LINEAR PHYSICS
     * ----------------------------- */

    const ay = gravity / mass;

    this.vy += ay * delta;

    this.vx *= airDrag;
    this.vy *= airDrag;

    this.x += this.vx * delta;
    this.y += this.vy * delta;

    /* -----------------------------
     * COLLISIONS WITH CONTAINER
     * ----------------------------- */

    // Floor / bottom
    if (this.y >= floor) {
      this.y = floor;
      this.vy *= -bounce;
      this.vx *= friction;
      this.angularVelocity += this.vx * torqueOnBounce;
    }

    // Ceiling / top
    if (this.y <= topWall) {
      this.y = topWall;
      this.vy *= -bounce;
      this.vx *= friction;
      this.angularVelocity -= this.vx * torqueOnBounce;
    }

    // Right wall
    if (this.x >= rightWall) {
      this.x = rightWall;
      this.vx *= -bounce;
      this.angularVelocity -= this.vy * torqueOnBounce;
    }

    // Left wall
    if (this.x <= leftWall) {
      this.x = leftWall;
      this.vx *= -bounce;
      this.angularVelocity += this.vy * torqueOnBounce;
    }

    /* -----------------------------
     * ROTATIONAL PHYSICS
     * ----------------------------- */

    this.rotation += this.angularVelocity * delta;
    this.angularVelocity *= angularDrag;

    /* -----------------------------
     * RENDER
     * ----------------------------- */

    this._setStyle(
      "transform",
      `
        translate3d(${this.x}px, ${this.y}px, 0)
        rotate(${this.rotation}deg)
      `
    );

    this.raf = requestAnimationFrame(this.update);
  };
}

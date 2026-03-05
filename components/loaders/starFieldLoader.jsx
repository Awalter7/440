import { useEffect, useRef, useState } from "react";

const NUM_STARS   = 500;
const WARP_ACC    = 0.18;   // warp speed acceleration
const LERP_SPEED  = 0.04;   // how quickly acceleration ramps up
const DAMPING     = 0.88;   // velocity multiplier per frame when decelerating (< 1 = friction)

export default function StarFieldLoader({ warp = false, className }) {
  // Internal toggle — lets you demo standalone; driven by `warp` prop if passed
  const [warpActive, setWarpActive] = useState(warp);
  const canvasRef = useRef(null);
  const warpRef   = useRef(warpActive); // mutable ref readable inside the animation loop

  useEffect(() => { warpRef.current = warpActive; }, [warpActive]);
  useEffect(() => { setWarpActive(warp); }, [warp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    const W = canvas.width;
    const H = canvas.height;

    const random  = (max) => Math.random() * max;
    const onScreen = (x, y) => x >= 0 && x <= W && y >= 0 && y <= H;
    const lerp    = (a, b, t) => a + (b - a) * t;

    class Star {
      constructor(x, y) {
        this.x     = x;  this.y     = y;
        this.prevX = x;  this.prevY = y;
        this.vx    = 0;  this.vy    = 0;
        this.ang   = Math.atan2(y - H / 2, x - W / 2);
      }

      isActive() { return onScreen(this.prevX, this.prevY); }

      update(acc, damping) {
        if (damping) {
          this.vx *= DAMPING;
          this.vy *= DAMPING;
        } else {
          this.vx += Math.cos(this.ang) * acc;
          this.vy += Math.sin(this.ang) * acc;
        }
        this.prevX = this.x; this.prevY = this.y;
        const speed = Math.hypot(this.vx, this.vy);
        if (speed > 0.05) {
          this.x += this.vx;
          this.y += this.vy;
        } else {
          // Fully stopped — freeze as a static point
          this.vx = 0; this.vy = 0;
          this.prevX = this.x; this.prevY = this.y;
        }
      }

      draw() {
        const speed = Math.hypot(this.vx, this.vy);
        if (speed < 0.05) {
          // Fully stopped — draw as a small static star dot
          ctx.fillStyle = "rgba(200, 220, 255, 0.8)";
          ctx.beginPath();
          ctx.arc(this.x, this.y, 1, 0, Math.PI * 2);
          ctx.fill();
          return;
        }
        const alpha = Math.min(1, speed * 5);
        const blue  = Math.floor(Math.min(255, 180 + speed * 400));
        ctx.strokeStyle = `rgba(200, 220, ${blue}, ${alpha})`;
        ctx.lineWidth   = Math.min(2.5, speed * 0.6);
        ctx.beginPath();
        ctx.moveTo(this.prevX, this.prevY);
        ctx.lineTo(this.x,     this.y);
        ctx.stroke();
      }
    }

    let stars      = Array.from({ length: NUM_STARS }, () => new Star(random(W), random(H)));
    let currentAcc = 0;
    let animId;

    const loop = () => {
      const isWarping = warpRef.current;

      // Trail length: long at warp, quick fade when stopped
      const t = Math.min(1, currentAcc / WARP_ACC);
      ctx.fillStyle = `rgba(0, 0, 0, ${lerp(0.6, 0.12, t)})`;
      ctx.fillRect(0, 0, W, H);

      if (isWarping) {
        currentAcc = lerp(currentAcc, WARP_ACC, LERP_SPEED);
      } else {
        currentAcc = lerp(currentAcc, 0, LERP_SPEED);
      }

      const damping = !isWarping;

      stars = stars.filter((star) => {
        star.update(currentAcc, damping);
        star.draw();
        return onScreen(star.x, star.y);
      });

      // Only spawn new stars while warping
      if (isWarping) {
        while (stars.length < NUM_STARS) {
          stars.push(new Star(
            W / 2 + (Math.random() - 0.5) * 20,
            H / 2 + (Math.random() - 0.5) * 20,
          ));
        }
      }

      animId = requestAnimationFrame(loop);
    };

    loop();
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className={className}>
      <canvas ref={canvasRef} width={600} height={600} style={{ display: "block" }} />
    </div>
  );
}

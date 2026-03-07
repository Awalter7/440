import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";

const NUM_STARS  = 500;

// Stellar classification by color temperature and rarity
// Rarity weights are approximate inverse of real-world frequency
// M-type is most common (~76%), O-type is rarest (~0.00003%)
const STELLAR_CLASSES = [
  // { type, kelvin range, RGB color, weight (higher = more common) }
  // Colors are white-blended for brightness: lerped ~60% toward (255,255,255)
  { type: "O", kelvinMin: 30000, kelvinMax: 50000, r: 220, g: 228, b: 255, weight: 0.00003 }, // Blue-white
  { type: "B", kelvinMin: 10000, kelvinMax: 30000, r: 222, g: 230, b: 255, weight: 0.13   }, // Blue-white
  { type: "A", kelvinMin:  7500, kelvinMax: 10000, r: 235, g: 240, b: 255, weight: 0.6    }, // Near-white
  { type: "F", kelvinMin:  6000, kelvinMax:  7500, r: 252, g: 251, b: 255, weight: 3      }, // White with faint yellow
  { type: "G", kelvinMin:  5200, kelvinMax:  6000, r: 255, g: 252, b: 235, weight: 7      }, // Warm white
  { type: "K", kelvinMin:  3700, kelvinMax:  5200, r: 255, g: 235, b: 210, weight: 12     }, // Pale orange-white
  { type: "M", kelvinMin:  2400, kelvinMax:  3700, r: 255, g: 228, b: 190, weight: 76     }, // Warm white-orange
];

// Precompute cumulative weights for weighted random selection
const totalWeight = STELLAR_CLASSES.reduce((sum, c) => sum + c.weight, 0);
const cumulativeWeights = [];
let cumSum = 0;
for (const cls of STELLAR_CLASSES) {
  cumSum += cls.weight;
  cumulativeWeights.push(cumSum / totalWeight);
}

function pickStellarClass() {
  const r = Math.random();
  for (let i = 0; i < cumulativeWeights.length; i++) {
    if (r <= cumulativeWeights[i]) return STELLAR_CLASSES[i];
  }
  return STELLAR_CLASSES[STELLAR_CLASSES.length - 1];
}

export default function StarFieldLoader({
  speedVal = 0.01,
  lerpVal = .05,
  className,
}) {
    const { progress } = useProgress();

    const speedRef = useRef({speed: speedVal})
    const lerpRef = useRef({lerp: lerpVal})
    const canvasRef    = useRef(null);
    const animIdRef = useRef(null);


    useEffect(() => {
        if(progress !== 100) return;

        const timer = setTimeout(() => {
            // setWarpActive(true);
            speedRef.current.speed = .09
        }, 4000);

        const timer1 = setTimeout(() => {
            // setWarpActive(true);
            speedRef.current.speed = .09
        }, 4000);

        return () => clearTimeout(timer);
        return () => clearTimeout(timer2);
    }, [progress]);

    
    useEffect(() => {
        if(progress !== 100) return;


        const timer = setTimeout(() => {
            // setWarpActive(true);
            speedRef.current.speed = .0001;
            speedRef.current.lerp = 100;
        }, 5000);


        return () => clearTimeout(timer);
    }, [progress]);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx    = canvas.getContext("2d");

        const setSize = () => {
            canvas.width  = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        setSize();
        window.addEventListener("resize", setSize);

        const random   = (max) => Math.random() * max;
        const onScreen = (x, y) => x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height;
        const lerp     = (a, b, t) => a + (b - a) * t;

        class Star {
            constructor(x, y) {
                this.pos     = { x, y };
                this.prevPos = { x, y };

                this.vel = { x: 0, y: 0 };

                this.ang = Math.atan2(
                    y - canvas.height / 2,
                    x - canvas.width / 2
                );

                this.z3d  = 0;
                this.size = Math.random() * 1.5 + 0.5;
                this.alpha = 0;

                // Assign stellar classification by rarity-weighted random
                const cls = pickStellarClass();
                this.r = cls.r;
                this.g = cls.g;
                this.b = cls.b;

                // O and B type stars are brighter/larger
                if (cls.type === "O") {
                    this.size = Math.random() * 2.5 + 1.5;
                } else if (cls.type === "B") {
                    this.size = Math.random() * 2.0 + 1.0;
                }
            }

            update(acc, shouldDamp) {
                this.vel.x += Math.cos(this.ang) * acc;
                this.vel.y += Math.sin(this.ang) * acc;


                this.prevPos.x = this.pos.x;
                this.prevPos.y = this.pos.y;

                this.pos.x += this.vel.x;
                this.pos.y += this.vel.y;

                const speed = Math.sqrt(this.vel.x ** 2 + this.vel.y ** 2);
                this.z3d += speed;

                this.alpha = Math.min(1, this.alpha + 0.05);
            }

            map(value, inMin, inMax, outMin, outMax) {
                return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
            }

            draw() {
                ctx.beginPath();
                ctx.moveTo(this.prevPos.x, this.prevPos.y);
                ctx.lineTo(this.pos.x, this.pos.y);

                const mag   = Math.hypot(this.vel.x, this.vel.y);
                const alpha = this.map(mag, 0, 3, 0, 1);

                ctx.strokeStyle = `rgba(${this.r},${this.g},${this.b},${alpha})`;
                ctx.lineWidth   = this.size * 1.5;
                ctx.lineCap     = "round";

                ctx.stroke();
            }
        }

        let stars      = Array.from({ length: NUM_STARS }, () => new Star(random(canvas.width), random(canvas.height)));
        let currentAcc = speedRef.current.speed;
        let animId;

        let displayedTargetAcc =  speedRef.current.speed;

        const loop = () => {


            const W = canvas.width;
            const H = canvas.height;


            const targetAcc =  speedRef.current.speed;


            ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
            ctx.fillRect(0, 0, W, H);

            displayedTargetAcc = lerp(displayedTargetAcc, targetAcc, 0.005);
            currentAcc = lerp(currentAcc, targetAcc, lerpRef.current.lerp);

            if(currentAcc < 0.0001){
                cancelAnimationFrame(animIdRef.current);
            }

            console.log(currentAcc)

            stars = stars.filter((star) => {
                star.update(currentAcc);
                star.draw();
                return onScreen(star.pos.x, star.pos.y);
            });

            // if (isWarping || isMoving) {
                while (stars.length < NUM_STARS) {
                    stars.push(
                        new Star(
                            W / 2 + (Math.random() - 0.5) * 2000,
                            H / 2 + (Math.random() - 0.5) * 1000
                        )
                    );
                }
            // }

            animIdRef.current = requestAnimationFrame(loop);
        };

        loop();

        return () => {
            cancelAnimationFrame(animId);
            window.removeEventListener("resize", setSize);
        };
    }, []);

    return (
        <div
        className={className}
        style={{
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            backgroundColor: "black"
        }}
        >
        <canvas
            ref={canvasRef}
            style={{ 
                display: "block", 
                width: "100%", 
                height: "100%",
                opacity: 1,
                transitionDelay: 5,
                transition: "opacity 2s ease-in",
            }}
        />
        </div>
    );
}
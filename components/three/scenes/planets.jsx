"use client"
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import PlanetGroup from "../objects/planets"
import { ComposerProvider } from "../contexts/composerContext";
import { useEffect, useRef } from "react";
import { useScroll } from "framer-motion";

// ─── Momentum scroll config ───────────────────────────────────────────────────
const FRICTION = 0.96;
const MIN_VELOCITY = 0.1;
const SCROLL_MULTIPLIER = 3.5;
const OPACITY_FULL_AT = 1;

export function useMomentumScroll() {
  useEffect(() => {
    let velocity = 0;
    let rafId;
    let isWheeling = false;
    let wheelTimeout;

    const onWheel = (e) => {
      e.preventDefault();
      isWheeling = true;
      velocity += e.deltaY * SCROLL_MULTIPLIER;
      clearTimeout(wheelTimeout);
      wheelTimeout = setTimeout(() => { isWheeling = false; }, 50);
    };

    const loop = () => {
      if (Math.abs(velocity) > MIN_VELOCITY) {
        window.scrollBy(0, velocity);
        if (!isWheeling) velocity *= FRICTION;
      } else if (!isWheeling) {
        velocity = 0;
      }
      rafId = requestAnimationFrame(loop);
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(rafId);
      clearTimeout(wheelTimeout);
    };
  }, []);
}

// ─── Intro animation config ───────────────────────────────────────────────────
const INTRO_START_Z = -2050;
const INTRO_END_Z = -150;
const INTRO_START_Y = 200;
const INTRO_END_Y = 18;
const INTRO_DURATION_MS = 4000; // duration of intro animation in ms
const INTRO_DELAY_MS = 3000; // ← add this



// easeInOutExpo
function easeInOutExpo(t) {
  if (t === 0) return 0;
  if (t === 1) return 1;
  if (t < 0.5) return Math.pow(2, 20 * t - 10) / 2;
  return (2 - Math.pow(2, -20 * t + 10)) / 2;
}

// ─── Camera animation config ──────────────────────────────────────────────────
const CAMERA_START_Z = -150;
const CAMERA_START_Y = 18;
const CAMERA_PEAK_Z = -90;
const CAMERA_PEAK_Y = 20;
const CAMERA_END_Z = -90;
const CAMERA_END_Y = 22;
const ANIM_TOTAL = 2000;
const ANIM_BALANCE = 0.30;
const ANIM_DELAY_START = 0;

// ─── Animation speed config ───────────────────────────────────────────────────
const SCROLL_TO_ANIM_RATIO = 1.0;
const MAX_STEP_PER_FRAME = 40;
const DEBT_DRAIN_SPEED = 20;
const LERP = 0.12;

// ─── Evaluate camera position for a given progress value (0 → ANIM_TOTAL) ────
function getCameraPosition(scrollProgress) {
  const phase1End = ANIM_DELAY_START + ANIM_TOTAL * ANIM_BALANCE;
  const phase2End = ANIM_DELAY_START + ANIM_TOTAL;
  const p = Math.max(ANIM_DELAY_START, Math.min(phase2End, scrollProgress));

  if (p <= phase1End) {
    const t = (p - ANIM_DELAY_START) / (phase1End - ANIM_DELAY_START);
    return {
      z: CAMERA_START_Z + t * (CAMERA_PEAK_Z - CAMERA_START_Z),
      y: CAMERA_START_Y + t * (CAMERA_PEAK_Y - CAMERA_START_Y),
    };
  } else {
    const t = (p - phase1End) / (phase2End - phase1End);
    const eased = t * t;
    return {
      z: CAMERA_PEAK_Z + eased * (CAMERA_END_Z - CAMERA_PEAK_Z),
      y: CAMERA_PEAK_Y + eased * (CAMERA_END_Y - CAMERA_PEAK_Y),
    };
  }
}

// ─── ScrollCamera ─────────────────────────────────────────────────────────────
function ScrollCamera({canvasRef }) {
  const { camera } = useThree();
  const { scrollY } = useScroll();
  const prevScrollY = useRef(ANIM_DELAY_START);
  const animProgress = useRef(ANIM_DELAY_START);
  const displayProgress = useRef(ANIM_DELAY_START);

  // Intro animation state
  const introStartTime = useRef(null);
  const introComplete = useRef(false);

  useFrame(({ clock }) => {
    // ── Intro animation (runs once on load) ──────────────────────────────────
    if (!introComplete.current) {

        if (introStartTime.current === null) {
            introStartTime.current = clock.getElapsedTime() * 1000;
        }

        const elapsed = clock.getElapsedTime() * 1000 - introStartTime.current;
        const delayedElapsed = Math.max(0, elapsed - INTRO_DELAY_MS); // ← subtract delay
        const t = Math.min(delayedElapsed / INTRO_DURATION_MS, 1);
        const eased = easeInOutExpo(t);

        camera.position.z = INTRO_START_Z + eased * (INTRO_END_Z - INTRO_START_Z);
        camera.position.y = INTRO_START_Y + eased * (INTRO_END_Y - INTRO_START_Y);

        if (elapsed >= INTRO_DURATION_MS + INTRO_DELAY_MS) { // ← check total time
            introComplete.current = true;
            camera.position.z = INTRO_END_Z;
        }

              // ── Fade in: 0 → 1 over the first OPACITY_FULL_AT fraction of the intro ──
        const opacity = Math.min(t / OPACITY_FULL_AT, 1);
        if (canvasRef.current) {
            canvasRef.current.style.opacity = opacity;
        }

        if (elapsed >= INTRO_DURATION_MS + INTRO_DELAY_MS) {
            introComplete.current = true;
            camera.position.z = INTRO_END_Z;
            if (canvasRef.current) canvasRef.current.style.opacity = 1;
        }

        return; // skip scroll logic during intro
    }

    // ── Scroll-driven animation ───────────────────────────────────────────────
    const rawScroll = scrollY.get();
    const scrollDelta = rawScroll - prevScrollY.current;
    prevScrollY.current = rawScroll;

    const velocityStep = scrollDelta * SCROLL_TO_ANIM_RATIO;
    const cappedStep = Math.sign(velocityStep) * Math.min(Math.abs(velocityStep), MAX_STEP_PER_FRAME);

    const debt = rawScroll - animProgress.current;
    const debtStep = Math.sign(debt) * Math.min(Math.abs(debt), DEBT_DRAIN_SPEED);

    let step;
    if (Math.sign(debt) !== Math.sign(velocityStep) && Math.abs(velocityStep) > 0.5) {
      step = cappedStep;
    } else {
      step = Math.sign(debt) * Math.max(Math.abs(cappedStep), Math.abs(debtStep));
    }

    animProgress.current = Math.max(
      ANIM_DELAY_START,
      Math.min(ANIM_DELAY_START + ANIM_TOTAL, animProgress.current + step)
    );

    displayProgress.current += (animProgress.current - displayProgress.current) * LERP;

    const { z, y } = getCameraPosition(displayProgress.current);
    camera.position.z = z;
    camera.position.y = y;
  });

  return null;
}

export function Planets({ className, id }) {
    const canvasRef = useRef(null);   // ← new ref

  // useMomentumScroll();
    return (
        <Canvas
            ref={canvasRef} 
            shadows
            camera={{
                fov: 20,
                position: [-5, CAMERA_START_Y, INTRO_START_Z], // ← starts at -550
                rotation: [-3.0332631463700075, 0, -Math.PI],
                near: 10,
                far: 10000,
            }}
            gl={{ antialias: true }}
            className={className}
            id={id}
            frameloop="always"
            style={{
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                zIndex: "10",
                backgroundColor: "transparent",

        }}
        >
        <ComposerProvider>
            <PlanetGroup />
        </ComposerProvider>
        <ScrollCamera canvasRef={canvasRef}/>
        </Canvas>
    );
}

export default Planets;
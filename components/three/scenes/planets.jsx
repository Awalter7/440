"use client"
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import PlanetGroup from "../objects/planets"
import { ComposerProvider } from "../contexts/composerContext";
import { useEffect, useRef } from "react";
import { useScroll } from "framer-motion";

// ─── Momentum scroll config ────────────────────────────────────────────────────
const FRICTION          = 0.96;
const MIN_VELOCITY      = 0.1;
const SCROLL_MULTIPLIER = 3.5;

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
            wheelTimeout = setTimeout(() => {
                isWheeling = false;
            }, 50);
        };

        const loop = () => {
            if (Math.abs(velocity) > MIN_VELOCITY) {
                window.scrollBy(0, velocity);
                if (!isWheeling) {
                    velocity *= FRICTION;
                }
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

// ─── Camera animation config ───────────────────────────────────────────────────
const CAMERA_START_Z   = -150;
const CAMERA_START_Y   = 18;
const CAMERA_PEAK_Z    = -90;
const CAMERA_PEAK_Y    = 20;
const CAMERA_END_Z     = -90;
const CAMERA_END_Y     = 22;

const ANIM_TOTAL       = 2000;
const ANIM_BALANCE     = 0.30;
const ANIM_DELAY_START = 0;

// ─── Animation speed config ────────────────────────────────────────────────────
// 1:1 ratio between scroll delta and animation progress per frame.
const SCROLL_TO_ANIM_RATIO = 1.0;

// Hard cap per frame — prevents single-frame jumps from fast trackpads/wheels.
// At 60fps this allows covering the full 2000-unit animation in ~3 seconds of
// sustained fast scrolling, which feels responsive without ever skipping.
const MAX_STEP_PER_FRAME = 40;

// When animProgress lags behind scrollY (debt from capping), drain it at this
// speed per frame so a quick flick still plays through the full animation.
const DEBT_DRAIN_SPEED = 20;

// Display smoothing — lerp factor toward the capped playhead.
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
//
// Two-layer system:
//
//  1. animProgress  — the internal playhead. Moves proportional to scroll
//     velocity but capped at MAX_STEP_PER_FRAME. Any remaining "debt" between
//     scrollY and animProgress drains at DEBT_DRAIN_SPEED so fast flicks still
//     play the full animation through.
//
//  2. displayProgress — lerps toward animProgress each frame for visual
//     smoothness without adding extra lag to the playhead itself.

function ScrollCamera() {
    const { camera } = useThree();
    const { scrollY } = useScroll();

    const prevScrollY     = useRef(ANIM_DELAY_START);
    const animProgress    = useRef(ANIM_DELAY_START);
    const displayProgress = useRef(ANIM_DELAY_START);

    useFrame(() => {
        const rawScroll = scrollY.get();

        // Scroll velocity this frame
        const scrollDelta = rawScroll - prevScrollY.current;
        prevScrollY.current = rawScroll;

        // Velocity-proportional step, hard-capped to prevent single-frame skips
        const velocityStep = scrollDelta * SCROLL_TO_ANIM_RATIO;
        const cappedStep = Math.sign(velocityStep) * Math.min(Math.abs(velocityStep), MAX_STEP_PER_FRAME);

        // Debt: how far the playhead still needs to travel to "catch up" to scrollY
        const debt = rawScroll - animProgress.current;
        const debtStep = Math.sign(debt) * Math.min(Math.abs(debt), DEBT_DRAIN_SPEED);

        // Advance by whichever is greater: live velocity or debt drain.
        // This makes fast scrolling feel fast, while ensuring lingering debt
        // from a quick flick still drains (plays through) after scrolling stops.
        let step;
        if (Math.sign(debt) !== Math.sign(velocityStep) && Math.abs(velocityStep) > 0.5) {
            // User reversed direction — follow live velocity immediately
            step = cappedStep;
        } else {
            step = Math.sign(debt) * Math.max(Math.abs(cappedStep), Math.abs(debtStep));
        }

        animProgress.current = Math.max(
            ANIM_DELAY_START,
            Math.min(ANIM_DELAY_START + ANIM_TOTAL, animProgress.current + step)
        );

        // Smooth display toward the playhead
        displayProgress.current += (animProgress.current - displayProgress.current) * LERP;

        // Apply to camera
        const { z, y } = getCameraPosition(displayProgress.current);
        camera.position.z = z;
        camera.position.y = y;
    });

    return null;
}

export function Planets({ className, id }) {
    // useMomentumScroll();

    return (
        <Canvas
            shadows
            camera={{
                fov: 20,
                position: [-5, CAMERA_START_Y, CAMERA_START_Z],
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
            <ScrollCamera />
        </Canvas>
    );
}

export default Planets;
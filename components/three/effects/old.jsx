// Camera Controller Component (runs inside Canvas)
function CameraController({ 
  initialPositions, 
  loadEffect, 
  clickEffects 
}) {
  const { progress } = useProgress();
  const cameraRef = useRef();
  
  // State to track current camera values (like styles in CustomScroll)
  const [cameraState, setCameraState] = useState(() => {
    const initial = initialPositions.find(item => item.object === "camera");
    return {
      position: initial?.position || { x: 0, y: 1, z: 1 },
      rotation: initial?.rotation || { x: 0, y: 0, z: 0 },
      fov: initial?.fov || 25
    };
  });

  // Track active click effect
  const [activeEffect, setActiveEffect] = useState("");
  const [clickEffectProgress, setClickEffectProgress] = useState(0);
  const clickEffectAnimationFrames = useRef({});

  // Track load effect
  const [loadEffectProgress, setLoadEffectProgress] = useState(0);
  const loadEffectAnimationFrame = useRef({});
  const loadStartTime = useRef(null);

  // Helper to interpolate numeric values
  const interpolateValue = (start, end, progress, easing) => {
    const easedProgress = easing ? easing(progress) : progress;
    return start + (end - start) * easedProgress;
  };

  // Load Effect Animation
  useEffect(() => {
    if (progress !== 100 || !loadEffect || loadEffect.length === 0) return;

    const cameraLoadEffect = loadEffect.find(effect => effect.object === "camera");
    if (!cameraLoadEffect || loadEffectAnimationFrame.current["load"]) return;

    const effectDelay = cameraLoadEffect.delay || 0;
    const effectDuration = cameraLoadEffect.duration || 1000;
    let delayTimeoutId = null;

    const animate = (currentTime) => {
      if (!loadStartTime.current) {
        loadStartTime.current = currentTime;
      }

      const elapsed = currentTime - loadStartTime.current;
      const progress = Math.min(elapsed / effectDuration, 1);

      setLoadEffectProgress(progress);

      if (progress < 1) {
        loadEffectAnimationFrame.current["load"] = requestAnimationFrame(animate);
      } else {
        // Animation complete - set final values
        setCameraState(prevState => ({
          position: cameraLoadEffect.position || prevState.position,
          rotation: cameraLoadEffect.rotation || prevState.rotation,
          fov: cameraLoadEffect.fov !== undefined ? cameraLoadEffect.fov : prevState.fov
        }));

        delete loadEffectAnimationFrame.current["load"];
        setLoadEffectProgress(0);
        loadStartTime.current = null;
      }
    };

    delayTimeoutId = setTimeout(() => {
      loadEffectAnimationFrame.current["load"] = requestAnimationFrame(animate);
    }, effectDelay);

    return () => {
      if (loadEffectAnimationFrame.current["load"]) {
        cancelAnimationFrame(loadEffectAnimationFrame.current["load"]);
        delete loadEffectAnimationFrame.current["load"];
      }
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [progress, loadEffect]);

  // Click Effect Event Listener
  useEffect(() => {
    if (!clickEffects || clickEffects.length === 0) return;

    const handleClick = (e) => {
      let element = e.target;

      while (element) {
        clickEffects.forEach((effect, index) => {
          if (effect.object === "camera" && effect.triggerId && element.id === effect.triggerId) {
            const effectId = `effect_${index}`;

            if (activeEffect === effectId) return;

            // If there's an active effect, capture current interpolated values
            if (activeEffect !== "" && clickEffectProgress > 0) {
              const currentEffectIndex = parseInt(activeEffect.split('_')[1]);
              const currentEffect = clickEffects[currentEffectIndex];

              if (currentEffect && currentEffect.object === "camera") {
                const currentValues = getCurrentCameraValues(clickEffectProgress);
                setCameraState(currentValues);
              }

              // Cancel the current animation
              if (clickEffectAnimationFrames.current[activeEffect]) {
                cancelAnimationFrame(clickEffectAnimationFrames.current[activeEffect]);
                delete clickEffectAnimationFrames.current[activeEffect];
              }
            }

            setActiveEffect(effectId);
            setClickEffectProgress(0);
          }
        });
        element = element.parentElement;
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [clickEffects, activeEffect, clickEffectProgress]);

  // Click Effect Animation Loop
  useEffect(() => {
    if (activeEffect === "") return;

    const effectIndex = parseInt(activeEffect.split('_')[1]);
    const effect = clickEffects[effectIndex];

    if (!effect || effect.object !== "camera" || clickEffectAnimationFrames.current[activeEffect]) return;

    const startTime = { current: null };
    const effectDuration = effect.duration || 1000;
    const effectDelay = effect.delay || 0;
    let delayTimeoutId = null;

    const animate = (currentTime) => {
      if (!startTime.current) {
        startTime.current = currentTime;
      }

      const elapsed = currentTime - startTime.current;
      const progress = Math.min(elapsed / effectDuration, 1);

      setClickEffectProgress(progress);

      if (progress < 1) {
        clickEffectAnimationFrames.current[activeEffect] = requestAnimationFrame(animate);
      } else {
        // Animation complete - update with final values
        setCameraState({
          position: effect.position || cameraState.position,
          rotation: effect.rotation || cameraState.rotation,
          fov: effect.fov !== undefined ? effect.fov : cameraState.fov
        });

        delete clickEffectAnimationFrames.current[activeEffect];
        setActiveEffect("");
        setClickEffectProgress(0);
      }
    };

    delayTimeoutId = setTimeout(() => {
      clickEffectAnimationFrames.current[activeEffect] = requestAnimationFrame(animate);
    }, effectDelay);

    return () => {
      Object.values(clickEffectAnimationFrames.current).forEach(frameId => {
        if (frameId) cancelAnimationFrame(frameId);
      });
      if (delayTimeoutId) clearTimeout(delayTimeoutId);
    };
  }, [activeEffect, clickEffects]);

  // Get current camera values with interpolation
  const getCurrentCameraValues = (progressOverride) => {
    
    let result = { ...cameraState };

    // Apply load effect if active
    if (loadEffectProgress > 0 && loadEffectProgress < 1) {
      const cameraLoadEffect = loadEffect?.find(effect => effect.object === "camera");
      if (cameraLoadEffect) {
        const easingName = cameraLoadEffect.easingFunction || 'linear';
        const easing = easingFunctions[easingName] || easingFunctions.linear;

        if (cameraLoadEffect.position) {
          result.position = {
            x: interpolateValue(cameraState.position.x, cameraLoadEffect.position.x, loadEffectProgress, easing),
            y: interpolateValue(cameraState.position.y, cameraLoadEffect.position.y, loadEffectProgress, easing),
            z: interpolateValue(cameraState.position.z, cameraLoadEffect.position.z, loadEffectProgress, easing)
          };
        }

        if (cameraLoadEffect.rotation) {
          result.rotation = {
            x: interpolateValue(cameraState.rotation.x, cameraLoadEffect.rotation.x, loadEffectProgress, easing),
            y: interpolateValue(cameraState.rotation.y, cameraLoadEffect.rotation.y, loadEffectProgress, easing),
            z: interpolateValue(cameraState.rotation.z, cameraLoadEffect.rotation.z, loadEffectProgress, easing)
          };
        }

        if (cameraLoadEffect.fov !== undefined) {
          result.fov = interpolateValue(cameraState.fov, cameraLoadEffect.fov, loadEffectProgress, easing);
        }
      }
    }
    // Apply click effect if active
    else if (activeEffect !== "") {
      const idx = parseInt(activeEffect.split('_')[1]);
      const effect = clickEffects[idx];

      if (effect && effect.object === "camera") {
        const easingName = effect.easingFunction || 'linear';
        const easing = easingFunctions[easingName] || easingFunctions.linear;
        const progress = progressOverride !== undefined ? progressOverride : clickEffectProgress;

        if (effect.position) {
          result.position = {
            x: interpolateValue(cameraState.position.x, effect.position.x, progress, easing),
            y: interpolateValue(cameraState.position.y, effect.position.y, progress, easing),
            z: interpolateValue(cameraState.position.z, effect.position.z, progress, easing)
          };
        }

        if (effect.rotation) {
          result.rotation = {
            x: interpolateValue(cameraState.rotation.x, effect.rotation.x, progress, easing),
            y: interpolateValue(cameraState.rotation.y, effect.rotation.y, progress, easing),
            z: interpolateValue(cameraState.rotation.z, effect.rotation.z, progress, easing)
          };
        }

        if (effect.fov !== undefined) {
          result.fov = interpolateValue(cameraState.fov, effect.fov, progress, easing);
        }
      }
    }

    return result;
  };

  const currentValues = getCurrentCameraValues();

  // Update camera on every frame
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.position.set(
        currentValues.position.x,
        currentValues.position.y,
        currentValues.position.z
      );
      cameraRef.current.rotation.set(
        currentValues.rotation.x,
        currentValues.rotation.y,
        currentValues.rotation.z
      );
      cameraRef.current.fov = currentValues.fov;
      cameraRef.current.updateProjectionMatrix();
    }
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      position={[currentValues.position.x, currentValues.position.y, currentValues.position.z]}
      rotation={[currentValues.rotation.x, currentValues.rotation.y, currentValues.rotation.z]}
      fov={currentValues.fov}
    />
  );
}
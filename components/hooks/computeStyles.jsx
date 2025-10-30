import easingFunctions from "../utils/easingFunctions";
import { interpolate } from "./utils";

export function computeStyles(baseStyles, activeEffect, progress) {
  if (!activeEffect || progress <= 0) {
    return baseStyles;
  }

  const { effect } = activeEffect;
  if (!effect || !effect.styles || effect.styles.length === 0) {
    return baseStyles;
  }

  const easing = easingFunctions[effect.easingFunction] || easingFunctions.linear;
  const computedStyles = { ...baseStyles };
  const transformProps = [
    'scale', 'scaleX', 'scaleY', 'scaleZ',
    'rotate', 'rotateX', 'rotateY', 'rotateZ',
    'translateX', 'translateY', 'translateZ',
    'skewX', 'skewY'
  ];
  const transformValues = [];

  effect.styles.forEach(({ property, endValue }) => {
    const propKey = property.trim();
    const startValue = baseStyles[propKey];
    const interpolated = interpolate(
      startValue,
      endValue,
      progress,
      easing,
      propKey
    );

    if (interpolated !== undefined) {
      if (transformProps.includes(propKey)) {
        transformValues.push(`${propKey}(${interpolated})`);
      } else {
        computedStyles[propKey] = interpolated;
      }
    }
  });

  if (transformValues.length > 0) {
    computedStyles.transform = transformValues.join(' ');
  } else {
    delete computedStyles.transform;
  }

  return computedStyles;
}
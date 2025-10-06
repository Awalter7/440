import * as React from "react";

export function CustomScroll({
  children,
  className,
  positionType = "fixed",
  startTop,
  startLeft,
  startRight,
  startBottom,
  endTop,
  endLeft,
  endRight,
  endBottom,
  scrollStart = 0,
  scrollEnd = 1000,
  startOpacity = 1,
  endOpacity = 1,
  zIndex = 1000,
}) {
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const [isInStudio, setIsInStudio] = React.useState(true);

  React.useEffect(() => {
    // Detect if we're in Plasmic Studio
    const inStudio = window.location.href.includes("studio.plasmic.app") || 
                     window.location.href.includes("host.plasmic.app") ||
                     window.parent !== window;
    setIsInStudio(inStudio);

    if (inStudio) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      
      if (scrollY <= scrollStart) {
        setScrollProgress(0);
      } else if (scrollY >= scrollEnd) {
        setScrollProgress(1);
      } else {
        const progress = (scrollY - scrollStart) / (scrollEnd - scrollStart);
        setScrollProgress(progress);
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrollStart, scrollEnd]);

  // Parse value with unit (e.g., "100px", "50vw", "20vh")
  const parseValue = (value) => {
    if (value === undefined || value === null || value === "") return null;
    
    const str = String(value).trim();
    const match = str.match(/^(-?[\d.]+)(px|vw|vh|%|em|rem)?$/);
    
    if (!match) return null;
    
    return {
      number: parseFloat(match[1]),
      unit: match[2] || "px"
    };
  };

  // Interpolate between two values with units
  const interpolate = (start, end) => {
    const startParsed = parseValue(start);
    const endParsed = parseValue(end);
    
    if (!startParsed || !endParsed) return undefined;
    
    // If units don't match, we can't interpolate
    if (startParsed.unit !== endParsed.unit) {
      console.warn(`Unit mismatch: ${start} vs ${end}. Using start value unit.`);
    }
    
    const interpolatedNumber = startParsed.number + (endParsed.number - startParsed.number) * scrollProgress;
    return `${interpolatedNumber}${startParsed.unit}`;
  };

  const currentTop = interpolate(startTop, endTop);
  const currentLeft = interpolate(startLeft, endLeft);
  const currentRight = interpolate(startRight, endRight);
  const currentBottom = interpolate(startBottom, endBottom);
  const currentOpacity = startOpacity + (endOpacity - startOpacity) * scrollProgress;

  // In studio, always use relative positioning
  const position = isInStudio ? "relative" : positionType;

  const style = {
    position,
    ...(currentTop !== undefined && { top: currentTop }),
    ...(currentLeft !== undefined && { left: currentLeft }),
    ...(currentRight !== undefined && { right: currentRight }),
    ...(currentBottom !== undefined && { bottom: currentBottom }),
    opacity: currentOpacity,
    zIndex,
    transition: "none",
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}
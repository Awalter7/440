
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

  // Interpolate position values
  const interpolate = (start, end) => {
    if (start === undefined || end === undefined) return undefined;
    return start + (end - start) * scrollProgress;
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
    ...(currentTop !== undefined && { top: `${currentTop}px` }),
    ...(currentLeft !== undefined && { left: `${currentLeft}px` }),
    ...(currentRight !== undefined && { right: `${currentRight}px` }),
    ...(currentBottom !== undefined && { bottom: `${currentBottom}px` }),
    opacity: currentOpacity,
    zIndex,
    transition: "none", // Remove any transitions for smooth scroll-based animation
  };

  return (
    <div className={className} style={style}>
      {children}
    </div>
  );
}

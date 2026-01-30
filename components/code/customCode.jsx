import React, { useEffect, useRef, useState } from "react";

export function CustomCode({
  children,
  className,
  code,
  deps = [],
}) {
  const [value, setValue] = useState(null);
  const refs = useRef({});

  useEffect(() => {
    if (!code) return;

    try {
      const fn = new Function(
        "setValue",
        "getValue",
        "refs",
        `
        "use strict";
        ${code}
      `
      );

      console.log(fn)
      fn(
        setValue,
        () => value,
        refs.current
      );
    } catch (err) {
      console.error("[CustomCode Error]", err);
    }
  }, [code, ...deps]);

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;

        return React.cloneElement(child, {
          ...child.props,
          customValue: value,
          customRefs: refs.current,
          ref: (el) => {
            refs.current[index] = el;
          },
        });
      })}
    </div>
  );
}

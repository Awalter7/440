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

      console.log(fn);
      fn(
        setValue,
        () => value,
        refs.current
      );
    } catch (err) {
      console.error("[CustomCode Error]", err);
    }
  }, [code, ...deps]);

  // Recursive function to inject props into CustomScroll components
  const injectPropsRecursively = (children) => {
    return React.Children.map(children, (child, index) => {
      if (!React.isValidElement(child)) return child;

      // Check if this is a CustomScroll component
      const isCustomScroll = 
        child.type?.name === 'CustomScroll' || 
        child.type?.displayName === 'CustomScroll';

      // Prepare props to inject
      const injectedProps = {
        customValue: value,
        customRefs: refs.current,
      };

      // If it's a CustomScroll, inject the props and also process its children
      if (isCustomScroll) {
        return React.cloneElement(child, {
          ...child.props,
          ...injectedProps,
          children: child.props.children ? injectPropsRecursively(child.props.children) : child.props.children,
        });
      }

      // If it's not CustomScroll but has children, recursively process those children
      if (child.props?.children) {
        return React.cloneElement(child, {
          ...child.props,
          children: injectPropsRecursively(child.props.children),
        });
      }

      // Return the child as-is if no processing needed
      return child;
    });
  };

  return (
    <div className={className}>
      {injectPropsRecursively(children)}
    </div>
  );
}
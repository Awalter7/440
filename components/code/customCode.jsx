import React, { useEffect, useRef, useState, useId} from "react";

export function CustomCode({
  children,
  className,
  code,
  deps = [],
}) {
  return;

  // const [value, setValue] = useState(null);
  // const refs = useRef({});
  // const uID = useId(); // guaranteed stable, no module-level state needed

  // useEffect(() => {
  //   if (!code) return;

  //   // Normalize smart quotes/backtick lookalikes before eval
  //   const safeCode = code
  //     .replace(/[\u2018\u2019]/g, "'")   // smart single quotes
  //     .replace(/[\u201C\u201D]/g, '"')   // smart double quotes
  //     .replace(/[\u0060\uFF40]/g, '`');  // lookalike backticks

  //   try {
  //     const fn = new Function(
  //       "setValue",
  //       "getValue",
  //       "refs",
  //       "uID",
  //       `"use strict";\n${safeCode}`
  //     );

  //     fn(setValue, () => value, refs.current, uID);
  //   } catch (err) {
  //     console.error("[CustomCode Error]", err.message);
  //   }
  // }, [code, ...deps]);
  
  // // Recursive function to inject props into CustomScroll components
  // const injectPropsRecursively = (children) => {
  //   return React.Children.map(children, (child, index) => {
  //     if (!React.isValidElement(child)) return child;

  //     // Check if this is a CustomScroll component
  //     const isCustomScroll = 
  //       child.type?.name === 'CustomScroll' || 
  //       child.type?.displayName === 'CustomScroll';

  //     // Prepare props to inject
  //     const injectedProps = {
  //       customValue: value,
  //       customRefs: refs.current,
  //     };

  //     // If it's a CustomScroll, inject the props and also process its children
  //     if (isCustomScroll) {
  //       return React.cloneElement(child, {
  //         ...child.props,
  //         ...injectedProps,
  //         children: child.props.children ? injectPropsRecursively(child.props.children) : child.props.children,
  //       });
  //     }

  //     // If it's not CustomScroll but has children, recursively process those children
  //     if (child.props?.children) {
  //       return React.cloneElement(child, {
  //         ...child.props,
  //         children: injectPropsRecursively(child.props.children),
  //       });
  //     }

  //     // Return the child as-is if no processing needed
  //     return child;
  //   });
  // };

  // return (
  //   <div className={className} id={uID}>
  //     {injectPropsRecursively(children)}
  //   </div>
  // );
}
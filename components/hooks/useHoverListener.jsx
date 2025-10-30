import { useRef, useEffect } from "react";

export default function useHoverListener(ids, onHoverStart, onHoverEnd) {
  const onHoverStartRef = useRef(onHoverStart);
  const onHoverEndRef = useRef(onHoverEnd);

  useEffect(() => {
    onHoverStartRef.current = onHoverStart;
    onHoverEndRef.current = onHoverEnd;
  }, [onHoverStart, onHoverEnd]);

  useEffect(() => {
    if (!ids || ids.length === 0) return;

    const idArray = Array.isArray(ids) ? ids : [ids];
    const elements = idArray
      .map(id => ({ id, element: document.getElementById(id) }))
      .filter(item => item.element !== null);

    const handlers = new Map();

    elements.forEach(({ id, element }) => {
      const enterHandler = () => onHoverStartRef.current(id);
      const leaveHandler = () => onHoverEndRef.current(id);

      handlers.set(id, { enterHandler, leaveHandler });
      element.addEventListener('mouseenter', enterHandler);
      element.addEventListener('mouseleave', leaveHandler);
    });

    return () => {
      elements.forEach(({ id, element }) => {
        const { enterHandler, leaveHandler } = handlers.get(id) || {};
        if (enterHandler && leaveHandler) {
          element.removeEventListener('mouseenter', enterHandler);
          element.removeEventListener('mouseleave', leaveHandler);
        }
      });
    };
  }, [ids]);
}
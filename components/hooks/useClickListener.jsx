import { useRef, useEffect } from "react";

export default function useClickListener(ids, callback) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!ids || ids.length === 0) return;

    const idArray = Array.isArray(ids) ? ids : [ids];
    const elements = idArray
      .map(id => ({ id, element: document.getElementById(id) }))
      .filter(item => item.element !== null);

    const handlers = new Map();

    elements.forEach(({ id, element }) => {
      const handler = () => callbackRef.current(id);
      handlers.set(id, handler);
      element.addEventListener('click', handler);
    });

    return () => {
      elements.forEach(({ id, element }) => {
        const handler = handlers.get(id);
        if (handler) {
          element.removeEventListener('click', handler);
        }
      });
    };
  }, [ids]);
}
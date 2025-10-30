
import { useEffect, useState } from 'react'

export default function useShaderStatus() {
  const [shaderCompiled, setShaderCompiled] = useState(false);

  useEffect(() => {
    const handler = () => setShaderCompiled(true);
    window.addEventListener("shader-compiled", handler);
    return () => window.removeEventListener("shader-compiled", handler);
  }, []);

  return shaderCompiled;
}
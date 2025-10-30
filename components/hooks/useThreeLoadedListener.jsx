import {useRef, useEffect} from "react";
import { useProgress } from "@react-three/drei";

export default function useThreeLoadedListener(callback) {
    const callbackRef = useRef(callback);
    const { progress } = useProgress();   

    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect(() => {
        if(progress === 100){
            callbackRef.current(true)
        }else{
            callbackRef.current(false)
        }
    }, [progress]);
}
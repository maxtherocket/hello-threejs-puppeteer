import {useSetupRenderFrame} from "../hooks/use-render-frame";
import {useThree} from "@react-three/fiber";
import {useEffect} from "react";

export default function SetupRenderMode(){
  const {gl: renderer, scene, camera, invalidate } = useThree();
  useSetupRenderFrame({renderer, scene, camera, invalidate});
  useEffect(() => {
    if (window.RENDER_MODE){
      window._renderFrame(0);
    }
  }, []);
  return (null);
}

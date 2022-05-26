import {useFrame} from "@react-three/fiber";
import {useEffect, useState} from "react";

const renderFrameCallbacks = [];
const stateDummy = {};

window._renderFrame = function(frameNum) {
  console.info('renderFrameCallbacks.length:', renderFrameCallbacks.length, `frameNum: ${frameNum}`);
  renderFrameCallbacks.map((cb, i) => {
    cb(stateDummy, 0.016, frameNum*0.016);
    console.log('Render frame callback:', i);
  });
  console.info('window._renderer:', window._renderer);
  let result;
  if (window._renderer){
    try {
      window._renderer.render(window._scene, window._camera);
      window._invalidate && window._invalidate();
      console.log('rendered frame:', frameNum);
      console.info('window._canvasElement:', window._canvasElement);
      result = window._canvasElement.toDataURL();
    } catch (e) {
      console.error(e.message);
      console.error(e);
    }
  }
  return result;
}

window._renderFrames = (num= 1) => {
  const framesData = []
  for (let i = 0; i < num; i++) {
    framesData.push(window._renderFrame(i));
  }
  return framesData;
}

window._canvasElement = null;

export const useSetupRenderFrame = ({renderer, scene, camera, invalidate}) => {
  const [renderFrameSetupReady, renderFrameSetupReadySet] = useState(false);
  useEffect(() => {
    window._renderer = renderer;
    window._scene = scene;
    window._camera = camera;
    window._invalidate = invalidate;
    window._canvasElement = renderer.domElement;
    renderFrameSetupReadySet(true);
  }, []);
  window._renderSetupReady = () => {};
  return renderFrameSetupReady;
}

let timesCalledCount = 0;

export const useRenderFrame = (cb, deps = []) => {
    console.info('useRenderFrame Call');
    const RENDER_MODE = window.RENDER_MODE;
    if (!RENDER_MODE) {
      useFrame((state, delta) => {
        //console.info('timesCalledCount:', timesCalledCount);
        const elapsedTime = state.clock.getElapsedTime();
        cb(state, delta, elapsedTime);
      });
    } else {
      useEffect(() => {
        if (!renderFrameCallbacks.length) {
          renderFrameCallbacks.push(cb);
          console.info('renderFrameCallbacks ADD CB, renderFrameCallbacks.length', renderFrameCallbacks.length);
        }
        return () => {
          const idx = renderFrameCallbacks.indexOf(cb);
          if (idx > -1) {
            renderFrameCallbacks.splice(idx, 1);
          }
        }
      }, [cb, ...deps]);
    }
}

import { useEffect, useRef } from 'react'
import { OrbitControls, TorusKnot } from '@react-three/drei'
import { Canvas, useFrame, invalidate, useThree } from '@react-three/fiber'
import {Pane} from 'tweakpane';
import '../src/style/index.scss';

export default function App() {
  return (
    <div className="canvas-container">
      <Canvas id="main-canvas" frameloop="demand">
        <color attach="background" args={['black']} />
        <OrbitControls />
        <Thing />
      </Canvas>
    </div>
  )
}

function Thing() {
  const ref = useRef()
  useFrame(() => {
    return null;
  });

  const {gl: renderer, scene, camera} = useThree();
  useEffect(() => {

    const tweak = new Pane();

    const draw = window.draw = (frameNum) => {
      ref.current.rotation.y += frameNum * 0.01;
      console.log('RENDER');
      renderer.render(scene, camera);
      invalidate();
      const result = renderer.domElement.toDataURL();
      return result;
    }
    window.drawFrames = (num=1) => {
      const framesData = []
      for (let i = 0; i < num; i++) {
        framesData.push(draw(i))
        //await rafPromise();
      }
      return framesData;
    }
  }, []);
  return (
    <TorusKnot ref={ref} args={[1, 0.3, 128, 16]}>
      <meshNormalMaterial />
    </TorusKnot>
  )
}

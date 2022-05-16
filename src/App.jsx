import * as THREE from 'three'
import { useEffect, useRef, useState, useMemo } from 'react'
import { OrbitControls, TorusKnot } from '@react-three/drei'
import { Canvas, useFrame, invalidate, useThree } from '@react-three/fiber'
import niceColors from 'nice-color-palettes'
import queryString from 'query-string';
import {Pane} from 'tweakpane';
import axios from 'axios'
import urlParams from "./utils/url-params";
import '../src/style/index.scss';

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()
const colors = new Array(1000).fill().map(() => niceColors[17][Math.floor(Math.random() * 5)])

const GENERATE_URL = import.meta.env.PROD ? '/api/capture' : 'http://localhost:3000/api/capture'

export default function App() {

  const [bgColor, bgColorSet] = useState(urlParams.get('bg') || '#ebb9b9');
  const bgColorRef = useRef(bgColor);
  useEffect(() => {
    bgColorRef.current = bgColor;
  }, [bgColor])

  useEffect(() => {

    const PARAMS = {
      background: bgColor,
      status: 'Click Generate'
    };

    const pane = new Pane();
    pane.addInput(PARAMS, 'background').on('change', (ev) => {
      bgColorSet(ev.value);
    });

    const btn = pane.addButton({
      title: 'Generate'
    }).on('click', () => {
      PARAMS.status = 'Generating ... Wait';
      btn.disabled = true;

      const urlParamsVars = {
        bg: bgColorRef.current
      }
      const urlParamsString = queryString.stringify(urlParamsVars);
      console.info('urlParamsString:', urlParamsString);
      axios.get(`${GENERATE_URL}?${urlParamsString}`).then((response) => {
        console.info('response.data:', response.data);
        btn.disabled = false;
        PARAMS.status = 'Video Ready!';
        const dlButton = pane.addButton({
          title: 'Download Video'
        }).on('click', () => {
          window.open(response.data.video,'_blank');
        });
      })
    });

    pane.addMonitor(PARAMS, 'status');


  }, []);

  return (
    <div className="canvas-container">
      <Canvas
        id="main-canvas"
        frameloop="demand"
        gl={{ antialias: false, alpha: false }}
        camera={{ position: [0, 0, 20], near: 5, far: 100 }}
      >
        <color attach="background" args={[bgColor]} />
        <OrbitControls />
        <ambientLight />
        <pointLight position={[150, 150, 150]} intensity={0.55} />
        <Boxes />
      </Canvas>
    </div>
  )
}

function Boxes() {
  const [hovered, set] = useState()
  const {gl: renderer, scene, camera} = useThree();

  const colorArray = useMemo(() => Float32Array.from(new Array(1000).fill().flatMap((_, i) => tempColor.set(colors[i]).toArray())), [])

  const ref = useRef()

  useEffect(() => {

    const tweak = new Pane();

    const draw = window.draw = (frameNum) => {
      const time = (50 + frameNum) * 0.04
      ref.current.rotation.x = Math.sin(time / 4)
      ref.current.rotation.y = Math.sin(time / 2)
      let i = 0
      for (let x = 0; x < 10; x++)
        for (let y = 0; y < 10; y++)
          for (let z = 0; z < 10; z++) {
            const id = i++
            tempObject.position.set(5 - x, 5 - y, 5 - z)
            tempObject.rotation.y = Math.sin(x / 4 + time) + Math.sin(y / 4 + time) + Math.sin(z / 4 + time)
            tempObject.rotation.z = tempObject.rotation.y * 2
            tempObject.updateMatrix()
            ref.current.setMatrixAt(id, tempObject.matrix)
          }
      ref.current.instanceMatrix.needsUpdate = true

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

    draw(0);

  }, []);

  return (
    <instancedMesh ref={ref} args={[null, null, 1000]} onPointerMove={(e) => set(e.instanceId)} onPointerOut={(e) => set(undefined)}>
      <boxBufferGeometry args={[0.7, 0.7, 0.7]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </boxBufferGeometry>
      <meshPhongMaterial vertexColors={THREE.VertexColors} />
    </instancedMesh>
  )
}

function Instances({ count = 50, temp = new THREE.Object3D() }) {
  const ref = useRef()
  useEffect(() => {
    // Set positions
    for (let i = 0; i < count; i++) {
      temp.position.set(Math.random(), Math.random(), Math.random())
      temp.updateMatrix()
      ref.current.setMatrixAt(i, temp.matrix)
    }
    // Update the instance
    ref.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <boxGeometry />
      <meshPhongMaterial />
    </instancedMesh>
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

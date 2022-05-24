import {useEffect, useLayoutEffect, useMemo, useRef, useState} from "react";
import {useThree} from "@react-three/fiber";
import {Pane} from "tweakpane";
import niceColors from 'nice-color-palettes'
import * as THREE from "three";
import {useRenderFrame} from "../../hooks/use-render-frame";

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()
const colors = new Array(1000).fill().map(() => niceColors[17][Math.floor(Math.random() * 5)])

export default function Particles() {
  const [hovered, set] = useState()
  const {gl: renderer, scene, camera} = useThree();

  const colorArray = useMemo(() => Float32Array.from(new Array(1000).fill().flatMap((_, i) => tempColor.set(colors[i]).toArray())), [])

  const ref = useRef();

  useRenderFrame((state, delta, elapsedTime) => {
    const time = elapsedTime;
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
  });

  return (
    <instancedMesh ref={ref} args={[null, null, 1000]} onPointerMove={(e) => set(e.instanceId)} onPointerOut={(e) => set(undefined)}>
      <boxBufferGeometry args={[0.7, 0.7, 0.7]}>
        <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </boxBufferGeometry>
      <meshPhongMaterial vertexColors={THREE.VertexColors} />
    </instancedMesh>
  )
}

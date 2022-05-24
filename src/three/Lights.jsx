import React, { useRef } from 'react'
import {useTweaks} from "use-tweaks/src/useTweaks";
import {Select} from "@react-three/postprocessing";

function Lights() {

  const $dirLight = useRef()
  const $backLight = useRef()

  const color = useTweaks('Lights', {
    color: {value: "#ff0000"},

  })

  return (
    <>
      <spotLight
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        distance={9}
        angle={.1}
        penumbra={.3}
        castShadow
        ref={$dirLight} color={color} position={[0, 0, -30]} />

      <pointLight
        color={color}
        position={[0, 1, -10]}
        intensity={0.3}
      />

      <spotLight
        ref={$backLight}
        position={[0, 0, 3]}
        intensity={1}
        distance={4}
        color="blue"
      />

      <directionalLight position={[0, 0, 0]} intensity={1} />
    </>
  )

}

export default Lights

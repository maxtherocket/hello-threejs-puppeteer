import React, {Suspense, forwardRef, useMemo, useState, useRef} from "react";

import {
  EffectComposer,
  Noise,
  Vignette,
  HueSaturation,
  Select,
  Bloom
} from "@react-three/postprocessing";
import { useThree } from "@react-three/fiber";

import { GodRaysEffect, KernelSize, BlendFunction } from "postprocessing";

import { Icosahedron, MeshDistortMaterial, useTexture, useCubeTexture } from "@react-three/drei";
import {useTweaks} from "use-tweaks/src/useTweaks";

import bumpMapPath from '../assets/tex/bump.jpg';
import useAudioAnalyzer from "../hooks/use-audio-analyzer";
import {useRenderFrame} from "../hooks/use-render-frame";
import {CUBE_TEX_PATH} from "../settings";
import useCubeTexturePaths from "../hooks/use-cube-texture-paths";

export const GodRays = forwardRef((props, ref) => {
  const { camera } = useThree();
  const { sun } = props;

  const effect = useMemo(() => {
    const godRaysEffect = new GodRaysEffect(camera, sun, {
      height: 300,
      width: 300,
      kernelSize: KernelSize.SMALL,
      density: 0.96,
      decay: 0.92,
      weight: 0.3,
      exposure: 0.34,
      samples: 50,
      clampMax: 1,
    });

    return godRaysEffect;
  }, [camera, sun]);

  return <primitive ref={ref} object={effect} dispose={null} />;
});

// const Sun = forwardRef(function Sun(props, forwardRef) {
//   const {sunColor} = useTweaks("Sun", { sunColor: { value: "#FF0000" }})
//
//   return (
//     <Sphere args={[4, 4]} rotation={[0,Math.PI,0]} ref={forwardRef} position={[0, 0, 0]}>
//       <meshBasicMaterial color={sunColor} />
//     </Sphere>
//   );
// });

const Sun = forwardRef(function Sun({bumpMap, cubeTex}, forwardRef) {

  const analyzer = useAudioAnalyzer();
  const analyzerDataArray = useMemo(() => {
    if (analyzer) {
      const bufferLength = analyzer.frequencyBinCount;
      return new Uint8Array(bufferLength);
    }
  }, [analyzer]);

  const {
    color,
    speed,
    roughness,
    metalness,
    scale,
    distort,
    bumpScale,
  } = useTweaks("Orb", {
    color: { value: "#9400ff" },
    speed: { value: 10.43, min: 0, max: 15 },
    roughness: { value: 0.2, min: 0, max: 1, step: 0.05 },
    metalness: { value: 0.3, min: 0, max: 1, step: 0.05 },
    scale: { value: 1.1, min: 0, max: 3, step: 0.1 },
    distort: { value: 0.3, min: 0, max: 2, step: 0.1 },
    bumpScale: { value: 0.005, min: 0, max: 0.1, step: 0.001 }
  })

  const prevFTTVal = useRef(0);
  const distortMaterialRef = useRef();

  useRenderFrame((state, delta, elapsedTime) => {
    if (analyzer && analyzerDataArray) {
      analyzer.getByteTimeDomainData(analyzerDataArray);
      const targetFFTVal = analyzerDataArray[0];
      prevFTTVal.current += (targetFFTVal - prevFTTVal.current) / 3;
      distortMaterialRef.current.distort = distort + prevFTTVal.current * 0.002;
    }
  }, []);

  return (
    <Icosahedron args={[3, 30]} scale={[scale, scale, scale]} ref={forwardRef} position={[0, 0, 0]}>
      <MeshDistortMaterial
        ref={distortMaterialRef}
        envMap={cubeTex}
        bumpMap={bumpMap}
        color={color}
        emissive={color}
        roughness={roughness}
        metalness={metalness}
        bumpScale={bumpScale}
        clearcoat={1}
        clearcoatRoughness={1}
        radius={1}
        distort={distort}
        speed={speed}
      />
    </Icosahedron>
  );
});

function Effects({bumpMap, cubeTex}) {
  const [$sun, setSun] = useState();

  const {hue, saturation, noise} = useTweaks("Effects", {
    hue: {value: 3.11, min: 0, max: Math.PI * 2},
    saturation: {value: 2.05},
    noise: {value: 0.47, min: 0, max: 1,}
  });

  const {enabled} = useTweaks('Effect Composer', {
    enabled: true
  })

  return (
    <Suspense fallback={null}>
      <Sun bumpMap={bumpMap} cubeTex={cubeTex} ref={setSun} />
      <pointLight
        color={'#fff'}
        position={[0, 1, -10]}
        intensity={0.3}
      />
      {$sun && (
        <EffectComposer enabled={enabled}>
          <GodRays sun={$sun} />

          <Noise
            opacity={noise}
            premultiply // enables or disables noise premultiplication
            blendFunction={BlendFunction.ADD} // blend mode
          />

          <HueSaturation hue={hue} saturation={saturation} />

          <Vignette eskil={false} offset={0.1} darkness={1.1} />
          <Bloom
            luminanceThreshold={0}
            luminanceSmoothing={0.9}
            height={300}
            opacity={3} />
        </EffectComposer>
      )}
    </Suspense>
  );
}

export default Effects;

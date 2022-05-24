import {useEffect, useMemo, useRef, useState} from "react";
import PropTypes from "prop-types";
import {useThree} from "@react-three/fiber";
import niceColors from 'nice-color-palettes'
import * as THREE from "three";
import {useRenderFrame} from "../../hooks/use-render-frame";
import {useTweaks} from "use-tweaks/src/useTweaks";
import {createAnalyser} from "../../utils/audio-analyzer";
import useAudioAnalyzer from "../../hooks/use-audio-analyzer";
import {useCubeTexture} from "@react-three/drei";
import {CUBE_TEX_PATH} from "../../settings";

const tempObject = new THREE.Object3D()
const tempColor = new THREE.Color()
const colors = new Array(1000).fill().map(() => niceColors[5][Math.floor(Math.random() * 5)])
const NUM_FRAMES = 50;
let tunnelItemInstanceRefs = [];

export default function Tunnel({numItems = 50}) {
  const [hovered, set] = useState()
  const {gl: renderer, scene, camera} = useThree();

  const colorArray = useMemo(() => Float32Array.from(new Array(1000).fill().flatMap((_, i) => tempColor.set(colors[i]).toArray())), [])

  const opacityArray = useMemo(() => {
    const opacities = [];
    for (let i = 0; i < numItems; i++) {
      opacities.push(0.5);
    }
    return Float32Array.from(opacities);
  }, [])

  const ref = useRef();

  const {
    innerRadius,
    outerRadius,
    gap,
    nearCutoffZ,
    wireframe
  } = useTweaks('Tunnel Geometry', {
    innerRadius: {value: 4, step: 0.5, min: 0, max: 10},
    outerRadius: {value: 6, step: 0.5, min: 0, max: 10},
    gap: {value: 1, step: 0.5, min: 0, max: 10},
    nearCutoffZ: -29,
    wireframe: false
  })

  const {
    animate,
    speed,
    yShift
  } = useTweaks('Animation Control', {
    animate: true,
    speed: {value: 0.05, step: 0.01, min: 0, max: 0.5},
    yShift: {value: 0.1, step: 0.01, min: 0, max: 0.5},
  });

  const tunnelItemRefs = useMemo(() => {
    const itemRefs = [];
    for (let i = 0; i < numItems; i++) {
      itemRefs.push({
        position: new THREE.Vector3(0, 0, - gap * i),
        fftVal: 0
      });
    }
    return itemRefs;
  }, [numItems])

  const mostDistantItem = useRef(tunnelItemRefs[0]);

  useEffect(() => {
    for (let x = 0; x < NUM_FRAMES; x++) {
      tempObject.position.set(0, 0, - (x * gap))
      tempObject.updateMatrix()
      ref.current.setMatrixAt(x, tempObject.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [gap])

  const analyzer = useAudioAnalyzer();
  const analyzerDataArray = useMemo(() => {
    if (analyzer) {
      const bufferLength = analyzer.frequencyBinCount;
      return new Uint8Array(bufferLength);
    }
  }, [analyzer]);

  useRenderFrame((state, delta, elapsedTime) => {
    if (animate && analyzer) {
      const time = elapsedTime;
      //ref.current.rotation.x = Math.sin(time / 4)
      // ref.current.rotation.y = time;
      let minZ = 0;
      let maxZ = 0;
      for (let i = tunnelItemRefs.length-1; i >= 0; i--) {
        if (tunnelItemRefs[i].position.z < nearCutoffZ){
          tunnelItemRefs[i].position.z = mostDistantItem.current.position.z + gap;
          mostDistantItem.current = tunnelItemRefs[i];
        }
        maxZ = Math.max(maxZ, tunnelItemRefs[i].position.z)
        minZ = Math.min(minZ, tunnelItemRefs[i].position.z)
      }
      analyzer.getByteTimeDomainData(analyzerDataArray);
      tunnelItemRefs.map((itemRef, x) => {
        //itemRef.position.z -= speed;
        const targetFFTVal = analyzerDataArray[x];
        itemRef.fftVal += (targetFFTVal - itemRef.fftVal) / 3;
        tempObject.position.copy(itemRef.position);
        //tempObject.rotation.z = THREE.MathUtils.mapLinear(tempObject.position.z, maxZ, minZ, 0, Math.PI * 2);
        tempObject.rotation.z = Math.sin(tempObject.position.z * 0.2 + time);
        tempObject.position.y = Math.sin(tempObject.position.z * 1) * yShift;
        //const scale = 1 + (Math.sin(tempObject.position.z * 0.5) + 1) * 0.2;
        const scale = 1 + itemRef.fftVal * 0.001;
        tempObject.scale.set(scale, scale, 1);
        //tempObject.rotation.z = tempObject.rotation.y * 2
        tempObject.updateMatrix()
        ref.current.setMatrixAt(x, tempObject.matrix)
      })
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [gap, tunnelItemRefs, speed, yShift]);

  const shape = useMemo(() => {
    const s = new THREE.Shape();

    const pointsArray = [
      new THREE.Vector2(-outerRadius, -outerRadius),
      new THREE.Vector2(outerRadius, -outerRadius),
      new THREE.Vector2(outerRadius, outerRadius),
      new THREE.Vector2(-outerRadius, outerRadius),
    ]
    s.setFromPoints(pointsArray);

    const holePath = new THREE.Path();
    const holePoints = pointsArray.map((p) => {
      return p.multiplyScalar(innerRadius / outerRadius);
    });
    holePath.setFromPoints(holePoints)
    s.holes.push(holePath);

    //s.lineTo(-1, -1);
    return s;
  }, [innerRadius, outerRadius])

  const extrudeSettings = useMemo(() => {
    const extrudeSettings = {
      depth : 0.5,
      steps : 1,
      bevelEnabled: true,
      curveSegments: 6
    };
    return extrudeSettings;
  }, [])

  const {
    color,
    roughness,
    metalness,
    reflectivity,
    opacity,
  } = useTweaks("Tunnel Material", {
    color: { value: "#0025ff" },
    roughness: { value: 0.55, min: 0, max: 1, step: 0.05 },
    metalness: { value: 0.45, min: 0, max: 1, step: 0.05 },
    reflectivity: { value: 0.2, min: 0, max: 1, step: 0.1 },
    opacity: { value: 1, min: 0, max: 1, step: 0.1 }
  })

  const envMap = useCubeTexture(
    ["px.png", "nx.png", "py.png", "ny.png", "pz.png", "nz.png"],
    { path: CUBE_TEX_PATH }
  );

  return (
    <>
      <instancedMesh ref={ref} args={[null, null, NUM_FRAMES]} >
        <extrudeBufferGeometry args={[shape, extrudeSettings]}>
          <instancedBufferAttribute attach="attributes-color" args={[colorArray, 3]} />
          <instancedBufferAttribute attach="attributes-opacity" args={[opacityArray, 1]} />
        </extrudeBufferGeometry>
        <meshPhysicalMaterial
          envMap={envMap}
          color={color}
          transparent={false}
          opacity={opacity}
          reflectivity={reflectivity}
          roughness={roughness}
          metalness={metalness}
        />
      </instancedMesh>
    </>
  )
}

Tunnel.propTypes = {
  numItems: PropTypes.number
}

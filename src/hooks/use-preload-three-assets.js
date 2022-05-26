import {useEffect, useState} from "react";
import * as THREE from "three";

export default function usePreloadThreeAssets(manifestArray){
  const [loadComplete, setLoadComplete] = useState(false);
  const [assets, setAssets] = useState();

  useEffect(() => {
    async function loadAssetsAsync() {
      if (manifestArray && manifestArray.length) {
        console.info('manifestArray:', manifestArray);

        const assetLoadResults = {};
        for (let i = 0; i < manifestArray.length; i++) {
          const item = manifestArray[i];
          let result;
          let loader;
          switch (item.type){
            case 'texture':
              loader = new THREE.TextureLoader();
              result = await loader.loadAsync(item.url);
              break;
            case 'cube':
              loader = new THREE.CubeTextureLoader();
              result = await loader.setPath('').loadAsync(item.url);
              break;
          }

          assetLoadResults[item.id] = result;
        }
        console.info('assetLoadResults:', assetLoadResults);
        setAssets(assetLoadResults);
        setLoadComplete(true)
      } else {
        setLoadComplete(true)
      }
    }
    loadAssetsAsync();
  }, [])

  return {complete: loadComplete, assets};
}

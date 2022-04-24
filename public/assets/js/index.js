import * as THREE from 'three';

import { GLTFLoader } from "https://unpkg.com/three@0.139.2/examples/jsm/loaders/GLTFLoader.js"

const WIDTH = 640;
const HEIGHT = 480;

class App {
  constructor() {
    this.loadedAssets = {};
    this.setupPromise=new Promise((resolve,reject)=>{
      this.loadAsync().then(() => {
        this.setupThree();
        this.setupEvents();
        resolve();
      });
    });
  }
  setupThree() {
    const myCanvas = document.querySelector("#myCanvas");
    const renderer = new THREE.WebGLRenderer({
      canvas: myCanvas,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(WIDTH, HEIGHT);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
    camera.position.z = 5;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // const geometry = new THREE.BoxGeometry();
    // const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    // const cube = new THREE.Mesh( geometry, material );
    // scene.add( cube );
    const { myGltf } = this.loadedAssets;
    const cube = myGltf.scene.getObjectByName("Cube");
    {
      const textureNameList = ["--red", "--green", "--blue"].map((modifier) => `dummy-texture${modifier}`);
      for (let i = 0; i < cube.children.length; ++i) {
        const child = cube.children[i];
        const textureName = textureNameList[i];
        const texture = this.loadedAssets[textureName];
        texture.flipY = false;
        texture.needsUpdate = true;
        const material = new THREE.MeshStandardMaterial({
          map: texture,
        });
        child.material = material;
        material.needsUpdate = true;

      }


    }
    scene.add(cube);

    this.three = {
      renderer,
      scene,
      camera,
      cube,
    }
  }
  setupEvents() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.onTick();
    };
    animate();
  }
  onTick() {
    this.update();
    this.draw();
  }
  update() {
    const { cube } = this.three;
    const time = performance.now() / 1000;
    cube.rotation.x = time;
    cube.rotation.y = time;
  }
  draw() {
    const { renderer, scene, camera } = this.three;
    renderer.render(scene, camera);
    const result=renderer.domElement.toDataURL();
    if (!this.result) {
      this.result = result;
      console.log(this.result);
    }
    return result;
  }
  async loadTextureAsync(url, name) {
    const texture = await new Promise((resolve, reject) => {
      const loader = new THREE.TextureLoader();
      loader.load(url, (texture) => {
        console.log(texture);
        resolve(texture);
      })
    });
    Object.assign(this.loadedAssets, {
      [name]: texture,
    });
    return texture;
  }
  async loadMyGltfAsync() {
    const myGltf = await new Promise((resolve, reject) => {
      const loader = new GLTFLoader();
      loader.load("/assets/models/my.glb", (gltf) => {
        console.log(gltf);
        resolve(gltf);
      });
    });
    Object.assign(this.loadedAssets, {
      myGltf,
    });
    return myGltf;
  }
  async loadAsync() {
    const promises = [];
    for (let modifier of ["--red", "--green", "--blue"]) {
      promises.push(this.loadTextureAsync(`/assets/textures/dummy-texture${modifier}.png`, `dummy-texture${modifier}`));
    }

    promises.push(this.loadMyGltfAsync());
    return Promise.all(promises);
  }
}


console.log(THREE);


window.app = new App();






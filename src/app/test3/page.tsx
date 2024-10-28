'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
// import { useWindowSize } from '@/hooks/UseWindowSize';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { Leva, useControls } from 'leva';

import vertexShader from '@/shaders/test3/vertexShader.glsl';
import fragmentShader from '@/shaders/test3/fragmentShader.glsl';

// Noise Texture
const NOISE_TEXTURE_URL = 'https://cdn.maximeheckel.com/noises/noise2.png';
// Blue noise texture
const BLUE_NOISE_TEXTURE_URL = 'https://cdn.maximeheckel.com/noises/blue-noise.png';

const Raymarching = ({dpr, maxSteps, marchSize}: {dpr: number, maxSteps: number, marchSize: number}) => {
  const { viewport } = useThree();
  const [noisetexture, blueNoiseTexture] = useTexture(
    [NOISE_TEXTURE_URL, BLUE_NOISE_TEXTURE_URL],
    (textures) => {
      textures[0].wrapS = textures[1].wrapS = THREE.RepeatWrapping;
      textures[0].wrapT = textures[1].wrapT = THREE.RepeatWrapping;
      textures[0].minFilter = textures[1].minFilter = THREE.NearestMipmapLinearFilter;
      textures[0].magFilter = textures[1].magFilter = THREE.LinearFilter;
    }
  );

  const uniforms = useRef({
    uTime: { value: 0 },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth * dpr, window.innerHeight * dpr),
    },
    uNoise: { value: noisetexture },
    uBlueNoise: { value: blueNoiseTexture },
    uFrame: { value: 0 },
    uMaxSteps: { value: maxSteps },
    uMarchSize: { value: marchSize },
  }).current;

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uResolution.value.set(window.innerWidth * dpr, window.innerHeight * dpr);
    uniforms.uFrame.value += 1;
    uniforms.uMaxSteps.value = maxSteps;
    uniforms.uMarchSize.value = marchSize;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        fragmentShader={fragmentShader}
        vertexShader={vertexShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

const Scene = () => {
  const {dpr, maxSteps, marchSize} = useControls({
    dpr: { value: 0.5, min: 0.1, max: 2, step: 0.1 },
    maxSteps: { value: 40, min: 10, max: 200, step: 10 },
    marchSize: { value: 0.16, min: 0.10, max: 0.30, step: 0.01 },
  });
  return (
    <>
      <Canvas
        camera={{ position: [0, 0, 6] }}
        dpr={dpr}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
        }}
      >
        <Suspense fallback={null}>
          <Raymarching dpr={dpr} maxSteps={maxSteps} marchSize={marchSize} />
        </Suspense>
      </Canvas>
      <Leva />
    </>
  );
};

export default Scene;

'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import vertexShader from '@/shaders/test3/vertexShader.glsl';
import fragmentShader from '@/shaders/test3/fragmentShader.glsl';
// import { useWindowSize } from '@/hooks/UseWindowSize';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const DPR = 1;
// Noise Texture
const NOISE_TEXTURE_URL = 'https://cdn.maximeheckel.com/noises/noise2.png';

const Raymarching = () => {
  const { viewport } = useThree();
  const noisetexture = useTexture(NOISE_TEXTURE_URL, (tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.minFilter = THREE.NearestMipmapLinearFilter;
    tex.magFilter = THREE.LinearFilter;
  });

  const uniforms = useRef({
    uTime: { value: 0 },
    uResolution: {
      value: new THREE.Vector2(window.innerWidth, window.innerHeight),
    },
    uNoise: { value: noisetexture },
  }).current;

  useFrame((state, delta) => {
    uniforms.uTime.value += delta;
    uniforms.uResolution.value.set(window.innerWidth * DPR, window.innerHeight * DPR);
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
  return (
    <Canvas
      camera={{ position: [0, 0, 6] }}
      dpr={DPR}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <Suspense fallback={null}>
        <Raymarching />
      </Suspense>
    </Canvas>
  );
};

export default Scene;

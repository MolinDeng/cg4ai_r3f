'use client';

import { Suspense, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
// import { useWindowSize } from '@/hooks/UseWindowSize';
import * as THREE from 'three';

import vertexShader from '@/shaders/test0/vertexShader.glsl';
import fragmentShader from '@/shaders/test0/fragmentShader.glsl';
import useDevicePixelRatio from '@/hooks/useDevicePixelRatio';

const Test = () => {
  const { viewport } = useThree();
  const dpr = useDevicePixelRatio();
  const uniforms = useRef({
    u_time: { value: 0 },
    u_resolution: {
      value: new THREE.Vector2(window.innerWidth * dpr, window.innerHeight * dpr),
    },
  }).current;

  useFrame((_, delta) => {
    uniforms.u_time.value += delta;
    uniforms.u_resolution.value.set(window.innerWidth * dpr, window.innerHeight * dpr);
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

export default function TestPage() {
  return (
    <Canvas
      orthographic
      // dpr={1}
      camera={{ position: [0, 0, 6] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    >
      <Suspense fallback={null}>
        <Test />
      </Suspense>
    </Canvas>
  );
}

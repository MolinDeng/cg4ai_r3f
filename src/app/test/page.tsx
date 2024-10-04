'use client';

import { Suspense, useMemo, useRef } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { MathUtils, Mesh, ShaderMaterial, Vector2 } from 'three';
import { OrbitControls, shaderMaterial } from '@react-three/drei';

import vertexShader from '@/shaders/vertexShader.glsl';
import fragmentShader from '@/shaders/fragmentShader.glsl';
import { useWindowSize } from '@/hooks/UseWindowSize';

const TestMat = shaderMaterial(
  {
    u_time: 0,
    u_resolution: new Vector2(),
  },
  vertexShader,
  fragmentShader
);

extend({ TestMat });

const Test = () => {
  const mat = useRef<ShaderMaterial>();
  // const { width, height } = useWindowSize();
  const { viewport } = useThree();

  useFrame((_, delta) => {
    if (mat.current) {
      mat.current.uniforms.u_time.value += delta;
      mat.current.uniforms.u_resolution.value.set(
        viewport.width,
        viewport.height
      );
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      {/* @ts-ignore */}
      <testMat ref={mat} />
    </mesh>
  );
};

export default function TestPage() {
  return (
    <Canvas
      orthographic
      camera={{ position: [0.0, 0.0, 1000.0] }}
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
      {/* <OrbitControls /> */}
    </Canvas>
  );
}

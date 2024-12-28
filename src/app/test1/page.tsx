'use client';

import { Suspense, useRef } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { ShaderMaterial, Vector2 } from 'three';
import { shaderMaterial } from '@react-three/drei';

import vertexShader from '@/shaders/test1/vertexShader.glsl';
import fragmentShader from '@/shaders/test1/fragmentShader.glsl';
// import { useWindowSize } from '@/hooks/UseWindowSize';

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
      {/* @ts-expect-error Property 'testMat' does not exist on type 'JSX.IntrinsicElements'. */}
      <testMat ref={mat} />
    </mesh>
  );
};

export default function TestPage() {
  return (
    <Canvas
      orthographic
      dpr={1}
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

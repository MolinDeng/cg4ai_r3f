'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stats } from '@react-three/drei';
import * as Three from 'three';
import { Leva, useControls } from 'leva'

import vertexShader from '@/shaders/hw2/vertexShader.glsl';
import fragmentShader from '@/shaders/hw2/fragmentShader.glsl';
// import { useWindowSize } from '@/hooks/UseWindowSize';

const extractDimensionsFromFilename = (filename: string): [number, number, number] => {
  const match = filename.match(/_(\d+)x(\d+)x(\d+)_/);
  if (match) {
    const [, x, y, z] = match;
    return [parseInt(x), parseInt(y), parseInt(z)];
  }
  throw new Error('Invalid filename format. Expected *_NxNxN_*.raw');
};

const VolumeMesh = ({ volumeData, dims }: { volumeData: Uint8Array; dims: [number, number, number]}) => {
  const { camera, clock, invalidate } = useThree();

  // Leva Controls
  const { stepSize, isoValue, alphaVal, color, crossSection } = useControls({
    stepSize: { value: 0.01, min: 0.004, max: 0.016, step: 0.002 },
    isoValue: { value: 1, min: 0, max: 1, step: 0.04 },
    alphaVal: { value: 0.2, min: 0.01, max: 0.4, step: 0.01 },
    color: { value: 1, min: 1, max: 3, step: 1 },
    crossSection: { value: { x: 0.5, y: 0.5, z: 0.5 }, min: 0.02, max: 0.5, step: 0.02 },
  });

  const uniforms = useRef({
    u_camera: { value: camera.position },
    u_resolution: { value: new Three.Vector3(window.innerWidth, window.innerHeight, 1) },
    u_dt: { value: stepSize },
    u_time: { value: 0.0 },
    u_crossSectionSize: { value: new Three.Vector3(crossSection.x, crossSection.y, crossSection.z) },
    u_color: { value: color },
    u_volume: { value: new Three.Data3DTexture(volumeData, dims[0], dims[1], dims[2]) },
    u_isoValue: { value: isoValue },
    u_alphaVal: { value: alphaVal },
  }).current;

  useEffect(() => {
    const texture = uniforms.u_volume.value;
    texture.format = Three.RedFormat;
    texture.minFilter = Three.LinearFilter;
    texture.magFilter = Three.LinearFilter;
    texture.wrapS = Three.RepeatWrapping;
    texture.wrapT = Three.RepeatWrapping;
    texture.needsUpdate = true;

    invalidate();
  }, [volumeData]);

  useFrame(() => {
    uniforms.u_dt.value = stepSize;
    uniforms.u_isoValue.value = isoValue;
    uniforms.u_alphaVal.value = alphaVal;
    uniforms.u_crossSectionSize.value.set(crossSection.x, crossSection.y, crossSection.z);
    uniforms.u_color.value = color;
    uniforms.u_time.value = clock.getElapsedTime();
  });

  return (
    <mesh rotation-y={Math.PI / 2}>
      <boxGeometry args={[2, 2, 2]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
};

const TestPage = () => {
  const [volumeData, setVolumeData] = useState<Uint8Array | null>(null);
  const [dims, setDims] = useState<[number, number, number]>([256, 256, 256]);
  const [fileKey, setFileKey] = useState(0); // Used to force re-mount on file change

  const handleVolumeFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dimensions = extractDimensionsFromFilename(file.name);
      setDims(dimensions);

      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const data = new Uint8Array(arrayBuffer);
        setVolumeData(data);

        // Update key to force re-mount
        setFileKey((prevKey) => prevKey + 1);
      };
      reader.readAsArrayBuffer(file);
    } catch (err) {
      if (err instanceof Error) {
        console.error(err.message);
      } else {
        console.error('An unexpected error occurred', err);
      }
    }
  };

  return (
    <>
      <Canvas 
        key={fileKey}
        camera={{ position: [0, 0, -2], fov: 75 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
        }}
      >
        <Suspense fallback={null}>
          {volumeData && <VolumeMesh volumeData={volumeData} dims={dims} />}
        </Suspense>
        <OrbitControls />
      </Canvas>
      <div className="absolute top-16">
        <input type="file" onChange={handleVolumeFileUpload} />
      </div>
      <Leva /> {/* Leva UI for controls */}
      <Stats />
    </>
  );
};

export default TestPage;
// src/components/Scene.jsx
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useGLTF, Environment } from '@react-three/drei'
import { Suspense, useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'

function Model() {
  const { scene } = useGLTF('/homescreen-base-scene.glb')

  useEffect(() => {
    // Center the model horizontally and place on the ground at y=0
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())

    scene.position.x -= center.x
    scene.position.z -= center.z
    scene.position.y -= box.min.y
    scene.updateMatrixWorld()

    // Enable shadows on all meshes
    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  return <primitive object={scene} />
}

function GroundPlane() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, 0, 0]}>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#E6EFF4" />
    </mesh>
  )
}

/**
 * CameraRig
 * - Listens for mouse movement to rotate camera.
 * - Moves camera up on scroll-down, returns to original on scroll-up.
 */
function CameraRig() {
  const { camera, size } = useThree()

  // Store mouse for rotation
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const initialRotation = useRef(camera.rotation.clone())

  // Store the camera’s "target" position for smooth transitions
  const targetCameraPos = useRef(camera.position.clone())

  // (Optional) Keep the original camera position around if you like:
  const originalPosition = useRef(new THREE.Vector3(7, 0.75, 1))

  // Handle pointer movement (rotate)
  const handlePointerMove = useCallback(
    (event) => {
      setMouse({
        x: (event.clientX / size.width) * 2 - 1,
        y: (event.clientY / size.height) * 2 - 1,
      })
    },
    [size]
  )

  // Handle scroll: move camera up if scroll-down, return to original if scroll-up
  const handleWheel = useCallback((event) => {
    if (event.deltaY > 0) {
      // Scroll down => move camera up a bit
      targetCameraPos.current = targetCameraPos.current.clone()
      targetCameraPos.current.y += 0.1 // smaller step for slower upward movement
    } else if (event.deltaY < 0) {
      // Scroll up => return to original camera position
      targetCameraPos.current = originalPosition.current.clone()
    }
  }, [])

  // Attach listeners
  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('wheel', handleWheel)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [handlePointerMove, handleWheel])

  // On every frame, rotate & smoothly move the camera toward target
  useFrame(() => {
    // 1. Rotate camera based on mouse
    camera.rotation.y = initialRotation.current.y - mouse.x * 0.035
    camera.rotation.x = initialRotation.current.x - mouse.y * 0.025

    // 2. Smoothly move camera toward target
    //    Lower lerp factor => slower, smoother movement
    camera.position.lerp(targetCameraPos.current, 0.02)
  })

  return null
}

export default function Scene() {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#E6EFF4',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      }}
    >
      <Canvas
        shadows={{ type: THREE.PCFSoftShadowMap }}
        // Keep your original camera position & fov
        camera={{ position: [7, 0.75, 1], fov: 50 }}
      >
        <fog attach="fog" args={['#E6EFF4', 5, 20]} />

        <Suspense fallback={null}>
          <Environment preset="sunset" />
          <Model />
          <GroundPlane />
          <directionalLight
            position={[5, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <ambientLight intensity={0.3} />

          {/* CameraRig: rotates + scroll-based position changes */}
          <CameraRig />
        </Suspense>
      </Canvas>
    </div>
  )
}
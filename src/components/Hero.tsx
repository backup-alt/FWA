'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerspectiveCamera, Stars } from '@react-three/drei'
import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

function Football({ onLoad }: { onLoad?: () => void }) {
  const groupRef = useRef<THREE.Group>(null!)
  const { mouse } = useThree()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  useFrame((_, delta) => {
    if (!groupRef.current || !isLoaded) return

    groupRef.current.rotation.y += delta * 0.15
    groupRef.current.rotation.x += delta * 0.05

    const targetX = mouse.x * 0.3
    const targetY = -mouse.y * 0.3
    groupRef.current.rotation.y += (targetX - groupRef.current.rotation.y) * 0.02
    groupRef.current.rotation.x += (targetY - groupRef.current.rotation.x) * 0.02
  })

  return (
    <group ref={groupRef}>
      <hemisphereLight intensity={0.8} groundColor="#0a0a1a" color="#ffffff" />
      <directionalLight position={[5, 10, 7]} intensity={2} castShadow>
        <PerspectiveCamera makeDefault />
      </directionalLight>
      <directionalLight position={[-5, 5, -7]} intensity={1} color="#00ff00" />
      <pointLight position={[0, 0, 5]} intensity={1} color="#ffd700" decay={2} />
      
      <Stars radius={50} depth={100} count={2000} factor={4} saturation={0} />
      
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[1.8, 64, 64]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.7}
          metalness={0.1}
          envMapIntensity={1}
        />
      </mesh>
      
      <ParticleField />
    </group>
  )
}

function ParticleField() {
  const pointsRef = useRef<THREE.Points>(null!)

  useFrame((_, delta) => {
    if (!pointsRef.current) return
    const positions = pointsRef.current.geometry.attributes.position.array
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] -= delta * 0.5
      if (positions[i + 1] < -10) positions[i + 1] = 10
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true
    pointsRef.current.rotation.y += delta * 0.02
  })

  const positions = new Float32Array(1500 * 3)
  const colors = new Float32Array(1500 * 3)
  const sizes = new Float32Array(1500)

  for (let i = 0; i < 1500; i++) {
    const i3 = i * 3
    positions[i3] = (Math.random() - 0.5) * 30
    positions[i3 + 1] = (Math.random() - 0.5) * 30
    positions[i3 + 2] = (Math.random() - 0.5) * 30
    
    const color = new THREE.Color()
    color.setHSL(Math.random() * 0.1 + 0.3, 1, 0.5)
    colors[i3] = color.r
    colors[i3 + 1] = color.g
    colors[i3 + 2] = color.b
    
    sizes[i] = Math.random() * 0.15 + 0.05
  }

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export function Hero() {
  const [, setLoaded] = useState(false)

  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
    tl.fromTo('.hero-title', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1, delay: 0.3 })
      .fromTo('.hero-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
      .fromTo('.hero-cta', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.4')
      .fromTo('.hero-scroll', { opacity: 0 }, { opacity: 1, duration: 1, repeat: -1, yoyo: true }, '-=0.2')
  }, [])

  return (
    <div className="relative w-full h-screen min-h-[700px] overflow-hidden">
      <Canvas
        className="w-full h-full"
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        shadows
        onCreated={({ gl }) => {
          gl.setClearColor(0x0a0a1a, 1)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 1.2
        }}
      >
        <Football onLoad={() => setLoaded(true)} />
      </Canvas>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-6 pointer-events-none">
        <div className="text-center">
          <h1 className="hero-title text-5xl md:text-7xl lg:text-9xl font-extrabold tracking-tight leading-none mb-6">
            <span className="bg-gradient-to-r from-neon-green to-neon-gold bg-clip-text text-transparent">FOOTBALL</span>
            <br />
            <span className="text-white">3D</span>
          </h1>
          <p className="hero-subtitle text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-medium">
            Experience the beautiful game like never before. Immersive 3D, real-time stats, and cinematic visuals.
          </p>
          <a href="#fixtures" className="hero-cta btn-primary group inline-flex items-center">
            Explore Matches
            <svg className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
        </div>

        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 hero-scroll">
          <svg className="w-8 h-8 text-neon-green/50 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-900 to-transparent pointer-events-none" />
    </div>
  )
}
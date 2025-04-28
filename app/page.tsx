'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { initWebGL, renderWebGLCube } from './cube';

export default function WebGLTest() {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const glRef = useRef<WebGL2RenderingContext | null>(null);
    const cubeStateRef = useRef<ReturnType<typeof initWebGL> | null>(null);

    useEffect(() => {
        if (!containerRef.current || !canvasRef.current) return;

        // Create Three.js scene
        const scene = new THREE.Scene();
        sceneRef.current = scene;
        
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        cameraRef.current = camera;
        
        // Get WebGL2 context
        const gl = canvasRef.current.getContext('webgl2', {
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });

        if (!gl) {
            console.error('WebGL2 not supported');
            return;
        }

        glRef.current = gl;

        // Create Three.js renderer using the same context
        const renderer = new THREE.WebGLRenderer({ 
            canvas: canvasRef.current,
            context: gl,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        rendererRef.current = renderer;
        
        // Set renderer size with device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        renderer.setPixelRatio(dpr);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setClearColor(0x666666, 1);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        scene.add(directionalLight);

        // Create grid planes
        const gridSize = 10;
        const gridDivisions = 10;

        // XY plane (red)
        const xyGrid = new THREE.GridHelper(gridSize, gridDivisions, 0xff0000, 0xff0000);
        xyGrid.material.transparent = true;
        xyGrid.material.opacity = 0.8;
        xyGrid.material.linewidth = 4;
        xyGrid.material.side = THREE.DoubleSide;
        scene.add(xyGrid);

        // XZ plane (blue)
        const xzGrid = new THREE.GridHelper(gridSize, gridDivisions, 0x0000ff, 0x0000ff);
        xzGrid.material.transparent = true;
        xzGrid.material.opacity = 0.5;
        xzGrid.material.linewidth = 4;
        xzGrid.material.side = THREE.DoubleSide;
        xzGrid.rotation.x = Math.PI / 2;
        scene.add(xzGrid);

        // YZ plane (yellow)
        const yzGrid = new THREE.GridHelper(gridSize, gridDivisions, 0xffff00, 0xffff00);
        yzGrid.material.transparent = true;
        yzGrid.material.opacity = 0.5;
        yzGrid.material.linewidth = 4;
        yzGrid.material.side = THREE.DoubleSide;
        yzGrid.rotation.x = Math.PI / 2;
        yzGrid.rotation.z = Math.PI / 2;
        yzGrid.position.set(0, 0, 0);
        scene.add(yzGrid);

        // Position camera
        camera.position.set(5, 5, 5);
        camera.lookAt(new THREE.Vector3(0, 0, 0));

        // Add OrbitControls
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.screenSpacePanning = false;
        controls.minDistance = 1;
        controls.maxDistance = 50;
        controls.maxPolarAngle = Math.PI;
        controls.target.set(0, 0, 0);
        controls.update();
        controlsRef.current = controls;

        // Initialize WebGL cube
        const cubeState = initWebGL(gl, camera);
        if (!cubeState) {
            console.error('Failed to initialize WebGL cube');
            return;
        }
        cubeStateRef.current = cubeState;

        // Animation loop
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            
            // Clear the context
            if (gl) {
                gl.clearColor(0.4, 0.4, 0.4, 1.0);
                gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            }
            
            // First render Three.js scene
            renderer.render(scene, camera);
            
            // Then render WebGL cube
            if (cubeStateRef.current && gl) {
                renderWebGLCube(cubeStateRef.current, camera);
            }
        }
        animate();

        // Handle window resize
        const handleResize = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
            canvasRef.current!.width = width * dpr;
            canvasRef.current!.height = height * dpr;
        };

        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (gl) {
                gl.getExtension('WEBGL_lose_context')?.loseContext();
            }
            controls.dispose();
        };
    }, []);

    return (
        <div ref={containerRef} className="w-full h-full relative">
            <canvas 
                ref={canvasRef} 
                className="w-full h-full absolute top-0 left-0"
                style={{ display: 'block' }}
            />
        </div>
    );
}

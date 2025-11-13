import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

interface ThreeBackgroundProps {
  onInitError: () => void;
}

const ThreeBackground: React.FC<ThreeBackgroundProps> = ({ onInitError }) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [is4DMode, setIs4DMode] = useState(false);
    const sceneRef = useRef<THREE.Scene | null>(null);

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        let renderer: THREE.WebGLRenderer;
        let animationFrameId: number;
        let handleMouseMove: (event: MouseEvent) => void;
        let handleResize: () => void;

        try {
            // --- Basic Scene Setup ---
            const scene = new THREE.Scene();
            sceneRef.current = scene;
            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 8; // Pulled camera back

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            currentMount.appendChild(renderer.domElement);
            
            // --- Post-processing for Glow Effect ---
            const renderScene = new RenderPass(scene, camera);
            // Adjusted bloom intensity for larger object
            const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.0, 0.4, 0.75);
            const composer = new EffectComposer(renderer);
            composer.addPass(renderScene);
            composer.addPass(bloomPass);

            // --- Lighting ---
            scene.add(new THREE.AmbientLight(0x404040, 2));
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
            directionalLight.position.set(5, 5, 5);
            scene.add(directionalLight);

            // --- Mouse Tracking ---
            const mouse = new THREE.Vector2();
            handleMouseMove = (event: MouseEvent) => {
                mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
                mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            };
            window.addEventListener('mousemove', handleMouseMove);

            // --- Dice Creation ---
            const createDiceFaceTexture = (value: number) => {
                const size = 128;
                const canvas = document.createElement('canvas');
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d')!;

                ctx.fillStyle = '#1e293b';
                ctx.fillRect(0, 0, size, size);

                ctx.fillStyle = '#818cf8'; // Lighter purple for pips
                ctx.shadowColor = '#38bdf8'; // Neon blue glow
                ctx.shadowBlur = size * 0.15;

                const pipRadius = size * 0.1;
                const center = size / 2, q = size / 4, tq = size * 3 / 4;
                const pos: { [k: number]: number[][] } = {
                    1: [[center, center]], 2: [[q, q], [tq, tq]], 3: [[q, q], [center, center], [tq, tq]],
                    4: [[q, q], [tq, q], [q, tq], [tq, tq]], 5: [[q, q], [tq, q], [center, center], [q, tq], [tq, tq]],
                    6: [[q, q], [tq, q], [q, center], [tq, center], [q, tq], [tq, tq]],
                };
                
                if (pos[value]) {
                    for (const [x, y] of pos[value]) {
                        ctx.beginPath(); ctx.arc(x, y, pipRadius, 0, Math.PI * 2); ctx.fill();
                    }
                }
                return new THREE.CanvasTexture(canvas);
            };
            
            const diceGroup = new THREE.Group();
            diceGroup.name = 'diceGroup';
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const materials = [1, 2, 3, 4, 5, 6].map(num => new THREE.MeshStandardMaterial({ map: createDiceFaceTexture(num) }));
            const diceMesh = new THREE.Mesh(geometry, materials);
            
            const edges = new THREE.EdgesGeometry(geometry);
            const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x8b5cf6 }));
            
            diceGroup.add(diceMesh);
            diceGroup.add(line);
            diceGroup.scale.set(3, 3, 3); // Increased scale
            scene.add(diceGroup);

            // --- Tesseract (4D Cube) Creation ---
            const tesseractGroup = new THREE.Group();
            tesseractGroup.name = 'tesseractGroup';
            const createWireframeCube = (size: number, color: THREE.ColorRepresentation) => new THREE.LineSegments(
              new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size)),
              new THREE.LineBasicMaterial({ color })
            );
            const outerCube = createWireframeCube(2.5, 0x8b5cf6);
            const innerCube = createWireframeCube(1.25, 0x38bdf8);
            tesseractGroup.add(outerCube, innerCube);
            
            const vertices = new THREE.BoxGeometry(1, 1, 1).attributes.position;
            for (let i = 0; i < vertices.count; i++) {
                const start = new THREE.Vector3().fromBufferAttribute(vertices, i).multiplyScalar(1.25);
                const end = new THREE.Vector3().fromBufferAttribute(vertices, i).multiplyScalar(2.5);
                const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
                tesseractGroup.add(new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0x334155 })));
            }
            tesseractGroup.visible = false;
            tesseractGroup.scale.set(2, 2, 2); // Increased scale
            scene.add(tesseractGroup);

            // --- Animation Loop ---
            const clock = new THREE.Clock();
            const driftBounds = 10;
            const animate = () => {
                const elapsedTime = clock.getElapsedTime();
                const delta = clock.getDelta();
                
                // Animate Dice
                diceGroup.rotation.x += 0.003;
                diceGroup.rotation.y += 0.004;
                diceGroup.position.y = Math.sin(elapsedTime) * 0.2;
                diceGroup.position.x += 0.2 * delta;
                if (diceGroup.position.x > driftBounds) diceGroup.position.x = -driftBounds;

                // Add mouse interaction
                diceGroup.rotation.x += (mouse.y * 0.5 - diceGroup.rotation.x) * 0.05;
                diceGroup.rotation.y += (mouse.x * 0.5 - diceGroup.rotation.y) * 0.05;

                // Animate Tesseract
                tesseractGroup.rotation.x += 0.003;
                tesseractGroup.rotation.y += 0.004;
                innerCube.rotation.x -= 0.005;
                innerCube.rotation.y -= 0.006;
                tesseractGroup.position.y = Math.sin(elapsedTime) * 0.2;
                tesseractGroup.position.x += 0.2 * delta;
                 if (tesseractGroup.position.x > driftBounds) tesseractGroup.position.x = -driftBounds;
                
                composer.render();
                animationFrameId = requestAnimationFrame(animate);
            };
            
            const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if(!reducedMotion) {
               animate();
            }

            // --- Handle Resize ---
            handleResize = () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
                composer.setSize(window.innerWidth, window.innerHeight);
            };
            window.addEventListener('resize', handleResize);

        } catch (error) {
            // Silently call the error handler without logging to console.
            // The App component will handle disabling the feature.
            onInitError();
            return;
        }

        // --- Cleanup ---
        return () => {
            cancelAnimationFrame(animationFrameId);
            if (handleResize) window.removeEventListener('resize', handleResize);
            if (handleMouseMove) window.removeEventListener('mousemove', handleMouseMove);
            if (currentMount && renderer?.domElement) {
                if(currentMount.contains(renderer.domElement)) {
                    currentMount.removeChild(renderer.domElement);
                }
            }
            if(sceneRef.current){
                sceneRef.current.traverse(object => {
                    if (object instanceof THREE.Mesh) {
                        object.geometry.dispose();
                        if(Array.isArray(object.material)) {
                            object.material.forEach(material => material.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                });
            }
        };
    }, [onInitError]);

    // --- 4D Mode Toggle Effect ---
    useEffect(() => {
      const scene = sceneRef.current;
      if (!scene) return;
      const dice = scene.getObjectByName('diceGroup');
      const tesseract = scene.getObjectByName('tesseractGroup');
      if (dice && tesseract) {
          dice.visible = !is4DMode;
          tesseract.visible = is4DMode;
      }
    }, [is4DMode]);

    return (
      <>
        <div ref={mountRef} id="three-canvas" />
        <button 
          onClick={() => setIs4DMode(prev => !prev)}
          className="fixed bottom-4 right-4 z-50 bg-brand-surface/80 text-brand-text-secondary hover:text-brand-primary backdrop-blur-sm p-3 rounded-full shadow-lg transition-colors"
          title={is4DMode ? "Switch to 3D Dice" : "Switch to 4D Tesseract"}
        >
          {is4DMode ? 
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg> : 
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M8 8h8v8H8z"></path><path d="M3 8h2m14 0h2M8 3v2m0 14v2m8-18v2m0 14v2M3 16h2m14 0h2M16 3v2m0 14v2"></path></svg>
          }
        </button>
      </>
    );
};

export default ThreeBackground;
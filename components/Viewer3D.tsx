import React, { useRef, Suspense, useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  Html, 
  GizmoHelper, 
  GizmoViewport, 
  ContactShadows,
  useGLTF,
  Resize,
  Center,
  useFBX,
  Line,
  Grid
} from '@react-three/drei';
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';
import { Comment, Part, User, RemotePeer } from '../types';

// --- Interfaces ---

export interface Viewer3DRef {
  captureScreenshot: () => string;
}

interface Viewer3DProps {
  comments: Comment[];
  onAddComment: (point: { x: number; y: number; z: number }, partId?: string) => void;
  highlightedCommentId: string | null;
  exploded?: boolean;
  parts?: Part[];
  fileUrl?: string;
  fileName?: string;
  projectId?: string;
  currentUser: User;
  
  // Realtime
  remoteUsers: Record<string, RemotePeer>;
  onCursorMove: (point: { x: number; y: number; z: number }) => void;
  onCameraMove: (pos: number[], quat: number[]) => void;
  followTarget?: RemotePeer | null;
  
  // Tools
  measurementMode: boolean;
  clippingEnabled: boolean;
  clippingValue: number;
  wireframe?: boolean;
  showGrid?: boolean;
  
  // Theme
  isDarkMode?: boolean;
}

// --- Helper Components ---

const CameraSync = ({ onCameraMove, followTarget }: { onCameraMove: (pos: number[], quat: number[]) => void, followTarget?: RemotePeer | null }) => {
  const { camera } = useThree();
  const lastUpdate = useRef(0);

  useFrame((state) => {
    const now = state.clock.getElapsedTime();
    
    // If following someone, interpolate to their position
    if (followTarget && followTarget.camera) {
      const targetPos = new THREE.Vector3().fromArray(followTarget.camera.position);
      const targetQuat = new THREE.Quaternion().fromArray(followTarget.camera.quaternion);
      
      camera.position.lerp(targetPos, 0.05);
      camera.quaternion.slerp(targetQuat, 0.05);
    } else {
      // Only broadcast if NOT following (prevent feedback loops)
      if (now - lastUpdate.current > 0.1) {
        onCameraMove(camera.position.toArray(), camera.quaternion.toArray());
        lastUpdate.current = now;
      }
    }
  });
  return null;
};

const ObjectHighlighter = ({ hoverId, selectId, wireframe }: { hoverId: string | null, selectId: string | null, wireframe: boolean }) => {
  const { scene } = useThree();
  
  useFrame(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
         const mesh = obj as THREE.Mesh;
         
         // Ensure material is a standard material we can modify
         if (!(mesh.material instanceof THREE.MeshStandardMaterial) && !(mesh.material instanceof THREE.MeshBasicMaterial)) {
            return;
         }
         
         const material = mesh.material as THREE.MeshStandardMaterial;

         // Store original state if not stored
         if (!mesh.userData.origEmissive) {
            mesh.userData.origEmissive = material.emissive ? material.emissive.getHex() : 0x000000;
            // mesh.userData.origColor = material.color ? material.color.getHex() : 0xffffff;
         }

         // Wireframe Logic
         material.wireframe = wireframe;

         // Highlight Logic
         // We check both UUID (for hover) and Name (for persistent part selection)
         const isHovered = mesh.uuid === hoverId;
         const isSelected = selectId && (mesh.name === selectId || mesh.uuid === selectId);

         if (isSelected) {
            material.emissive.setHex(0x2E2CF6); // Brand Primary
            material.emissiveIntensity = 0.5;
         } else if (isHovered) {
            material.emissive.setHex(0x5B5AF7); // Brand Secondary
            material.emissiveIntensity = 0.3;
         } else {
            material.emissive.setHex(mesh.userData.origEmissive);
            material.emissiveIntensity = 0;
         }
      }
    });
  });
  return null;
};

const RemoteUserVisual: React.FC<{ data: RemotePeer; isTarget?: boolean }> = ({ data, isTarget }) => {
  const cursorRef = useRef<THREE.Group>(null);
  const cameraGroupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    // Smooth interpolation for cursor
    if (cursorRef.current && data.cursor) {
      cursorRef.current.position.lerp(new THREE.Vector3(data.cursor.x, data.cursor.y, data.cursor.z), 0.2);
    }
    // Smooth interpolation for camera
    if (cameraGroupRef.current && data.camera) {
      const targetPos = new THREE.Vector3().fromArray(data.camera.position);
      const targetQuat = new THREE.Quaternion().fromArray(data.camera.quaternion);
      cameraGroupRef.current.position.lerp(targetPos, 0.1);
      cameraGroupRef.current.quaternion.slerp(targetQuat, 0.1);
    }
    
    // Scale pulse if speaking
    if (cameraGroupRef.current) {
        if (data.isSpeaking) {
            const scale = 1 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
            cameraGroupRef.current.scale.setScalar(scale);
        } else {
            cameraGroupRef.current.scale.setScalar(1);
        }
    }
  });

  // Don't render camera visual if we are inside it (following them)
  if (isTarget) return null;

  return (
    <>
      {data.cursor && (
        <group ref={cursorRef} position={[data.cursor.x, data.cursor.y, data.cursor.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.08, 0.25, 16]} />
            <meshBasicMaterial color={data.color} transparent opacity={0.8} />
          </mesh>
          <Html position={[0, 0.2, 0]} center>
            <div 
              className="px-2 py-0.5 rounded text-[10px] font-bold text-white whitespace-nowrap shadow-sm flex items-center gap-1"
              style={{ backgroundColor: data.color }}
            >
              {data.name}
            </div>
          </Html>
        </group>
      )}
      {data.camera && (
        <group ref={cameraGroupRef}>
          <group rotation={[0, Math.PI, 0]}>
            <mesh>
              <boxGeometry args={[0.3, 0.2, 0.4]} />
              <meshBasicMaterial color={data.isPresenting ? '#C7F000' : data.color} wireframe />
            </mesh>
            <mesh position={[0, 0, 0.2]} rotation={[Math.PI/2, 0, 0]}>
                <coneGeometry args={[0.2, 0.4, 4, 1, true]} />
                <meshBasicMaterial color={data.isPresenting ? '#C7F000' : data.color} wireframe transparent opacity={0.3} />
            </mesh>
            {data.isSpeaking && (
               <Html position={[0, 0.4, 0]} center>
                 <div className="bg-white rounded-full p-1 shadow-md">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 </div>
               </Html>
            )}
            {data.isPresenting && (
                <Html position={[0, 0.6, 0]} center>
                    <div className="bg-brand-accent px-2 py-0.5 rounded text-[10px] font-bold text-brand-primary shadow-sm">
                        Presenting
                    </div>
                </Html>
            )}
          </group>
        </group>
      )}
    </>
  );
};

// --- Model Components ---

const Clipper = ({ enabled, value }: { enabled: boolean, value: number }) => {
  const { scene } = useThree();
  const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, -1, 0), 0));

  useEffect(() => {
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const material = (obj as THREE.Mesh).material as THREE.MeshStandardMaterial;
        if (material) {
           material.clippingPlanes = enabled ? [planeRef.current] : [];
           material.clipShadows = true;
           material.needsUpdate = true;
        }
      }
    });
  }, [scene, enabled]);

  useFrame(() => {
    if (enabled) {
        const y = THREE.MathUtils.lerp(-2, 4, value);
        planeRef.current.constant = y;
    }
  });

  return null;
};

const GenericModelLoader = ({ url, fileName, onHover, onUnhover }: { url: string, fileName?: string, onHover: (e: any) => void, onUnhover: (e: any) => void }) => {
  const getLoader = () => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    
    // Props for interactivity
    const interactionProps = {
      onPointerOver: onHover,
      onPointerOut: onUnhover
    };
    
    if (ext === 'obj') {
      const obj = useLoader(OBJLoader, url);
      return <primitive object={obj.clone()} {...interactionProps} />;
    }
    if (ext === 'fbx') {
      const fbx = useFBX(url);
      return <primitive object={fbx.clone()} scale={0.01} {...interactionProps} />;
    }
    const { scene } = useGLTF(url);
    return <primitive object={scene.clone()} {...interactionProps} />;
  };

  return (
    <Resize scale={3}>
      <Center top>
        {getLoader()}
      </Center>
    </Resize>
  );
};

// Fallback Model
const MechanicalPart = ({ exploded, parts, onHover, onUnhover }: { exploded: boolean, parts?: Part[], onHover: (e: any) => void, onUnhover: (e: any) => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  const isVisible = (id: string) => parts ? parts.find(p => p.id === id)?.visible ?? true : true;
  
  useFrame((state, delta) => {
    if (groupRef.current) {
      const speed = 4 * delta;
      const topCap = groupRef.current.getObjectByName('TopCap');
      if (topCap) topCap.position.y = THREE.MathUtils.lerp(topCap.position.y, exploded ? 2.5 : 1.5, speed);
      const hub = groupRef.current.getObjectByName('Hub');
      if (hub) hub.position.y = THREE.MathUtils.lerp(hub.position.y, exploded ? 0.8 : 0.5, speed);
      [0, 1, 2, 3].forEach(i => {
         const flange = groupRef.current?.getObjectByName(`Flange_${i}`);
         if (flange) flange.position.x = THREE.MathUtils.lerp(flange.position.x, exploded ? 2.5 : 1.5, speed);
      });
    }
  });

  const interactionProps = {
    onPointerOver: onHover,
    onPointerOut: onUnhover
  };

  return (
    <group ref={groupRef}>
      <mesh name="BasePlate" position={[0, -0.5, 0]} receiveShadow castShadow visible={isVisible('BasePlate')} {...interactionProps}>
        <cylinderGeometry args={[2, 2.2, 0.2, 32]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh name="Hub" position={[0, 0.5, 0]} castShadow receiveShadow visible={isVisible('Hub')} {...interactionProps}>
        <cylinderGeometry args={[1, 1, 2, 32]} />
        <meshStandardMaterial color="#889" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh name="TopCap" position={[0, 1.5, 0]} castShadow visible={isVisible('TopCap')} {...interactionProps}>
         <torusGeometry args={[0.8, 0.2, 16, 32]} />
         <meshStandardMaterial color="#C7F000" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
};

const SceneContent = ({ 
  fileUrl, fileName, exploded, parts, clippingEnabled, clippingValue,
  measurementMode, onInteraction, onScreenshot, setHoveredMesh
}: any) => {
  const { gl, scene, camera } = useThree();
  
  useEffect(() => {
    onScreenshot.current = () => {
      gl.render(scene, camera);
      return gl.domElement.toDataURL('image/png');
    };
  }, [gl, scene, camera, onScreenshot]);

  const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);
  
  // Raycasting click handler
  const handleClick = (e: any) => {
    // Only handle click for the first intersected object (stops propagation implicitly by logic)
    e.stopPropagation();

    if (measurementMode) {
       if (measurePoints.length >= 2) {
         setMeasurePoints([e.point]);
       } else {
         setMeasurePoints([...measurePoints, e.point]);
       }
    } else {
       if (e.delta < 5) {
         const partName = e.object.name || e.object.parent?.name || 'Unknown Part';
         // Trigger interaction callback with raycast data
         onInteraction(e.point, partName);
       }
    }
  };

  const handleHover = (e: any) => {
    e.stopPropagation();
    setHoveredMesh(e.object.uuid);
    // Change cursor
    document.body.style.cursor = 'pointer';
  };

  const handleUnhover = (e: any) => {
    setHoveredMesh(null);
    document.body.style.cursor = 'auto';
  };

  return (
    <>
      <Clipper enabled={clippingEnabled} value={clippingValue} />
      
      <group onClick={handleClick}>
         <Suspense fallback={null}>
            {fileUrl ? (
              <GenericModelLoader 
                url={fileUrl} 
                fileName={fileName} 
                onHover={handleHover}
                onUnhover={handleUnhover}
              />
            ) : (
              <MechanicalPart 
                exploded={exploded} 
                parts={parts} 
                onHover={handleHover}
                onUnhover={handleUnhover}
              />
            )}
         </Suspense>
      </group>

      {/* Measurement Visuals */}
      {measurePoints.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05]} />
          <meshBasicMaterial color="#FF4757" toneMapped={false} />
        </mesh>
      ))}
      {measurePoints.length === 2 && (
        <>
           <Line points={measurePoints} color="#FF4757" lineWidth={2} />
           <Html position={measurePoints[0].clone().add(measurePoints[1]).multiplyScalar(0.5)}>
              <div className="bg-[#FF4757] text-white px-2 py-1 rounded text-xs font-bold font-mono shadow-md">
                {measurePoints[0].distanceTo(measurePoints[1]).toFixed(2)}m
              </div>
           </Html>
        </>
      )}
    </>
  );
};

// --- Main Viewer Component ---

const Viewer3D = forwardRef<Viewer3DRef, Viewer3DProps>((props, ref) => {
  const { 
    comments, onAddComment, highlightedCommentId, exploded = false, parts, 
    fileUrl, fileName, currentUser,
    measurementMode, clippingEnabled, clippingValue,
    remoteUsers, onCursorMove, onCameraMove,
    followTarget,
    wireframe = false,
    showGrid = true,
    isDarkMode = false
  } = props;
  
  const screenshotFnRef = useRef<(() => string) | null>(null);
  const [hoveredMeshId, setHoveredMeshId] = useState<string | null>(null);
  
  // Determine if a part is selected based on highlighted comment
  const selectedPartId = highlightedCommentId 
    ? comments.find(c => c.id === highlightedCommentId)?.partId || null 
    : null;

  useImperativeHandle(ref, () => ({
    captureScreenshot: () => {
      return screenshotFnRef.current ? screenshotFnRef.current() : '';
    }
  }));

  const handlePointerMove = (e: any) => {
    if (e.point) {
       onCursorMove(e.point);
    }
  };

  return (
    <div className={`w-full h-full rounded-xl overflow-hidden relative shadow-inner select-none transition-colors duration-500 ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-[#f0f2f5]'}`}>
      <Canvas 
        shadows 
        camera={{ position: [4, 4, 4], fov: 50 }} 
        dpr={[1, 2]} 
        onPointerMove={handlePointerMove}
        gl={{ localClippingEnabled: true, preserveDrawingBuffer: true }}
      >
        <CameraSync onCameraMove={onCameraMove} followTarget={followTarget} />
        {/* Environment Changes based on Theme */}
        <Environment preset={isDarkMode ? "night" : "city"} />
        <ambientLight intensity={isDarkMode ? 0.2 : 0.5} />
        <directionalLight position={[5, 5, -10]} intensity={isDarkMode ? 0.5 : 1} castShadow shadow-bias={-0.0001} />
        
        {/* Logic for Highlighting & Wireframe */}
        <ObjectHighlighter 
           hoverId={hoveredMeshId} 
           selectId={selectedPartId} 
           wireframe={wireframe}
        />

        <group position={[0, -0.5, 0]}>
           <SceneContent 
              fileUrl={fileUrl} 
              fileName={fileName} 
              exploded={exploded} 
              parts={parts}
              clippingEnabled={clippingEnabled}
              clippingValue={clippingValue}
              measurementMode={measurementMode}
              onInteraction={onAddComment}
              onScreenshot={screenshotFnRef}
              setHoveredMesh={setHoveredMeshId}
           />
           <ContactShadows position={[0, 0, 0]} opacity={isDarkMode ? 0.6 : 0.4} scale={10} blur={2.5} far={4} color={isDarkMode ? "#000000" : "#000000"} />
           {showGrid && (
             <Grid 
                infiniteGrid 
                fadeDistance={30} 
                sectionColor={isDarkMode ? "#4B5563" : "#2E2CF6"} 
                cellColor={isDarkMode ? "#374151" : "#cccccc"} 
                position={[0, -0.01, 0]}
             />
           )}
        </group>

        {Object.values(remoteUsers).map((user: RemotePeer) => (
           <RemoteUserVisual 
              key={user.id} 
              data={user} 
              isTarget={followTarget?.id === user.id}
           />
        ))}

        <AnnotationMarkers comments={comments} highlightedId={highlightedCommentId} />

        <OrbitControls 
          makeDefault 
          enabled={!followTarget}
          minPolarAngle={0} 
          maxPolarAngle={Math.PI / 1.75} 
        />
        
        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#FF4757', '#2ED573', '#2E2CF6']} labelColor={isDarkMode ? "white" : "black"} />
        </GizmoHelper>
      </Canvas>
      
      <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full shadow-lg text-xs font-medium pointer-events-none border w-max max-w-[90%] text-center backdrop-blur-md
        ${isDarkMode ? 'bg-black/80 text-gray-300 border-white/10' : 'bg-white/90 text-text-secondary border-white/50'}`}>
        {followTarget ? (
           <span className="text-brand-primary font-bold animate-pulse flex items-center gap-2">
             <span className="w-2 h-2 bg-brand-primary rounded-full" />
             FOLLOWING {followTarget.name.toUpperCase()}
           </span>
        ) : measurementMode ? (
           <span className="text-brand-primary font-bold">Measurement Mode Active: Click two points to measure</span>
        ) : (
           <span>Left click to Rotate • Right click to Pan • Double click to Comment</span>
        )}
      </div>
    </div>
  );
});

const AnnotationMarkers = ({ comments, highlightedId }: { comments: Comment[], highlightedId: string | null }) => {
  return (
    <>
      {comments.filter(c => c.position && c.status === 'open').map((comment, index) => (
        <Html key={comment.id} position={comment.position as [number, number, number]} zIndexRange={[100, 0]}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 cursor-pointer transition-all duration-300 transform hover:scale-110 ${comment.id === highlightedId || highlightedId === null ? 'bg-brand-primary border-white text-white shadow-xl scale-110 z-50' : 'bg-white/80 border-brand-primary text-brand-primary shadow-sm backdrop-blur-sm scale-100 opacity-60'}`}>
            <span className="font-bold text-xs">{index + 1}</span>
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-48 opacity-0 hover:opacity-100 pointer-events-none transition-opacity bg-black/90 text-white text-xs p-2 rounded-lg z-50">
               {comment.partId && <div className="text-[10px] text-gray-400 uppercase font-bold mb-1">{comment.partId}</div>}
               {comment.text.substring(0, 50)}...
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 w-px h-8 bg-brand-primary origin-top -translate-y-full -translate-x-1/2 opacity-50 pointer-events-none" />
        </Html>
      ))}
    </>
  );
};

export default Viewer3D;
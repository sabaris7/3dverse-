
export interface User {
  id: string;
  name: string;
  avatar: string;
  color: string;
  role: 'admin' | 'reviewer' | 'viewer';
}

export interface Comment {
  id: string;
  projectId: string; // Foreign Key
  userId: string;
  text: string;
  createdAt: string;
  position?: [number, number, number] | null; // 3D coordinates
  partId?: string; // Specific mesh name/ID attached to
  status: 'open' | 'resolved';
  replies?: Comment[];
}

export interface Project {
  id: string;
  name: string;
  thumbnail: string;
  lastModified: string;
  status: 'Open' | 'In Review' | 'Approved';
  owner: string;
  activeUsers: number;
  fileUrl?: string;
  fileName?: string;
}

export enum ViewMode {
  DASHBOARD = 'DASHBOARD',
  WORKSPACE = 'WORKSPACE',
  PROJECTS = 'PROJECTS',
  SHARED = 'SHARED',
  ACTIVITY = 'ACTIVITY',
  SETTINGS = 'SETTINGS',
}

export interface AnnotationPoint {
  x: number;
  y: number;
  z: number;
}

export interface Part {
  id: string;
  name: string;
  visible: boolean;
}

// --- Realtime Types ---

export interface RemotePeer {
  id: string;
  name: string;
  color: string;
  avatar: string;
  cursor?: { x: number, y: number, z: number };
  camera?: { position: number[], quaternion: number[] };
  lastSeen: number;
  // Phase 3: Comm Stats
  isSpeaking?: boolean;
  isMuted?: boolean;
  isPresenting?: boolean;
}

export type RealtimeEventType = 
  | 'JOIN' 
  | 'LEAVE' 
  | 'HEARTBEAT' 
  | 'CURSOR_MOVE' 
  | 'CAMERA_MOVE' 
  | 'COMMENT_ADD'
  | 'COMMENT_UPDATE'
  | 'PART_TOGGLE'
  | 'EXPLODE_TOGGLE'
  | 'PEER_UPDATE'      // For mic/mute status
  | 'PRESENTATION_START'
  | 'PRESENTATION_STOP';

export interface RealtimeEvent {
  type: RealtimeEventType;
  projectId: string;
  senderId: string;
  payload: any;
  timestamp: number;
}

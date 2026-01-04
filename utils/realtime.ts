import { useEffect, useState, useRef, useCallback } from 'react';
import { User, RemotePeer, RealtimeEvent, RealtimeEventType } from '../types';

/**
 * MockSocketService
 * 
 * Simulates a WebSocket connection using BroadcastChannel.
 * This architecture is designed to be easily swapped for `socket.io-client` 
 * when moving to a real backend.
 */
class MockSocketService {
  private channel: BroadcastChannel | null = null;
  private listeners: Record<string, ((payload: any, senderId: string) => void)[]> = {};
  private userId: string = '';
  private projectId: string = '';
  private isConnected: boolean = false;

  constructor() {}

  public connect(projectId: string, userId: string) {
    if (this.isConnected && this.projectId === projectId) return;
    
    this.disconnect();
    this.userId = userId;
    this.projectId = projectId;
    this.channel = new BroadcastChannel(`3dverse_room_${projectId}`);
    
    this.channel.onmessage = (event: MessageEvent<RealtimeEvent>) => {
      const { type, payload, senderId, projectId: eventProjectId } = event.data;
      
      // Ignore events from self or other projects (though channel separates projects)
      if (senderId === this.userId || eventProjectId !== this.projectId) return;

      if (this.listeners[type]) {
        this.listeners[type].forEach(callback => callback(payload, senderId));
      }
    };

    this.isConnected = true;
    console.log(`[Realtime] Connected to room: ${projectId}`);
  }

  public disconnect() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.listeners = {};
    this.isConnected = false;
  }

  public on(event: RealtimeEventType, callback: (payload: any, senderId: string) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  public emit(event: RealtimeEventType, payload: any) {
    if (!this.channel || !this.isConnected) return;

    const message: RealtimeEvent = {
      type: event,
      projectId: this.projectId,
      senderId: this.userId,
      payload: payload,
      timestamp: Date.now()
    };

    this.channel.postMessage(message);
  }
}

// Singleton instance
const socket = new MockSocketService();

export const useRealtime = (projectId: string, currentUser: User) => {
  const [peers, setPeers] = useState<Record<string, RemotePeer>>({});
  const [isConnected, setIsConnected] = useState(false);
  
  // Realtime State events exposed to UI
  const [lastEvent, setLastEvent] = useState<{type: RealtimeEventType, payload: any, senderId?: string} | null>(null);

  // Connect to room
  useEffect(() => {
    socket.connect(projectId, currentUser.id);
    setIsConnected(true);

    // Announce presence immediately
    socket.emit('JOIN', { 
      user: { 
        id: currentUser.id, 
        name: currentUser.name, 
        avatar: currentUser.avatar, 
        color: currentUser.color 
      } 
    });

    return () => {
      socket.emit('LEAVE', { userId: currentUser.id });
      socket.disconnect();
      setIsConnected(false);
    };
  }, [projectId, currentUser.id]);

  // Handle Incoming Events
  useEffect(() => {
    if (!isConnected) return;

    // 1. Peer Management
    const handleJoin = (payload: any, senderId: string) => {
      setPeers(prev => ({
        ...prev,
        [senderId]: {
          id: senderId,
          name: payload.user.name,
          avatar: payload.user.avatar,
          color: payload.user.color,
          lastSeen: Date.now()
        }
      }));
      
      // Reply with our presence so they know about us (Handshake)
      socket.emit('HEARTBEAT', { 
        user: { 
          id: currentUser.id, 
          name: currentUser.name, 
          avatar: currentUser.avatar, 
          color: currentUser.color 
        } 
      });
      
      setLastEvent({ type: 'JOIN', payload, senderId });
    };

    const handleLeave = (payload: any, senderId: string) => {
      setPeers(prev => {
        const next = { ...prev };
        delete next[senderId];
        return next;
      });
      setLastEvent({ type: 'LEAVE', payload, senderId });
    };

    const handleHeartbeat = (payload: any, senderId: string) => {
      setPeers(prev => ({
        ...prev,
        [senderId]: {
          ...(prev[senderId] || { 
            id: senderId, 
            name: payload.user.name, 
            avatar: payload.user.avatar, 
            color: payload.user.color 
          }),
          lastSeen: Date.now(),
          // Update comms stats if included in heartbeat
          isMuted: payload.isMuted ?? prev[senderId]?.isMuted,
          isSpeaking: payload.isSpeaking ?? prev[senderId]?.isSpeaking,
          isPresenting: payload.isPresenting ?? prev[senderId]?.isPresenting,
        }
      }));
    };

    // 2. Interaction Events
    const handleCursor = (payload: any, senderId: string) => {
      setPeers(prev => {
        if (!prev[senderId]) return prev;
        return {
          ...prev,
          [senderId]: { ...prev[senderId], cursor: payload, lastSeen: Date.now() }
        };
      });
    };

    const handleCamera = (payload: any, senderId: string) => {
       setPeers(prev => {
        if (!prev[senderId]) return prev;
        return {
          ...prev,
          [senderId]: { ...prev[senderId], camera: payload, lastSeen: Date.now() }
        };
      });
    };
    
    const handlePeerUpdate = (payload: any, senderId: string) => {
      setPeers(prev => {
        if (!prev[senderId]) return prev;
        return {
          ...prev,
          [senderId]: { ...prev[senderId], ...payload }
        };
      });
    };

    // 3. State Synchronization Events
    const handleGenericEvent = (type: RealtimeEventType) => (payload: any, senderId: string) => {
      setLastEvent({ type, payload, senderId });
    };

    // Register Listeners
    const unsubs = [
      socket.on('JOIN', handleJoin),
      socket.on('LEAVE', handleLeave),
      socket.on('HEARTBEAT', handleHeartbeat),
      socket.on('CURSOR_MOVE', handleCursor),
      socket.on('CAMERA_MOVE', handleCamera),
      socket.on('PEER_UPDATE', handlePeerUpdate),
      socket.on('COMMENT_ADD', handleGenericEvent('COMMENT_ADD')),
      socket.on('COMMENT_UPDATE', handleGenericEvent('COMMENT_UPDATE')),
      socket.on('PART_TOGGLE', handleGenericEvent('PART_TOGGLE')),
      socket.on('EXPLODE_TOGGLE', handleGenericEvent('EXPLODE_TOGGLE')),
      socket.on('PRESENTATION_START', handleGenericEvent('PRESENTATION_START')),
      socket.on('PRESENTATION_STOP', handleGenericEvent('PRESENTATION_STOP')),
    ];

    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, [isConnected, currentUser]);

  // Heartbeat Loop (Keep Alive)
  useEffect(() => {
    if (!isConnected) return;
    
    // We can define getters for current local state to include in heartbeat if needed,
    // but for now we rely on explicit events for state changes.
    const interval = setInterval(() => {
      socket.emit('HEARTBEAT', { 
        user: { 
          id: currentUser.id, 
          name: currentUser.name, 
          avatar: currentUser.avatar, 
          color: currentUser.color 
        } 
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected, currentUser]);

  // Peer Cleanup Loop
  useEffect(() => {
    const interval = setInterval(() => {
      setPeers(prev => {
        const now = Date.now();
        let changed = false;
        const next = { ...prev };
        
        Object.values(next).forEach((peer: RemotePeer) => {
          if (now - peer.lastSeen > 10000) {
            delete next[peer.id];
            changed = true;
          }
        });

        return changed ? next : prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Public Methods
  const broadcastCursor = useCallback((point: { x: number, y: number, z: number }) => {
    socket.emit('CURSOR_MOVE', point);
  }, []);

  const broadcastCamera = useCallback((position: number[], quaternion: number[]) => {
    socket.emit('CAMERA_MOVE', { position, quaternion });
  }, []);

  const broadcastAction = useCallback((type: RealtimeEventType, payload: any) => {
    socket.emit(type, payload);
  }, []);

  return { 
    isConnected,
    peers, 
    lastEvent,
    broadcastCursor, 
    broadcastCamera, 
    broadcastAction 
  };
};

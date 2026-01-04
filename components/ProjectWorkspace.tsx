import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Share2, 
  Layers, 
  Maximize2,
  CheckCircle2,
  Send,
  MousePointer2,
  Eye,
  EyeOff,
  ChevronDown,
  CornerDownRight,
  Ruler,
  Scissors,
  Camera,
  Wifi,
  WifiOff,
  Mic,
  MicOff,
  Presentation,
  XCircle,
  Play,
  Grid3x3,
  Box,
  Sparkles,
  MessageSquare,
  Keyboard,
  HelpCircle
} from 'lucide-react';
import { Project, Comment, Part, User, RemotePeer } from '../types';
import { MOCK_USERS } from '../constants';
import Viewer3D, { Viewer3DRef } from './Viewer3D';
import ShareModal from './ShareModal';
import AIChatPanel from './AIChatPanel';
import { useRealtime } from '../utils/realtime';
import { useAudioAnalyzer } from '../utils/audio';
import * as db from '../utils/storage';

interface WorkspaceProps {
  project: Project;
  currentUser: User;
  onBack: () => void;
  onUpdateStatus: (status: 'Open' | 'In Review' | 'Approved') => void;
  isDarkMode: boolean;
}

const PARTS_LIST: Part[] = [
  { id: 'TopCap', name: 'Top Cap Assembly', visible: true },
  { id: 'Hub', name: 'Central Hub', visible: true },
  { id: 'Flanges', name: 'Mounting Flanges (x4)', visible: true },
  { id: 'BasePlate', name: 'Base Plate', visible: true },
];

const ShortcutsModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;
  const shortcuts = [
    { key: 'M', label: 'Toggle Measure Tool' },
    { key: 'X', label: 'Explode View' },
    { key: 'W', label: 'Wireframe Mode' },
    { key: 'G', label: 'Toggle Grid' },
    { key: 'Esc', label: 'Cancel / Close' },
    { key: '?', label: 'Show Shortcuts' },
  ];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-surface-darkCard rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
         <div className="flex justify-between items-center mb-4">
           <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white">
             <Keyboard size={20} /> Keyboard Shortcuts
           </h3>
           <button onClick={onClose}><XCircle className="text-text-secondary hover:text-text-primary" /></button>
         </div>
         <div className="space-y-2">
            {shortcuts.map(s => (
              <div key={s.key} className="flex justify-between items-center py-2 border-b border-surface-secondary dark:border-surface-darkSec last:border-0">
                 <span className="text-sm text-text-secondary dark:text-gray-300">{s.label}</span>
                 <kbd className="bg-surface-secondary dark:bg-surface-darkSec px-2 py-1 rounded-md text-xs font-mono font-bold dark:text-white border border-gray-200 dark:border-gray-700 min-w-[24px] text-center">{s.key}</kbd>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
};

const ProjectWorkspace: React.FC<WorkspaceProps> = ({ project, currentUser, onBack, onUpdateStatus, isDarkMode }) => {
  // --- Realtime Integration ---
  const { 
    isConnected, 
    peers, 
    lastEvent, 
    broadcastCursor, 
    broadcastCamera, 
    broadcastAction 
  } = useRealtime(project.id, currentUser);
  
  // --- Audio / Comm Hook ---
  const { isSpeaking, isMicOn, startAudio, stopAudio } = useAudioAnalyzer();
  
  const viewerRef = useRef<Viewer3DRef>(null);

  // App State
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [activeTab, setActiveTab] = useState<'comments' | 'layers'>('comments');
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false); // AI Panel State
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [toasts, setToasts] = useState<{id: string, message: string, type: 'info'|'success'|'warning'}[]>([]);

  // Interaction State
  const [newCommentText, setNewCommentText] = useState('');
  const [pendingPoint, setPendingPoint] = useState<{x:number, y:number, z:number} | null>(null);
  const [pendingPartId, setPendingPartId] = useState<string | undefined>(undefined);
  const [highlightedComment, setHighlightedComment] = useState<string | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  
  // Tools State
  const [measurementMode, setMeasurementMode] = useState(false);
  const [clippingEnabled, setClippingEnabled] = useState(false);
  const [clippingValue, setClippingValue] = useState(0.5);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);

  // Reply State
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // 3D State
  const [exploded, setExploded] = useState(false);
  const [parts, setParts] = useState<Part[]>(PARTS_LIST);

  // --- Phase 3: Comm State ---
  const [isPresenting, setIsPresenting] = useState(false);
  const [followingPeerId, setFollowingPeerId] = useState<string | null>(null);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;

      switch(e.key.toLowerCase()) {
        case 'm': 
          setMeasurementMode(prev => !prev);
          setClippingEnabled(false);
          break;
        case 'x': 
          handleExplodeToggle();
          break;
        case 'w':
          setShowWireframe(prev => !prev);
          break;
        case 'g':
          setShowGrid(prev => !prev);
          break;
        case '?':
          setIsShortcutsOpen(true);
          break;
        case 'escape':
          if (isShortcutsOpen) setIsShortcutsOpen(false);
          else if (isShareOpen) setIsShareOpen(false);
          else if (isAIOpen) setIsAIOpen(false);
          else if (measurementMode) setMeasurementMode(false);
          else if (clippingEnabled) setClippingEnabled(false);
          else if (pendingPoint) {
            setPendingPoint(null);
            setPendingPartId(undefined);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isShortcutsOpen, isShareOpen, isAIOpen, measurementMode, clippingEnabled, exploded, pendingPoint]);

  // --- Helper: Toasts ---
  const showToast = (message: string, type: 'info'|'success'|'warning' = 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  // --- Data Loading ---
  useEffect(() => {
    const loadComments = async () => {
      setIsLoadingComments(true);
      try {
        const data = await db.getComments(project.id);
        setComments(data);
      } catch (e) {
        console.error("Failed to load comments", e);
      } finally {
        setIsLoadingComments(false);
      }
    };
    loadComments();
  }, [project.id]);

  // --- Realtime Event Handling ---
  useEffect(() => {
    if (!lastEvent) return;

    switch (lastEvent.type) {
      case 'JOIN':
        const joinPayload = lastEvent.payload as { user: { name: string } };
        showToast(`${joinPayload.user.name} joined`, 'info');
        break;
      case 'LEAVE':
        // Optional: show leave toast
        break;
      case 'EXPLODE_TOGGLE':
        setExploded(lastEvent.payload as boolean);
        break;
      case 'PART_TOGGLE':
        const partPayload = lastEvent.payload as { id: string, visible: boolean };
        setParts(prev => prev.map(p => p.id === partPayload.id ? { ...p, visible: partPayload.visible } : p));
        break;
      case 'COMMENT_ADD':
        setComments(prev => {
          const payload = lastEvent.payload as Comment;
          if (prev.find(c => c.id === payload.id)) return prev;
          const senderName = lastEvent.senderId && peers[lastEvent.senderId] ? peers[lastEvent.senderId].name : 'Someone';
          showToast(`New comment from ${senderName}`, 'info');
          return [payload, ...prev];
        });
        break;
      case 'COMMENT_UPDATE':
        setComments(prev => {
          const payload = lastEvent.payload as Comment;
          return prev.map(c => c.id === payload.id ? payload : c);
        });
        break;
      case 'PRESENTATION_START':
        const presenterName = (lastEvent.senderId && peers[lastEvent.senderId]) ? peers[lastEvent.senderId].name : 'Unknown';
        setFollowingPeerId(lastEvent.senderId || null);
        showToast(`${presenterName} is presenting`, 'warning');
        break;
      case 'PRESENTATION_STOP':
        setFollowingPeerId(null);
        showToast(`Presentation ended`, 'info');
        break;
    }
  }, [lastEvent, peers]);

  // --- Sync Audio State with Realtime ---
  useEffect(() => {
     // Broadcast speaking state whenever it changes
     broadcastAction('PEER_UPDATE', { isSpeaking, isMuted: !isMicOn });
  }, [isSpeaking, isMicOn, broadcastAction]);

  const toggleMic = async () => {
    if (isMicOn) {
      stopAudio();
    } else {
      const success = await startAudio();
      if (!success) {
        showToast("Could not access microphone", "warning");
      }
    }
  };

  // --- Presentation Logic ---
  const togglePresentation = () => {
    if (isPresenting) {
       setIsPresenting(false);
       broadcastAction('PRESENTATION_STOP', {});
       broadcastAction('PEER_UPDATE', { isPresenting: false });
    } else {
       // Stop following if I start presenting
       setFollowingPeerId(null);
       setIsPresenting(true);
       broadcastAction('PRESENTATION_START', {});
       broadcastAction('PEER_UPDATE', { isPresenting: true });
    }
  };

  const stopFollowing = () => {
    setFollowingPeerId(null);
  };

  // --- 3D Actions ---

  const handleExplodeToggle = () => {
    const newValue = !exploded;
    setExploded(newValue);
    broadcastAction('EXPLODE_TOGGLE', newValue);
  };

  const togglePartVisibility = (id: string) => {
    const targetPart = parts.find(p => p.id === id);
    if (!targetPart) return;
    const newVisibility = !targetPart.visible;
    setParts(prev => prev.map(p => p.id === id ? { ...p, visible: newVisibility } : p));
    broadcastAction('PART_TOGGLE', { id, visible: newVisibility });
  };

  const handle3DClick = (point: { x: number; y: number; z: number }, partId?: string) => {
    if (measurementMode || isPresenting || followingPeerId) return; // Disable comments during these modes
    
    setPendingPoint(point);
    setPendingPartId(partId);
    setActiveTab('comments');
    if (!isAIOpen) { // Only focus comment if AI is closed, otherwise might be confusing
       setTimeout(() => document.getElementById('comment-input')?.focus(), 50);
    }
  };

  const submitComment = async () => {
    if (!newCommentText.trim()) return;

    const newComment: Comment = {
      id: `c-${Date.now()}`,
      projectId: project.id,
      userId: currentUser.id,
      text: newCommentText,
      createdAt: new Date().toISOString(),
      position: pendingPoint ? [pendingPoint.x, pendingPoint.y, pendingPoint.z] : null,
      partId: pendingPartId,
      status: 'open',
      replies: []
    };

    setComments([newComment, ...comments]);
    await db.saveComment(newComment);
    broadcastAction('COMMENT_ADD', newComment);

    setNewCommentText('');
    setPendingPoint(null);
    setPendingPartId(undefined);
  };

  const submitReply = async (parentId: string) => {
    if (!replyText.trim()) return;
    
    let targetComment = comments.find(c => c.id === parentId);
    if (!targetComment) return;

    const newReply: Comment = {
      id: `r-${Date.now()}`,
      projectId: project.id,
      userId: currentUser.id,
      text: replyText,
      createdAt: 'Just now',
      status: 'open'
    };

    const updatedComment = {
      ...targetComment,
      replies: [...(targetComment.replies || []), newReply]
    };

    setComments(prev => prev.map(c => c.id === parentId ? updatedComment : c));
    await db.updateComment(updatedComment);
    broadcastAction('COMMENT_UPDATE', updatedComment);
    
    setReplyText('');
    setReplyingTo(null);
  };
  
  const handleResolveComment = async (e: React.MouseEvent, commentId: string) => {
    e.stopPropagation();
    const comment = comments.find(c => c.id === commentId);
    if (!comment) return;

    const updatedComment = { ...comment, status: comment.status === 'open' ? 'resolved' : 'open' } as Comment;
    
    setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
    await db.updateComment(updatedComment);
    broadcastAction('COMMENT_UPDATE', updatedComment);
  };

  const handleStatusChange = (status: 'Open' | 'In Review' | 'Approved') => {
    onUpdateStatus(status);
    setIsStatusOpen(false);
  };

  const handleScreenshot = async () => {
    if (viewerRef.current) {
      const dataUrl = viewerRef.current.captureScreenshot();
      if (dataUrl) {
         await db.updateProjectThumbnail(project.id, dataUrl);
         showToast("Project thumbnail updated", "success");
      }
    }
  };

  // Helper for AI
  const captureScreenForAI = () => {
    if (viewerRef.current) {
      return viewerRef.current.captureScreenshot();
    }
    return '';
  };

  // Resolve Following Peer Object
  const followingPeer = followingPeerId ? (Object.values(peers) as RemotePeer[]).find(p => p.id === followingPeerId) : null;

  return (
    <div className="h-screen w-full bg-white dark:bg-surface-dark flex flex-col overflow-hidden relative">
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />

      {/* Toast Container */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
         {toasts.map(toast => (
            <div key={toast.id} className={`bg-white/90 backdrop-blur-md px-4 py-2 rounded-lg shadow-xl border-l-4 text-sm font-medium animate-in slide-in-from-top-2 fade-in
              ${toast.type === 'info' ? 'border-brand-primary text-text-primary' : 
                toast.type === 'success' ? 'border-green-500 text-green-700' : 'border-orange-500 text-orange-700'}`}>
               {toast.message}
            </div>
         ))}
      </div>

      {/* Top Bar */}
      <header className="h-16 border-b border-surface-secondary dark:border-surface-darkSec flex items-center justify-between px-6 bg-white dark:bg-surface-darkCard z-10 shrink-0 shadow-sm transition-colors">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-surface-secondary dark:hover:bg-surface-darkSec rounded-full transition-colors text-text-secondary"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold text-text-primary dark:text-white text-lg leading-tight line-clamp-1">{project.name}</h2>
            <div className="flex items-center gap-2 text-xs text-text-secondary">
               <div className="relative">
                  <button 
                    onClick={() => setIsStatusOpen(!isStatusOpen)}
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-transparent hover:border-surface-secondary dark:hover:border-surface-darkSec transition-all cursor-pointer ${
                      project.status === 'Open' ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300' :
                      project.status === 'In Review' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/30 dark:text-orange-300' :
                      'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-300'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      project.status === 'Open' ? 'bg-blue-500' : 
                      project.status === 'In Review' ? 'bg-orange-500' :
                      'bg-green-500'
                    }`} />
                    <span className="font-bold uppercase text-[10px] whitespace-nowrap">{project.status}</span>
                    <ChevronDown size={12} />
                  </button>
                  
                  {isStatusOpen && (
                    <div className="absolute top-full left-0 mt-2 w-32 bg-white dark:bg-surface-darkCard rounded-xl shadow-xl border border-surface-secondary dark:border-surface-darkSec overflow-hidden z-50 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                      {['Open', 'In Review', 'Approved'].map((status) => (
                        <button 
                          key={status}
                          onClick={() => handleStatusChange(status as any)}
                          className="px-4 py-2 text-left text-xs font-medium hover:bg-surface-secondary dark:hover:bg-surface-darkSec transition-colors dark:text-gray-200"
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  )}
               </div>
              <span className="flex items-center gap-1">
                 {isConnected ? <Wifi size={12} className="text-green-500" /> : <WifiOff size={12} className="text-red-500" />}
                 {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>

        {/* Phase 3: Communication Controls */}
        <div className="flex items-center gap-3">
           {/* Mic Toggle */}
           <button 
             onClick={toggleMic}
             className={`h-10 px-4 rounded-full flex items-center gap-2 transition-all border ${
               isMicOn 
                 ? 'bg-red-50 text-red-600 border-red-100 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400' 
                 : 'bg-surface-secondary text-text-secondary border-transparent hover:bg-surface-secondary/80 dark:bg-surface-darkSec dark:text-gray-400'
             }`}
           >
             {isMicOn ? <Mic size={18} /> : <MicOff size={18} />}
             <span className="text-sm font-medium hidden md:inline">{isMicOn ? 'Mute' : 'Unmute'}</span>
           </button>

           {/* Presentation Toggle */}
           {followingPeer ? (
             <div className="h-10 px-4 bg-brand-primary text-white rounded-full flex items-center gap-2 animate-pulse cursor-default">
                <Eye size={18} />
                <span className="text-sm font-bold">Following {followingPeer.name}</span>
                <button onClick={stopFollowing} className="p-1 hover:bg-white/20 rounded-full ml-1"><XCircle size={16} /></button>
             </div>
           ) : (
             <button 
               onClick={togglePresentation}
               className={`h-10 px-4 rounded-full flex items-center gap-2 transition-all border ${
                 isPresenting 
                   ? 'bg-brand-accent text-brand-primary border-brand-accent hover:bg-brand-accent/90' 
                   : 'bg-white text-text-primary border-surface-secondary hover:border-brand-primary/50 dark:bg-surface-darkCard dark:text-white dark:border-surface-darkSec'
               }`}
             >
               {isPresenting ? <Presentation size={18} /> : <Play size={18} />}
               <span className="text-sm font-bold hidden md:inline">{isPresenting ? 'Stop Presenting' : 'Present'}</span>
             </button>
           )}
        </div>

        <div className="flex items-center gap-6 ml-4 pl-4 border-l border-surface-secondary dark:border-surface-darkSec">
          {/* Active Users List */}
          <div className="hidden md:flex items-center -space-x-2">
             <div className="relative group cursor-pointer z-10" title="You">
                <img 
                  src={currentUser.avatar} 
                  className={`w-8 h-8 rounded-full border-2 border-white dark:border-surface-darkCard transition-all ${isSpeaking ? 'ring-2 ring-green-400' : ''}`} 
                  alt={currentUser.name} 
                />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-surface-darkCard rounded-full"></div>
                {/* Me Status */}
                {(!isMicOn) && (
                   <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-white dark:border-surface-darkCard">
                      <MicOff size={8} className="text-white" />
                   </div>
                )}
              </div>

            {Object.values(peers).map((peer: RemotePeer) => (
              <div key={peer.id} className="relative group cursor-pointer animate-in fade-in zoom-in-50 duration-300">
                <img 
                  src={peer.avatar || 'https://picsum.photos/32/32'} 
                  className={`w-8 h-8 rounded-full border-2 border-white dark:border-surface-darkCard bg-gray-200 transition-all ${peer.isSpeaking ? 'ring-2 ring-green-400' : ''} ${peer.isPresenting ? 'ring-2 ring-brand-accent' : ''}`} 
                  alt={peer.name} 
                />
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-surface-darkCard rounded-full"></div>
                {peer.isMuted && (
                   <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-0.5 border border-white dark:border-surface-darkCard">
                      <MicOff size={8} className="text-white" />
                   </div>
                )}
                {peer.isPresenting && (
                   <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-brand-accent rounded-full p-0.5 border border-white dark:border-surface-darkCard z-20">
                      <Presentation size={10} className="text-brand-primary" />
                   </div>
                )}
                
                {/* Tooltip */}
                <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {peer.name} {peer.isSpeaking ? '(Speaking)' : ''} {peer.isPresenting ? '(Presenting)' : ''}
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => setIsShareOpen(true)}
            className="flex items-center gap-2 bg-brand-primary text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-brand-secondary transition-colors shadow-lg shadow-brand-primary/20"
          >
            <Share2 size={16} />
            <span className="hidden md:inline">Share</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* 3D Canvas Container */}
        <main className="flex-1 relative bg-surface-app dark:bg-[#111] p-0 md:p-4 transition-colors">
           <Viewer3D 
              ref={viewerRef}
              comments={comments} 
              onAddComment={handle3DClick} 
              highlightedCommentId={highlightedComment}
              exploded={exploded}
              parts={parts}
              fileUrl={project.fileUrl}
              fileName={project.fileName}
              projectId={project.id}
              currentUser={currentUser}
              measurementMode={measurementMode}
              clippingEnabled={clippingEnabled}
              clippingValue={clippingValue}
              remoteUsers={peers}
              onCursorMove={broadcastCursor}
              onCameraMove={broadcastCamera}
              followTarget={followingPeer}
              wireframe={showWireframe}
              showGrid={showGrid}
              isDarkMode={isDarkMode}
           />
           
           {/* Floating Toolbar */}
           <div className={`absolute top-4 left-4 md:top-8 md:left-8 flex flex-col gap-2 bg-white dark:bg-surface-darkCard p-2 rounded-full shadow-lg border border-surface-secondary/50 dark:border-surface-darkSec transition-all ${followingPeer || isPresenting ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
              <button 
                onClick={() => { setMeasurementMode(false); setClippingEnabled(false); }}
                className={`p-2.5 rounded-full transition-colors ${!measurementMode && !clippingEnabled ? 'bg-brand-primary text-white' : 'hover:bg-surface-secondary dark:hover:bg-surface-darkSec text-text-secondary dark:text-gray-400'}`}
                title="Select / Comment"
              >
                <MousePointer2 size={20} />
              </button>
              
              <button 
                className={`p-2.5 rounded-full transition-colors ${exploded ? 'bg-brand-primary text-white' : 'hover:bg-surface-secondary dark:hover:bg-surface-darkSec text-text-secondary dark:text-gray-400'}`} 
                title="Explode View (X)"
                onClick={handleExplodeToggle}
              >
                <Layers size={20} />
              </button>
              
              <button 
                className={`p-2.5 rounded-full transition-colors ${measurementMode ? 'bg-brand-primary text-white' : 'hover:bg-surface-secondary dark:hover:bg-surface-darkSec text-text-secondary dark:text-gray-400'}`} 
                title="Measurement Tool (M)"
                onClick={() => { setMeasurementMode(!measurementMode); setClippingEnabled(false); }}
              >
                <Ruler size={20} />
              </button>

              <div className="relative group">
                <button 
                  className={`p-2.5 rounded-full transition-colors ${clippingEnabled ? 'bg-brand-primary text-white' : 'hover:bg-surface-secondary dark:hover:bg-surface-darkSec text-text-secondary dark:text-gray-400'}`} 
                  title="Section Cut"
                  onClick={() => { setClippingEnabled(!clippingEnabled); setMeasurementMode(false); }}
                >
                  <Scissors size={20} />
                </button>
                
                {/* Clipping Slider Popup */}
                {clippingEnabled && (
                  <div className="absolute left-full top-0 ml-2 h-32 bg-white dark:bg-surface-darkCard p-3 rounded-xl shadow-xl flex flex-col items-center border border-surface-secondary dark:border-surface-darkSec animate-in fade-in zoom-in-95 origin-left pointer-events-auto">
                     <input 
                       type="range" 
                       min="0" 
                       max="1" 
                       step="0.01" 
                       value={clippingValue}
                       onChange={(e) => setClippingValue(parseFloat(e.target.value))}
                       className="h-24 -rotate-90 origin-center accent-brand-primary cursor-pointer" 
                     />
                  </div>
                )}
              </div>

              <div className="w-8 h-px bg-surface-secondary dark:bg-surface-darkSec my-1" />
              
              <button 
                className={`p-2.5 rounded-full transition-colors ${showWireframe ? 'bg-brand-primary text-white' : 'hover:bg-surface-secondary dark:hover:bg-surface-darkSec text-text-secondary dark:text-gray-400'}`} 
                title="Wireframe Mode (W)"
                onClick={() => setShowWireframe(!showWireframe)}
              >
                <Box size={20} />
              </button>

              <button 
                className={`p-2.5 rounded-full transition-colors ${showGrid ? 'bg-brand-primary text-white' : 'hover:bg-surface-secondary dark:hover:bg-surface-darkSec text-text-secondary dark:text-gray-400'}`} 
                title="Toggle Grid (G)"
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid3x3 size={20} />
              </button>

              <div className="w-8 h-px bg-surface-secondary dark:bg-surface-darkSec my-1" />

              <button 
                id="screenshot-btn"
                onClick={handleScreenshot}
                className="p-2.5 hover:bg-surface-secondary dark:hover:bg-surface-darkSec rounded-full text-text-secondary dark:text-gray-400 hover:text-brand-primary transition-colors" 
                title="Update Project Thumbnail"
              >
                <Camera size={20} />
              </button>

              <button 
                onClick={() => { setIsAIOpen(!isAIOpen); }}
                className={`p-2.5 rounded-full transition-all duration-300 ${isAIOpen ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30'}`} 
                title="AI Design Assistant"
              >
                <Sparkles size={20} className={isAIOpen ? "animate-pulse" : ""} />
              </button>
           </div>
           
           {/* Shortcuts Help Toggle */}
           <div className="absolute bottom-4 left-4 z-20">
              <button 
                 onClick={() => setIsShortcutsOpen(true)}
                 className="w-8 h-8 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-md rounded-full text-text-secondary dark:text-gray-400 hover:bg-white dark:hover:bg-surface-darkCard hover:text-brand-primary transition-all shadow-sm"
                 title="Keyboard Shortcuts (?)"
              >
                 <HelpCircle size={16} />
              </button>
           </div>
        </main>

        {/* Right Sidebar - Collaboration Panel */}
        <aside className="w-full md:w-[360px] bg-white dark:bg-surface-darkCard border-l border-surface-secondary dark:border-surface-darkSec flex flex-col shadow-xl z-20 absolute md:relative right-0 h-full transform translate-x-full md:translate-x-0 transition-transform">
          
          {/* AI Panel Overlay (Takes over the sidebar if open) */}
          {isAIOpen && (
             <div className="absolute inset-0 z-40">
                <AIChatPanel 
                   isOpen={isAIOpen} 
                   onClose={() => setIsAIOpen(false)} 
                   project={project}
                   comments={comments}
                   parts={parts}
                   onCaptureScreen={captureScreenForAI}
                />
             </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-surface-secondary dark:border-surface-darkSec p-1 m-4 mb-0 bg-surface-secondary dark:bg-surface-darkSec rounded-lg">
            <button 
              onClick={() => setActiveTab('comments')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'comments' ? 'bg-white dark:bg-surface-darkCard text-text-primary dark:text-white shadow-sm' : 'text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-white'}`}
            >
              Comments ({comments.filter(c => c.status === 'open').length})
            </button>
            <button 
              onClick={() => setActiveTab('layers')}
              className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'layers' ? 'bg-white dark:bg-surface-darkCard text-text-primary dark:text-white shadow-sm' : 'text-text-secondary hover:text-text-primary dark:text-gray-400 dark:hover:text-white'}`}
            >
              Layers
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeTab === 'comments' ? (
              <>
                 {isLoadingComments && (
                   <div className="flex justify-center py-4">
                     <div className="w-6 h-6 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                   </div>
                 )}

                 {/* New Comment Input Context */}
                 {pendingPoint && (
                   <div className="bg-brand-accent/10 border border-brand-accent p-3 rounded-xl mb-4 text-sm text-text-primary dark:text-white animate-in slide-in-from-left">
                      <p className="font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand-accent block" />
                        Placing comment on 3D model
                      </p>
                      {pendingPartId && (
                         <p className="text-xs font-mono text-brand-primary mt-1">
                           Attached to: {pendingPartId}
                         </p>
                      )}
                      <p className="text-xs text-text-secondary dark:text-gray-400 mt-1">Type below to pin this note.</p>
                   </div>
                 )}

                 {!isLoadingComments && comments.map((comment) => {
                   // Try to find user in peers or mock data or fallback
                   const user = (Object.values(peers) as RemotePeer[]).find(p => p.id === comment.userId) || MOCK_USERS.find(u => u.id === comment.userId) || MOCK_USERS[0];
                   
                   return (
                     <div 
                        key={comment.id} 
                        className={`group p-4 rounded-xl border transition-all cursor-pointer ${
                          comment.id === highlightedComment 
                            ? 'border-brand-primary bg-brand-primary/5 ring-1 ring-brand-primary dark:bg-brand-primary/10' 
                            : 'border-surface-secondary dark:border-surface-darkSec hover:border-brand-primary/30 bg-white dark:bg-surface-darkCard'
                        }`}
                        onMouseEnter={() => setHighlightedComment(comment.id)}
                        onMouseLeave={() => setHighlightedComment(null)}
                     >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <img src={user.avatar || 'https://picsum.photos/32/32'} className="w-6 h-6 rounded-full" alt="avatar" />
                            <span className="text-sm font-bold text-text-primary dark:text-white">{user.name}</span>
                            <span className="text-xs text-text-secondary dark:text-gray-400">
                              {new Date(comment.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                          {comment.status === 'resolved' ? (
                            <CheckCircle2 size={16} className="text-status-positive" />
                          ) : (
                             <div className="w-2 h-2 rounded-full bg-brand-primary group-hover:scale-125 transition-transform" />
                          )}
                        </div>
                        <p className={`text-sm leading-relaxed ${comment.status === 'resolved' ? 'text-text-muted line-through' : 'text-text-secondary dark:text-gray-300'}`}>
                          {comment.text}
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                           {comment.position && (
                             <div className="flex items-center gap-1 text-xs font-mono text-brand-primary bg-brand-primary/5 px-2 py-1 rounded w-fit">
                               <MousePointer2 size={12} />
                               <span>XYZ Pinned</span>
                             </div>
                           )}
                           {comment.partId && (
                             <div className="flex items-center gap-1 text-xs font-mono text-text-secondary dark:text-gray-400 bg-surface-secondary dark:bg-surface-darkSec px-2 py-1 rounded w-fit max-w-[120px] truncate">
                               <Layers size={12} />
                               <span className="truncate">{comment.partId}</span>
                             </div>
                           )}
                        </div>
                        
                        {/* Replies */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-4 space-y-3 pl-4 border-l-2 border-surface-secondary dark:border-surface-darkSec">
                             {comment.replies.map(reply => {
                               const rUser = MOCK_USERS.find(u => u.id === reply.userId) || MOCK_USERS[0];
                               return (
                                 <div key={reply.id} className="text-sm">
                                    <div className="flex items-center gap-2 mb-1">
                                      <img src={rUser.avatar} className="w-4 h-4 rounded-full" />
                                      <span className="font-bold text-text-primary dark:text-white text-xs">{rUser.name}</span>
                                    </div>
                                    <p className="text-text-secondary dark:text-gray-300 text-xs">{reply.text}</p>
                                 </div>
                               )
                             })}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="mt-3 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                            onClick={(e) => { e.stopPropagation(); setReplyingTo(replyingTo === comment.id ? null : comment.id); }} 
                            className="text-xs font-semibold text-text-secondary hover:text-brand-primary dark:text-gray-400 dark:hover:text-brand-primary"
                           >
                            Reply
                           </button>
                           <button 
                             onClick={(e) => handleResolveComment(e, comment.id)}
                             className="text-xs font-semibold text-text-secondary hover:text-brand-primary dark:text-gray-400 dark:hover:text-brand-primary"
                           >
                             {comment.status === 'resolved' ? 'Re-open' : 'Resolve'}
                           </button>
                        </div>

                        {/* Inline Reply Input */}
                        {replyingTo === comment.id && (
                           <div className="mt-3 flex gap-2 animate-in slide-in-from-top-1">
                             <input 
                               autoFocus
                               className="flex-1 bg-surface-secondary dark:bg-surface-darkSec rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary dark:text-white"
                               placeholder="Write a reply..."
                               value={replyText}
                               onChange={(e) => setReplyText(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && submitReply(comment.id)}
                               onClick={(e) => e.stopPropagation()}
                             />
                             <button 
                               onClick={(e) => { e.stopPropagation(); submitReply(comment.id); }}
                               className="p-2 bg-brand-primary text-white rounded-lg hover:bg-brand-secondary"
                             >
                               <CornerDownRight size={14} />
                             </button>
                           </div>
                        )}
                     </div>
                   );
                 })}
              </>
            ) : (
              <div className="space-y-1">
                {parts.map(part => (
                  <div key={part.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-secondary dark:hover:bg-surface-darkSec group cursor-pointer border border-transparent hover:border-surface-secondary dark:hover:border-surface-darkSec">
                     <div className="flex items-center gap-3">
                       <Layers size={16} className="text-text-muted" />
                       <span className={`text-sm font-medium ${part.visible ? 'text-text-primary dark:text-white' : 'text-text-muted line-through'}`}>
                         {part.name}
                       </span>
                     </div>
                     <button 
                       onClick={(e) => { e.stopPropagation(); togglePartVisibility(part.id); }}
                       className="text-text-secondary hover:text-brand-primary p-1 rounded-md transition-colors"
                     >
                        {part.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                     </button>
                  </div>
                ))}
                
                <div className="mt-6 p-4 bg-brand-primary/5 rounded-xl border border-brand-primary/20">
                   <h4 className="text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">Model Info</h4>
                   <div className="grid grid-cols-2 gap-y-2 text-xs text-text-secondary dark:text-gray-400">
                      <span>Vertices:</span> <span className="text-right font-mono">14,204</span>
                      <span>Triangles:</span> <span className="text-right font-mono">28,110</span>
                      <span>Materials:</span> <span className="text-right font-mono">4</span>
                      <span>Size:</span> <span className="text-right font-mono">4.2MB</span>
                   </div>
                </div>
              </div>
            )}
          </div>

          {/* Comment Input */}
          {activeTab === 'comments' && (
            <div className="p-4 border-t border-surface-secondary dark:border-surface-darkSec bg-surface-app/30 dark:bg-surface-darkSec/30 backdrop-blur-sm">
              <div className="relative">
                <input
                  id="comment-input"
                  type="text"
                  placeholder={pendingPoint ? "Type your annotation..." : "Start a discussion..."}
                  className="w-full pl-4 pr-12 py-3 bg-white dark:bg-surface-darkCard border border-surface-secondary dark:border-surface-darkSec rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary shadow-sm dark:text-white"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submitComment()}
                  disabled={!!followingPeer}
                />
                <button 
                  onClick={submitComment}
                  disabled={!!followingPeer}
                  className={`absolute right-1.5 top-1.5 p-1.5 rounded-full transition-all ${newCommentText.trim() ? 'bg-brand-primary text-white' : 'bg-surface-secondary dark:bg-surface-darkSec text-text-muted'}`}
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile Floating Action Button */}
        <div className="md:hidden absolute bottom-24 right-4 z-30">
           <button 
             onClick={() => {}}
             className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-brand-primary"
           >
             <Layers size={24} />
           </button>
        </div>
      </div>

      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        projectName={project.name}
      />
    </div>
  );
};

export default ProjectWorkspace;
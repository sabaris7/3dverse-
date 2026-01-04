import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, Image as ImageIcon, Loader2, MessageSquare, Bot } from 'lucide-react';
import { Project, Comment, Part } from '../types';
import { generateAIResponse, ChatMessage } from '../utils/gemini';

interface AIChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  comments: Comment[];
  parts: Part[];
  onCaptureScreen: () => string; // Function to get base64 screenshot
}

const AIChatPanel: React.FC<AIChatPanelProps> = ({ 
  isOpen, 
  onClose, 
  project, 
  comments, 
  parts, 
  onCaptureScreen 
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `Hi! I'm your Design Assistant. I can help you summarize reviews, analyze the current view, or answer questions about "${project.name}".`,
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string = input, includeScreenshot: boolean = false) => {
    if (!text.trim() && !includeScreenshot) return;

    const userMsgId = Date.now().toString();
    const screenshot = includeScreenshot ? onCaptureScreen() : undefined;

    // Add User Message
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: text,
      image: screenshot, // Store locally to display thumb
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const responseText = await generateAIResponse(
        messages, 
        text, 
        { project, comments, parts, screenshot }
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      // Error handling is inside the util, but fallback here just in case
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const QuickAction = ({ icon: Icon, label, onClick }: any) => (
    <button 
      onClick={onClick}
      disabled={isProcessing}
      className="flex items-center gap-2 px-3 py-2 bg-brand-primary/5 hover:bg-brand-primary/10 border border-brand-primary/10 rounded-lg text-xs font-medium text-brand-primary transition-colors disabled:opacity-50"
    >
      <Icon size={14} />
      <span>{label}</span>
    </button>
  );

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full bg-white border-l border-surface-secondary shadow-xl w-full md:w-[360px] animate-in slide-in-from-right duration-300 z-30">
      
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-surface-secondary bg-surface-app/30 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-bold text-text-primary text-sm">Design AI</h3>
            <div className="flex items-center gap-1.5">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
               <span className="text-[10px] text-text-secondary uppercase font-semibold">Gemini Flash</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-surface-secondary rounded-full text-text-secondary">
          <X size={18} />
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${msg.role === 'model' ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'}`}>
              {msg.role === 'model' ? <Bot size={16} /> : <div className="text-xs font-bold">ME</div>}
            </div>
            
            <div className={`flex flex-col gap-2 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
               {/* Image Attachment Display */}
               {msg.image && (
                 <div className="w-32 h-24 rounded-lg overflow-hidden border-2 border-white shadow-sm mb-1">
                   <img src={msg.image} className="w-full h-full object-cover" alt="Context" />
                 </div>
               )}
               
               <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                 msg.role === 'user' 
                   ? 'bg-brand-primary text-white rounded-tr-sm' 
                   : 'bg-surface-secondary text-text-primary rounded-tl-sm'
               }`}>
                 {msg.text}
               </div>
               <span className="text-[10px] text-text-muted opacity-0 group-hover:opacity-100 transition-opacity">
                 {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
               </span>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex gap-3 animate-pulse">
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
              <Bot size={16} className="text-indigo-600" />
            </div>
            <div className="bg-surface-secondary px-4 py-3 rounded-2xl rounded-tl-sm text-sm text-text-secondary flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions (Only show if empty or last msg is from AI) */}
      {!isProcessing && messages[messages.length - 1].role === 'model' && (
        <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          <QuickAction 
            icon={MessageSquare} 
            label="Summarize Comments" 
            onClick={() => handleSend("Summarize the open comments and key issues for this project.")} 
          />
          <QuickAction 
            icon={ImageIcon} 
            label="Critique View" 
            onClick={() => handleSend("Analyze this viewport. What components are visible and are there any design concerns?", true)} 
          />
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-surface-secondary bg-white">
        <div className="relative flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask anything..."
            className="flex-1 pl-4 pr-12 py-3 bg-surface-app border border-surface-secondary rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/50 transition-shadow disabled:opacity-50"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={isProcessing}
          />
          <button 
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            className="absolute right-1.5 p-2 bg-brand-primary text-white rounded-full hover:bg-brand-secondary disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send size={14} />
          </button>
        </div>
        <div className="text-[10px] text-center text-text-muted mt-2">
           AI responses may vary. Check important info.
        </div>
      </div>
    </div>
  );
};

export default AIChatPanel;

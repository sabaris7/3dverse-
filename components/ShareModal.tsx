import React, { useState } from 'react';
import { X, Copy, Mail, Check } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
}

const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, projectName }) => {
  const [email, setEmail] = useState('');
  const [copied, setCopied] = useState(false);
  
  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Invitation sent to ${email}`);
      setEmail('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-secondary">
          <h3 className="text-lg font-bold text-text-primary">Share "{projectName}"</h3>
          <button onClick={onClose} className="p-2 hover:bg-surface-secondary rounded-full transition-colors">
            <X size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Copy Link Section */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Project Link</label>
            <div className="flex gap-2">
              <input 
                readOnly
                value={window.location.href}
                className="flex-1 bg-surface-secondary border border-surface-secondary rounded-lg px-3 py-2 text-sm text-text-secondary outline-none"
              />
              <button 
                onClick={handleCopy}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${copied ? 'bg-green-100 text-green-700' : 'bg-brand-primary text-white hover:bg-brand-secondary'}`}
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-secondary"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-text-secondary">Or invite by email</span>
            </div>
          </div>

          {/* Invite Section */}
          <form onSubmit={handleInvite} className="space-y-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">Email Address</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input 
                  type="email" 
                  placeholder="colleague@company.com"
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-surface-secondary focus:outline-none focus:ring-2 focus:ring-brand-primary text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                disabled={!email}
                className="px-4 py-2 bg-brand-accent text-text-primary font-bold rounded-lg text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
              >
                Invite
              </button>
            </div>
          </form>

          {/* Shared With List (Mock) */}
          <div className="space-y-3 pt-2">
            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider">With Access</label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center text-xs">AR</div>
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary">Alex Rivera (You)</span>
                      <span className="text-[10px] text-text-secondary">Owner</span>
                   </div>
                 </div>
              </div>
              <div className="flex items-center justify-between opacity-75">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs">SC</div>
                   <div className="flex flex-col">
                      <span className="text-sm font-bold text-text-primary">Sarah Chen</span>
                      <span className="text-[10px] text-text-secondary">Editor</span>
                   </div>
                 </div>
                 <button className="text-xs text-text-secondary hover:text-red-500">Remove</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ShareModal;

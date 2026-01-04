import React, { useState } from 'react';
import { X, Upload, FileBox, Check } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; file: File }) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selectedFile) {
      onSubmit({ name, description, file: selectedFile });
      // Reset form
      setName('');
      setDescription('');
      setSelectedFile(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-secondary">
          <h3 className="text-xl font-bold text-text-primary">Create New Project</h3>
          <button 
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Project Name</label>
            <input 
              type="text" 
              placeholder="e.g. Front Axle Assembly v2"
              className="w-full px-4 py-3 rounded-xl border border-surface-secondary bg-surface-app focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Description <span className="text-text-muted font-normal normal-case">(Optional)</span></label>
            <textarea 
              rows={3}
              placeholder="Add context for your reviewers..."
              className="w-full px-4 py-3 rounded-xl border border-surface-secondary bg-surface-app focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">3D Model File</label>
            
            <div 
              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer
                ${dragActive ? 'border-brand-primary bg-brand-primary/5' : 'border-surface-secondary hover:border-brand-primary/50 hover:bg-surface-secondary/50'}
                ${selectedFile ? 'bg-green-50 border-green-500 border-solid' : ''}
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                type="file" 
                id="file-upload" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".gltf,.glb,.obj,.fbx"
                onChange={handleFileSelect}
              />
              
              {selectedFile ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-3">
                    <Check size={24} />
                  </div>
                  <p className="font-bold text-text-primary">{selectedFile.name}</p>
                  <p className="text-xs text-text-secondary mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready to upload</p>
                  <button 
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedFile(null); }}
                    className="absolute top-2 right-2 p-1 text-text-muted hover:text-red-500 z-10"
                  >
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-surface-secondary text-brand-primary flex items-center justify-center mb-3">
                    <Upload size={24} />
                  </div>
                  <p className="font-medium text-text-primary">Drag & drop or Click to Browse</p>
                  <p className="text-xs text-text-secondary mt-1">Supports GLTF, GLB (Max 50MB)</p>
                </>
              )}
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded-full font-bold text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={!name || !selectedFile}
              className="flex-1 py-3 rounded-full font-bold bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Project
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;

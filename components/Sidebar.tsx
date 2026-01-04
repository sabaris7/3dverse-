import React from 'react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Users, 
  Activity, 
  Settings, 
  LogOut,
  Plus,
  X
} from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode | 'LOGOUT') => void;
  onNewProject: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, onNewProject, isOpen, onClose }) => {
  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: ViewMode.DASHBOARD },
    { icon: FolderOpen, label: 'Projects', id: ViewMode.PROJECTS },
    { icon: Users, label: 'Shared With Me', id: ViewMode.SHARED },
    { icon: Activity, label: 'Activity Feed', id: ViewMode.ACTIVITY },
  ];

  const bottomItems = [
    { icon: Settings, label: 'Settings', id: ViewMode.SETTINGS },
    { icon: LogOut, label: 'Logout', id: 'LOGOUT' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Container */}
      <aside 
        className={`fixed left-0 top-0 h-full w-[240px] bg-brand-primary text-white flex flex-col z-50 shadow-2xl transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:rounded-r-3xl rounded-none`}
      >
        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">3dverse</h1>
            <p className="text-brand-secondary text-xs font-medium uppercase tracking-wider mt-1 opacity-80">Collaborate</p>
          </div>
          <button onClick={onClose} className="md:hidden text-white/70 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Main Nav */}
        <nav className="flex-1 px-4 space-y-2 mt-4">
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { onNavigate(item.id as ViewMode); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all duration-200 ${
                currentView === item.id 
                  ? 'bg-white text-brand-primary shadow-lg translate-x-2'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon size={20} strokeWidth={2} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* CTA */}
        <div className="px-6 py-4">
          <button 
            onClick={() => { onNewProject(); onClose(); }}
            className="w-full bg-brand-accent text-text-primary h-12 rounded-full font-bold flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform"
          >
            <Plus size={20} />
            <span>New Project</span>
          </button>
        </div>

        {/* Bottom Nav */}
        <div className="p-6 pt-2 space-y-2">
          {bottomItems.map((item) => (
            <button
              key={item.label}
              onClick={() => { onNavigate(item.id as ViewMode | 'LOGOUT'); onClose(); }}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-full transition-colors ${
                 currentView === item.id ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <item.icon size={18} />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

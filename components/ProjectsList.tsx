import React from 'react';
import { Project } from '../types';
import { Plus, Search, Filter, ArrowUpRight } from 'lucide-react';

interface ProjectsListProps {
  projects: Project[];
  onOpenProject: (project: Project) => void;
  onNewProject: () => void;
}

const ProjectsList: React.FC<ProjectsListProps> = ({ projects, onOpenProject, onNewProject }) => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
           <h2 className="text-3xl font-bold text-text-primary">All Projects</h2>
           <p className="text-text-secondary mt-1">Manage and organize your team's engineering files.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:flex-none">
             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
             <input 
               type="text" 
               placeholder="Search projects..." 
               className="pl-10 pr-4 py-2 rounded-full border border-surface-secondary bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary w-full md:w-64"
             />
           </div>
           <button className="p-2 border border-surface-secondary rounded-full bg-white text-text-secondary hover:text-brand-primary hover:border-brand-primary/50 transition-colors">
              <Filter size={18} />
           </button>
           <button 
            onClick={onNewProject}
            className="flex items-center gap-2 bg-brand-primary text-white px-5 py-2 rounded-full font-bold shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform"
           >
              <Plus size={18} />
              <span className="hidden md:inline">New Project</span>
           </button>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {projects.map((project) => (
          <div 
            key={project.id} 
            onClick={() => onOpenProject(project)}
            className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-brand-primary/10 flex flex-col"
          >
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-surface-secondary mb-4">
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-end p-4">
                 <span className="text-white font-medium text-sm flex items-center gap-2">
                   Open Workspace <ArrowUpRight size={16} />
                 </span>
              </div>
              
              {/* Thumbnail Placeholder - Random Color to differentiate */}
              <div className={`w-full h-full flex items-center justify-center text-brand-primary/20 ${['bg-blue-50', 'bg-purple-50', 'bg-green-50', 'bg-orange-50'][project.name.length % 4]}`}>
                {project.thumbnail && !project.thumbnail.includes('picsum') ? (
                  // If it's a real image (mocked for now as just checking picsum to keep existing behavior or use file icon)
                   <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                     <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                     <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                     <line x1="12" y1="22.08" x2="12" y2="12"></line>
                  </svg>
                ) : (
                  <img src={project.thumbnail} className="w-full h-full object-cover" alt={project.name} />
                )}
              </div>

              {/* Status Badge */}
              <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/20 shadow-sm
                ${project.status === 'Open' ? 'bg-blue-100/90 text-blue-700' : 
                  project.status === 'In Review' ? 'bg-orange-100/90 text-orange-700' : 
                  'bg-green-100/90 text-green-700'}`}>
                {project.status}
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-text-primary text-lg group-hover:text-brand-primary transition-colors line-clamp-1" title={project.name}>{project.name}</h4>
                <p className="text-xs text-text-secondary mt-1">Owned by {project.owner}</p>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-surface-secondary">
                <span className="text-xs text-text-secondary font-medium">Last active {project.lastModified}</span>
                <div className="flex -space-x-2">
                  {[1,2].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full bg-surface-secondary border-2 border-white" />
                  ))}
                  {project.activeUsers > 0 && (
                     <div className="w-6 h-6 rounded-full bg-surface-secondary border-2 border-white flex items-center justify-center text-[10px] text-text-secondary font-bold">
                       +{project.activeUsers}
                     </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* New Project Placeholder */}
        <div 
          onClick={onNewProject}
          className="border-2 border-dashed border-surface-secondary rounded-2xl flex flex-col items-center justify-center p-8 gap-4 text-text-muted hover:text-brand-primary hover:border-brand-primary hover:bg-brand-primary/5 transition-all cursor-pointer group min-h-[300px]"
        >
           <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center group-hover:bg-white group-hover:shadow-md transition-all">
             <Plus size={32} />
           </div>
           <span className="font-bold">Create New Project</span>
        </div>
      </div>
    </div>
  );
};

export default ProjectsList;

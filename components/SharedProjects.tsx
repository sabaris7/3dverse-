import React from 'react';
import { FileBox, MoreVertical, Clock, Users, ArrowUpRight } from 'lucide-react';
import { Project } from '../types';
import { MOCK_PROJECTS } from '../constants';

interface SharedProjectsProps {
  onOpenProject: (project: Project) => void;
}

const SharedProjects: React.FC<SharedProjectsProps> = ({ onOpenProject }) => {
  return (
    <div className="p-4 md:p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Shared With Me</h2>
          <p className="text-text-secondary mt-1">Projects you've been invited to review.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-surface-secondary overflow-hidden overflow-x-auto">
        {/* Table Header */}
        <div className="min-w-[800px] grid grid-cols-12 gap-4 p-4 border-b border-surface-secondary bg-surface-secondary/30 text-xs font-semibold text-text-muted uppercase tracking-wider">
          <div className="col-span-5 pl-2">Project Name</div>
          <div className="col-span-3">Owner</div>
          <div className="col-span-2">Last Active</div>
          <div className="col-span-2 text-right pr-2">Actions</div>
        </div>

        {/* Table Body */}
        <div className="min-w-[800px] divide-y divide-surface-secondary">
          {MOCK_PROJECTS.map((project) => (
            <div 
              key={project.id} 
              onClick={() => onOpenProject(project)}
              className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-surface-secondary/50 cursor-pointer transition-colors group"
            >
              <div className="col-span-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface-secondary flex-shrink-0 flex items-center justify-center text-brand-primary">
                  <FileBox size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary group-hover:text-brand-primary transition-colors">{project.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase
                      ${project.status === 'Open' ? 'bg-blue-100 text-blue-700' : 
                        project.status === 'In Review' ? 'bg-orange-100 text-orange-700' : 
                        'bg-green-100 text-green-700'}`}>
                      {project.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-span-3 flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center text-white text-[10px] font-bold">
                  {project.owner.charAt(0)}
                </div>
                <span className="text-sm text-text-secondary font-medium">{project.owner}</span>
              </div>

              <div className="col-span-2 text-sm text-text-secondary flex items-center gap-2">
                <Clock size={14} />
                {project.lastModified}
              </div>

              <div className="col-span-2 flex justify-end gap-2">
                <button className="p-2 text-text-secondary hover:text-brand-primary hover:bg-white rounded-full transition-all opacity-0 group-hover:opacity-100">
                  <ArrowUpRight size={18} />
                </button>
                <button className="p-2 text-text-secondary hover:text-text-primary hover:bg-white rounded-full transition-all">
                  <MoreVertical size={18} />
                </button>
              </div>
            </div>
          ))}
          
          {/* Add some dummy rows to make it look fuller */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-surface-secondary/50 cursor-pointer transition-colors opacity-60">
               <div className="col-span-5 flex items-center gap-4">
                 <div className="w-12 h-12 rounded-lg bg-surface-secondary flex-shrink-0 flex items-center justify-center text-text-muted">
                    <FileBox size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-text-primary">Hydraulic Pump Assembly</h3>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-500">Archived</span>
                    </div>
                 </div>
               </div>
               <div className="col-span-3 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-gray-300"></div>
                  <span className="text-sm text-text-secondary">External Vendor</span>
               </div>
               <div className="col-span-2 text-sm text-text-secondary">
                  5d ago
               </div>
               <div className="col-span-2"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SharedProjects;

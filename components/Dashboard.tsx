import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Clock, Users, MessageSquare, ArrowUpRight, MoreHorizontal, Activity } from 'lucide-react';
import { Project, ViewMode } from '../types';
import { ANALYTICS_DATA, CURRENT_USER } from '../constants';

interface DashboardProps {
  onOpenProject: (project: Project) => void;
  projects: Project[];
}

const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-lg transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-surface-secondary rounded-xl text-brand-primary">
        <Icon size={24} />
      </div>
      {change && (
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${trend === 'up' ? 'bg-status-positive/10 text-status-positive' : 'bg-status-negative/10 text-status-negative'}`}>
          {change}
        </span>
      )}
    </div>
    <div className="space-y-1">
      <h3 className="text-text-secondary text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ onOpenProject, projects }) => {
  // Take only first 3 projects for dashboard summary
  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-primary">Welcome back, {CURRENT_USER.name.split(' ')[0]}</h2>
          <p className="text-text-secondary mt-1">Here's what's happening with your design reviews today.</p>
        </div>
        <div className="flex items-center gap-4">
          <img src={CURRENT_USER.avatar} alt="Profile" className="w-10 h-10 rounded-full border-2 border-white shadow-md" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Reviews" value="12" change="+24%" trend="up" icon={Clock} />
        <StatCard title="Pending Approvals" value="5" change="-10%" trend="down" icon={Activity} />
        <StatCard title="Team Velocity" value="8.4" change="+12%" trend="up" icon={Users} />
        <StatCard title="Open Comments" value="34" change="0%" trend="neutral" icon={MessageSquare} />
      </div>

      {/* Charts & Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content - Projects */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-text-primary">Recent Projects</h3>
            <button className="text-brand-primary text-sm font-semibold hover:underline">View All</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recentProjects.map((project) => (
              <div 
                key={project.id} 
                onClick={() => onOpenProject(project)}
                className="group bg-white rounded-2xl p-4 shadow-sm hover:shadow-xl transition-all cursor-pointer border border-transparent hover:border-brand-primary/10"
              >
                <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-secondary mb-4">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-end p-4">
                     <span className="text-white font-medium text-sm flex items-center gap-2">
                       Open Workspace <ArrowUpRight size={16} />
                     </span>
                  </div>
                  {/* Abstract placeholder for project thumbnail */}
                  <div className={`w-full h-full flex items-center justify-center text-brand-primary/20 ${['bg-blue-50', 'bg-purple-50', 'bg-green-50', 'bg-orange-50'][project.name.length % 4]}`}>
                    {project.thumbnail && !project.thumbnail.includes('picsum') ? (
                       <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                         <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                         <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                         <line x1="12" y1="22.08" x2="12" y2="12"></line>
                      </svg>
                    ) : (
                      <img src={project.thumbnail} className="w-full h-full object-cover" alt={project.name} />
                    )}
                  </div>
                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md 
                    ${project.status === 'Open' ? 'bg-blue-100/80 text-blue-700' : 
                      project.status === 'In Review' ? 'bg-orange-100/80 text-orange-700' : 
                      'bg-green-100/80 text-green-700'}`}>
                    {project.status}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-text-primary group-hover:text-brand-primary transition-colors">{project.name}</h4>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-text-secondary">Edited {project.lastModified}</span>
                    <div className="flex -space-x-2">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-6 h-6 rounded-full bg-surface-secondary border-2 border-white" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Analytics */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-text-primary">Review Analytics</h3>
          <div className="bg-white p-6 rounded-2xl shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <h4 className="text-sm font-semibold text-text-secondary">Weekly Engagement</h4>
               <MoreHorizontal size={16} className="text-text-muted" />
             </div>
             <div className="h-[200px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={ANALYTICS_DATA}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#9CA3AF'}} dy={10} />
                   <Tooltip 
                      cursor={{fill: '#F3F4F6'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                   />
                   <Bar dataKey="duration" fill="#2E2CF6" radius={[4, 4, 0, 0]} barSize={20} />
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm">
             <div className="flex justify-between items-center mb-6">
               <h4 className="text-sm font-semibold text-text-secondary">Approval Time</h4>
             </div>
             <div className="h-[150px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={ANALYTICS_DATA}>
                   <Line type="monotone" dataKey="duration" stroke="#C7F000" strokeWidth={3} dot={false} />
                   <Tooltip />
                 </LineChart>
               </ResponsiveContainer>
             </div>
             <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
               <div className="w-2 h-2 rounded-full bg-brand-accent"></div>
               <span>Avg. 2.4 days to approval</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

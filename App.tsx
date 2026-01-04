import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ProjectWorkspace from './components/ProjectWorkspace';
import SharedProjects from './components/SharedProjects';
import ActivityFeed from './components/ActivityFeed';
import ProjectsList from './components/ProjectsList';
import Settings from './components/Settings';
import NewProjectModal from './components/NewProjectModal';
import LoginScreen from './components/LoginScreen';
import { Project, ViewMode, User } from './types';
import * as db from './utils/storage';

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // App State
  const [projects, setProjects] = useState<Project[]>([]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Theme State
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Load Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme('dark');
    }
  }, []);

  // Apply Theme
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Load Projects on Mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const storedProjects = await db.getAllProjects();
        // Regenerate blob URLs for stored files
        const hydratedProjects = await db.rehydrateProjectUrls(storedProjects);
        setProjects(hydratedProjects);
      } catch (err) {
        console.error("Failed to load projects", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    // In a real app, you would save token to localStorage here
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView(ViewMode.DASHBOARD);
    setSelectedProject(null);
  };

  const handleOpenProject = (project: Project) => {
    setSelectedProject(project);
    setCurrentView(ViewMode.WORKSPACE);
    setIsSidebarOpen(false);
  };

  const handleNavigate = (view: ViewMode | 'LOGOUT') => {
    if (view === 'LOGOUT') {
      handleLogout();
      return;
    }
    setCurrentView(view);
    if (view !== ViewMode.WORKSPACE) {
      setSelectedProject(null);
    }
    setIsSidebarOpen(false);
  };

  const handleCreateProject = async (data: { name: string; description: string; file: File }) => {
    if (!currentUser) return;
    
    const newProjectId = `p-${Date.now()}`;
    
    // Save file to IndexedDB (Mocking Cloud Storage)
    await db.saveFile(newProjectId, data.file);
    const fileUrl = URL.createObjectURL(data.file);

    const newProject: Project = {
      id: newProjectId,
      name: data.name,
      thumbnail: '', // Will use default placeholder logic in UI
      lastModified: 'Just now',
      status: 'Open',
      owner: currentUser.name,
      activeUsers: 1,
      fileUrl: fileUrl,
      fileName: data.file.name
    };

    // Save project metadata to IndexedDB
    await db.saveProject(newProject);

    setProjects([newProject, ...projects]);
    setIsNewProjectModalOpen(false);
    
    // Auto open
    handleOpenProject(newProject);
  };

  const handleUpdateProjectStatus = async (status: 'Open' | 'In Review' | 'Approved') => {
    if (!selectedProject) return;

    // Update local selected project
    const updatedProject = { ...selectedProject, status };
    setSelectedProject(updatedProject);

    // Save to DB
    await db.saveProject(updatedProject);

    // Update global list
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-app dark:bg-surface-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  // Dedicated Workspace View (Full Screen)
  if (currentView === ViewMode.WORKSPACE && selectedProject) {
    return (
      <div className="font-sans text-text-primary dark:text-text-inverse antialiased h-screen overflow-hidden">
         <ProjectWorkspace 
            project={selectedProject} 
            currentUser={currentUser}
            onBack={() => handleNavigate(ViewMode.DASHBOARD)}
            onUpdateStatus={handleUpdateProjectStatus}
            isDarkMode={theme === 'dark'}
         />
      </div>
    );
  }

  // Layout for Dashboard-style Views (Sidebar + Content)
  return (
    <div className="flex min-h-screen bg-surface-app dark:bg-surface-dark font-sans text-text-primary dark:text-text-inverse antialiased transition-colors duration-300">
      <Sidebar 
        currentView={currentView} 
        onNavigate={handleNavigate} 
        onNewProject={() => setIsNewProjectModalOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-surface-darkCard border-b border-surface-secondary dark:border-surface-darkSec flex items-center px-4 z-30">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 -ml-2 text-text-secondary hover:text-brand-primary"
        >
          <Menu size={24} />
        </button>
        <span className="ml-2 font-bold text-lg text-text-primary dark:text-white">3dverse</span>
      </div>

      <main className="flex-1 w-full relative pt-16 md:pt-0 transition-all duration-300 md:ml-[240px]">
        {currentView === ViewMode.DASHBOARD && (
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
             <Dashboard 
                onOpenProject={handleOpenProject} 
                projects={projects}
             />
          </div>
        )}
        
        {currentView === ViewMode.PROJECTS && (
          <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
             <ProjectsList 
                onOpenProject={handleOpenProject} 
                projects={projects}
                onNewProject={() => setIsNewProjectModalOpen(true)}
             />
          </div>
        )}
        
        {currentView === ViewMode.SHARED && <SharedProjects onOpenProject={handleOpenProject} />}
        {currentView === ViewMode.ACTIVITY && <ActivityFeed />}
        {currentView === ViewMode.SETTINGS && (
          <Settings 
             theme={theme}
             onSetTheme={setTheme}
             currentUser={currentUser}
          />
        )}
      </main>

      <NewProjectModal 
        isOpen={isNewProjectModalOpen} 
        onClose={() => setIsNewProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </div>
  );
}

export default App;
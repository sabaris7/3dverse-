import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Save } from 'lucide-react';
import { User as UserType } from '../types';

interface SettingsProps {
  theme: 'light' | 'dark';
  onSetTheme: (theme: 'light' | 'dark') => void;
  currentUser: UserType;
}

const Settings: React.FC<SettingsProps> = ({ theme, onSetTheme, currentUser }) => {
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    comments: true,
    mentions: true
  });

  return (
    <div className="p-4 md:p-8 max-w-[1000px] mx-auto space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-text-primary dark:text-white">Settings</h2>
          <p className="text-text-secondary mt-1">Manage your profile and preferences.</p>
        </div>
        <button className="flex items-center justify-center gap-2 bg-brand-primary text-white px-5 py-2 rounded-full font-bold shadow-lg hover:bg-brand-secondary transition-colors w-full md:w-auto">
           <Save size={18} />
           <span>Save Changes</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* Profile Section */}
         <div className="lg:col-span-2 space-y-8">
            <section className="bg-white dark:bg-surface-darkCard rounded-2xl p-6 shadow-sm border border-surface-secondary dark:border-surface-darkSec transition-colors">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-brand-primary/10 text-brand-primary rounded-lg">
                   <User size={20} />
                 </div>
                 <h3 className="text-lg font-bold text-text-primary dark:text-white">Public Profile</h3>
               </div>

               <div className="flex flex-col md:flex-row items-start gap-6">
                 <div className="relative group cursor-pointer self-center md:self-start">
                    <img src={currentUser.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-surface-secondary dark:border-surface-darkSec" />
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-bold">Change</div>
                 </div>
                 
                 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary uppercase">Full Name</label>
                      <input type="text" defaultValue={currentUser.name} className="w-full px-4 py-2 rounded-lg border border-surface-secondary dark:border-surface-darkSec bg-surface-app dark:bg-surface-dark focus:outline-none focus:border-brand-primary dark:text-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary uppercase">Role</label>
                      <input type="text" defaultValue="Senior Engineer" className="w-full px-4 py-2 rounded-lg border border-surface-secondary dark:border-surface-darkSec bg-surface-app dark:bg-surface-dark focus:outline-none focus:border-brand-primary dark:text-white" />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-xs font-bold text-text-secondary uppercase">Bio</label>
                      <textarea rows={3} defaultValue="Mechanical design lead specializing in fluid dynamics and thermal systems." className="w-full px-4 py-2 rounded-lg border border-surface-secondary dark:border-surface-darkSec bg-surface-app dark:bg-surface-dark focus:outline-none focus:border-brand-primary resize-none dark:text-white" />
                    </div>
                 </div>
               </div>
            </section>

            <section className="bg-white dark:bg-surface-darkCard rounded-2xl p-6 shadow-sm border border-surface-secondary dark:border-surface-darkSec transition-colors">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                   <Bell size={20} />
                 </div>
                 <h3 className="text-lg font-bold text-text-primary dark:text-white">Notifications</h3>
               </div>

               <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between py-2">
                       <div className="capitalize font-medium text-text-primary dark:text-gray-200">{key} Notifications</div>
                       <button 
                         onClick={() => setNotifications({...notifications, [key]: !value})}
                         className={`w-12 h-6 rounded-full transition-colors relative ${value ? 'bg-brand-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                       >
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${value ? 'left-7' : 'left-1'}`} />
                       </button>
                    </div>
                  ))}
               </div>
            </section>
         </div>

         {/* Sidebar/Extra Config */}
         <div className="space-y-6">
            <section className="bg-white dark:bg-surface-darkCard rounded-2xl p-6 shadow-sm border border-surface-secondary dark:border-surface-darkSec transition-colors">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                   <Palette size={20} />
                 </div>
                 <h3 className="text-lg font-bold text-text-primary dark:text-white">Appearance</h3>
               </div>
               
               <div className="flex gap-2 p-1 bg-surface-secondary dark:bg-surface-darkSec rounded-lg">
                 <button 
                   onClick={() => onSetTheme('light')}
                   className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${theme === 'light' ? 'bg-white shadow-sm text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
                 >
                   Light
                 </button>
                 <button 
                   onClick={() => onSetTheme('dark')}
                   className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${theme === 'dark' ? 'bg-surface-darkCard shadow-sm text-white' : 'text-text-secondary hover:text-white'}`}
                 >
                   Dark
                 </button>
               </div>
            </section>

            <section className="bg-white dark:bg-surface-darkCard rounded-2xl p-6 shadow-sm border border-surface-secondary dark:border-surface-darkSec transition-colors">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                   <Shield size={20} />
                 </div>
                 <h3 className="text-lg font-bold text-text-primary dark:text-white">Security</h3>
               </div>
               
               <button className="w-full py-2 px-4 border border-surface-secondary dark:border-surface-darkSec rounded-lg text-sm font-medium hover:bg-surface-secondary dark:hover:bg-surface-darkSec transition-colors text-left mb-2 text-text-primary dark:text-gray-200">
                 Change Password
               </button>
               <button className="w-full py-2 px-4 border border-surface-secondary dark:border-surface-darkSec rounded-lg text-sm font-medium hover:bg-surface-secondary dark:hover:bg-surface-darkSec transition-colors text-left text-text-primary dark:text-gray-200">
                 Two-Factor Authentication
               </button>
            </section>
         </div>

      </div>
    </div>
  );
};

export default Settings;
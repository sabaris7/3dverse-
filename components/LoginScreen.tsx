import React, { useState } from 'react';
import { MOCK_USERS } from '../constants';
import { Shield, ArrowRight, Mail, Lock, User, Github, ArrowLeft, Terminal } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginScreenProps {
  onLogin: (user: UserType) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP' | 'DEV'>('LOGIN');
  const [isLoading, setIsLoading] = useState<string | null>(null); // string is the provider name
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleAuth = (provider: string, targetUserIndex: number = 0) => {
    setIsLoading(provider);
    setTimeout(() => {
      // Simulate auth success by picking a mock user
      onLogin(MOCK_USERS[targetUserIndex]);
      setIsLoading(null);
    }, 1500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (mode === 'SIGNUP' && !fullName) return;
    
    handleAuth('email', 0); // Default to first user for email login
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );

  const MicrosoftIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 23 23">
      <path fill="#f35325" d="M1 1h10v10H1z"/>
      <path fill="#81bc06" d="M12 1h10v10H12z"/>
      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
      <path fill="#ffba08" d="M12 12h10v10H12z"/>
    </svg>
  );

  // --- Developer/Test Mode View ---
  if (mode === 'DEV') {
    return (
      <div className="min-h-screen bg-surface-app flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
           <div className="p-6 border-b border-surface-secondary flex items-center gap-3 bg-brand-primary/5">
              <button onClick={() => setMode('LOGIN')} className="p-2 hover:bg-white rounded-full transition-colors">
                <ArrowLeft size={20} className="text-text-secondary" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-text-primary">Developer Mode</h2>
                <p className="text-xs text-text-secondary">Direct role access bypassing auth</p>
              </div>
           </div>
           
           <div className="p-6 space-y-3">
            {MOCK_USERS.map((user, idx) => (
              <div 
                key={user.id}
                onClick={() => handleAuth(`dev-${user.id}`, idx)}
                className="flex items-center gap-4 p-3 rounded-xl border-2 border-surface-secondary hover:border-brand-primary/30 hover:bg-surface-secondary/50 cursor-pointer transition-all group"
              >
                <div className="relative">
                  <img src={user.avatar} className="w-10 h-10 rounded-full bg-gray-200" alt={user.name} />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold text-white uppercase ${
                     user.role === 'admin' ? 'bg-brand-primary' : 
                     user.role === 'reviewer' ? 'bg-orange-500' : 'bg-green-500'
                  }`}>
                    {user.role[0]}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-text-primary text-sm group-hover:text-brand-primary transition-colors">{user.name}</h3>
                  <p className="text-xs text-text-secondary capitalize">{user.role}</p>
                </div>
                {isLoading === `dev-${user.id}` ? (
                   <div className="w-5 h-5 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                   <ArrowRight size={16} className="text-text-secondary opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
            ))}
           </div>
        </div>
      </div>
    );
  }

  // --- Main Auth View ---
  return (
    <div className="min-h-screen flex bg-surface-app">
      
      {/* Left Panel - Visuals */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-primary relative overflow-hidden flex-col justify-between p-12 text-white">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
        </div>
        
        <div className="relative z-10">
           <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Shield size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight">3dverse</span>
           </div>
           
           <h1 className="text-5xl font-bold leading-tight mb-6">
             Design together,<br/>
             <span className="text-brand-accent">in real-time.</span>
           </h1>
           <p className="text-lg text-blue-100 max-w-md leading-relaxed">
             The most advanced browser-based 3D collaboration platform. Streamline your engineering reviews with zero installs.
           </p>
        </div>

        {/* Abstract 3D Representation */}
        <div className="relative z-10 h-64 w-full flex items-center justify-center">
           <div className="relative w-48 h-48">
              <div className="absolute inset-0 border-2 border-brand-accent/30 rounded-full animate-ping duration-[3000ms]"></div>
              <div className="absolute inset-4 border-2 border-white/20 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-12 border-4 border-brand-accent rounded-full flex items-center justify-center backdrop-blur-sm bg-white/5">
                 <Shield size={48} className="text-white animate-pulse" />
              </div>
           </div>
        </div>

        <div className="relative z-10 flex gap-4 text-sm text-blue-200 font-medium">
          <span>Secure Encryption</span>
          <span>•</span>
          <span>SOC2 Compliant</span>
          <span>•</span>
          <span>Enterprise Ready</span>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white md:bg-transparent rounded-3xl md:rounded-none shadow-xl md:shadow-none p-8 md:p-0 animate-in slide-in-from-right duration-500">
           
           {/* Mobile Logo */}
           <div className="lg:hidden flex justify-center mb-8">
              <div className="w-12 h-12 bg-brand-primary rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-brand-primary/30">
                <Shield size={24} className="text-white" />
              </div>
           </div>

           <div className="text-center mb-8">
             <h2 className="text-3xl font-bold text-text-primary mb-2">
               {mode === 'LOGIN' ? 'Welcome back' : 'Create an account'}
             </h2>
             <p className="text-text-secondary">
               {mode === 'LOGIN' 
                 ? 'Enter your details to access your workspace.' 
                 : 'Start your 14-day free trial. No credit card required.'}
             </p>
           </div>

           {/* OAuth Buttons */}
           <div className="grid grid-cols-3 gap-3 mb-8">
              <button 
                onClick={() => handleAuth('google', 0)}
                disabled={!!isLoading}
                className="flex items-center justify-center py-2.5 border border-surface-secondary rounded-xl hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                 {isLoading === 'google' ? <div className="w-5 h-5 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" /> : <GoogleIcon />}
              </button>
              <button 
                onClick={() => handleAuth('github', 1)}
                disabled={!!isLoading}
                className="flex items-center justify-center py-2.5 border border-surface-secondary rounded-xl hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                 {isLoading === 'github' ? <div className="w-5 h-5 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" /> : <Github size={20} />}
              </button>
              <button 
                onClick={() => handleAuth('microsoft', 2)}
                disabled={!!isLoading}
                className="flex items-center justify-center py-2.5 border border-surface-secondary rounded-xl hover:bg-surface-secondary transition-colors disabled:opacity-50"
              >
                 {isLoading === 'microsoft' ? <div className="w-5 h-5 border-2 border-text-secondary border-t-transparent rounded-full animate-spin" /> : <MicrosoftIcon />}
              </button>
           </div>

           <div className="relative mb-8">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-surface-secondary"></div></div>
             <div className="relative flex justify-center text-xs font-bold uppercase text-text-muted">
                <span className="bg-white px-2">Or continue with email</span>
             </div>
           </div>

           {/* Email Form */}
           <form onSubmit={handleFormSubmit} className="space-y-4">
              {mode === 'SIGNUP' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 fade-in">
                  <label className="text-xs font-bold text-text-secondary uppercase">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input 
                      type="text" 
                      placeholder="e.g. Alex Rivera"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-secondary bg-surface-app focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Email Address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="email" 
                    placeholder="name@company.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-secondary bg-surface-app focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-text-secondary uppercase">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-surface-secondary bg-surface-app focus:outline-none focus:ring-2 focus:ring-brand-primary transition-shadow"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                 <button 
                   type="submit"
                   disabled={!!isLoading}
                   className="w-full py-3.5 rounded-xl font-bold text-white bg-brand-primary shadow-lg shadow-brand-primary/20 hover:bg-brand-secondary hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                 >
                   {isLoading === 'email' ? (
                     <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   ) : (
                     <>
                       <span>{mode === 'LOGIN' ? 'Sign In' : 'Create Account'}</span>
                       <ArrowRight size={18} />
                     </>
                   )}
                 </button>
              </div>
           </form>

           {/* Footer */}
           <div className="mt-8 text-center text-sm">
             <span className="text-text-secondary">
               {mode === 'LOGIN' ? "Don't have an account?" : "Already have an account?"}
             </span>
             <button 
               onClick={() => setMode(mode === 'LOGIN' ? 'SIGNUP' : 'LOGIN')}
               className="ml-1 font-bold text-brand-primary hover:underline"
             >
               {mode === 'LOGIN' ? 'Sign up' : 'Log in'}
             </button>
           </div>

           {/* Dev Mode Trigger */}
           <div className="mt-12 text-center">
              <button 
                onClick={() => setMode('DEV')}
                className="inline-flex items-center gap-2 text-xs font-mono text-text-muted hover:text-brand-primary transition-colors px-3 py-1 rounded-full hover:bg-brand-primary/5"
              >
                <Terminal size={12} />
                <span>Developer Access</span>
              </button>
           </div>

        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

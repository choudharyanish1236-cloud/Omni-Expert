
import React, { useState } from 'react';
import { User } from '../types';
import { CameraIcon, MailIcon, UserIcon, CheckIcon, XIcon } from './Icons';

interface ProfileProps {
  user: User;
  onUpdate: (updatedUser: User) => void;
  onClose: () => void;
}

const Profile: React.FC<ProfileProps> = ({ user, onUpdate, onClose }) => {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email || '');
  const [profilePicture, setProfilePicture] = useState(user.profilePicture || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate minor delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    onUpdate({
      ...user,
      username: username.trim() || user.username,
      email: email.trim(),
      profilePicture: profilePicture.trim()
    });
    
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#020617]/90 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden shadow-blue-500/10">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg">
              <UserIcon />
            </div>
            <h2 className="text-lg font-black uppercase tracking-tighter text-white">Operator Profile</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
          >
            <XIcon />
          </button>
        </div>

        <div className="p-8 space-y-8">
          {/* Avatar Selection */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-xl">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon />
                )}
              </div>
              <div className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-lg shadow-lg border-2 border-slate-900">
                <CameraIcon />
              </div>
            </div>
            <div className="w-full space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Profile Image URL</label>
              <input 
                type="text"
                value={profilePicture}
                onChange={(e) => setProfilePicture(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl px-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500/30 transition-all outline-none text-sm font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Username / Identifier</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                  <UserIcon />
                </div>
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500/30 transition-all outline-none text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contact Email</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                  <MailIcon />
                </div>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@omniexpert.ai"
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl pl-12 pr-4 py-3 text-slate-200 focus:ring-2 focus:ring-blue-500/30 transition-all outline-none text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-900/80 border-t border-slate-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-colors"
          >
            Discard
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckIcon />
                <span>Save Protocols</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Camera, CheckCheck } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';

interface Profile {
  name: string; email: string; first_name?: string; last_name?: string; nickname?: string;
  phone?: string; avatar_url?: string; role: string;
}

const roleName = (role: string) => role.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security'>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message: string; type: string; read_at?: string; created_at: string }>>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState({ current_password: '', password: '', password_confirmation: '' });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

  useEffect(() => {
    fetch('/api/profile', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(data => {
        setProfile(data);
        if (data.role === 'administrator') {
          fetch('/api/system/maintenance', { headers: { Accept: 'application/json' } })
            .then(res => res.ok ? res.json() : Promise.reject())
            .then(sys => setMaintenanceMode(sys.enabled))
            .catch(() => {});
        }
      })
      .catch(() => setMessage('Account settings could not be loaded.'));
  }, []);

  const loadNotifications = () => fetch('/api/dashboard/notifications?per_page=20', { headers: { Accept: 'application/json' } })
    .then(response => response.ok ? response.json() : Promise.reject())
    .then(data => setNotifications(data.data ?? []))
    .catch(() => setMessage('Notifications could not be loaded.'));

  useEffect(() => { if (activeTab === 'notifications') void loadNotifications(); }, [activeTab]);

  const saveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const response = await fetch('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf }, body: JSON.stringify(profile) });
      if (!response.ok) throw new Error();
      setProfile(await response.json());
      setMessage('Profile saved successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Profile could not be saved.'); } finally { setSaving(false); }
  };

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const avatar = event.target.files?.[0];
    if (!avatar || !profile) return;
    setSaving(true);
    const form = new FormData();
    form.append('avatar', avatar);
    try {
      const response = await fetch('/api/profile/avatar', { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf }, body: form });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setProfile({ ...profile, avatar_url: data.avatar_url });
      setMessage('Profile picture updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Profile picture could not be uploaded.'); } finally { setSaving(false); }
  };

  const savePassword = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile/password', { method: 'PUT', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf }, body: JSON.stringify(password) });
      if (!response.ok) throw new Error();
      setPassword({ current_password: '', password: '', password_confirmation: '' });
      setMessage('Password updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Password update failed. Check the current password and confirmation.'); } finally { setSaving(false); }
  };

  const markAllRead = async () => {
    await fetch('/api/dashboard/notifications/read-all', { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf } });
    await loadNotifications();
    setMessage('All notifications marked as read.');
    setTimeout(() => setMessage(''), 3000);
  };

  const toggleMaintenanceMode = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/system/maintenance', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf }, 
        body: JSON.stringify({ enabled: !maintenanceMode }) 
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      setMaintenanceMode(data.enabled);
      setMessage(data.message);
      setTimeout(() => setMessage(''), 3000);
    } catch { 
      setMessage('Failed to update maintenance mode.'); 
    } finally { 
      setSaving(false); 
    }
  };

  const initial = (profile?.nickname || profile?.first_name || profile?.name || 'A').slice(0, 1).toUpperCase();

  const unreadCount = notifications.filter(n => !n.read_at).length;

  return (
    <>
      <Head title="Settings" />
      <AppLayout dark={true} showHeader={false}>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8">
            
            {/* Left Sidebar (Settings Navigation) */}
            <div className="w-full md:w-64 shrink-0">
              <nav className="flex flex-col space-y-1">
                <button 
                  onClick={() => setActiveTab('profile')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'profile' ? 'bg-zinc-800 text-white' : 'text-content-secondary hover:bg-zinc-800/50 hover:text-white'}`}
                >
                  Public profile
                </button>
                <button 
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'security' ? 'bg-zinc-800 text-white' : 'text-content-secondary hover:bg-zinc-800/50 hover:text-white'}`}
                >
                  Password & security
                </button>
                <button 
                  onClick={() => setActiveTab('notifications')}
                  className={`flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${activeTab === 'notifications' ? 'bg-zinc-800 text-white' : 'text-content-secondary hover:bg-zinc-800/50 hover:text-white'}`}
                >
                  Notifications
                  {unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs py-0.5 px-2 rounded-full">{unreadCount}</span>
                  )}
                </button>
              </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              {message && (
                <div className="mb-6 rounded-md border border-green-500/30 bg-green-500/10 p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-400">{message}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && profile && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6 pb-2 border-b border-border-subtle">Public profile</h2>
                  
                  <div className="flex flex-col-reverse lg:flex-row gap-10">
                    {/* Form Fields */}
                    <div className="flex-1 space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1">Name</label>
                        <input 
                          value={profile.name} 
                          onChange={e => setProfile({...profile, name: e.target.value})} 
                          className="w-full max-w-md rounded-md border border-zinc-700 bg-surface-input px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-content-secondary">Your name may appear around IntelliTrack where you contribute or are mentioned.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1">Public email</label>
                        <input 
                          value={profile.email} 
                          disabled 
                          className="w-full max-w-md rounded-md border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-sm text-slate-400"
                        />
                        <p className="mt-1 text-xs text-content-secondary">You can manage verified email addresses in your email settings.</p>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1">Nickname</label>
                        <input 
                          value={profile.nickname || ''} 
                          onChange={e => setProfile({...profile, nickname: e.target.value})} 
                          className="w-full max-w-md rounded-md border border-zinc-700 bg-surface-input px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md">
                        <div>
                          <label className="block text-sm font-semibold text-slate-200 mb-1">First name</label>
                          <input 
                            value={profile.first_name || ''} 
                            onChange={e => setProfile({...profile, first_name: e.target.value})} 
                            className="w-full rounded-md border border-zinc-700 bg-surface-input px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-200 mb-1">Last name</label>
                          <input 
                            value={profile.last_name || ''} 
                            onChange={e => setProfile({...profile, last_name: e.target.value})} 
                            className="w-full rounded-md border border-zinc-700 bg-surface-input px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1">Phone</label>
                        <input 
                          value={profile.phone || ''} 
                          onChange={e => setProfile({...profile, phone: e.target.value})} 
                          className="w-full max-w-md rounded-md border border-zinc-700 bg-surface-input px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="pt-4">
                        <button 
                          onClick={saveProfile} 
                          disabled={saving}
                          className="rounded-md bg-[#238636] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#2ea043] disabled:opacity-50"
                        >
                          {saving ? 'Saving...' : 'Update profile'}
                        </button>
                      </div>
                    </div>

                    {/* Avatar Upload (Right side) */}
                    <div className="flex flex-col items-start lg:w-48 shrink-0">
                      <label className="block text-sm font-semibold text-slate-200 mb-2">Profile picture</label>
                      <div className="relative group rounded-full overflow-hidden h-48 w-48 border border-border-subtle bg-zinc-800">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-5xl text-black font-bold bg-[#ffcc00]">
                            {initial}
                          </div>
                        )}
                        <button 
                          onClick={() => inputRef.current?.click()}
                          className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Camera className="h-8 w-8 mb-2" />
                          <span className="text-sm font-medium">Edit</span>
                        </button>
                      </div>
                      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} className="hidden" />
                      
                      <div className="mt-6 w-full rounded-md border border-border-subtle p-3 bg-zinc-900/50 text-center">
                        <p className="text-xs text-content-secondary uppercase tracking-wider font-semibold">Assigned Role</p>
                        <p className="mt-1 font-medium text-brand">{roleName(profile.role)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-6 pb-2 border-b border-border-subtle">Password & security</h2>
                  
                  <div className="max-w-2xl">
                    <h3 className="text-lg font-medium text-white mb-4">Change password</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1">Old password</label>
                        <input 
                          type="password"
                          value={password.current_password} 
                          onChange={e => setPassword({...password, current_password: e.target.value})} 
                          className="w-full max-w-md rounded-md border border-zinc-700 bg-surface-input px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="border-t border-border-subtle my-4 max-w-md" />

                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1">New password</label>
                        <input 
                          type="password"
                          value={password.password} 
                          onChange={e => setPassword({...password, password: e.target.value})} 
                          className="w-full max-w-md rounded-md border border-zinc-700 bg-surface-input px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-200 mb-1">Confirm new password</label>
                        <input 
                          type="password"
                          value={password.password_confirmation} 
                          onChange={e => setPassword({...password, password_confirmation: e.target.value})} 
                          className="w-full max-w-md rounded-md border border-zinc-700 bg-surface-input px-3 py-1.5 text-sm text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <p className="mt-1 text-xs text-content-secondary">Make sure it's at least 8 characters including a number and a lowercase letter.</p>
                      </div>
                      
                      <div className="pt-4">
                        <button 
                          onClick={savePassword} 
                          disabled={saving}
                          className="rounded-md bg-[#238636] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#2ea043] disabled:opacity-50"
                        >
                          {saving ? 'Updating...' : 'Update password'}
                        </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-red-500 mt-12 mb-4">Danger zone</h3>
                    <div className="rounded-md border border-red-500/30 bg-transparent flex flex-col divide-y divide-red-500/30">
                      
                      {profile?.role === 'administrator' && (
                        <div className="p-4 flex justify-between items-center">
                          <div>
                            <p className="text-sm font-semibold text-white">System Maintenance Mode</p>
                            <p className="text-xs text-content-secondary">When enabled, the system will be locked down for all non-administrator users. They will see a maintenance screen.</p>
                          </div>
                          <button 
                            onClick={toggleMaintenanceMode}
                            disabled={saving}
                            className={`rounded-md border px-4 py-1.5 text-sm font-semibold transition ${maintenanceMode ? 'bg-red-600/20 border-red-500 text-red-500 hover:bg-red-600 hover:text-white' : 'bg-transparent border-red-500 text-red-500 hover:bg-red-600 hover:text-white'}`}
                          >
                            {saving ? 'Updating...' : maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
                          </button>
                        </div>
                      )}

                      <div className="p-4 flex justify-between items-center">
                        <div>
                          <p className="text-sm font-semibold text-white">Deactivate your account</p>
                          <p className="text-xs text-content-secondary">Once you deactivate your account, there is no going back. Please be certain.</p>
                        </div>
                        <button className="rounded-md bg-red-600/10 border border-red-500 px-4 py-1.5 text-sm font-semibold text-red-500 transition hover:bg-red-600 hover:text-white">
                          Deactivate account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div>
                  <div className="flex justify-between items-end mb-6 pb-2 border-b border-border-subtle">
                    <h2 className="text-2xl font-semibold text-white">Notifications</h2>
                    <button 
                      onClick={markAllRead}
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Mark all as read
                    </button>
                  </div>
                  
                  <div className="max-w-3xl">
                    <div className="rounded-md border border-border-subtle bg-surface-card overflow-hidden">
                      {notifications.length ? (
                        <div className="divide-y divide-border-subtle">
                          {notifications.map(notification => (
                            <div key={notification.id} className={`p-4 flex gap-4 ${notification.read_at ? 'opacity-60' : 'bg-zinc-800/30'}`}>
                              <div className="mt-0.5">
                                {notification.read_at ? (
                                  <CheckCheck className="h-5 w-5 text-content-secondary" />
                                ) : (
                                  <span className={`block h-3 w-3 mt-1 rounded-full ${notification.type === 'warning' ? 'bg-yellow-500' : notification.type === 'urgent' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                )}
                              </div>
                              <div>
                                <h4 className="text-sm font-semibold text-white">{notification.title}</h4>
                                <p className="text-sm text-content-secondary mt-1">{notification.message}</p>
                                <p className="text-xs text-content-secondary mt-2">{new Date(notification.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-sm text-content-secondary">No notifications yet.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </AppLayout>
    </>
  );
};

export default Settings;
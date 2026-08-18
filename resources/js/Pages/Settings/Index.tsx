import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import { Bell, Camera, CheckCheck, LockKeyhole, Sparkles, UserRound } from 'lucide-react';
import AppLayout from '../../Layouts/AppLayout';
import { Card, CardBody, CardHeader } from '../../Components/Card';
import Button from '../../Components/Button';

interface Profile {
  name: string; email: string; first_name?: string; last_name?: string; nickname?: string;
  phone?: string; avatar_url?: string; role: string;
}

const roleName = (role: string) => role.replaceAll('_', ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const Settings = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'password'>('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; message: string; type: string; read_at?: string; created_at: string }>>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState({ current_password: '', password: '', password_confirmation: '' });
  const inputRef = useRef<HTMLInputElement>(null);
  const csrf = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

  useEffect(() => {
    fetch('/api/profile', { headers: { Accept: 'application/json' } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(setProfile)
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
      setMessage('Profile saved.');
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
      setMessage('Profile picture updated.');
    } catch { setMessage('Profile picture could not be uploaded. Use a PNG, JPG, or WebP image below 2 MB.'); } finally { setSaving(false); }
  };

  const savePassword = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/profile/password', { method: 'PUT', headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-TOKEN': csrf }, body: JSON.stringify(password) });
      if (!response.ok) throw new Error();
      setPassword({ current_password: '', password: '', password_confirmation: '' });
      setMessage('Password updated.');
    } catch { setMessage('Password update failed. Check the current password and confirmation.'); } finally { setSaving(false); }
  };

  const markAllRead = async () => {
    await fetch('/api/dashboard/notifications/read-all', { method: 'POST', headers: { Accept: 'application/json', 'X-CSRF-TOKEN': csrf } });
    await loadNotifications();
    setMessage('All notifications marked as read.');
  };

  const initial = (profile?.nickname || profile?.first_name || profile?.name || 'A').slice(0, 1).toUpperCase();

  return <><Head title="Settings" /><AppLayout title="Settings"><div className="mx-auto max-w-5xl space-y-5">
    {message && <p className="border border-neutral-300 bg-neutral-50 p-3 text-sm text-neutral-700 dark:border-white/10 dark:bg-white/5 dark:text-neutral-200">{message}</p>}
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]"><div className="border border-neutral-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#1b1b1b]"><div className="flex items-start gap-4"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#edf3ff] text-[#246bdb] dark:bg-[#3b3208] dark:text-[#ffd000]"><Sparkles className="h-5 w-5" /></span><div><p className="text-lg font-semibold text-neutral-950 dark:text-white">Personal workspace settings</p><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Manage your public identity, notification inbox, and account security.</p></div></div></div><div className="border border-neutral-200 bg-[#f8fafc] p-5 dark:border-white/10 dark:bg-[#202020]"><p className="text-xs font-medium uppercase tracking-[0.14em] text-neutral-500">Account status</p><p className="mt-2 font-semibold text-neutral-900 dark:text-white">{profile ? roleName(profile.role) : 'Loading account'}</p><p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Access controlled by Core 1 roles</p></div></div>
    <Card noPadding><CardBody><div className="border-b border-neutral-200 px-6 pt-5 dark:border-white/10"><div className="flex items-center gap-3 overflow-x-auto"><button type="button" onClick={() => setActiveTab('profile')} className={`flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium ${activeTab === 'profile' ? 'border-[#246bdb] text-[#246bdb] dark:border-[#ffd000] dark:text-[#ffd000]' : 'border-transparent text-neutral-500'}`}><UserRound className="h-4 w-4" />Profile</button><button type="button" onClick={() => setActiveTab('notifications')} className={`flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium ${activeTab === 'notifications' ? 'border-[#246bdb] text-[#246bdb] dark:border-[#ffd000] dark:text-[#ffd000]' : 'border-transparent text-neutral-500'}`}><Bell className="h-4 w-4" />Notifications{notifications.filter(notification => !notification.read_at).length > 0 && <span className="rounded-full bg-[#246bdb] px-1.5 py-0.5 text-[10px] text-white dark:bg-[#ffd000] dark:text-neutral-950">{notifications.filter(notification => !notification.read_at).length}</span>}</button><button type="button" onClick={() => setActiveTab('password')} className={`flex items-center gap-2 border-b-2 px-3 pb-3 text-sm font-medium ${activeTab === 'password' ? 'border-[#246bdb] text-[#246bdb] dark:border-[#ffd000] dark:text-[#ffd000]' : 'border-transparent text-neutral-500'}`}><LockKeyhole className="h-4 w-4" />Password</button></div></div></CardBody>{activeTab === 'profile' && <><CardHeader title="Profile & identity" subtitle="Choose how your account appears in the Alibaton workspace." /><CardBody>{profile ? <div className="grid grid-cols-1 gap-8 lg:grid-cols-[210px_1fr]">
      <div className="flex flex-col items-center border-b border-neutral-200 pb-6 dark:border-white/10 lg:border-b-0 lg:border-r lg:pr-8">
        <button type="button" onClick={() => inputRef.current?.click()} className="group relative h-28 w-28 overflow-hidden rounded-full bg-[#ffd000] text-3xl font-bold text-neutral-950 ring-4 ring-neutral-100 dark:ring-white/10">
          {profile.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" /> : initial}
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100"><Camera className="h-6 w-6" /></span>
        </button>
        <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={uploadAvatar} className="hidden" />
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-3 text-sm font-medium text-[#246bdb] dark:text-[#ffd000]">Change profile picture</button>
        <p className="mt-1 text-center text-xs text-neutral-500 dark:text-neutral-400">PNG, JPG, or WebP up to 2 MB</p>
        <div className="mt-6 w-full border-t border-neutral-200 pt-4 text-center dark:border-white/10"><p className="text-xs text-neutral-500">Assigned role</p><p className="mt-1 font-semibold text-neutral-900 dark:text-white">{roleName(profile.role)}</p></div>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Display name<input value={profile.name} onChange={event => setProfile({ ...profile, name: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Nickname<input value={profile.nickname || ''} onChange={event => setProfile({ ...profile, nickname: event.target.value })} placeholder="e.g. Johnny" className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Email<input value={profile.email} disabled className="mt-1 w-full border border-neutral-200 bg-neutral-100 p-2.5 text-sm dark:bg-white/5" /></label>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Phone<input value={profile.phone || ''} onChange={event => setProfile({ ...profile, phone: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">First name<input value={profile.first_name || ''} onChange={event => setProfile({ ...profile, first_name: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-200">Last name<input value={profile.last_name || ''} onChange={event => setProfile({ ...profile, last_name: event.target.value })} className="mt-1 w-full border border-neutral-300 p-2.5 text-sm" /></label>
        <div className="md:col-span-2"><Button onClick={saveProfile} loading={saving}>Save profile</Button></div>
      </div>
    </div> : <p className="text-sm text-neutral-500">Loading profile...</p>}</CardBody></>}{activeTab === 'notifications' && <CardBody><div className="flex items-center justify-between border-b border-neutral-200 pb-4 dark:border-white/10"><div><h3 className="font-semibold text-neutral-900 dark:text-white">Notification center</h3><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Recent alerts from inquiries, rentals, quotations, and workflow updates.</p></div><Button size="sm" variant="outline" onClick={markAllRead}><CheckCheck className="h-4 w-4" />Mark all read</Button></div><div className="divide-y divide-neutral-200 dark:divide-white/10">{notifications.length ? notifications.map(notification => <div className="flex gap-3 py-4" key={notification.id}><span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.read_at ? 'bg-neutral-300 dark:bg-neutral-600' : notification.type === 'warning' ? 'bg-[#ffd000]' : notification.type === 'urgent' ? 'bg-red-500' : 'bg-[#246bdb]'}`} /><div><p className="text-sm font-medium text-neutral-900 dark:text-white">{notification.title}</p><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{notification.message}</p></div></div>) : <div className="py-12 text-center text-sm text-neutral-500">No notifications yet.</div>}</div></CardBody>}{activeTab === 'password' && <CardBody><div className="flex items-start gap-3 border-b border-neutral-200 pb-5 dark:border-white/10"><span className="flex h-9 w-9 items-center justify-center bg-neutral-100 dark:bg-white/8"><LockKeyhole className="h-4 w-4" /></span><div><h3 className="font-semibold text-neutral-900 dark:text-white">Password & security</h3><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Use at least eight characters and keep your password private.</p></div></div><div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3"><input type="password" value={password.current_password} onChange={event => setPassword({ ...password, current_password: event.target.value })} placeholder="Current password" className="border border-neutral-300 p-2.5 text-sm" /><input type="password" value={password.password} onChange={event => setPassword({ ...password, password: event.target.value })} placeholder="New password" className="border border-neutral-300 p-2.5 text-sm" /><input type="password" value={password.password_confirmation} onChange={event => setPassword({ ...password, password_confirmation: event.target.value })} placeholder="Confirm new password" className="border border-neutral-300 p-2.5 text-sm" /></div><Button className="mt-5" onClick={savePassword} loading={saving}>Update password</Button></CardBody>}</Card>
  </div></AppLayout></>;
};

export default Settings;
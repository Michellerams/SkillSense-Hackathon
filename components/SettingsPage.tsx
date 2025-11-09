
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { CameraIcon, UserIcon, LockClosedIcon, EnvelopeIcon } from './common/Icon';

interface SettingsPageProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ user, onUpdateUser }) => {
  const [formData, setFormData] = useState<User>(user);
  const [isSaved, setIsSaved] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(user);
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarUrl = reader.result as string;
        setFormData(prev => ({ ...prev, avatarUrl: newAvatarUrl }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedUserJSON = localStorage.getItem('skillSenseUser');
    if (storedUserJSON) {
        const storedUser = JSON.parse(storedUserJSON);
        const updatedUserForStorage = { ...storedUser, ...formData };
        localStorage.setItem('skillSenseUser', JSON.stringify(updatedUserForStorage));
    }
    onUpdateUser(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    const storedUserJSON = localStorage.getItem('skillSenseUser');
    if (!storedUserJSON) {
        setPasswordError("Could not find user data. Please log out and log in again.");
        return;
    }
    const storedUser = JSON.parse(storedUserJSON);

    if (storedUser.password !== currentPassword) {
        setPasswordError("Your current password does not match.");
        return;
    }
    if (!newPassword || newPassword.length < 6) {
        setPasswordError("New password must be at least 6 characters long.");
        return;
    }
    if (newPassword !== confirmNewPassword) {
        setPasswordError("New passwords do not match.");
        return;
    }

    const updatedUser = { ...storedUser, password: newPassword };
    localStorage.setItem('skillSenseUser', JSON.stringify(updatedUser));
    onUpdateUser(updatedUser); // Update the user in the app state
    setPasswordSuccess("Password changed successfully!");
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
    setTimeout(() => setPasswordSuccess(''), 3000);
  };
  
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(user);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-white mb-6">Profile Settings</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={handleImageClick}>
                  <img src={formData.avatarUrl} alt={formData.name} className="w-20 h-20 rounded-full shadow-sm transition-opacity group-hover:opacity-75" />
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <CameraIcon className="w-8 h-8 text-white" />
                  </div>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/png, image/jpeg, image/gif"/>
               <button type="button" onClick={handleImageClick} className="px-4 py-2 text-sm bg-gray-800 text-gray-200 font-semibold rounded-lg hover:bg-gray-700 transition-colors">
                 Change Picture
               </button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">First Name</label>
                <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"/>
                </div>
             </div>
             <div>
                <label htmlFor="surname" className="block text-sm font-medium text-gray-300 mb-1">Last Name</label>
                 <div className="relative">
                    <input type="text" id="surname" name="surname" value={formData.surname || ''} onChange={handleInputChange} className="w-full bg-gray-800/50 border border-gray-600 rounded-lg py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"/>
                </div>
             </div>
          </div>
           <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">Email Address</label>
              <div className="relative">
                  <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                  <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={formData.email || ''} 
                      readOnly 
                      className="w-full bg-gray-800/30 border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-gray-500 focus:outline-none cursor-not-allowed"
                  />
              </div>
              <p className="mt-1 text-xs text-gray-500">Email addresses cannot be changed after registration.</p>
          </div>
          <div className="pt-4 border-t border-gray-700 flex justify-end items-center gap-4">
             {isSaved && <p className="text-sm text-green-500 font-medium">Changes saved successfully!</p>}
             <button type="submit" disabled={!hasChanges} className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/20 transform hover:scale-105 disabled:bg-gray-600 disabled:text-gray-400 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed">
                Save Changes
             </button>
          </div>
        </form>
      </div>

      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-white mb-6">Change Password</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Current Password</label>
                <div className="relative">
                    <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                    <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="w-full bg-gray-800/50 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">New Password</label>
                    <div className="relative">
                        <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="w-full bg-gray-800/50 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Confirm New Password</label>
                    <div className="relative">
                        <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"/>
                        <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="w-full bg-gray-800/50 border border-gray-600 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                    </div>
                </div>
            </div>
             <div className="pt-4 border-t border-gray-700 flex justify-end items-center gap-4">
                {passwordError && <p className="text-sm text-red-400 font-medium">{passwordError}</p>}
                {passwordSuccess && <p className="text-sm text-green-500 font-medium">{passwordSuccess}</p>}
                <button type="submit" className="px-6 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/20 transform hover:scale-105">
                    Update Password
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsPage;
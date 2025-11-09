import React, { useState } from 'react';
import { User } from '../types';
import { UserIcon, LockClosedIcon, XMarkIcon, CheckCircleIcon } from './common/Icon';

interface PasswordResetModalProps {
  onClose: () => void;
}

const PasswordResetModal: React.FC<PasswordResetModalProps> = ({ onClose }) => {
  const [step, setStep] = useState<'find' | 'reset' | 'success'>('find');
  const [name, setName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  
  const handleFindAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const storedUserJSON = localStorage.getItem('skillSenseUser');
    if (!storedUserJSON) {
      setError("No account data found. Please register an account first.");
      return;
    }
    const storedUser: User = JSON.parse(storedUserJSON);
    if (storedUser.name.toLowerCase() === name.toLowerCase()) {
      setStep('reset');
    } else {
      setError("No account found with that name.");
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const storedUserJSON = localStorage.getItem('skillSenseUser');
    if (storedUserJSON) {
        let storedUser: User = JSON.parse(storedUserJSON);
        if (storedUser.name.toLowerCase() === name.toLowerCase()) {
            storedUser.password = newPassword;
            localStorage.setItem('skillSenseUser', JSON.stringify(storedUser));
            setStep('success');
        } else {
            setError("An unexpected error occurred. Please try again.");
        }
    } else {
        setError("Could not find user data to update.");
    }
  };

  const renderContent = () => {
    switch (step) {
      case 'find':
        return (
          <>
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Find Your Account</h3>
            <p className="text-gray-400 text-center mb-6">Enter the first name associated with your account.</p>
            {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
            <form onSubmit={handleFindAccount} className="space-y-4">
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="First Name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-600 text-black font-bold py-3 rounded-lg hover:bg-amber-500 transition-all duration-300"
              >
                Find Account
              </button>
            </form>
          </>
        );
      case 'reset':
        return (
          <>
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Reset Your Password</h3>
            <p className="text-gray-400 text-center mb-6">Enter a new password for {name}.</p>
            {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  placeholder="New Password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
              <div className="relative">
                <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-600 text-black font-bold py-3 rounded-lg hover:bg-amber-500 transition-all duration-300"
              >
                Reset Password
              </button>
            </form>
          </>
        );
      case 'success':
        return (
            <div className="flex flex-col items-center text-center">
                <CheckCircleIcon className="w-16 h-16 text-green-400 mb-4" />
                <h3 className="text-2xl font-bold text-white mb-2">Password Reset!</h3>
                <p className="text-gray-400 mb-6">Your password has been successfully updated. You can now log in with your new password.</p>
                <button
                    onClick={onClose}
                    className="w-full bg-amber-600 text-black font-bold py-3 rounded-lg hover:bg-amber-500 transition-all duration-300"
                >
                    Back to Login
                </button>
            </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in-up">
      <div className="relative w-full max-w-md p-8 bg-black/40 border border-gray-700/50 rounded-2xl shadow-2xl shadow-amber-900/20">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
          <XMarkIcon className="w-6 h-6" />
        </button>
        {renderContent()}
      </div>
    </div>
  );
};

export default PasswordResetModal;
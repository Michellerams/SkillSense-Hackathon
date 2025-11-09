
import React, { useState } from 'react';
import WelcomePage from './components/WelcomePage';
import MainApp from './components/MainApp';
import { User } from './types';
import { introBackgroundImage } from './assets/background';
import RainEffect from './components/RainEffect';
import StarrySky from './components/StarrySky';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    // Clear the stored user data on logout
    localStorage.removeItem('skillSenseUser');
  }

  const handleUpdateUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
  };

  return (
    <div 
      className="relative min-h-screen text-gray-200 font-sans bg-black overflow-hidden"
    >
      {/* Animated Milky Way Background */}
      <div 
        className="absolute inset-0 bg-cover bg-fixed animate-milky-way-pan z-0" 
        style={{ 
          backgroundImage: `url(${introBackgroundImage})`,
          backgroundSize: '150% 150%'
        }}
      ></div>
      
      {/* Starry Sky for logged-in dashboard */}
      {currentUser && <StarrySky />}

      {/* 4D Effects - Conditionally Rendered for Welcome Page */}
      {!currentUser && (
        <>
          <RainEffect />
          <div 
            className="lightning" 
            style={{ animation: 'lightning-flash 12s linear infinite' }}
          ></div>
        </>
      )}

      {/* Overlay and Blur Effect */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-1"></div>
      
      {/* Main Content */}
      <div className="relative z-10">
        {currentUser ? <MainApp user={currentUser} onLogout={handleLogout} onUpdateUser={handleUpdateUser} /> : <WelcomePage onLoginSuccess={handleLogin} />}
      </div>
    </div>
  );
};

export default App;
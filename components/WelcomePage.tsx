
import React, { useState, useEffect, useRef } from 'react';
import { StarIcon, UserIcon, LockClosedIcon, EnvelopeIcon } from './common/Icon';
import { User } from '../types';
import PasswordResetModal from './PasswordResetModal';


interface WelcomePageProps {
  onLoginSuccess: (user: User) => void;
}

// Expanded and updated list of quotes for more variety and inspiration.
const quotes = [
  "The future belongs to those who learn more skills and combine them in creative ways.",
  "Your career is your business. You are its CEO.",
  "The only skill that will be important in the 21st century is the skill of learning new skills.",
  "Invest in yourself. Your career is the engine of your wealth.",
  "The beautiful thing about learning is that no one can take it away from you.",
  "Don't watch the clock; do what it does. Keep going.",
];

const WelcomePage: React.FC<WelcomePageProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [loginName, setLoginName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [quote, setQuote] = useState('');
  // Use a ref to store the last quote's index to prevent repetition.
  const lastQuoteIndex = useRef<number | null>(null);

  useEffect(() => {
    // Select a random quote, ensuring it's not the same as the last one shown.
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * quotes.length);
    } while (quotes.length > 1 && randomIndex === lastQuoteIndex.current);
    
    setQuote(quotes[randomIndex]);
    lastQuoteIndex.current = randomIndex;
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegistering) {
      if (!firstName) {
        setError("First name is required.");
        return;
      }
      if (!email.includes('@')) {
        setError("Please enter a valid email address.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      const userDisplayName = `${firstName} ${lastName}`.trim();
      const newUser: User = {
        name: firstName,
        surname: lastName,
        email: email,
        password: password,
        avatarUrl: `https://api.dicebear.com/8.x/initials/svg?seed=${encodeURIComponent(userDisplayName)}&backgroundColor=fbbf24`,
      };
      // For demo purposes, we use localStorage as a mock database.
      localStorage.setItem('skillSenseUser', JSON.stringify(newUser));
      onLoginSuccess(newUser);
    } else {
      // Login logic
      const storedUserJSON = localStorage.getItem('skillSenseUser');
      if (!storedUserJSON) {
        setError("No account found. Please register.");
        return;
      }
      const storedUser: User = JSON.parse(storedUserJSON);
      if (storedUser.name.toLowerCase() === loginName.toLowerCase() && storedUser.password === password) {
        onLoginSuccess(storedUser);
      } else {
        setError("Invalid name or password.");
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden p-4 bg-transparent">

      <main className="relative z-10 flex flex-col items-center text-center w-full max-w-4xl mx-auto">
        <header className="w-full flex justify-between items-center py-6 px-4 md:px-0">
          <div className="flex items-center space-x-2">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-amber-400">
                <path d="M12 2L9 9H2L7 13L5 20L12 15L19 20L17 13L22 9H15L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h1 className="text-2xl font-bold text-white tracking-wider">SkillSense</h1>
          </div>
        </header>
        
        <div className="flex flex-col lg:flex-row items-center justify-between w-full mt-12 lg:mt-24 group [perspective:2000px]">
            <div className="lg:w-1/2 text-center lg:text-left mb-12 lg:mb-0 lg:pr-12 transition-transform duration-500 ease-out group-hover:[transform:rotateY(5deg)_translateZ(20px)] animate-fade-in-slide-up" style={{ animationDelay: '0.3s', opacity: 0 }}>
                <div className="relative inline-block mb-8">
                    <div className="absolute -inset-12 bg-amber-500/30 rounded-full animate-pulse blur-2xl"></div>
                    <div className="absolute -inset-6 bg-amber-500/20 rounded-full animate-pulse blur-xl delay-200"></div>
                    <StarIcon className="relative w-24 h-24 text-amber-400" />
                </div>
                <h2 className="text-4xl md:text-6xl font-extrabold text-white leading-tight tracking-wide">
                    UNLOCK YOUR POTENTIAL
                </h2>
                <h3 className="text-3xl md:text-5xl font-extrabold text-white/80 mt-2">
                    WITH AI-DRIVEN INSIGHTS
                </h3>
                <p className="mt-6 text-lg text-gray-300 max-w-md mx-auto lg:mx-0">
                    Join the future of professional development. Aggregate your career data to generate a dynamic, evidence-backed skill profile.
                </p>
                {quote && (
                  <blockquote className="mt-8 text-lg text-amber-300/80 italic max-w-md mx-auto lg:mx-0 border-l-4 border-amber-400/50 pl-4">
                    "{quote}"
                  </blockquote>
                )}
            </div>
            
            {/* Login/Register card updated with glass morphism effect */}
            <div className="lg:w-1/2 w-full max-w-md p-8 bg-white/5 backdrop-blur-lg border border-white/10 rounded-2xl shadow-2xl shadow-amber-900/20 transition-transform duration-500 ease-out group-hover:[transform:rotateY(-5deg)_translateZ(20px)] animate-fade-in-slide-up" style={{ animationDelay: '0.6s', opacity: 0 }}>
                <h2 className="text-3xl font-bold text-center text-white mb-2">{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
                <p className="text-gray-400 text-center mb-6">Let's get you started.</p>
                {error && <p className="text-red-400 text-center text-sm mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegistering ? (
                       <>
                        <div className="flex gap-4">
                            <div className="relative w-1/2">
                                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input type="text" placeholder="First Name" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                            </div>
                            <div className="relative w-1/2">
                                <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-4 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                            </div>
                        </div>
                         <div className="relative">
                            <EnvelopeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input type="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                        </div>
                        <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                        </div>
                        <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input type="password" placeholder="Confirm Password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                        </div>
                       </>
                    ) : (
                        <>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input type="text" placeholder="Name" required value={loginName} onChange={(e) => setLoginName(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                        </div>
                        <div className="relative">
                            <LockClosedIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                            <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                        </div>
                        </>
                    )}
                    
                    {!isRegistering && (
                        <div className="text-right text-sm">
                            <button type="button" onClick={() => setShowResetModal(true)} className="font-semibold text-amber-500 hover:text-amber-400">
                                Forgot Password?
                            </button>
                        </div>
                    )}
                    <button type="submit" className="w-full bg-amber-600 text-black font-bold py-3 rounded-lg hover:bg-amber-500 transition-all duration-300 shadow-lg shadow-amber-600/20 transform hover:scale-105">
                        {isRegistering ? 'Register' : 'Login'}
                    </button>
                </form>
                <p className="text-center text-gray-500 mt-6">
                    {isRegistering ? 'Already have an account?' : "Don't have an account?"}
                    <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="font-semibold text-amber-500 hover:text-amber-400 ml-2">
                        {isRegistering ? 'Login' : 'Register'}
                    </button>
                </p>
            </div>
        </div>
      </main>
      {showResetModal && <PasswordResetModal onClose={() => setShowResetModal(false)} />}
    </div>
  );
};

export default WelcomePage;
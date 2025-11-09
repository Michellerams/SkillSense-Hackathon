
import React from 'react';
import { DashboardIcon, UserCircleIcon, BriefcaseIcon, StarIcon, CogIcon } from './common/Icon';
import { View } from './MainApp';
import { User } from '../types';

interface SidebarProps {
    user: User;
    activeView: View;
    setActiveView: (view: View) => void;
    onLogout: () => void;
}

/**
 * A reusable navigation item component for the sidebar.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.icon - The icon to display.
 * @param {string} props.label - The text label for the item.
 * @param {boolean} props.isActive - Whether the item is currently active.
 * @param {() => void} props.onClick - The function to call when clicked.
 */
const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center w-full text-left px-4 py-3 rounded-lg transition-all duration-200 transform hover:translate-x-2 ${
            isActive
                ? 'bg-amber-400/10 text-amber-300 font-bold'
                : 'text-gray-300 hover:bg-white/10 hover:text-white'
        }`}
    >
        <span className="mr-3">{icon}</span>
        <span>{label}</span>
    </button>
);


const Sidebar: React.FC<SidebarProps> = ({ user, activeView, setActiveView, onLogout }) => {
    const fullName = `${user.name} ${user.surname || ''}`.trim();
    return (
        // Sidebar updated with glass morphism for a modern look.
        <aside className="w-[320px] bg-black/20 backdrop-blur-xl border-r border-white/10 text-white flex flex-col p-6 fixed top-0 left-0 h-screen z-30">
             <div className="flex items-center space-x-3 mb-8">
                 <div className="bg-amber-400 p-2 rounded-lg">
                    <StarIcon className="w-6 h-6 text-black" />
                 </div>
                 <h1 className="text-2xl font-bold tracking-wider text-white">SkillSense</h1>
            </div>
            
            <nav className="flex-grow flex flex-col space-y-2">
                 <h2 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">Menu</h2>
                 <NavItem
                    icon={<DashboardIcon className="w-6 h-6" />}
                    label="Dashboard"
                    isActive={activeView === 'dashboard'}
                    onClick={() => setActiveView('dashboard')}
                />
                 <NavItem
                    icon={<UserCircleIcon className="w-6 h-6" />}
                    label="My Skill Profile"
                    isActive={activeView === 'profile'}
                    onClick={() => setActiveView('profile')}
                />
                 <NavItem
                    icon={<BriefcaseIcon className="w-6 h-6" />}
                    label="Opportunity Analysis"
                    isActive={activeView === 'opportunities'}
                    onClick={() => setActiveView('opportunities')}
                />
                <div className="flex-grow" />
                <h2 className="px-4 pt-4 pb-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">Profile</h2>
                <NavItem
                    icon={<CogIcon className="w-6 h-6" />}
                    label="Settings"
                    isActive={activeView === 'settings'}
                    onClick={() => setActiveView('settings')}
                />
            </nav>

            <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
                    <div className="flex items-center truncate">
                        <img src={user.avatarUrl} alt="User" className="w-10 h-10 rounded-full flex-shrink-0" />
                        <div className="ml-3 truncate">
                            <p className="font-semibold text-white truncate">{fullName}</p>
                            <p className="text-xs text-gray-400 truncate">{user.email || 'SkillSeeker'}</p>
                        </div>
                    </div>
                     <button onClick={onLogout} className="px-3 py-1.5 text-xs font-medium border border-gray-500 rounded-lg hover:bg-gray-600 hover:border-amber-500 transition-colors flex-shrink-0">
                        Logout
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;

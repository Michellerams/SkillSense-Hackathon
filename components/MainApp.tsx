
import React, { useState, useCallback } from 'react';
import { DataSource, Skill, User } from '../types';
import SkillProfile from './SkillProfile';
import OpportunityAnalyzer from './OpportunityAnalyzer';
import { extractSkillsFromData } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import Sidebar from './Sidebar';
import Dashboard from './Dashboard';
import SettingsPage from './SettingsPage';
import Chatbot from './Chatbot';

interface MainAppProps {
    user: User;
    onLogout: () => void;
    onUpdateUser: (user: User) => void;
}

export type View = 'dashboard' | 'profile' | 'opportunities' | 'settings';

const MainApp: React.FC<MainAppProps> = ({ user, onLogout, onUpdateUser }) => {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [summary, setSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View>('dashboard');
  
  /**
   * Handles the analysis of provided data sources to extract skills.
   * Sets the loading state, clears previous errors and skills, and calls the geminiService.
   * @param sources An array of DataSource objects to be analyzed.
   */
  const handleAnalyze = useCallback(async (sources: DataSource[]) => {
    if (sources.length === 0) {
      setError('Please add at least one data source.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setSkills([]);
    setSummary('');
    setDataSources(sources);

    try {
      const result = await extractSkillsFromData(sources);
      setSkills(result.skills);
      setSummary(result.summary);
      setActiveView('dashboard'); // Switch to dashboard after analysis
    } catch (e: any)
 {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Updates the state with a new list of skills.
   * @param updatedSkills The new array of Skill objects.
   */
  const handleUpdateSkills = (updatedSkills: Skill[]) => {
    setSkills(updatedSkills);
  };
  
  const hasProfile = skills.length > 0;

  /**
   * Renders the main content based on the current loading state, active view, and whether a profile exists.
   */
  const renderContent = () => {
    // Loading state display
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-white/5 backdrop-blur-md rounded-lg p-8 border border-white/10">
            <Spinner />
            <p className="mt-4 text-amber-500 font-semibold animate-pulse">AI analyzing.....</p>
            <p className="mt-2 text-gray-400 text-sm">This may take a moment.</p>
        </div>
      );
    }

    // Empty state for views that require a skill profile
    if (!hasProfile && (activeView === 'profile' || activeView === 'opportunities')) {
        return (
             <div className="flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-white/10 bg-white/5 backdrop-blur-md p-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2-2z" />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-gray-200">Your Skill Profile is Empty</h3>
              <p className="mt-1 text-gray-400">Go to the Dashboard to add data sources and run an analysis to begin.</p>
            </div>
        );
    }

    // Main view router
    switch (activeView) {
        case 'dashboard':
            return <Dashboard skills={skills} onAnalyze={handleAnalyze} isLoading={isLoading}/>;
        case 'profile':
            return <SkillProfile user={user} skills={skills} summary={summary} onUpdateSummary={setSummary} dataSources={dataSources} onUpdateSkills={handleUpdateSkills} onUpdateUser={onUpdateUser} />;
        case 'opportunities':
            return <OpportunityAnalyzer userSkills={skills} />;
        case 'settings':
             return <SettingsPage user={user} onUpdateUser={onUpdateUser} />;
        default:
            return <Dashboard skills={skills} onAnalyze={handleAnalyze} isLoading={isLoading}/>;
    }
  }


  return (
    <div className="flex min-h-screen">
      <Sidebar
        user={user}
        onLogout={onLogout} 
        activeView={activeView}
        setActiveView={setActiveView}
      />
      
      <div className="flex-1 flex flex-col bg-transparent ml-[320px]">
         {/* Header with glass morphism effect */}
         <header className="w-full flex justify-between items-center py-4 px-8 border-b border-white/10 bg-black/30 backdrop-blur-lg sticky top-0 z-20">
            <h1 className="text-2xl font-bold text-white capitalize">{activeView}</h1>
            {/* Could add search or other header items here */}
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg mb-6">{error}</div>}
          {renderContent()}
        </main>
      </div>
      <Chatbot analysisCompleted={hasProfile} skills={skills} />
    </div>
  );
};

export default MainApp;

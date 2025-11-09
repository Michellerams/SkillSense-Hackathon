import React, { useState, useCallback } from 'react';
import { LearningResource, Skill, SuggestedSkill } from '../types';
import { suggestNewSkills, getLearningResources } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { LightBulbIcon, AcademicCapIcon } from './common/Icon';
import LearningResourcesModal from './LearningResourcesModal';

interface SkillSuggestionsProps {
    userSkills: Skill[];
}

const categoryColors: { [key: string]: string } = {
  'Technical': 'bg-blue-900/50 text-blue-300 border-blue-700',
  'Soft Skill': 'bg-green-900/50 text-green-300 border-green-700',
  'Leadership': 'bg-purple-900/50 text-purple-300 border-purple-700',
  'Language': 'bg-teal-900/50 text-teal-300 border-teal-700',
  'Other': 'bg-gray-700/50 text-gray-300 border-gray-600',
};

const SkillSuggestions: React.FC<SkillSuggestionsProps> = ({ userSkills }) => {
    const [suggestions, setSuggestions] = useState<SuggestedSkill[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingResources, setIsLoadingResources] = useState(false);
    const [learningResources, setLearningResources] = useState<LearningResource[]>([]);
    const [selectedSkillForLearning, setSelectedSkillForLearning] = useState<string | null>(null);
    const [resourcesError, setResourcesError] = useState<string | null>(null);

    const handleGetSuggestions = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setSuggestions([]);
        try {
            const result = await suggestNewSkills(userSkills);
            setSuggestions(result);
        } catch (e: any) {
            setError(e.message || 'Failed to get suggestions.');
        } finally {
            setIsLoading(false);
        }
    }, [userSkills]);
    
    const handleFindResources = useCallback(async (skillName: string) => {
        setIsLoadingResources(true);
        setResourcesError(null);
        setSelectedSkillForLearning(skillName);
        try {
            const result = await getLearningResources(skillName);
            if (result.length > 0) {
                setLearningResources(result);
            } else {
                 setResourcesError(`Could not find any learning resources for "${skillName}".`);
                 setSelectedSkillForLearning(null);
            }
        } catch (e: any) {
            setResourcesError(e.message || `Failed to find resources for ${skillName}.`);
            setSelectedSkillForLearning(null);
        } finally {
            setIsLoadingResources(false);
        }
    }, []);

    return (
        <div>
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Skill Growth Suggestions</h2>
                 <button
                    onClick={handleGetSuggestions}
                    disabled={isLoading || userSkills.length === 0}
                    className="flex items-center justify-center px-4 py-2 bg-gray-800 text-gray-200 font-semibold rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed"
                >
                    {isLoading && <Spinner className="w-5 h-5 mr-2" />}
                    {suggestions.length > 0 ? 'Regenerate Suggestions' : 'Suggest New Skills'}
                </button>
            </div>
            {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg mb-4">{error}</div>}
            
            <div className="bg-black/20 border border-gray-700 rounded-lg p-6 min-h-[10rem] flex flex-col items-center justify-center">
                {isLoading && (
                    <>
                        <Spinner />
                        <p className="mt-4 text-amber-500 font-semibold animate-pulse">AI analyzing growth path...</p>
                    </>
                )}

                {!isLoading && suggestions.length > 0 && (
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
                        {suggestions.map(skill => (
                            <div key={skill.name} className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-md font-bold text-white pr-4">{skill.name}</h3>
                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${categoryColors[skill.category]}`}>
                                            {skill.category}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-300 italic border-l-2 border-amber-700 pl-3 mt-3">
                                        {skill.reasoning}
                                    </p>
                                </div>
                                 <div className="mt-4 pt-3 border-t border-gray-700/50">
                                    <button
                                        onClick={() => handleFindResources(skill.name)}
                                        disabled={isLoadingResources && selectedSkillForLearning === skill.name}
                                        className="flex items-center justify-center w-full text-sm font-semibold text-amber-400 hover:text-amber-300 disabled:text-gray-500 disabled:cursor-wait"
                                    >
                                        {isLoadingResources && selectedSkillForLearning === skill.name ? (
                                            <Spinner className="w-4 h-4 mr-2" />
                                        ) : (
                                            <AcademicCapIcon className="w-4 h-4 mr-2" />
                                        )}
                                        Find Learning Resources
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {!isLoading && suggestions.length === 0 && (
                    <div className="text-center">
                        <LightBulbIcon className="w-12 h-12 text-gray-500 mx-auto"/>
                        <p className="mt-4 text-gray-400">Discover your next career move. Click "Suggest New Skills" to get AI-powered recommendations.</p>
                    </div>
                )}
            </div>
            {resourcesError && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-red-800 text-white px-6 py-3 rounded-lg shadow-lg z-50">
                    {resourcesError}
                </div>
             )}

            {selectedSkillForLearning && !isLoadingResources && learningResources.length > 0 && (
                <LearningResourcesModal
                    skillName={selectedSkillForLearning}
                    resources={learningResources}
                    onClose={() => {
                        setSelectedSkillForLearning(null);
                        setLearningResources([]);
                        setResourcesError(null);
                    }}
                />
            )}
        </div>
    );
};

export default SkillSuggestions;
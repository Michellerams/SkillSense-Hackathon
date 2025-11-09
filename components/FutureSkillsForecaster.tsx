import React, { useState, useCallback } from 'react';
import { Skill, FutureSkill, Trend } from '../types';
import { forecastFutureSkills } from '../services/geminiService';
import { Spinner } from './common/Spinner';
import { SparklesIcon } from './common/Icon';

interface FutureSkillsForecasterProps {
    userSkills: Skill[];
}

const trendStyles: { [key in Trend]: { colors: string; label: string } } = {
  [Trend.Emerging]: { colors: 'border-cyan-500 bg-cyan-900/50 text-cyan-300', label: 'Emerging' },
  [Trend.Growing]: { colors: 'border-purple-500 bg-purple-900/50 text-purple-300', label: 'Growing' },
  [Trend.Transformative]: { colors: 'border-pink-500 bg-pink-900/50 text-pink-300', label: 'Transformative' },
};

const FutureSkillsForecaster: React.FC<FutureSkillsForecasterProps> = ({ userSkills }) => {
    const [futureSkills, setFutureSkills] = useState<FutureSkill[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleForecast = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setFutureSkills([]);
        try {
            const result = await forecastFutureSkills(userSkills);
            setFutureSkills(result);
        } catch (e: any) {
            setError(e.message || 'Failed to get forecast.');
        } finally {
            setIsLoading(false);
        }
    }, [userSkills]);

    return (
        <div>
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Future Skills Forecaster</h2>
                 <button
                    onClick={handleForecast}
                    disabled={isLoading || userSkills.length === 0}
                    className="flex items-center justify-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-900/40 transform hover:scale-105 disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed"
                >
                    {isLoading && <Spinner className="w-5 h-5 mr-2" />}
                    {futureSkills.length > 0 ? 'Recalculate Future' : 'Forecast My Future Skills'}
                </button>
            </div>
            {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg mb-4">{error}</div>}
            
            <div className="bg-black/20 border border-gray-700 rounded-lg p-6 min-h-[10rem] flex flex-col items-center justify-center">
                {isLoading && (
                    <>
                        <Spinner />
                        <p className="mt-4 text-purple-400 font-semibold animate-pulse">Consulting the AI oracle...</p>
                    </>
                )}

                {!isLoading && futureSkills.length > 0 && (
                     <div className="space-y-4 w-full">
                        {futureSkills.map(skill => (
                            <div key={skill.name} className="future-skill-card bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-md font-bold text-white pr-4">{skill.name}</h3>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${trendStyles[skill.trend].colors}`}>
                                        {skill.trend}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-400 mt-3 mb-2 font-medium">Why it matters:</p>
                                <p className="text-sm text-gray-300 italic border-l-2 border-purple-600 pl-3">
                                    {skill.reasoning}
                                </p>
                                <p className="text-sm text-gray-400 mt-3 mb-2 font-medium">Potential Impact:</p>
                                <p className="text-sm text-gray-300 italic border-l-2 border-pink-600 pl-3">
                                    {skill.impact}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
                
                {!isLoading && futureSkills.length === 0 && (
                    <div className="text-center">
                        <SparklesIcon className="w-12 h-12 text-gray-500 mx-auto"/>
                        <p className="mt-4 text-gray-400">Stay ahead of the curve. Let our AI predict the next big skills for your career path.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FutureSkillsForecaster;
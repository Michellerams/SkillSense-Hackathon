import React, { useMemo, useState, useCallback } from 'react';
import { MatchedSkill, Skill, LearningResource } from '../types';
import { ChevronDownIcon, ChevronUpIcon, AcademicCapIcon } from './common/Icon';
import { Spinner } from './common/Spinner';
import SkillRadarChart from './SkillRadarChart';
import LearningResourcesModal from './LearningResourcesModal';
import { getLearningResources } from '../services/geminiService';

interface SkillGapAnalysisProps {
  userSkills: Skill[];
  jobSkills: Skill[];
  summary: string;
}

const SkillGapAnalysis: React.FC<SkillGapAnalysisProps> = ({ userSkills, jobSkills, summary }) => {
  const [showAdditional, setShowAdditional] = useState(false);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [learningResources, setLearningResources] = useState<LearningResource[]>([]);
  const [selectedSkillForLearning, setSelectedSkillForLearning] = useState<string | null>(null);
  const [resourcesError, setResourcesError] = useState<string | null>(null);

  /**
   * Memoized computation to compare user skills against job skills.
   * This categorizes skills into 'matched', 'missing', and 'additional' for display.
   * The useMemo hook prevents re-computation on every render unless dependencies change.
   */
  const { matchedSkills, missingSkills, additionalUserSkills } = useMemo(() => {
    const userSkillMap = new Map<string, Skill>(userSkills.map(s => [s.name.toLowerCase().trim(), s]));
    const jobSkillSet = new Set<string>(jobSkills.map(s => s.name.toLowerCase().trim()));
    
    const matched: MatchedSkill[] = [];
    const missing: Skill[] = [];

    jobSkills.forEach(jobSkill => {
      const key = jobSkill.name.toLowerCase().trim();
      if (userSkillMap.has(key)) {
        const userSkill = userSkillMap.get(key)!;
        matched.push({ ...jobSkill, matchStatus: 'matched', userConfidence: userSkill.confidence });
      } else {
        missing.push({ ...jobSkill, matchStatus: 'missing' });
      }
    });

    const additional = userSkills.filter(userSkill => !jobSkillSet.has(userSkill.name.toLowerCase().trim()));

    // Sort skills for consistent and logical display.
    matched.sort((a, b) => b.confidence - a.confidence);
    missing.sort((a, b) => b.confidence - a.confidence);
    additional.sort((a, b) => a.name.localeCompare(b.name));

    return { matchedSkills: matched, missingSkills: missing, additionalUserSkills: additional };
  }, [userSkills, jobSkills]);
  
  /**
   * Fetches learning resources for a given skill name using the AI service.
   * Manages loading and error states for the resource fetching process.
   */
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
    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl space-y-8">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">AI-Powered Analysis Summary</h2>
        {summary ? (
          <div className="bg-black/20 border border-gray-700 rounded-lg p-4">
            <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{summary}</p>
          </div>
        ) : (
          <div className="bg-black/20 border border-gray-700 rounded-lg p-4 text-center text-gray-400">
            <Spinner className="w-6 h-6 mx-auto mb-2" />
            Generating analysis summary...
          </div>
        )}
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">Skill Comparison Overview</h2>
        <div className="bg-black/10 p-4 rounded-lg border border-gray-700 min-h-[400px]">
           <SkillRadarChart userSkills={userSkills} jobSkills={jobSkills} />
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-red-900/10 p-4 rounded-lg border border-red-800">
                <h3 className="text-lg font-semibold text-red-300 mb-3">Skills to Develop ({missingSkills.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {missingSkills.map(skill => (
                        <div key={skill.name} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                            <p className="font-bold text-white">{skill.name}</p>
                            <div className="text-xs text-gray-400 mt-1">{skill.category}</div>
                            <div className="flex items-center space-x-2 my-2" title={`Job Criticality: ${skill.confidence}%`}>
                                <div className="text-xs text-gray-400 w-20">Criticality</div>
                                <div className="w-full bg-gray-600 rounded-full h-1.5 flex-1">
                                    <div className="bg-gradient-to-r from-red-500 to-red-400 h-1.5 rounded-full" style={{ width: `${skill.confidence}%` }}></div>
                                </div>
                                <span className="text-xs font-semibold w-8 text-right">{skill.confidence}%</span>
                            </div>
                            <button
                                onClick={() => handleFindResources(skill.name)}
                                disabled={isLoadingResources && selectedSkillForLearning === skill.name}
                                className="flex items-center justify-center w-full text-xs font-semibold text-amber-400 hover:text-amber-300 disabled:text-gray-500 disabled:cursor-wait mt-2 pt-2 border-t border-gray-700/50"
                            >
                                {isLoadingResources && selectedSkillForLearning === skill.name ? (
                                    <Spinner className="w-4 h-4 mr-2" />
                                ) : (
                                    <AcademicCapIcon className="w-4 h-4 mr-2" />
                                )}
                                Find Learning Resources
                            </button>
                        </div>
                    ))}
                    {missingSkills.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No skill gaps found!</p>}
                </div>
            </div>
            <div className="bg-green-900/10 p-4 rounded-lg border border-green-800">
                <h3 className="text-lg font-semibold text-green-300 mb-3">Matched Skills ({matchedSkills.length})</h3>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {matchedSkills.map(skill => (
                        <div key={skill.name} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3">
                            <p className="font-bold text-white">{skill.name}</p>
                            <div className="text-xs text-gray-400 mt-1">{skill.category}</div>
                             <div className="flex items-center space-x-2 my-2" title={`Your Confidence: ${skill.userConfidence}%`}>
                                <div className="text-xs text-gray-400 w-20">Your Level</div>
                                <div className="w-full bg-gray-600 rounded-full h-1.5 flex-1">
                                    <div className="bg-gradient-to-r from-green-500 to-green-400 h-1.5 rounded-full" style={{ width: `${skill.userConfidence}%` }}></div>
                                </div>
                                <span className="text-xs font-semibold w-8 text-right">{skill.userConfidence}%</span>
                            </div>
                        </div>
                    ))}
                    {matchedSkills.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No matching skills identified.</p>}
                </div>
            </div>
        </div>
      
      {additionalUserSkills.length > 0 && (
          <div className="bg-amber-900/10 p-4 rounded-lg border border-amber-800">
            <button 
                onClick={() => setShowAdditional(!showAdditional)}
                className="w-full flex justify-between items-center text-left"
            >
                <h3 className="text-lg font-semibold text-amber-300">Your Additional Skills ({additionalUserSkills.length})</h3>
                <div className="flex items-center text-amber-300">
                    <span className="text-sm font-medium mr-2">{showAdditional ? 'Hide' : 'Show'}</span>
                    {showAdditional ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </div>
            </button>
            {showAdditional && (
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {additionalUserSkills.map(skill => (
                        <div key={skill.name} className="bg-gray-800/30 border border-gray-700 rounded-lg p-3 text-sm">
                            <p className="font-bold text-white">{skill.name}</p>
                            <div className="text-xs text-gray-400 mt-1">{skill.category}</div>
                             <div className="flex items-center space-x-2 my-2" title={`Your Confidence: ${skill.confidence}%`}>
                                <div className="w-full bg-gray-600 rounded-full h-1.5 flex-1">
                                    <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full" style={{ width: `${skill.confidence}%` }}></div>
                                </div>
                                <span className="text-xs font-semibold">{skill.confidence}%</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      )}
      
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

export default SkillGapAnalysis;
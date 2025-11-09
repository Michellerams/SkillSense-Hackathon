
import React, { useState, useCallback } from 'react';
import { Skill } from '../types';
import SkillGapAnalysis from './SkillGapAnalysis';
import { extractSkillsFromJobPosting, generateSkillGapSummary } from '../services/geminiService';
import { Spinner } from './common/Spinner';

interface OpportunityAnalyzerProps {
  userSkills: Skill[];
}

const OpportunityAnalyzer: React.FC<OpportunityAnalyzerProps> = ({ userSkills }) => {
  const [jobDescription, setJobDescription] = useState('');
  const [jobSkills, setJobSkills] = useState<Skill[]>([]);
  const [gapSummary, setGapSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Analyzes the job description text to extract skills and generate a gap analysis summary.
   */
  const handleAnalyzeJob = useCallback(async () => {
    if (jobDescription.trim() === '') {
      setError('Please paste a job description.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setJobSkills([]);
    setGapSummary('');

    try {
      // Extract skills from the job description using the AI service.
      const extractedSkills = await extractSkillsFromJobPosting(jobDescription);
      setJobSkills(extractedSkills);
      
      // If user skills are available, generate a gap summary.
      if (userSkills.length > 0 && extractedSkills.length > 0) {
        const summary = await generateSkillGapSummary(userSkills, extractedSkills);
        setGapSummary(summary);
      }

    } catch (e: any) {
      setError(e.message || 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [jobDescription, userSkills]);

  return (
    <div className="space-y-8">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
        <h2 className="text-xl font-bold text-white mb-2">Analyze a Job Description</h2>
        <p className="text-gray-400 mb-4 text-sm">Paste a job description below to identify required skills and see how your profile matches up.</p>
        <div className="bg-black/20 border border-gray-700 rounded-lg p-4">
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job description here..."
            className="w-full h-48 bg-gray-800/50 border border-gray-600 rounded-lg p-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all resize-y"
          />
          <button
            onClick={handleAnalyzeJob}
            disabled={isLoading || !jobDescription.trim()}
            className="w-full mt-4 flex items-center justify-center bg-amber-500 text-black font-bold py-2.5 rounded-lg hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/20 transform hover:scale-105 disabled:bg-gray-600 disabled:text-gray-400 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Analyzing...' : 'Analyze Job & Find Skill Gaps'}
          </button>
        </div>
      </div>
      
      {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg">{error}</div>}

      {isLoading && (
        <div className="flex flex-col items-center justify-center h-64 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
            <Spinner />
            <p className="mt-4 text-amber-500 font-semibold animate-pulse">AI analyzing job description...</p>
        </div>
      )}

      {jobSkills.length > 0 && !isLoading && (
        <SkillGapAnalysis userSkills={userSkills} jobSkills={jobSkills} summary={gapSummary} />
      )}
    </div>
  );
};

export default OpportunityAnalyzer;
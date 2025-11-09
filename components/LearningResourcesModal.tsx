import React from 'react';
import { LearningResource } from '../types';
import { XMarkIcon, AcademicCapIcon, LinkIcon } from './common/Icon';

interface LearningResourcesModalProps {
  skillName: string;
  resources: LearningResource[];
  onClose: () => void;
}

const LearningResourcesModal: React.FC<LearningResourcesModalProps> = ({ skillName, resources, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-amber-800 rounded-2xl shadow-2xl shadow-amber-900/20 w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-800">
          <div>
            <h2 className="text-xl font-bold text-white">Learning Resources</h2>
            <p className="text-amber-400 font-semibold">For: {skillName}</p>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="p-6 overflow-y-auto space-y-4">
          {resources.map((res, index) => (
            <div key={index} className="bg-gray-800/50 p-4 rounded-lg border border-gray-700/50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-white">{res.title}</h3>
                  <p className="text-sm text-gray-400">{res.platform}</p>
                </div>
                <span className="text-xs font-semibold px-2 py-1 bg-gray-700 text-gray-300 rounded-md flex items-center gap-1">
                  <AcademicCapIcon className="w-3 h-3" />
                  {res.type}
                </span>
              </div>
              <div className="mt-3">
                <a 
                  href={res.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-xs text-amber-500 hover:text-amber-400 inline-flex items-center gap-1 truncate"
                >
                  <LinkIcon className="w-3 h-3" />
                  <span className="truncate">{res.url}</span>
                </a>
              </div>
            </div>
          ))}
          <div className="text-xs text-gray-500 pt-2 text-center">
            Disclaimer: Links are AI-generated suggestions for illustrative purposes and should be verified.
          </div>
        </main>
      </div>
    </div>
  );
};

export default LearningResourcesModal;
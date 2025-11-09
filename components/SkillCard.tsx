
import React, { useState, useEffect } from 'react';
import { Skill, SkillCategory } from '../types';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, BriefcaseIcon, LightBulbIcon, AcademicCapIcon, StarIcon, GlobeAltIcon } from './common/Icon';

interface SkillCardProps {
  skill: Skill;
  onUpdate: (updatedSkill: Skill) => void;
  onDelete: () => void;
}

const categoryStyles: { [key in SkillCategory]: { colors: string; icon: React.ReactNode } } = {
  [SkillCategory.Technical]: { colors: 'bg-blue-900/50 text-blue-300 border-blue-700', icon: <BriefcaseIcon className="w-8 h-8 text-blue-400" /> },
  [SkillCategory.SoftSkill]: { colors: 'bg-green-900/50 text-green-300 border-green-700', icon: <LightBulbIcon className="w-8 h-8 text-green-400" /> },
  [SkillCategory.Leadership]: { colors: 'bg-purple-900/50 text-purple-300 border-purple-700', icon: <AcademicCapIcon className="w-8 h-8 text-purple-400" /> },
  [SkillCategory.Language]: { colors: 'bg-teal-900/50 text-teal-300 border-teal-700', icon: <GlobeAltIcon className="w-8 h-8 text-teal-400" /> },
  [SkillCategory.Other]: { colors: 'bg-gray-700/50 text-gray-300 border-gray-600', icon: <StarIcon className="w-8 h-8 text-gray-400" /> },
};


const SkillCard: React.FC<SkillCardProps> = ({ skill, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableSkill, setEditableSkill] = useState<Skill>(skill);

  useEffect(() => {
    setEditableSkill(skill);
  }, [skill]);

  const handleSave = () => {
    onUpdate(editableSkill);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditableSkill(skill);
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditableSkill(prev => ({ ...prev, [name]: name === 'confidence' ? parseInt(value) : value }));
  };

  const confidenceColor = skill.confidence > 75 ? 'text-green-400' : skill.confidence > 50 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="group h-64 [perspective:1000px]">
      <div className={`relative h-full w-full [transform-style:preserve-3d] transition-transform duration-700 ${isEditing ? '[transform:rotateY(180deg)]' : 'group-hover:[transform:rotateY(180deg)]'}`}>
        {/* Front Face */}
        <div className="absolute h-full w-full [backface-visibility:hidden] rounded-xl border border-gray-800 bg-gray-900/60 backdrop-blur-sm flex flex-col items-center justify-center text-center p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
           <span className={`absolute top-4 right-4 px-2 py-0.5 text-xs font-semibold rounded-full border ${categoryStyles[skill.category].colors}`}>
                {skill.category}
            </span>
            <div className="flex-grow flex flex-col items-center justify-center">
                {categoryStyles[skill.category].icon}
                <h3 className="text-xl font-bold text-white mt-4">{skill.name}</h3>
            </div>
            <p className="text-xs text-gray-500">Hover for details</p>
        </div>

        {/* Back Face */}
        <div className="absolute h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border border-amber-800 bg-gray-800/80 backdrop-blur-sm flex flex-col shadow-2xl shadow-amber-900/40">
          {isEditing ? (
            <div className="p-4 flex flex-col space-y-2 h-full">
              <input name="name" value={editableSkill.name} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white font-bold text-base" />
              <select name="category" value={editableSkill.category} onChange={handleInputChange} className="w-full bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white text-sm">
                {Object.values(SkillCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="flex items-center space-x-2">
                  <input type="range" name="confidence" min="1" max="100" value={editableSkill.confidence} onChange={handleInputChange} className="w-full" />
                  <span className="font-bold text-xs text-gray-300">{editableSkill.confidence}%</span>
              </div>
              <textarea name="evidence" value={editableSkill.evidence} onChange={handleInputChange} className="w-full flex-grow bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-gray-300 text-xs resize-none" />
              <div className="flex justify-end space-x-1 pt-1">
                <button onClick={handleCancel} className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700"><XMarkIcon className="w-5 h-5" /></button>
                <button onClick={handleSave} className="p-2 text-green-500 hover:text-green-400 rounded-full hover:bg-green-500/20"><CheckIcon className="w-5 h-5" /></button>
              </div>
            </div>
          ) : (
            <div className="p-4 flex flex-col h-full">
              <div className="flex-grow flex flex-col overflow-hidden">
                <div className="flex justify-between items-start gap-2">
                    <h3 className="text-lg font-bold text-white pr-2">{skill.name}</h3>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${categoryStyles[skill.category].colors}`}>
                            {skill.category}
                        </span>
                        {skill.type && (
                            <span title={`This skill was ${skill.type === 'Implicit' ? 'inferred from context' : 'explicitly stated'}`} className={`px-2 py-0.5 text-xs font-semibold rounded-full border whitespace-nowrap ${skill.type === 'Implicit' ? 'border-cyan-700 bg-cyan-900/50 text-cyan-300' : 'border-gray-600 bg-gray-700/50 text-gray-300'}`}>
                                {skill.type}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center my-3">
                    <div className="w-full bg-gray-600 rounded-full h-1.5">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full" style={{ width: `${skill.confidence}%` }}></div>
                    </div>
                    <span className={`ml-3 font-bold text-sm ${confidenceColor}`}>{skill.confidence}%</span>
                </div>
                
                <div className="flex-grow overflow-y-auto pr-2 text-sm text-gray-400 italic border-l-2 border-amber-700 pl-3">
                  <p>"{skill.evidence}"</p>
                </div>
              </div>

              <div className="flex justify-end items-center mt-2 pt-2 border-t border-gray-700 space-x-1 flex-shrink-0">
                <button onClick={() => setIsEditing(true)} className="p-2 rounded-full text-gray-500 hover:bg-gray-700 hover:text-amber-500 transition-colors">
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button onClick={onDelete} className="p-2 rounded-full text-gray-500 hover:bg-gray-700 hover:text-red-500 transition-colors">
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillCard;
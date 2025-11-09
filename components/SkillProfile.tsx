
import React, { useState, useCallback, useRef } from 'react';
import { DataSource, Skill, SkillCategory, User } from '../types';
import SkillCard from './SkillCard';
import CVViewer from './CVViewer';
import { Spinner } from './common/Spinner';
import { generateCVFromSkills, summarizeSkills } from '../services/geminiService';
import { CameraIcon, ArrowDownTrayIcon } from './common/Icon';

declare global {
  interface Window {
    jspdf: any;
  }
}

interface SkillProfileProps {
  user: User;
  skills: Skill[];
  dataSources: DataSource[];
  summary: string;
  onUpdateSummary: (summary: string) => void;
  onUpdateSkills: (skills: Skill[]) => void;
  onUpdateUser: (user: User) => void;
}

const SkillProfile: React.FC<SkillProfileProps> = ({ user, skills, dataSources, summary, onUpdateSummary, onUpdateSkills, onUpdateUser }) => {
  const [filter, setFilter] = useState<SkillCategory | 'All'>('All');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [cvContent, setCvContent] = useState<string | null>(null);
  const [isGeneratingCv, setIsGeneratingCv] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatarUrl = reader.result as string;
        onUpdateUser({ ...user, avatarUrl: newAvatarUrl });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateSummary = useCallback(async () => {
    if (skills.length === 0) return;
    setIsSummarizing(true);
    setError(null);
    try {
        const generatedSummary = await summarizeSkills(skills);
        onUpdateSummary(generatedSummary);
    } catch (e: any) {
        setError(e.message || 'Failed to generate summary.');
    } finally {
        setIsSummarizing(false);
    }
  }, [skills, onUpdateSummary]);
  
  const handleGenerateCv = useCallback(async () => {
    if (skills.length === 0) return;
    
    setIsGeneratingCv(true);
    setError(null);
    
    let currentSummary = summary;
    
    // If summary doesn't exist, generate it first.
    if (!currentSummary) {
        try {
            const generatedSummary = await summarizeSkills(skills);
            onUpdateSummary(generatedSummary);
            currentSummary = generatedSummary;
        } catch (e: any) {
            setError(e.message || 'Failed to generate summary for CV.');
            setIsGeneratingCv(false);
            return;
        }
    }
    
    try {
        const generatedCv = await generateCVFromSkills(skills, currentSummary);
        if (generatedCv && generatedCv.trim()) {
            setCvContent(generatedCv);
        } else {
            setError('The AI could not generate a CV from the provided data. Please try again.');
        }
    } catch (e: any) {
        setError(e.message || 'Failed to generate CV.');
    } finally {
        setIsGeneratingCv(false);
    }
  }, [skills, summary, onUpdateSummary]);
  
  const handleDownloadPdf = useCallback(async () => {
    if (skills.length === 0) return;

    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        console.error("jsPDF is not loaded!");
        setError("PDF generation library is not available. Please try refreshing the page.");
        return;
    }
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    if (typeof (doc as any).autoTable !== 'function') {
        console.error("jsPDF-AutoTable plugin is not loaded!");
        setError("PDF report generator is not available. Please try refreshing the page.");
        return;
    }

    setIsGeneratingPdf(true);
    setError(null);

    try {
      const fullName = `${user.name} ${user.surname || ''}`.trim();
      let currentY = 40;

      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('SkillSense AI Skill Report', 105, 22, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`For: ${fullName}`, 14, currentY);
      currentY += 7;
      if (user.email) {
          doc.text(`Email: ${user.email}`, 14, currentY);
          currentY += 7;
      }
      
      currentY += 8;
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Data Sources Analyzed', 14, currentY);
      currentY += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const sourceNames = dataSources.map(ds => ds.name).join(', ');
      const splitSourceNames = doc.splitTextToSize(sourceNames, 180);
      doc.text(splitSourceNames, 14, currentY);
      currentY += (splitSourceNames.length * 4) + 8;


      const categories: SkillCategory[] = [SkillCategory.Technical, SkillCategory.SoftSkill, SkillCategory.Leadership, SkillCategory.Language, SkillCategory.Other];
      const body: (string|{content: string, colSpan: number, styles: any})[][] = [];

      categories.forEach(category => {
          const categorySkills = skills.filter(skill => skill.category === category);
          if (categorySkills.length > 0) {
              body.push([{ 
                  content: category, 
                  colSpan: 3, 
                  styles: { fontStyle: 'bold', fillColor: '#f3f4f6', textColor: '#111827' } 
              }]);
              categorySkills.forEach(skill => {
                  body.push([
                      skill.name,
                      `${skill.confidence}%`,
                      skill.evidence
                  ]);
              });
          }
      });
      
      (doc as any).autoTable({
          startY: currentY,
          head: [['Skill', 'Confidence', 'Evidence']],
          body: body,
          theme: 'striped',
          headStyles: { fillColor: '#fbbf24', textColor: '#000000' },
          columnStyles: {
            2: { cellWidth: 88 }
          }
      });
      
      doc.save(`SkillSense_Report_${fullName.replace(/\s/g, '_')}.pdf`);
    } catch (e: any) {
      setError(e.message || 'Failed to generate PDF report.');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [skills, user, dataSources]);


  const updateSkill = (index: number, updatedSkill: Skill) => {
    const newSkills = [...skills];
    newSkills[index] = updatedSkill;
    onUpdateSkills(newSkills);
    onUpdateSummary(''); // Clear summary as skills have changed
  };

  const deleteSkill = (index: number) => {
    const newSkills = skills.filter((_, i) => i !== index);
    onUpdateSkills(newSkills);
    onUpdateSummary(''); // Clear summary as skills have changed
  };

  const filteredSkills = filter === 'All' ? skills : skills.filter(skill => skill.category === filter);
  const categories: SkillCategory[] = [SkillCategory.Technical, SkillCategory.SoftSkill, SkillCategory.Leadership, SkillCategory.Language, SkillCategory.Other];
  const fullName = `${user.name} ${user.surname || ''}`.trim();

  return (
    <div className="space-y-8">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl flex items-center gap-5">
            <div className="relative group cursor-pointer" onClick={handleImageClick}>
                <img src={user.avatarUrl} alt={user.name} className="w-16 h-16 rounded-full shadow-sm transition-opacity group-hover:opacity-75" />
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <CameraIcon className="w-6 h-6 text-white" />
                </div>
            </div>
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                accept="image/png, image/jpeg, image/gif"
            />
            <div>
                <h1 className="text-3xl font-bold text-white">{fullName}</h1>
                <p className="text-gray-400">{user.email || 'Your Personal Skill Profile'}</p>
            </div>
        </div>

        {error && <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg">{error}</div>}
        
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
            <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">AI-Generated Summary & CV</h2>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={handleGenerateSummary}
                        disabled={isSummarizing || skills.length === 0}
                        className="flex items-center justify-center px-4 py-2 bg-gray-800 text-gray-200 font-semibold rounded-lg hover:bg-gray-700 transition-colors disabled:bg-gray-700/50 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        {isSummarizing && <Spinner className="w-5 h-5 mr-2" />}
                        {summary ? 'Regenerate Summary' : 'Generate Summary'}
                    </button>
                    <button
                        onClick={handleGenerateCv}
                        disabled={isGeneratingCv || skills.length === 0}
                        className="flex items-center justify-center px-4 py-2 bg-amber-500 text-black font-bold rounded-lg hover:bg-amber-400 transition-colors disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                        {isGeneratingCv && <Spinner className="w-5 h-5 mr-2" />}
                        Generate CV
                    </button>
                    <button
                        onClick={handleDownloadPdf}
                        disabled={isGeneratingPdf || skills.length === 0}
                        className="flex items-center justify-center px-4 py-2 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {isGeneratingPdf ? <Spinner className="w-5 h-5 mr-2" /> : <ArrowDownTrayIcon className="w-5 h-5 mr-2" />}
                        Download Report
                    </button>
                </div>
            </div>
            <div className="bg-black/20 border border-gray-700 rounded-lg p-6 min-h-[8rem]">
                {isSummarizing && !summary && (
                    <div className="text-center text-gray-400">Generating summary...</div>
                )}
                {summary && (
                    <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">{summary}</p>
                )}
                {!summary && !isSummarizing && (
                    <p className="text-gray-500 text-center">Click "Generate Summary" to create a professional overview, or click "Generate CV" to do both in one step.</p>
                )}
            </div>
        </div>
        
        <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-white mb-4">Identified Skills ({skills.length})</h2>
            <div className="mb-6">
                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setFilter('All')} className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${filter === 'All' ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>All</button>
                    {categories.map(cat => (
                         <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-1.5 text-sm font-medium rounded-full transition-colors ${filter === cat ? 'bg-amber-500 text-black' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}>{cat}</button>
                    ))}
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSkills.map((skill, index) => {
                    const originalIndex = skills.findIndex(s => s === skill);
                    return <SkillCard key={originalIndex} skill={skill} onUpdate={(s) => updateSkill(originalIndex, s)} onDelete={() => deleteSkill(originalIndex)} />;
                })}
            </div>
            {filteredSkills.length === 0 && filter !== 'All' && (
                <div className="text-center py-10 text-gray-500">
                    No skills found in the "{filter}" category.
                </div>
            )}
        </div>
        {cvContent && <CVViewer cvContent={cvContent} onClose={() => setCvContent(null)} />}
    </div>
  );
};

export default SkillProfile;
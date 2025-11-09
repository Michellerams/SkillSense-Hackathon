
import React, { useState, useRef, useCallback } from 'react';
import { DataSource } from '../types';
import { DocumentPlusIcon, LinkIcon, XMarkIcon } from './common/Icon';

interface DataSourceInputProps {
  onAnalyze: (sources: DataSource[]) => void;
  isLoading: boolean;
}

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

const DataSourceInput: React.FC<DataSourceInputProps> = ({ onAnalyze, isLoading }) => {
  const [sources, setSources] = useState<DataSource[]>([]);
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    const supportedFileTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    for (const file of Array.from<File>(files)) {
      if (file.type.startsWith('text/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setSources(prev => [...prev, { name: file.name, content, mimeType: file.type }]);
        };
        reader.readAsText(file);
      } else if (supportedFileTypes.includes(file.type)) {
        try {
          const base64Content = await fileToBase64(file);
          setSources(prev => [...prev, { name: file.name, content: base64Content, mimeType: file.type }]);
        } catch (error) {
          console.error("Error reading file:", error);
          alert("Sorry, there was an error processing the file.");
        }
      } else {
        alert(`File type ${file.type} not supported for direct reading.`);
      }
    }
     // Reset file input to allow uploading the same file again
    if(event.target) {
      event.target.value = '';
    }
  };

  const removeSource = (index: number) => {
    setSources(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleAnalyzeClick = useCallback(() => {
    const allSources = [...sources];
    if (linkedInUrl.trim()) {
        allSources.push({ name: 'LinkedIn Profile URL', content: `LinkedIn Profile: ${linkedInUrl.trim()}`, mimeType: 'text/plain' });
    }
    if (githubUrl.trim()) {
        allSources.push({ name: 'GitHub Profile URL', content: `GitHub Profile: ${githubUrl.trim()}`, mimeType: 'text/plain' });
    }
    if (websiteUrl.trim()) {
        allSources.push({ name: 'Personal Website URL', content: `Personal Website: ${websiteUrl.trim()}`, mimeType: 'text/plain' });
    }
    onAnalyze(allSources);
  }, [onAnalyze, sources, linkedInUrl, githubUrl, websiteUrl]);

  const canAnalyze = sources.length > 0 || linkedInUrl.trim() !== '' || githubUrl.trim() !== '' || websiteUrl.trim() !== '';

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left side: Upload and Links */}
        <div className="space-y-4">
           {/* File Upload */}
            <div>
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center w-full px-4 py-3 bg-white/5 border-2 border-dashed border-gray-600 rounded-lg hover:border-amber-500 hover:bg-white/10 transition-colors"
                >
                    <DocumentPlusIcon className="w-5 h-5 mr-2 text-gray-400" />
                    <span className="font-semibold text-sm text-gray-300">Upload CV, Reviews, etc. (.pdf, .docx, .txt)</span>
                </button>
                <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".txt,.md,.pdf,.docx"
                />
            </div>
            {/* Link Inputs */}
            <div className="space-y-2">
                 <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="url" placeholder="LinkedIn Profile URL" value={linkedInUrl} onChange={e => setLinkedInUrl(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                </div>
                 <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="url" placeholder="GitHub Profile URL" value={githubUrl} onChange={e => setGithubUrl(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                </div>
                 <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input type="url" placeholder="Personal Website/Portfolio URL" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} className="w-full bg-gray-800/50 border border-gray-600 rounded-lg py-2 pl-9 pr-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all" />
                </div>
            </div>
        </div>

        {/* Right side: Source List */}
        <div className="bg-black/20 border border-gray-700 rounded-lg p-3 min-h-[180px]">
            <h3 className="font-semibold text-sm text-gray-400 mb-2">Added Sources ({sources.length})</h3>
            <div className="space-y-1.5 overflow-y-auto max-h-48">
                {sources.length > 0 ? sources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-800/50 border border-gray-700 p-1.5 rounded-lg text-xs">
                        <span className="truncate text-gray-300 flex-1 pl-1">{source.name}</span>
                        <button onClick={() => removeSource(index)} className="ml-2 p-1 text-gray-500 hover:text-red-500 rounded-full hover:bg-red-500/10">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                )) : (
                    <p className="text-center text-xs text-gray-500 pt-10">Uploaded documents will appear here.</p>
                )}
            </div>
        </div>
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-700">
        <button
            onClick={handleAnalyzeClick}
            disabled={isLoading || !canAnalyze}
            className="w-full max-w-xs mx-auto flex items-center justify-center bg-amber-500 text-black font-bold py-2.5 rounded-lg hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/20 transform hover:scale-105 disabled:bg-gray-600 disabled:text-gray-400 disabled:shadow-none disabled:scale-100 disabled:cursor-not-allowed"
        >
            {isLoading ? 'Analyzing...' : 'Analyze Skills'}
        </button>
      </div>
    </div>
  );
};

export default DataSourceInput;

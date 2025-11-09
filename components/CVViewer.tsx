import React, { useState } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from './common/Icon';

declare global {
  interface Window {
    jspdf: any;
  }
}

interface CVViewerProps {
  cvContent: string;
  onClose: () => void;
}

const CVViewer: React.FC<CVViewerProps> = ({ cvContent, onClose }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copy Markdown');

  const handleCopy = () => {
    navigator.clipboard.writeText(cvContent);
    setCopyButtonText('Copied!');
    setTimeout(() => setCopyButtonText('Copy Markdown'), 2000);
  };
  
  const handleDownloadPdf = () => {
    if (typeof window.jspdf === 'undefined' || typeof window.jspdf.jsPDF === 'undefined') {
        alert("PDF generation library is not available.");
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Simple text conversion from markdown
    const textContent = cvContent
      .replace(/## (.*)/g, '\n$1\n')
      .replace(/### (.*)/g, '\n$1\n')
      .replace(/\* (.*)/g, '- $1')
      .replace(/\*\*(.*)\*\*/g, '$1');

    const lines = doc.splitTextToSize(textContent, 180);
    doc.text(lines, 15, 15);
    doc.save('SkillSense_CV.pdf');
  };
  
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-gray-900 border border-amber-800 rounded-2xl shadow-2xl shadow-amber-900/20 w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex justify-between items-center p-4 border-b border-gray-800 flex-wrap gap-2">
          <h2 className="text-xl font-bold text-white">Generated CV</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={handleCopy} className="px-3 py-1.5 text-xs bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors">
              {copyButtonText}
            </button>
            <button onClick={handleDownloadPdf} className="flex items-center gap-2 px-3 py-1.5 text-xs bg-amber-600 text-black font-semibold rounded-lg hover:bg-amber-500 transition-colors">
              <ArrowDownTrayIcon className="w-4 h-4" /> Download as PDF
            </button>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-white">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </header>
        <main className="p-6 overflow-y-auto">
          <pre className="text-gray-300 whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {cvContent}
          </pre>
        </main>
      </div>
    </div>
  );
};

export default CVViewer;
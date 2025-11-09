import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ChatBubbleIcon, XMarkIcon, PaperClipIcon, PaperAirplaneIcon } from './common/Icon';
import { Skill } from '../types';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  fileName?: string;
}

interface ChatbotProps {
  analysisCompleted: boolean;
  skills: Skill[];
}

/**
 * Converts a File object to a base64 encoded string with its MIME type.
 * @param file The file to convert.
 * @returns A promise that resolves to an object containing the mimeType and base64 data.
 */
const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const mimeType = result.split(';')[0].split(':')[1];
      const data = result.split(',')[1];
      resolve({ mimeType, data });
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * The system prompt that defines the chatbot's persona, capabilities, and rules.
 * This is a crucial piece of prompt engineering to guide the AI's behavior for accuracy.
 */
const systemPrompt = `You are SkillBot, an expert AI career coach integrated into the SkillSense application. Your primary function is to provide accurate, insightful, and encouraging analysis of professional materials provided by the user.

**Core Task:**
Analyze the user's provided content (text, an attached document, or a URL). Your analysis must be grounded **exclusively** in the information available from the provided source.

**User's Current Skill Profile (Context):**
You will be provided with the user's current skill profile. You MUST use this as context to tailor your feedback and make your recommendations more relevant and personalized.

**CRITICAL INSTRUCTIONS FOR ACCURACY AND QUALITY:**
1.  **Grounding is Paramount**: Do not invent information. All your insights and summaries must be directly supported by the content you are analyzing. If you analyze a URL, you MUST use your search tool to access its content and base your entire analysis on what you find there.
2.  **Fact-Check Yourself**: Before generating a response, mentally double-check your key findings against the source material to ensure accuracy.
3.  **Strictly Unbiased**: Your analysis must be completely objective. Ignore any personal details like name, pronouns, or location. Focus solely on the professional skills, experiences, and achievements presented.
4.  **Encouraging & Professional Tone**: Maintain a warm, motivating, and professional tone. Frame all feedback constructively and always find positive aspects to highlight.
5.  **Adhere to Format**: Your response MUST strictly follow the Markdown format below. Do not add extra headers or commentary outside this structure.

**Output Format:**

**Summary:**
[A concise, factual summary of the provided content. What is it and what is its main purpose?]

**Insight:**
[Your analysis of the content. What does this reveal about the person's skills or the project's quality? Connect your insights to specific evidence from the source.]

**Recommendation:**
[Provide 1-2 concrete, actionable recommendations based on your analysis and the user's skill profile context. This could be a new skill to learn, a way to improve a project, or a next career step.]

**Encouragement:**
[A positive, specific comment that builds confidence by acknowledging a clear strength you observed. Example: "The way you structured the backend logic in this project is impressive and clearly demonstrates your expertise in API design."]

Now, begin your analysis of the user's query.`;

const Chatbot: React.FC<ChatbotProps> = ({ analysisCompleted, skills }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userInput, setUserInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Formats the bot's markdown response into styled React elements.
   * @param text The raw markdown text from the bot.
   * @returns A React fragment with formatted content.
   */
  const formatBotMessage = (text: string) => {
    const segments = text.split(/\r?\n/);
    const elements: React.ReactElement[] = [];
    let currentBlock: string[] = [];

    const flushBlock = (key: number) => {
        if (currentBlock.length > 0) {
            elements.push(<p key={`p-${key}`} className="text-sm whitespace-pre-wrap">{currentBlock.join('\n')}</p>);
            currentBlock = [];
        }
    };

    segments.forEach((line, index) => {
        const match = line.match(/^\*\*(Summary|Insight|Recommendation|Encouragement):\*\*/);
        if (match) {
            flushBlock(index);
            const header = match[1];
            elements.push(<strong key={`h-${index}`} className="block text-amber-400 font-bold mt-3 mb-1">{header}:</strong>);
            const restOfLine = line.substring(match[0].length).trim();
            if (restOfLine) {
                currentBlock.push(restOfLine);
            }
        } else {
            currentBlock.push(line);
        }
    });

    flushBlock(segments.length);
    return <>{elements}</>;
  };

  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const textInput = userInput.trim();
    if (!textInput && !attachedFile) return;

    const userMessage: Message = {
      sender: 'user',
      text: textInput,
      fileName: attachedFile?.name,
    };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setUserInput('');
    setAttachedFile(null);

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const containsUrl = urlRegex.test(textInput);

    try {
        const history = messages
            .filter((msg, index) => !(index === 0 && msg.sender === 'bot')) // Exclude initial welcome message
            .map((msg): { role: string; parts: { text: string }[] } => ({
                role: msg.sender === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }],
            }));
        
        const currentUserParts: any[] = [];

        const isFirstMeaningfulInteraction = messages.filter(m => m.sender === 'user').length === 0 && analysisCompleted;
        if (isFirstMeaningfulInteraction && skills.length > 0) {
            const skillsContext = `For context, this is my current skill profile. Please use it to inform your analysis and recommendations:\n\n${JSON.stringify(skills, null, 2)}\n\nMy request is below:\n---`;
            currentUserParts.push({ text: skillsContext });
        }

        if (textInput) {
            currentUserParts.push({ text: textInput });
        }
        
        if (attachedFile) {
            const fileData = await fileToBase64(attachedFile);
            currentUserParts.push({
            inlineData: {
                mimeType: fileData.mimeType,
                data: fileData.data,
            }
            });
        }
        
        const contents = [...history, { role: 'user', parts: currentUserParts }];
        
        const config: any = {};
        if (containsUrl) {
            config.tools = [{ googleSearch: {} }];
        }
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: contents,
            config: {
                ...config,
                systemInstruction: systemPrompt,
            }
        });

      setMessages(prev => [...prev, { sender: 'bot', text: response.text }]);
    } catch (error) {
      console.error("Gemini API error:", error);
      setMessages(prev => [...prev, { sender: 'bot', text: "Oops! My circuits are a bit fuzzy. I couldn't analyze that. Please try a different file or link." }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleChat = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen && messages.length === 0) {
      // Set a dynamic welcome message based on application state.
      const welcomeText = analysisCompleted 
        ? "Your profile has been analyzed! Want to dive deeper? Share a project link, research paper, or an updated CV, and I'll give you personalized feedback."
        : "Hello! I'm SkillBot, your AI Career Coach. Share a link to your GitHub, a research paper, or upload your CV, and I'll provide a detailed analysis to get you started.";
      setMessages([{ sender: 'bot', text: welcomeText }]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4">
      {isOpen && (
        <div className="w-[380px] h-[600px] bg-gray-900/50 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 flex flex-col animate-fade-in-up">
          <header className="flex items-center justify-between p-4 bg-amber-500 text-black rounded-t-2xl">
            <h3 className="font-bold text-lg">SkillBot AI Coach</h3>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-black/10">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </header>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <div key={index} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.sender === 'bot' && <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 text-lg">🤖</div>}
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 ${msg.sender === 'user' ? 'bg-amber-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                  {msg.sender === 'bot' ? formatBotMessage(msg.text) : <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
                  {msg.fileName && (
                    <div className="mt-2 pt-2 border-t border-amber-400/50 text-xs text-amber-100 flex items-center gap-2">
                        <PaperClipIcon className="w-4 h-4" /> <span>{msg.fileName}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
               <div className="flex items-end gap-2 justify-start">
                    <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center flex-shrink-0 text-lg">🤖</div>
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-700 text-gray-200 rounded-bl-none">
                         <div className="flex items-center justify-center space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="p-3 border-t border-gray-700">
            {attachedFile && (
                <div className="flex items-center justify-between bg-gray-800 text-xs text-gray-300 px-3 py-1.5 rounded-md mb-2">
                    <span className="truncate">File: {attachedFile.name}</span>
                    <button type="button" onClick={() => setAttachedFile(null)} className="ml-2 text-gray-500 hover:text-white">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="relative flex items-center">
              <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Paste a link or ask a question..."
                autoComplete="off"
                className="w-full bg-gray-800 border-gray-600 rounded-full py-2 pl-10 pr-20 text-sm text-white focus:ring-amber-500 focus:border-amber-500"
              />
              <input type="file" ref={fileInputRef} onChange={e => setAttachedFile(e.target.files?.[0] || null)} className="hidden" />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-amber-400">
                 <PaperClipIcon className="w-5 h-5"/>
              </button>
              <button type="submit" disabled={isLoading} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 bg-amber-500 text-black rounded-full hover:bg-amber-400 transition-colors disabled:bg-gray-600">
                 <PaperAirplaneIcon className="w-5 h-5"/>
              </button>
            </div>
          </form>
        </div>
      )}

      <button
        onClick={toggleChat}
        className="w-16 h-16 bg-amber-500 text-black rounded-full shadow-lg flex items-center justify-center transform hover:scale-110 transition-transform"
        aria-label="Toggle Chatbot"
      >
        {isOpen ? <XMarkIcon className="w-8 h-8" /> : <ChatBubbleIcon className="w-8 h-8" />}
      </button>
    </div>
  );
};

export default Chatbot;

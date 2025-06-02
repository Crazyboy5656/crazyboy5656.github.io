
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';
import { OlympiadSubject, ChatMessage } from '../types';
import { OLYMPIAD_SUBJECTS } from '../constants';
import { analyzeQuestionImage, analyzeTextQuestion, startOrContinueChat } from '../services/geminiService';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatMathString } from '../utils/textFormatters';

const FileUploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.336 7.65M6.75 19.5L6.75 9.75" />
  </svg>
);

const BrainIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.764m-4.764 4.764a2.25 2.25 0 013.422-.025m-3.422.025a2.25 2.25 0 003.422.025m0 0a2.25 2.25 0 003.422.025M12 6.75v.75m0 3v.75m0 3v.75m3.75-4.5v.75m0 3v.75m-7.5-3v.75m0 3v.75M7.5 12h.75m3 0h.75m3 0h.75M12 15a2.25 2.25 0 002.25-2.25H9.75A2.25 2.25 0 0012 15zm0 0v2.25m0 0H9.75M12 17.25v-2.25m3.75 0v2.25M15.75 15v2.25M6 12v-1.5a1.5 1.5 0 013 0v1.5" />
    </svg>
);

const TypeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
    </svg>
);

const PaperAirplaneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);


const AISolverPage: React.FC = () => {
  const { isLoading, setIsLoading, error, setError, apiKeyAvailable, olympiadSubject: globalDefaultSubject } = useAppContext();
  const location = useLocation();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  const [inputMode, setInputMode] = useState<'image' | 'text'>('image');
  const [typedQuestion, setTypedQuestion] = useState<string>('');
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<OlympiadSubject | undefined>(globalDefaultSubject || undefined);
  
  // State for chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [followUpQuery, setFollowUpQuery] = useState<string>('');
  const [isSolving, setIsSolving] = useState<boolean>(false); // For initial solve
  const [isChatting, setIsChatting] = useState<boolean>(false); // For follow-ups


  useEffect(() => {
    if (location.state?.preselectedSubject) {
      setSelectedSubject(location.state.preselectedSubject as OlympiadSubject);
    } else if (globalDefaultSubject) {
        setSelectedSubject(globalDefaultSubject);
    }
  }, [location.state, globalDefaultSubject]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);


  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a JPG, PNG, WEBP or GIF image.');
        setUploadedImageFile(null); setImagePreview(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size exceeds 10MB. Please upload a smaller image.');
        setUploadedImageFile(null); setImagePreview(null);
        return;
      }
      
      setUploadedImageFile(file);
      setChatHistory([]); 
      setError(null); 

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolveWithAI = useCallback(async () => {
    if (!apiKeyAvailable) {
      setError("API Key must be available.");
      return;
    }

    let initialUserMessageText = "";
    if (inputMode === 'image') {
      if (!uploadedImageFile) {
        setError("Please upload an image of the question first.");
        return;
      }
      initialUserMessageText = "My question is in the uploaded image. Please solve it.";
    } else { // text mode
      if (!typedQuestion.trim()) {
        setError("Please type your question first.");
        return;
      }
      initialUserMessageText = `My question is: "${typedQuestion}" Please solve it.`;
    }

    setIsSolving(true); // Use for initial solve button state
    setIsLoading(true); // Global loading for context
    setError(null);
    setChatHistory([]); // Clear previous chat

    const initialUserMessage: ChatMessage = {
      id: Date.now().toString() + 'user',
      role: 'user',
      text: initialUserMessageText,
      timestamp: Date.now(),
    };

    try {
      let responseText = "";
      if (inputMode === 'image' && uploadedImageFile) {
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(uploadedImageFile);
          reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            if (!result) reject(new Error("Could not read image data."));
            else resolve(result);
          };
          reader.onerror = () => reject(new Error("Failed to read image file."));
        });
        responseText = await analyzeQuestionImage(base64Image, uploadedImageFile.type, selectedSubject);
      } else if (inputMode === 'text') {
        responseText = await analyzeTextQuestion(typedQuestion, selectedSubject);
      }
      
      const initialModelMessage: ChatMessage = {
        id: Date.now().toString() + 'model',
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };
      setChatHistory([initialUserMessage, initialModelMessage]);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get solution from AI.';
      setError(errorMsg);
      setChatHistory([initialUserMessage, { id: Date.now().toString() + 'system', role: 'system', text: `Error: ${errorMsg}`, timestamp: Date.now() }]);
    } finally {
      setIsSolving(false);
      setIsLoading(false);
    }
  }, [apiKeyAvailable, inputMode, uploadedImageFile, typedQuestion, selectedSubject, setIsLoading, setError, setChatHistory]);

  const handleFollowUp = async () => {
    if (!followUpQuery.trim() || !apiKeyAvailable || chatHistory.length === 0) {
        setError("Please type your follow-up question.");
        return;
    }
    setIsChatting(true);
    setIsLoading(true);
    setError(null);

    const userFollowUpMessage: ChatMessage = { 
      id: Date.now().toString() + 'user- followup', 
      role: 'user', 
      text: followUpQuery, 
      timestamp: Date.now() 
    };
    const currentChatHistory = [...chatHistory, userFollowUpMessage];
    setChatHistory(currentChatHistory);
    setFollowUpQuery('');

    try {
        // Pass selectedSubject if available, otherwise it's a general query
        const aiResponse = await startOrContinueChat(currentChatHistory, userFollowUpMessage.text, selectedSubject || OlympiadSubject.MATH); // Fallback subject if undefined
        setChatHistory(prev => [...prev, aiResponse]);
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get follow-up explanation.';
        setError(errorMsg);
        setChatHistory(prev => [...prev, {id: Date.now().toString() + 'system-followup', role: 'system', text: `Error: ${errorMsg}`, timestamp: Date.now()}]);
    } finally {
        setIsChatting(false);
        setIsLoading(false);
    }
  };

  const handleClear = () => {
    setUploadedImageFile(null);
    setImagePreview(null);
    setTypedQuestion('');
    setChatHistory([]);
    setFollowUpQuery('');
    setError(null);
    // Reset input mode to image by default, or keep current?
    // setInputMode('image'); 
  };
  
  if (!apiKeyAvailable) {
     return <div className="p-8 text-center text-red-600">API Key not configured. AI Solver cannot function.</div>;
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-sky-100 to-indigo-100 p-4 sm:p-8">
      <header className="mb-8 text-center">
        <BrainIcon className="w-16 h-16 mx-auto text-primary mb-3" />
        <h1 className="text-4xl font-bold text-primary">AI Question Solver</h1>
        <p className="text-lg text-textSecondary">Upload an image or type a question and let the AI help you solve it!</p>
      </header>

      {error && !isChatting && !isSolving && ( // Show general error if not specific to ongoing chat/solve
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 shadow-md rounded-md" role="alert">
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Upload and Control Panel */}
        <div className="bg-card p-6 rounded-xl shadow-xl">
          <h2 className="text-2xl font-semibold text-textPrimary mb-4">1. Provide Your Question</h2>
          
          <div className="mb-4">
            <span className="block text-sm font-medium text-textPrimary mb-2">Input Method:</span>
            <div className="flex gap-2 sm:gap-4 rounded-lg bg-slate-100 p-1">
                <button 
                    onClick={() => setInputMode('image')} 
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${inputMode === 'image' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                    aria-pressed={inputMode === 'image'}
                    disabled={isSolving || isChatting}
                >
                    <FileUploadIcon className="w-5 h-5"/> Upload Image
                </button>
                <button 
                    onClick={() => setInputMode('text')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${inputMode === 'text' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                    aria-pressed={inputMode === 'text'}
                    disabled={isSolving || isChatting}
                >
                   <TypeIcon className="w-5 h-5"/> Type Question
                </button>
            </div>
          </div>

          {inputMode === 'image' && (
            <div className="mb-6">
              <label htmlFor="file-upload-ai" className="block text-sm font-medium text-textPrimary mb-1">Question Image:</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary transition-colors">
                <div className="space-y-1 text-center">
                  <FileUploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="file-upload-ai"
                      className={`relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary px-1 ${isSolving || isChatting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <span>Upload a file</span>
                      <input id="file-upload-ai" name="file-upload-ai" type="file" className="sr-only" onChange={handleImageUpload} accept="image/png, image/jpeg, image/gif, image/webp" disabled={isSolving || isChatting} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 10MB</p>
                </div>
              </div>
              {imagePreview && (
                <div className="mt-4 text-center">
                  <h3 className="text-sm font-medium text-textPrimary mb-1">Image Preview:</h3>
                  <img src={imagePreview} alt="Question preview" className="max-h-40 w-auto rounded-lg shadow-sm mx-auto border" />
                </div>
              )}
            </div>
          )}

          {inputMode === 'text' && (
            <div className="mb-6">
              <label htmlFor="typed-question" className="block text-sm font-medium text-textPrimary mb-1">Your Question:</label>
              <textarea
                id="typed-question"
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-shadow disabled:bg-slate-100"
                placeholder="Enter your question here..."
                value={typedQuestion}
                onChange={(e) => setTypedQuestion(e.target.value)}
                disabled={isSolving || isChatting}
              />
            </div>
          )}


          <div className="mb-6">
            <label htmlFor="subject-select" className="block text-sm font-medium text-textPrimary mb-1">Subject (Optional, helps AI):</label>
            <select
              id="subject-select"
              value={selectedSubject || ''}
              onChange={(e) => setSelectedSubject(e.target.value as OlympiadSubject)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm disabled:bg-slate-100"
              disabled={isSolving || isChatting}
            >
              <option value="">Select Subject (General if none)</option>
              {OLYMPIAD_SUBJECTS.map(subject => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleSolveWithAI} 
              disabled={isSolving || isChatting || (inputMode === 'image' && !uploadedImageFile) || (inputMode === 'text' && !typedQuestion.trim())} 
              size="lg"
              className="flex-1"
            >
              {isSolving ? <LoadingSpinner size="sm" color="text-white" /> : 'Solve with AI'}
            </Button>
            <Button 
              onClick={handleClear} 
              variant="ghost" 
              size="lg"
              className="flex-1"
              disabled={isSolving || isChatting}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* AI Response and Chat Area */}
        <div className="bg-card p-6 rounded-xl shadow-xl flex flex-col">
          <h2 className="text-2xl font-semibold text-textPrimary mb-4">2. AI Solution & Chat</h2>
          
          <div ref={chatContainerRef} className="flex-grow space-y-4 overflow-y-auto bg-slate-50 p-4 rounded-lg shadow-inner mb-4 min-h-[200px] max-h-[calc(100vh-25rem)]">
            {chatHistory.length === 0 && !isSolving && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <BrainIcon className="w-12 h-12 text-gray-400 mb-3"/>
                <p className="text-textSecondary">The AI's solution and our chat will appear here.</p>
              </div>
            )}
            {isSolving && chatHistory.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full">
                    <LoadingSpinner />
                    <p className="mt-3 text-textSecondary">AI is generating initial solution...</p>
                </div>
            )}
            {chatHistory.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xl px-4 py-3 rounded-xl shadow-md break-words ${
                  msg.role === 'user' ? 'bg-primary text-white' : 
                  msg.role === 'model' ? 'bg-white text-textPrimary border border-gray-200' : 
                  'bg-red-100 text-red-700 border border-red-300' // System/error messages
                }`}>
                  <div 
                    className="text-sm whitespace-pre-wrap prose prose-sm max-w-none" 
                    dangerouslySetInnerHTML={{ __html: formatMathString(msg.text) }}
                  />
                  <p className="text-xs opacity-70 mt-1.5 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            ))}
            {isChatting && <div className="flex justify-start p-2"> <LoadingSpinner size="sm" color="text-primary"/> </div> }
          </div>
            
          {chatHistory.length > 0 && chatHistory.some(m => m.role === 'model') && !chatHistory.some(m => m.role === 'system' && m.text.startsWith("Error")) && (
            <div className="mt-auto pt-4 border-t border-gray-200">
              <div className="flex gap-2 items-center">
                <input
                    type="text"
                    value={followUpQuery}
                    onChange={(e) => setFollowUpQuery(e.target.value)}
                    placeholder="Ask a follow-up question..."
                    className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-slate-100"
                    disabled={isSolving || isChatting}
                    onKeyPress={(e) => e.key === 'Enter' && !isSolving && !isChatting && followUpQuery.trim() && handleFollowUp()}
                    aria-label="Follow-up question input"
                />
                <Button 
                    onClick={handleFollowUp} 
                    disabled={isSolving || isChatting || !followUpQuery.trim()} 
                    rightIcon={<PaperAirplaneIcon className="w-5 h-5"/>} 
                    aria-label="Send follow-up"
                >
                    Send
                </Button>
              </div>
            </div>
          )}
          {error && (isChatting || isSolving) && ( // Show error specific to chat/solve if it occurred during operation
             <p className="text-red-500 text-sm mt-2 text-center">{error}</p>
          )}

        </div>
      </div>
    </div>
  );
};

export default AISolverPage;

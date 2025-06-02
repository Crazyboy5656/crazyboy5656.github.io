
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../hooks/useAppContext';
import { OlympiadSubject, ChatMessage } from '../types';
import { OLYMPIAD_SUBJECTS, APP_NAME } from '../constants';
import Button from '../components/Button';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatMathString } from '../utils/textFormatters';
import { analyzeQuestionImage, analyzeTextQuestion, startOrContinueChat } from '../services/geminiService';

// Icons (some might be duplicates if AISolverPage was merged here, ensure definitions are unique or shared)

const AcademicCapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
  </svg>
);
const CalculatorIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 15.75V18m-7.5-6.75h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm0 2.25h.008v.008H8.25v-.008zm2.25-4.5h.008v.008H10.5v-.008zm0 2.25h.008v.008H10.5v-.008zm0 2.25h.008v.008H10.5v-.008zm0 2.25h.008v.008H10.5v-.008zm2.25-4.5h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75v-.008zm0 2.25h.008v.008H12.75v-.008zm2.25-4.5h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zm0 2.25h.008v.008H15v-.008zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
</svg>
);
const LightBulbIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.355a7.5 7.5 0 01-7.5 0" />
  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 6.75A.75.75 0 0110.5 6h3a.75.75 0 01.75.75v3.75a.75.75 0 01-.75.75h-3a.75.75 0 01-.75-.75V6.75z" />
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75M9.75 15.75h4.5M9 9.75h6M10.5 3.75h3M7.5 12c0 .621.504 1.125 1.125 1.125M15.375 12c0 .621.504 1.125 1.125 1.125M12 6V3.75" />
</svg>
);
const BeakerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 6.083c-.095-.044-.193-.083-.294-.117l-.25-.084c-.26-.087-.53-.133-.806-.133C11.902 5.75 11 6.652 11 7.75v9.5A2.25 2.25 0 0013.25 19.5h1.5A2.25 2.25 0 0017 17.25V7.75c0-1.098-.902-2-2-2-.276 0-.546.046-.806.133l-.25.084c-.101.034-.2.073-.294.117zM14.25 6.083L12 5m2.25 1.083L12 5m0 0L9.75 6.083M12 5v2.75M12 19.5v-2.25m0 0A2.25 2.25 0 009.75 15H6.573c-.316 0-.624.07-.9.203l-.16.08a1.125 1.125 0 01-1.012-.04L2.75 14.25m10.5 3H4.625c1.088-.69 2.403-1.125 3.875-1.125h.001c1.472 0 2.786.435 3.875 1.125z" />
</svg>
);
const CodeBracketIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
</svg>
);
const QuestionMarkCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
  </svg>
);
const PuzzlePieceIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 7.756a4.5 4.5 0 100 8.488M7.5 10.5h5.25m-5.25 3h5.25M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 6.75h.008v.008H12v-.008z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.215 12.81A4.504 4.504 0 016.75 10.5a4.5 4.5 0 013.465-4.31m0 8.62a4.5 4.5 0 000-8.62" />
 </svg>
);
// Icons for the modal
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


const OnboardingPage: React.FC = () => {
  const { setOlympiadSubject: setGlobalOlympiadSubject, apiKeyAvailable, error: globalError, setIsLoading: setGlobalIsLoading, setError: setGlobalError } = useAppContext();
  const navigate = useNavigate();
  const [selectedSubject, setSelectedSubject] = useState<OlympiadSubject | null>(null);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(!!globalError && !apiKeyAvailable); 
  const solverChatContainerRef = useRef<HTMLDivElement>(null);

  // State for AI Solver Modal
  const [isSolverModalOpen, setIsSolverModalOpen] = useState<boolean>(false);
  const [solverInputMode, setSolverInputMode] = useState<'image' | 'text'>('image');
  const [solverTypedQuestion, setSolverTypedQuestion] = useState<string>('');
  const [solverUploadedImageFile, setSolverUploadedImageFile] = useState<File | null>(null);
  const [solverImagePreview, setSolverImagePreview] = useState<string | null>(null);
  const [solverSelectedSubject, setSolverSelectedSubject] = useState<OlympiadSubject | undefined>(undefined);
  
  const [solverChatHistory, setSolverChatHistory] = useState<ChatMessage[]>([]);
  const [solverFollowUpQuery, setSolverFollowUpQuery] = useState<string>('');
  const [solverIsSolving, setSolverIsSolving] = useState<boolean>(false); // For initial solve in modal
  const [solverIsChatting, setSolverIsChatting] = useState<boolean>(false); // For follow-ups in modal
  const [solverError, setSolverError] = useState<string | null>(null);

  useEffect(() => {
    if (solverChatContainerRef.current) {
        solverChatContainerRef.current.scrollTop = solverChatContainerRef.current.scrollHeight;
    }
  }, [solverChatHistory]);


  const handleSubmitSubject = () => {
    if (selectedSubject) {
      setGlobalOlympiadSubject(selectedSubject);
      navigate('/');
    }
  };

  const handleOpenSolverModal = () => {
    if (!apiKeyAvailable) {
        setGlobalError("AI Question Solver requires a configured API Key.");
        setShowErrorModal(true); 
        return;
    }
    setIsSolverModalOpen(true);
    // Reset solver state when opening
    setSolverInputMode('image');
    setSolverTypedQuestion('');
    setSolverUploadedImageFile(null);
    setSolverImagePreview(null);
    setSolverSelectedSubject(undefined);
    setSolverChatHistory([]);
    setSolverFollowUpQuery('');
    setSolverIsSolving(false);
    setSolverIsChatting(false);
    setSolverError(null);
  };

  const handleSolverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setSolverError('Invalid file type. Please upload a JPG, PNG, WEBP or GIF image.');
        setSolverUploadedImageFile(null); setSolverImagePreview(null);
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setSolverError('File size exceeds 10MB. Please upload a smaller image.');
        setSolverUploadedImageFile(null); setSolverImagePreview(null);
        return;
      }
      
      setSolverUploadedImageFile(file);
      setSolverChatHistory([]); 
      setSolverError(null); 

      const reader = new FileReader();
      reader.onloadend = () => {
        setSolverImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolveWithAIModal = useCallback(async () => {
    if (!apiKeyAvailable) {
      setSolverError("API Key must be available.");
      return;
    }

    let initialUserMessageText = "";
    if (solverInputMode === 'image') {
      if (!solverUploadedImageFile) {
        setSolverError("Please upload an image of the question first.");
        return;
      }
      initialUserMessageText = "My question is in the uploaded image. Please solve it.";
    } else { // text mode
      if (!solverTypedQuestion.trim()) {
        setSolverError("Please type your question first.");
        return;
      }
      initialUserMessageText = `My question is: "${solverTypedQuestion}" Please solve it.`;
    }
    
    setSolverIsSolving(true);
    setGlobalIsLoading(true); // Use global loading as modal is part of page
    setSolverError(null);
    setSolverChatHistory([]);

    const initialUserMessage: ChatMessage = {
      id: Date.now().toString() + 'user-modal',
      role: 'user',
      text: initialUserMessageText,
      timestamp: Date.now(),
    };

    try {
      let responseText = "";
      if (solverInputMode === 'image' && solverUploadedImageFile) {
        const base64Image = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(solverUploadedImageFile);
          reader.onload = () => {
            const result = (reader.result as string).split(',')[1];
            if (!result) reject(new Error("Could not read image data."));
            else resolve(result);
          };
          reader.onerror = () => reject(new Error("Failed to read image file."));
        });
        responseText = await analyzeQuestionImage(base64Image, solverUploadedImageFile.type, solverSelectedSubject);
      } else if (solverInputMode === 'text') {
        responseText = await analyzeTextQuestion(solverTypedQuestion, solverSelectedSubject);
      }
      
      const initialModelMessage: ChatMessage = {
        id: Date.now().toString() + 'model-modal',
        role: 'model',
        text: responseText,
        timestamp: Date.now(),
      };
      setSolverChatHistory([initialUserMessage, initialModelMessage]);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to get solution from AI.';
      setSolverError(errorMsg);
      setSolverChatHistory([initialUserMessage, {id: Date.now().toString() + 'system-modal', role: 'system', text: `Error: ${errorMsg}`, timestamp: Date.now()}]);
    } finally {
      setSolverIsSolving(false);
      setGlobalIsLoading(false);
    }
  }, [apiKeyAvailable, solverInputMode, solverUploadedImageFile, solverTypedQuestion, solverSelectedSubject, setGlobalIsLoading]);

  const handleSolverFollowUp = async () => {
    if (!solverFollowUpQuery.trim() || !apiKeyAvailable || solverChatHistory.length === 0) {
        setSolverError("Please type your follow-up question.");
        return;
    }
    setSolverIsChatting(true);
    setGlobalIsLoading(true);
    setSolverError(null);

    const userFollowUpMessage: ChatMessage = { 
      id: Date.now().toString() + 'user-modal-followup', 
      role: 'user', 
      text: solverFollowUpQuery, 
      timestamp: Date.now() 
    };
    const currentChatHistory = [...solverChatHistory, userFollowUpMessage];
    setSolverChatHistory(currentChatHistory);
    setSolverFollowUpQuery('');

    try {
        const aiResponse = await startOrContinueChat(currentChatHistory, userFollowUpMessage.text, solverSelectedSubject || OlympiadSubject.MATH); // Fallback subject
        setSolverChatHistory(prev => [...prev, aiResponse]);
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get follow-up explanation.';
        setSolverError(errorMsg);
        setSolverChatHistory(prev => [...prev, {id: Date.now().toString() + 'system-modal-followup', role: 'system', text: `Error: ${errorMsg}`, timestamp: Date.now()}]);
    } finally {
        setSolverIsChatting(false);
        setGlobalIsLoading(false);
    }
  };

  const handleSolverClear = () => {
    setSolverUploadedImageFile(null);
    setSolverImagePreview(null);
    setSolverTypedQuestion('');
    setSolverChatHistory([]);
    setSolverFollowUpQuery('');
    setSolverError(null);
  };


  const CardIcon: React.FC<{ subject: OlympiadSubject | "AI_SOLVER", className?: string }> = ({ subject, className }) => {
    const baseClass = "w-12 h-12 mb-3"; 
    const iconClass = `${baseClass} ${className}`;
    switch (subject) {
      case OlympiadSubject.MATH: return <CalculatorIcon className={iconClass} />;
      case OlympiadSubject.PHYSICS: return <LightBulbIcon className={iconClass} />;
      case OlympiadSubject.CHEMISTRY: return <BeakerIcon className={iconClass} />;
      case OlympiadSubject.INFORMATICS: return <CodeBracketIcon className={iconClass} />;
      case "AI_SOLVER": return <PuzzlePieceIcon className={iconClass} />; 
      default: return <QuestionMarkCircleIcon className={iconClass} />;
    }
  };


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary to-secondary p-6">
      <Modal 
        isOpen={showErrorModal && !apiKeyAvailable} 
        title="API Key Error" 
        onClose={() => {
            setShowErrorModal(false);
            if (globalError === "Gemini API Key is not configured. Please set the API_KEY environment variable." || globalError === "AI Question Solver requires a configured API Key.") {
                 setGlobalError(null); 
            }
        }}
      >
          <p className="text-textSecondary">{globalError || "An unspecified error occurred."}</p>
          <p className="mt-2 text-sm text-gray-500">The application may not function correctly without a valid API key.</p>
          <div className="mt-4 flex justify-end">
            <Button variant="primary" onClick={() => {
                setShowErrorModal(false);
                 if (globalError === "Gemini API Key is not configured. Please set the API_KEY environment variable." || globalError === "AI Question Solver requires a configured API Key.") {
                    setGlobalError(null); 
                }
            }}>Acknowledge</Button>
          </div>
      </Modal>

      {/* AI Solver Modal */}
      <Modal isOpen={isSolverModalOpen} onClose={() => setIsSolverModalOpen(false)} title="AI Question Solver" size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Input Column */}
          <div className="flex flex-col">
            <div className="mb-4">
              <span className="block text-sm font-medium text-textPrimary mb-2">Input Method:</span>
              <div className="flex gap-2 sm:gap-4 rounded-lg bg-slate-100 p-1">
                <button 
                    onClick={() => setSolverInputMode('image')} 
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${solverInputMode === 'image' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                    aria-pressed={solverInputMode === 'image'}
                    disabled={solverIsSolving || solverIsChatting}
                >
                    <FileUploadIcon className="w-5 h-5"/> Upload Image
                </button>
                <button 
                    onClick={() => setSolverInputMode('text')}
                    className={`flex-1 py-2 px-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-colors ${solverInputMode === 'text' ? 'bg-primary text-white shadow' : 'text-slate-600 hover:bg-slate-200'}`}
                    aria-pressed={solverInputMode === 'text'}
                    disabled={solverIsSolving || solverIsChatting}
                >
                   <TypeIcon className="w-5 h-5"/> Type Question
                </button>
              </div>
            </div>

            {solverInputMode === 'image' && (
              <div className="mb-4">
                <label htmlFor="solver-file-upload" className="block text-sm font-medium text-textPrimary mb-1">Question Image:</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary transition-colors">
                  <div className="space-y-1 text-center">
                    <FileUploadIcon className="mx-auto h-10 w-10 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="solver-file-upload"
                        className={`relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary px-1 ${solverIsSolving || solverIsChatting ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span>Upload a file</span>
                        <input id="solver-file-upload" name="solver-file-upload" type="file" className="sr-only" onChange={handleSolverImageUpload} accept="image/png, image/jpeg, image/gif, image/webp" disabled={solverIsSolving || solverIsChatting}/>
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 10MB</p>
                  </div>
                </div>
                {solverImagePreview && (
                  <div className="mt-3 text-center">
                    <img src={solverImagePreview} alt="Question preview" className="max-h-32 w-auto rounded-lg shadow-sm mx-auto border" />
                  </div>
                )}
              </div>
            )}

            {solverInputMode === 'text' && (
              <div className="mb-4">
                <label htmlFor="solver-typed-question" className="block text-sm font-medium text-textPrimary mb-1">Your Question:</label>
                <textarea
                  id="solver-typed-question"
                  rows={5}
                  className="w-full p-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-slate-100"
                  placeholder="Enter your question here..."
                  value={solverTypedQuestion}
                  onChange={(e) => setSolverTypedQuestion(e.target.value)}
                  disabled={solverIsSolving || solverIsChatting}
                />
              </div>
            )}

            <div className="mb-4">
              <label htmlFor="solver-subject-select" className="block text-sm font-medium text-textPrimary mb-1">Subject (Optional):</label>
              <select
                id="solver-subject-select"
                value={solverSelectedSubject || ''}
                onChange={(e) => setSolverSelectedSubject(e.target.value as OlympiadSubject)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md shadow-sm disabled:bg-slate-100"
                disabled={solverIsSolving || solverIsChatting}
              >
                <option value="">Select Subject (General if none)</option>
                {OLYMPIAD_SUBJECTS.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>
            
            <div className="mt-auto flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleSolveWithAIModal} 
                disabled={solverIsSolving || solverIsChatting || (solverInputMode === 'image' && !solverUploadedImageFile) || (solverInputMode === 'text' && !solverTypedQuestion.trim())} 
                className="flex-1 py-2.5"
              >
                {solverIsSolving ? <LoadingSpinner size="sm" color="text-white" /> : 'Solve with AI'}
              </Button>
              <Button 
                onClick={handleSolverClear} 
                variant="ghost" 
                className="flex-1 py-2.5"
                disabled={solverIsSolving || solverIsChatting}
              >
                Clear
              </Button>
            </div>
          </div>

          {/* Response & Chat Column */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-textPrimary mb-2">AI Solution & Chat</h3>
             <div ref={solverChatContainerRef} className="flex-grow space-y-3 overflow-y-auto bg-slate-50 p-3 rounded-lg shadow-inner mb-4 min-h-[200px] max-h-[300px]">
                {solverChatHistory.length === 0 && !solverIsSolving && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <BrainIcon className="w-10 h-10 text-gray-400 mb-2"/>
                    <p className="text-textSecondary text-sm">The AI's solution and our chat will appear here.</p>
                </div>
                )}
                {solverIsSolving && solverChatHistory.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full">
                        <LoadingSpinner />
                        <p className="mt-2 text-textSecondary text-sm">AI is generating initial solution...</p>
                    </div>
                )}
                {solverChatHistory.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-md px-3 py-2 rounded-xl shadow-md break-words ${
                    msg.role === 'user' ? 'bg-primary text-white' : 
                    msg.role === 'model' ? 'bg-white text-textPrimary border border-gray-200' : 
                    'bg-red-100 text-red-700 border border-red-300'
                    }`}>
                    <div 
                        className="text-xs sm:text-sm whitespace-pre-wrap prose prose-sm max-w-none" 
                        dangerouslySetInnerHTML={{ __html: formatMathString(msg.text) }}
                    />
                    <p className="text-xs opacity-70 mt-1 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                ))}
                {solverIsChatting && <div className="flex justify-start p-1"> <LoadingSpinner size="sm" color="text-primary"/> </div> }
            </div>
            
            {solverChatHistory.length > 0 && solverChatHistory.some(m=>m.role === 'model') && !solverChatHistory.some(m => m.role === 'system' && m.text.startsWith("Error")) && (
            <div className="mt-auto pt-3 border-t border-gray-200">
                <div className="flex gap-2 items-center">
                <input
                    type="text"
                    value={solverFollowUpQuery}
                    onChange={(e) => setSolverFollowUpQuery(e.target.value)}
                    placeholder="Ask a follow-up..."
                    className="flex-grow p-2 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-1 focus:ring-primary focus:border-primary disabled:bg-slate-100"
                    disabled={solverIsSolving || solverIsChatting}
                    onKeyPress={(e) => e.key === 'Enter' && !solverIsSolving && !solverIsChatting && solverFollowUpQuery.trim() && handleSolverFollowUp()}
                />
                <Button 
                    onClick={handleSolverFollowUp} 
                    disabled={solverIsSolving || solverIsChatting || !solverFollowUpQuery.trim()} 
                    size="sm"
                    rightIcon={<PaperAirplaneIcon className="w-4 h-4"/>}
                >
                    Send
                </Button>
                </div>
            </div>
            )}
            {solverError && (solverIsSolving || solverIsChatting) && (
                <p className="text-red-500 text-xs mt-2 text-center">{solverError}</p>
            )}
          </div>
        </div>
      </Modal>


      <div className="bg-card p-8 sm:p-12 rounded-xl shadow-2xl max-w-2xl w-full text-center">
        <AcademicCapIcon className="w-20 h-20 text-primary mx-auto mb-6" />
        <h1 className="text-4xl font-bold text-textPrimary mb-3">Welcome to {APP_NAME}!</h1>
        <p className="text-lg text-textSecondary mb-8">Let's personalize your learning journey or help you solve a specific question.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
          {OLYMPIAD_SUBJECTS.map((subject) => (
            <div key={subject} className={`p-0 rounded-lg border-2 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 flex flex-col
                ${selectedSubject === subject ? 'border-primary ring-2 ring-primary bg-blue-50' : 'border-gray-300 hover:border-primary-light bg-white'}`}>
              <button
                onClick={() => setSelectedSubject(subject)}
                className="p-6 w-full h-full flex flex-col items-center justify-center flex-grow"
                aria-pressed={selectedSubject === subject}
                aria-label={`Select ${subject} as your Olympiad subject`}
              >
                <CardIcon subject={subject} className="text-primary" />
                <span className="text-xl font-semibold text-textPrimary">{subject}</span>
              </button>
            </div>
          ))}
           {/* AI Solver Card - Now opens modal */}
           <div 
            key="ai-solver" 
            className={`p-0 rounded-lg border-2 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 flex flex-col border-gray-300 hover:border-accent bg-white cursor-pointer`}
            onClick={handleOpenSolverModal}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleOpenSolverModal();}}
            aria-label="Open AI Question Solver"
            >
            <div className="p-6 w-full h-full flex flex-col items-center justify-center flex-grow">
                <CardIcon subject="AI_SOLVER" className="text-accent" />
                <span className="text-xl font-semibold text-textPrimary">AI Question Solver</span>
            </div>
          </div>
        </div>
        
        <Button
          onClick={handleSubmitSubject}
          disabled={!selectedSubject || !apiKeyAvailable}
          size="lg"
          className="w-full sm:w-auto"
        >
          Start Learning My Subject
        </Button>
        {!apiKeyAvailable && <p className="text-red-500 text-sm mt-4">Cannot start learning: API Key is not configured.</p>}
         {apiKeyAvailable && !selectedSubject && <p className="text-textSecondary text-sm mt-4">Select a subject to start daily challenges, or use the AI Solver.</p>}
      </div>
      <p className="text-center text-blue-100 mt-8 text-sm">
        Powered by AI to help you achieve your Olympiad goals.
      </p>
    </div>
  );
};

export default OnboardingPage;

import React, { useState, useEffect, useCallback } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { DailyQuestion, ChatMessage, OlympiadSubject, QuestionAttempt } from '../types';
import { generateDailyQuestions, evaluateSolution, startOrContinueChat } from '../services/geminiService';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { LOCAL_STORAGE_KEYS } from '../constants';
import useLocalStorage from '../hooks/useLocalStorage';
import { formatMathString } from '../utils/textFormatters'; // Added import

const FileUploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338-2.32 5.75 5.75 0 011.336 7.65M6.75 19.5L6.75 9.75" />
  </svg>
);
const PaperAirplaneIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
  </svg>
);

const DashboardPage: React.FC = () => {
  const { olympiadSubject, isLoading, setIsLoading, error, setError, addAttempt, updateStreakOnActivity, apiKeyAvailable } = useAppContext();
  const [dailyQuestions, setDailyQuestions] = useLocalStorage<DailyQuestion[]>(`${LOCAL_STORAGE_KEYS.DAILY_QUESTIONS}_${olympiadSubject}`, []);
  const [currentQuestion, setCurrentQuestion] = useState<DailyQuestion | null>(null);
  const [solution, setSolution] = useState<string>('');
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [feedbackChat, setFeedbackChat] = useState<ChatMessage[]>([]);
  const [followUpQuery, setFollowUpQuery] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);

  const fetchQuestions = useCallback(async () => {
    if (!olympiadSubject || !apiKeyAvailable) return;
    setIsLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];
      const storedDataKey = `${LOCAL_STORAGE_KEYS.DAILY_QUESTIONS}_${olympiadSubject}_${today}`;
      const storedQuestionsToday = localStorage.getItem(storedDataKey);

      if (storedQuestionsToday) {
        setDailyQuestions(JSON.parse(storedQuestionsToday));
      } else {
        // Clear all other daily question caches for this subject before fetching new ones
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(`${LOCAL_STORAGE_KEYS.DAILY_QUESTIONS}_${olympiadSubject}_`) && key !== storedDataKey) {
                localStorage.removeItem(key);
            }
        });
        const questions = await generateDailyQuestions(olympiadSubject, 3);
        setDailyQuestions(questions);
        localStorage.setItem(storedDataKey, JSON.stringify(questions));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch daily questions.');
      setDailyQuestions([]); // Clear questions on error
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [olympiadSubject, apiKeyAvailable, setIsLoading, setError, setDailyQuestions]);


  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  useEffect(() => {
    if (dailyQuestions.length > 0 && !currentQuestion) {
      setCurrentQuestion(dailyQuestions[0]);
      resetQuestionState();
    } else if (dailyQuestions.length === 0) {
        setCurrentQuestion(null); // Ensure no question is selected if list is empty
    }
  }, [dailyQuestions, currentQuestion]);

  const resetQuestionState = () => {
    setSolution('');
    setUploadedImage(null);
    setImagePreview(null);
    setFeedbackChat([]);
    setFollowUpQuery('');
    setHasSubmitted(false);
  };
  
  const selectQuestion = (question: DailyQuestion) => {
    setCurrentQuestion(question);
    resetQuestionState();
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      // Basic validation for image type and size (optional)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload a JPG, PNG, or GIF image.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size exceeds 10MB. Please upload a smaller image.');
        return;
      }
      setError(null); // Clear previous error

      setUploadedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitSolution = async () => {
    if (!currentQuestion || !solution.trim() || !olympiadSubject || !apiKeyAvailable) {
      setError("Please select a question and provide a solution.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setHasSubmitted(true);

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: `My solution: ${solution}`, timestamp: Date.now() };
    setFeedbackChat([userMessage]);

    try {
      // Note: The uploadedImage for daily questions is currently for context/preview only.
      // It's NOT sent to evaluateSolution in this version.
      // To use it, evaluateSolution would need to accept image data,
      // and the AI prompt would need to be adjusted to consider it.
      const aiFeedback = await evaluateSolution(olympiadSubject, currentQuestion.text, solution);
      setFeedbackChat(prev => [...prev, aiFeedback]);

      const isCorrect = aiFeedback.text.toLowerCase().startsWith('correct');
      
      addAttempt({
        questionId: currentQuestion.id,
        questionText: currentQuestion.text,
        solutionAttempt: solution,
        isCorrect,
        feedback: [userMessage, aiFeedback],
        subject: olympiadSubject,
      });
      updateStreakOnActivity();

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to evaluate solution.';
      setError(errorMsg);
      setFeedbackChat(prev => [...prev, {id: Date.now().toString(), role: 'system', text: `Error: ${errorMsg}`, timestamp: Date.now()}]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpQuery.trim() || !currentQuestion || !olympiadSubject || !apiKeyAvailable || feedbackChat.length === 0) {
        setError("Please type your follow-up question.");
        return;
    }
    setIsLoading(true);
    setError(null);
    const userFollowUpMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: followUpQuery, timestamp: Date.now() };
    setFeedbackChat(prev => [...prev, userFollowUpMessage]);
    setFollowUpQuery('');

    try {
        const aiResponse = await startOrContinueChat(feedbackChat, userFollowUpMessage.text, olympiadSubject);
        setFeedbackChat(prev => [...prev, aiResponse]);
    } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get follow-up explanation.';
        setError(errorMsg);
        setFeedbackChat(prev => [...prev, {id: Date.now().toString(), role: 'system', text: `Error: ${errorMsg}`, timestamp: Date.now()}]);
    } finally {
        setIsLoading(false);
    }
  };


  if (!olympiadSubject) {
    // This case should ideally be handled by ProtectedRoute, but as a fallback:
    return <div className="p-8 text-center text-textPrimary">Please select an Olympiad subject first through the onboarding process.</div>;
  }
  
  if (!apiKeyAvailable) {
     return <div className="p-8 text-center text-red-600">API Key not configured. Dashboard cannot function. Please ensure the API_KEY environment variable is set.</div>;
  }


  return (
    <div className="min-h-[calc(100vh-5rem)] bg-gradient-to-br from-slate-100 to-sky-100 p-4 sm:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-primary mb-2">Daily Challenges: {olympiadSubject}</h1>
        <p className="text-lg text-textSecondary">Sharpen your skills with today's questions!</p>
      </header>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">{error}</div>}
      
      {isLoading && dailyQuestions.length === 0 && <div className="flex justify-center py-10"><LoadingSpinner /></div>}

      {!isLoading && dailyQuestions.length === 0 && (
        <div className="text-center py-10 bg-card shadow-lg rounded-lg">
          <p className="text-xl text-textSecondary">No daily questions available for {olympiadSubject}.</p>
          <Button onClick={fetchQuestions} className="mt-4" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" color="text-white"/> : 'Try Refreshing Questions'}
          </Button>
        </div>
      )}

      {dailyQuestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Question List */}
          <div className="md:col-span-1 bg-card p-6 rounded-xl shadow-lg max-h-[calc(100vh-12rem)] overflow-y-auto">
            <h2 className="text-2xl font-semibold text-textPrimary mb-4 border-b pb-2">Today's Questions</h2>
            <ul className="space-y-3">
              {dailyQuestions.map((q, index) => (
                <li key={q.id}>
                  <button
                    onClick={() => selectQuestion(q)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-light ${currentQuestion?.id === q.id ? 'bg-primary text-white shadow-md scale-105' : 'bg-slate-50 hover:bg-slate-100 text-textPrimary hover:shadow-sm'}`}
                    aria-current={currentQuestion?.id === q.id ? "page" : undefined}
                  >
                    <span className="font-medium block">Question {index + 1}</span>
                    <p 
                      className={`text-sm truncate ${currentQuestion?.id === q.id ? 'text-blue-100' : 'text-textSecondary'}`}
                      dangerouslySetInnerHTML={{ __html: formatMathString(q.text) }}
                    />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Current Question and Interaction Area */}
          <div className="md:col-span-2 bg-card p-6 rounded-xl shadow-lg max-h-[calc(100vh-12rem)] overflow-y-auto">
            {!currentQuestion && !isLoading && <p className="text-textSecondary text-center py-10 text-lg">Select a question from the list to start.</p>}
            {isLoading && currentQuestion && !hasSubmitted && <div className="flex justify-center py-10"><LoadingSpinner /></div>}
            
            {currentQuestion && (
              <div>
                <h2 className="text-2xl font-semibold text-textPrimary mb-1">Current Question:</h2>
                <div 
                  className="text-md text-textSecondary mb-6 prose max-w-none prose-indigo" 
                  dangerouslySetInnerHTML={{ __html: formatMathString(currentQuestion.text) }}
                />

                <div className="mb-6">
                  <label htmlFor="solution" className="block text-lg font-medium text-textPrimary mb-2">Your Solution:</label>
                  <textarea
                    id="solution"
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    rows={5}
                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary transition-shadow disabled:bg-slate-50"
                    placeholder="Type your detailed solution here..."
                    disabled={isLoading || hasSubmitted}
                    aria-label="Your solution text area"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-lg font-medium text-textPrimary mb-2">Upload solution (Optional):</label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-light transition-colors">
                    <div className="space-y-1 text-center">
                      <FileUploadIcon className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="file-upload-solution"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary-dark focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary px-1"
                        >
                          <span>Upload a file</span>
                          <input id="file-upload-solution" name="file-upload-solution" type="file" className="sr-only" onChange={handleImageUpload} accept="image/png, image/jpeg, image/gif" disabled={isLoading || hasSubmitted}/>
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                  {imagePreview && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-textSecondary mb-1">Image preview:</p>
                      <img src={imagePreview} alt="Solution preview" className="max-h-40 rounded-lg shadow-sm mx-auto border" />
                    </div>
                  )}
                </div>

                <Button onClick={handleSubmitSolution} disabled={isLoading || !solution.trim() || hasSubmitted} size="lg" className="w-full">
                  {isLoading && hasSubmitted ? <LoadingSpinner size="sm" color="text-white"/> : 'Submit Solution'}
                </Button>

                {/* Feedback and Chat Area */}
                {feedbackChat.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <h3 className="text-xl font-semibold text-textPrimary mb-4">Feedback & Discussion:</h3>
                    <div className="space-y-4 max-h-96 overflow-y-auto bg-slate-50 p-4 rounded-lg shadow-inner">
                      {feedbackChat.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-xl px-4 py-3 rounded-xl shadow-md ${
                            msg.role === 'user' ? 'bg-primary text-white' : 
                            msg.role === 'model' ? 'bg-white text-textPrimary border border-gray-200' : 'bg-red-100 text-red-700 border border-red-300'
                          }`}>
                            <div 
                              className="text-sm whitespace-pre-wrap prose prose-sm max-w-none" 
                              dangerouslySetInnerHTML={{ __html: formatMathString(msg.text) }}
                            />
                            <p className="text-xs opacity-70 mt-1.5 text-right">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      ))}
                       {isLoading && feedbackChat.length > 0 && feedbackChat[feedbackChat.length -1]?.role === 'user' && (
                        <div className="flex justify-start p-2"> <LoadingSpinner size="sm" color="text-primary"/> </div>
                       )}
                    </div>

                    {/* Follow-up Input */}
                    {(feedbackChat.some(msg => msg.role === 'model') && !feedbackChat.some(msg => msg.role ==='system' && msg.text.startsWith('Error'))) && (
                        <div className="mt-6 flex gap-2 items-center">
                        <input
                            type="text"
                            value={followUpQuery}
                            onChange={(e) => setFollowUpQuery(e.target.value)}
                            placeholder="Ask a follow-up question..."
                            className="flex-grow p-3 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-slate-50"
                            disabled={isLoading}
                            onKeyPress={(e) => e.key === 'Enter' && !isLoading && followUpQuery.trim() && handleFollowUp()}
                            aria-label="Follow-up question input"
                        />
                        <Button onClick={handleFollowUp} disabled={isLoading || !followUpQuery.trim()} rightIcon={<PaperAirplaneIcon className="w-5 h-5"/>} aria-label="Send follow-up">
                            Send
                        </Button>
                        </div>
                    )}
                  </div>
                )}
                 {!hasSubmitted && feedbackChat.length === 0 && (
                    <p className="mt-6 text-sm text-textSecondary text-center italic">Submit your solution to get feedback from the AI Tutor.</p>
                 )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
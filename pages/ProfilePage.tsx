import React, { useMemo, useEffect, useState } from 'react';
import { useAppContext } from '../hooks/useAppContext';
import { QuestionAttempt, OlympiadSubject } from '../types';
import { formatMathString } from '../utils/textFormatters'; 
import LoadingSpinner from '../components/LoadingSpinner'; 

// Augment the Window interface to inform TypeScript about Recharts
declare global {
  interface Window {
    Recharts?: any; // Recharts library loaded via CDN, make it optional
  }
}

const UserIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);
const FireIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048l2.404-2.403A5.99 5.99 0 0115.362 5.214zM12 12.75a4.5 4.5 0 004.5-4.5H7.5a4.5 4.5 0 004.5 4.5z" />
</svg>
);
const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
</svg>
);
const DocumentTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
</svg>
);
const ExclamationTriangleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);


const ProfilePage: React.FC = () => {
  const { olympiadSubject, progress, streakData } = useAppContext();
  const [rechartsLoaded, setRechartsLoaded] = useState(false);
  const [rechartsLoadError, setRechartsLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Recharts) {
      setRechartsLoaded(true);
      setRechartsLoadError(null);
    } else {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (typeof window !== 'undefined' && window.Recharts) {
          setRechartsLoaded(true);
          setRechartsLoadError(null);
          clearInterval(interval);
        } else if (attempts > 50) { // Stop polling after 5 seconds (50 * 100ms)
          const errorMsg = "Chart library failed to load after 5 seconds. Chart visualizations will be unavailable.";
          console.warn(errorMsg);
          setRechartsLoadError(errorMsg);
          // Do NOT set rechartsLoaded to true here, it means library is not available.
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval); 
    }
  }, []);

  // Destructure Recharts components only if it's confirmed to be loaded
  const RechartsComponents = rechartsLoaded && window.Recharts ? window.Recharts : null;
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } = RechartsComponents || {};

  const totalQuestionsAttempted = progress.attempts.length;
  const correctAnswers = progress.attempts.filter(a => a.isCorrect).length;
  const accuracyRate = totalQuestionsAttempted > 0 ? (correctAnswers / totalQuestionsAttempted) * 100 : 0;

  const progressOverTime = useMemo(() => {
    if (progress.attempts.length < 2) return []; 
    const sortedAttempts = [...progress.attempts].sort((a, b) => a.timestamp - b.timestamp);
    let cumulativeCorrect = 0;
    let cumulativeAttempted = 0;
    const mappedAttempts = sortedAttempts.map(attempt => {
      cumulativeAttempted++;
      if (attempt.isCorrect) cumulativeCorrect++;
      return {
        date: new Date(attempt.timestamp).toLocaleDateString(),
        accuracy: (cumulativeCorrect / cumulativeAttempted) * 100,
        attempted: cumulativeAttempted
      };
    });
    if (mappedAttempts.length <= 2) return mappedAttempts;
    return mappedAttempts.filter((val, index, arr) => 
        index === 0 || 
        index === arr.length -1 || 
        arr[index].date !== arr[index-1].date
    );
  }, [progress.attempts]);

  const topicsStruggled = useMemo(() => {
    const incorrectAttempts = progress.attempts.filter(a => !a.isCorrect);
    const topicMap: { [key: string]: { attempts: number, errors: number } } = {};
    
    incorrectAttempts.forEach(attempt => {
      const topicKey = attempt.questionText.substring(0, 30) + "..."; 
      if (!topicMap[topicKey]) {
        topicMap[topicKey] = { attempts: 0, errors: 0 };
      }
      topicMap[topicKey].errors++;
    });
    
    const allTopicOccurrences: { [key: string]: number } = {};
     progress.attempts.forEach(attempt => {
      const topicKey = attempt.questionText.substring(0, 30) + "...";
      allTopicOccurrences[topicKey] = (allTopicOccurrences[topicKey] || 0) + 1;
    });

    return Object.entries(topicMap)
        .map(([name, data]) => ({ 
            name, 
            errors: data.errors, 
            totalAttemptsOnTopic: allTopicOccurrences[name] || data.errors, 
            errorRate: (allTopicOccurrences[name] && allTopicOccurrences[name] > 0) ? (data.errors / allTopicOccurrences[name]) * 100 : 0  
        }))
        .sort((a,b) => b.errors - a.errors) 
        .slice(0, 5); 
  }, [progress.attempts]);

  const accuracyData = [
    { name: 'Correct', value: correctAnswers, fill: '#10b981' }, 
    { name: 'Incorrect', value: totalQuestionsAttempted - correctAnswers, fill: '#ef4444' }, 
  ];

  if (!olympiadSubject) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-50 p-4 sm:p-8 flex flex-col justify-center items-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-textSecondary">Loading user profile data...</p>
      </div>
    );
  }

  if (!rechartsLoaded && !rechartsLoadError) {
    return (
      <div className="min-h-[calc(100vh-5rem)] bg-slate-50 p-4 sm:p-8 flex flex-col justify-center items-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-textSecondary">Loading chart library...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50 p-4 sm:p-8">
      <header className="mb-10 text-center">
        <UserIcon className="w-24 h-24 mx-auto text-primary mb-4" />
        <h1 className="text-4xl font-bold text-textPrimary">Your Profile</h1>
        <p className="text-xl text-textSecondary">Olympiad Focus: <span className="font-semibold text-primary">{olympiadSubject}</span></p>
      </header>

      {rechartsLoadError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-700 p-4 mb-6 shadow-md rounded-md flex items-start" role="alert">
          <ExclamationTriangleIcon className="h-6 w-6 mr-3 mt-0.5 text-yellow-500 flex-shrink-0"/>
          <div>
            <p className="font-bold">Chart Library Issue</p>
            <p>{rechartsLoadError}</p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-card p-6 rounded-xl shadow-lg text-center">
          <FireIcon className="w-12 h-12 mx-auto text-accent mb-3" />
          <h2 className="text-3xl font-bold text-accent">{streakData.currentStreak} Days</h2>
          <p className="text-textSecondary">Current Streak</p>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-lg text-center">
          <ChartBarIcon className="w-12 h-12 mx-auto text-secondary mb-3" />
          <h2 className="text-3xl font-bold text-secondary">{totalQuestionsAttempted}</h2>
          <p className="text-textSecondary">Questions Attempted</p>
        </div>
        <div className="bg-card p-6 rounded-xl shadow-lg text-center">
          <UserIcon className="w-12 h-12 mx-auto text-primary mb-3" /> 
          <h2 className="text-3xl font-bold text-primary">{accuracyRate.toFixed(1)}%</h2>
          <p className="text-textSecondary">Accuracy Rate</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="bg-card p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-semibold text-textPrimary mb-6">Accuracy Overview</h3>
          {rechartsLoaded && PieChart ? (
            totalQuestionsAttempted > 0 ? (
             <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={accuracyData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {accuracyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, props: any) => [`${value} (${(value/totalQuestionsAttempted * 100).toFixed(1)}%)`, name]}/>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-textSecondary text-center py-10">No attempts yet to display accuracy chart.</p>
            )
          ) : (
             <p className="text-textSecondary text-center py-10">Chart cannot be displayed. {rechartsLoadError ? '' : 'Library loading...'}</p>
          )}
        </div>
        <div className="bg-card p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-semibold text-textPrimary mb-6">Progress Over Time (Accuracy %)</h3>
          {rechartsLoaded && LineChart ? (
            progressOverTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={progressOverTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`}/>
                <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Accuracy"]}/>
                <Legend />
                <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} name="Cumulative Accuracy"/>
              </LineChart>
            </ResponsiveContainer>
            ) : (
              <p className="text-textSecondary text-center py-10">Not enough data for progress chart. Try solving more questions!</p>
            )
          ) : (
            <p className="text-textSecondary text-center py-10">Chart cannot be displayed. {rechartsLoadError ? '' : 'Library loading...'}</p>
          )}
        </div>
      </div>
      
      {/* Struggled Topics and Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-card p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-semibold text-textPrimary mb-6">Most Struggled Topics (Top 5)</h3>
          {topicsStruggled.length > 0 ? (
            <ul className="space-y-3">
              {topicsStruggled.map((topic, index) => (
                <li key={index} className="p-3 bg-slate-50 rounded-md shadow-sm hover:bg-slate-100 transition-colors">
                  <p 
                    className="font-medium text-textPrimary truncate" 
                    title={topic.name} 
                    dangerouslySetInnerHTML={{ __html: formatMathString(topic.name) }}
                  />
                  <div className="flex justify-between items-center text-sm text-textSecondary mt-1">
                    <span>Errors: {topic.errors} (out of {topic.totalAttemptsOnTopic} attempts on this topic)</span>
                    <span className={`font-semibold ${topic.errorRate > 60 ? 'text-red-500' : topic.errorRate > 30 ? 'text-yellow-500' : 'text-green-500'}`}>
                        {topic.errorRate.toFixed(1)}% error rate
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-textSecondary text-center py-10">Great job! No specific struggled topics identified based on recent errors.</p>
          )}
          <p className="text-sm text-textSecondary mt-4 italic">Suggestions: Review concepts related to these topics. Try solving similar problems from external resources or the AI Solver.</p>
        </div>

        <div className="bg-card p-6 rounded-xl shadow-lg">
          <h3 className="text-2xl font-semibold text-textPrimary mb-6">Reports & Export</h3>
          <div className="space-y-4">
            <div>
              <DocumentTextIcon className="w-8 h-8 text-primary mb-2" />
              <h4 className="text-lg font-medium text-textPrimary">Weekly Report (Simulated)</h4>
              <p className="text-textSecondary mb-2">Summary of your activity and performance this week.</p>
              <button className="text-sm text-primary hover:underline" onClick={() => alert("Weekly report download/view feature is planned for a future update.")}>View/Download (Coming Soon)</button>
            </div>
            <div>
              <DocumentTextIcon className="w-8 h-8 text-primary mb-2" />
              <h4 className="text-lg font-medium text-textPrimary">Monthly Report (Simulated)</h4>
              <p className="text-textSecondary mb-2">Comprehensive overview of your progress this month.</p>
              <button className="text-sm text-primary hover:underline" onClick={() => alert("Monthly report download/view feature is planned for a future update.")}>View/Download (Coming Soon)</button>
            </div>
             <div>
              <DocumentTextIcon className="w-8 h-8 text-accent mb-2" />
              <h4 className="text-lg font-medium text-textPrimary">Export Progress Data</h4>
              <p className="text-textSecondary mb-2">Download your raw progress data as a JSON file.</p>
              <button className="text-sm text-accent hover:underline" onClick={() => {
                  const dataStr = JSON.stringify(progress.attempts, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `olympiad_progress_${olympiadSubject}_${new Date().toISOString().split('T')[0]}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                  linkElement.remove();
              }}>Export Data (JSON)</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
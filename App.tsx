import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, AppContext } from './contexts/AppContext';
import Navbar from './components/Navbar';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import AISolverPage from './pages/AISolverPage'; // Import the new page
import { useContext } from 'react';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const context = useContext(AppContext);
  
  // If context is not yet available during initial render, it might be loading.
  // Depending on AppProvider's setup, this might mean showing a loader or redirecting.
  // For this app, AppContext is synchronous, but good to be mindful.
  if (!context) { 
    // This state should ideally be temporary if AppProvider is above in the tree.
    // If it persists, it indicates an issue with context setup.
    console.warn("AppContext not available in ProtectedRoute. This might be a temporary state during app initialization or an error.");
    return <Navigate to="/onboarding" replace />; // Fallback, assuming onboarding handles missing context.
  }
  
  const { olympiadSubject, apiKeyAvailable } = context;

  if (!olympiadSubject || !apiKeyAvailable) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const context = useContext(AppContext);
  
  if (!context) {
    // This can happen briefly if AppProvider has async setup, or if there's an issue.
    // Render a loading state or null until context is confirmed.
    return <div className="flex justify-center items-center min-h-screen">Loading App...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/ai-solver" // New Route
            element={
              <ProtectedRoute>
                <AISolverPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } 
          />
           {/* Fallback route */}
          <Route path="*" element={<Navigate to={context.olympiadSubject && context.apiKeyAvailable ? "/" : "/onboarding"} replace />} />
        </Routes>
      </main>
      <footer className="bg-gray-800 text-white text-center p-4 text-sm print:hidden">
        © {new Date().getFullYear()} Olympiad AI Prep Tutor. All rights reserved.
      </footer>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;